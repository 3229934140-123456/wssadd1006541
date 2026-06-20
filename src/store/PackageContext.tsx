import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
import Taro from '@tarojs/taro';
import {
  OralCondition,
  Package,
  PackageType,
  PatientInfo,
  PlanRecord,
  PackageService,
  SendStatus,
  SendRecord,
  PersistedState,
  PatientAggregatedRecord,
  FailedSendGroup,
} from '../types';
import { 
  calculatePackages, 
  recalculatePackage, 
  generateId, 
  generatePatientSummary,
  isValidCondition 
} from '../utils/packageCalculator';
import { mockHistoryRecords } from '../data/historyRecords';
import dayjs from 'dayjs';

const STORAGE_KEY = 'dental_package_state_v1';

interface PackageContextType {
  patientInfo: PatientInfo;
  setPatientInfo: (info: PatientInfo) => void;
  oralCondition: OralCondition;
  setOralCondition: (condition: OralCondition) => void;
  packages: { basic: Package; premium: Package } | null;
  calculatePackages: () => boolean;
  selectedPackage: PackageType;
  setSelectedPackage: (type: PackageType) => void;
  toggleService: (packageType: PackageType, serviceId: string) => void;
  declineService: (packageType: PackageType, serviceId: string, reason: string) => void;
  restoreService: (packageType: PackageType, serviceId: string) => void;
  historyRecords: PlanRecord[];
  filteredRecords: PlanRecord[];
  searchKeyword: string;
  setSearchKeyword: (keyword: string) => void;
  createRecord: (selectedTargets?: ('reception' | 'patient')[]) => PlanRecord;
  sendToTarget: (recordId: string, target: 'reception' | 'patient') => Promise<boolean>;
  retrySend: (recordId: string, target: 'reception' | 'patient') => Promise<boolean>;
  updateRecordStatus: (recordId: string, status: PlanRecord['status']) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  resetAll: () => void;
  getRecordById: (id: string) => PlanRecord | undefined;
  getSendStatus: (record: PlanRecord, target: 'reception' | 'patient') => SendStatus;
  getSendTime: (record: PlanRecord, target: 'reception' | 'patient') => string;
  patientAggregatedRecords: PatientAggregatedRecord[];
  failedSendRecords: FailedSendGroup;
  followupSearchKeyword: string;
  setFollowupSearchKeyword: (keyword: string) => void;
  filteredPatientRecords: PatientAggregatedRecord[];
}

const defaultOralCondition: OralCondition = {
  tartarLevel: 'none',
  pigmentationLevel: 'none',
  bleedingLevel: 'none',
  isFirstTime: false,
};

const defaultSendRecord: SendRecord = {
  target: 'reception',
  status: 'pending',
  retryCount: 0,
};

const PackageContext = createContext<PackageContextType | undefined>(undefined);

const loadFromStorage = (): PersistedState | null => {
  try {
    const data = Taro.getStorageSync(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('[PackageContext] Failed to load from storage:', e);
  }
  return null;
};

const saveToStorage = (state: PersistedState) => {
  try {
    Taro.setStorageSync(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('[PackageContext] Failed to save to storage:', e);
  }
};

export const PackageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({});
  const [oralCondition, setOralCondition] = useState<OralCondition>(defaultOralCondition);
  const [packages, setPackages] = useState<{ basic: Package; premium: Package } | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<PackageType>('basic');
  const [historyRecords, setHistoryRecords] = useState<PlanRecord[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [followupSearchKeyword, setFollowupSearchKeyword] = useState<string>('');

  useEffect(() => {
    const saved = loadFromStorage();
    if (saved) {
      console.log('[PackageContext] Loaded saved state:', saved);
      setHistoryRecords(saved.historyRecords.length > 0 ? saved.historyRecords : mockHistoryRecords);
      if (saved.currentDraft) {
        setPatientInfo(saved.currentDraft.patientInfo);
        setOralCondition(saved.currentDraft.oralCondition);
        setPackages(saved.currentDraft.packages);
        setSelectedPackage(saved.currentDraft.selectedPackage);
        setCurrentStep(saved.currentDraft.currentStep);
      }
    } else {
      setHistoryRecords(mockHistoryRecords);
    }
  }, []);

  const persistState = useCallback(() => {
    const state: PersistedState = {
      historyRecords,
      currentDraft: packages ? {
        patientInfo,
        oralCondition,
        packages,
        selectedPackage,
        currentStep,
      } : null,
    };
    saveToStorage(state);
  }, [historyRecords, patientInfo, oralCondition, packages, selectedPackage, currentStep]);

  useEffect(() => {
    persistState();
  }, [persistState]);

  const filteredRecords = historyRecords.filter(record => {
    if (!searchKeyword.trim()) return true;
    const keyword = searchKeyword.toLowerCase().trim();
    const name = record.patientInfo.name?.toLowerCase() || '';
    const phone = record.patientInfo.phone || '';
    return name.includes(keyword) || phone.includes(keyword);
  });

  const patientAggregatedRecords = useMemo((): PatientAggregatedRecord[] => {
    const grouped = new Map<string, PlanRecord[]>();
    
    historyRecords.forEach(record => {
      const key = `${record.patientInfo.name || '未命名'}-${record.patientInfo.phone || '无电话'}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(record);
    });

    const result: PatientAggregatedRecord[] = [];
    grouped.forEach((records, key) => {
      const sorted = [...records].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const latest = sorted[0];
      const allDeclined: PackageService[] = [];
      sorted.forEach(r => {
        const pkg = r.packages[r.selectedPackage];
        pkg.services.forEach(s => {
          if (s.declined && !allDeclined.find(d => d.serviceId === s.serviceId)) {
            allDeclined.push(s);
          }
        });
      });

      result.push({
        patientName: latest.patientInfo.name || '未命名',
        patientPhone: latest.patientInfo.phone || '无电话',
        latestRecord: latest,
        recordCount: records.length,
        declinedServices: allDeclined,
        lastVisitDate: latest.createdAt,
        sendStatus: {
          reception: latest.sendRecords?.reception?.status || 'pending',
          patient: latest.sendRecords?.patient?.status || 'pending',
        },
      });
    });

    return result.sort((a, b) => 
      new Date(b.lastVisitDate).getTime() - new Date(a.lastVisitDate).getTime()
    );
  }, [historyRecords]);

  const filteredPatientRecords = useMemo((): PatientAggregatedRecord[] => {
    if (!followupSearchKeyword.trim()) return patientAggregatedRecords;
    const keyword = followupSearchKeyword.toLowerCase().trim();
    return patientAggregatedRecords.filter(p => 
      p.patientName.toLowerCase().includes(keyword) || 
      p.patientPhone.includes(keyword)
    );
  }, [patientAggregatedRecords, followupSearchKeyword]);

  const failedSendRecords = useMemo((): FailedSendGroup => {
    const reception: FailedSendGroup['reception'] = [];
    const patient: FailedSendGroup['patient'] = [];

    historyRecords.forEach(record => {
      if (record.sendRecords) {
        if (record.sendRecords.reception?.status === 'failed') {
          reception.push({
            record,
            target: 'reception',
            failedReason: record.sendRecords.reception.failedReason || '未知原因',
            retryCount: record.sendRecords.reception.retryCount,
            lastFailedAt: record.sendRecords.reception.sentAt || record.createdAt,
          });
        }
        if (record.sendRecords.patient?.status === 'failed') {
          patient.push({
            record,
            target: 'patient',
            failedReason: record.sendRecords.patient.failedReason || '未知原因',
            retryCount: record.sendRecords.patient.retryCount,
            lastFailedAt: record.sendRecords.patient.sentAt || record.createdAt,
          });
        }
      }
    });

    const sortByTime = (a: any, b: any) => 
      new Date(b.lastFailedAt).getTime() - new Date(a.lastFailedAt).getTime();

    return {
      reception: reception.sort(sortByTime),
      patient: patient.sort(sortByTime),
    };
  }, [historyRecords]);

  const handleCalculatePackages = useCallback((): boolean => {
    if (!isValidCondition(oralCondition)) {
      Taro.showToast({
        title: '请至少选择一项口腔情况',
        icon: 'none',
        duration: 2000,
      });
      return false;
    }
    console.log('[PackageContext] Calculating packages with condition:', oralCondition);
    const result = calculatePackages(oralCondition);
    setPackages(result);
    console.log('[PackageContext] Packages calculated:', result);
    return true;
  }, [oralCondition]);

  const toggleService = useCallback((packageType: PackageType, serviceId: string) => {
    if (!packages) return;
    
    console.log('[PackageContext] Toggling service:', packageType, serviceId);
    
    setPackages((prev) => {
      if (!prev) return prev;
      
      const targetPkg = prev[packageType];
      const updatedServices = targetPkg.services.map((s) => {
        if (s.serviceId === serviceId) {
          if (s.declined) {
            return s;
          }
          if (s.selected) {
            return { 
              ...s, 
              selected: false, 
              declined: true, 
              declinedReason: '患者取消选择',
              declinedAt: new Date().toISOString(),
            };
          }
          return { ...s, selected: true };
        }
        return s;
      });
      
      const updatedPkg = recalculatePackage({ ...targetPkg, services: updatedServices });
      
      return {
        ...prev,
        [packageType]: updatedPkg,
      };
    });
  }, [packages]);

  const declineService = useCallback((packageType: PackageType, serviceId: string, reason: string) => {
    if (!packages) return;
    
    console.log('[PackageContext] Declining service:', packageType, serviceId, reason);
    
    setPackages((prev) => {
      if (!prev) return prev;
      
      const targetPkg = prev[packageType];
      const updatedServices = targetPkg.services.map((s) => {
        if (s.serviceId === serviceId) {
          return { 
            ...s, 
            selected: false, 
            declined: true, 
            declinedReason: reason,
            declinedAt: new Date().toISOString(),
          };
        }
        return s;
      });
      
      const updatedPkg = recalculatePackage({ ...targetPkg, services: updatedServices });
      
      return {
        ...prev,
        [packageType]: updatedPkg,
      };
    });
    
    Taro.showToast({
      title: '已记录',
      icon: 'success',
      duration: 1500,
    });
  }, [packages]);

  const restoreService = useCallback((packageType: PackageType, serviceId: string) => {
    if (!packages) return;
    
    console.log('[PackageContext] Restoring service:', packageType, serviceId);
    
    setPackages((prev) => {
      if (!prev) return prev;
      
      const targetPkg = prev[packageType];
      const updatedServices = targetPkg.services.map((s) => {
        if (s.serviceId === serviceId && s.declined) {
          return { 
            ...s, 
            selected: true, 
            declined: false, 
            declinedReason: undefined,
            declinedAt: undefined,
          };
        }
        return s;
      });
      
      const updatedPkg = recalculatePackage({ ...targetPkg, services: updatedServices });
      
      return {
        ...prev,
        [packageType]: updatedPkg,
      };
    });
  }, [packages]);

  const createRecord = useCallback((selectedTargets?: ('reception' | 'patient')[]): PlanRecord => {
    if (!packages) {
      throw new Error('Packages not calculated');
    }

    const pkg = packages[selectedPackage];
    const declinedServices = pkg.services.filter((s) => s.declined) as PackageService[];
    const patientSummary = generatePatientSummary(
      patientInfo.name || '',
      pkg,
      declinedServices
    );

    const buildSendRecord = (target: 'reception' | 'patient'): SendRecord => ({
      target,
      status: selectedTargets?.includes(target) ? 'sending' : 'pending',
      retryCount: 0,
    });

    const record: PlanRecord = {
      id: generateId(),
      patientInfo: { ...patientInfo },
      oralCondition: { ...oralCondition },
      selectedPackage,
      packages: JSON.parse(JSON.stringify(packages)),
      totalPrice: pkg.totalPrice,
      totalDuration: pkg.totalDuration,
      declinedServices,
      createdAt: dayjs().format('YYYY-MM-DD HH:mm'),
      status: 'draft',
      sendRecords: {
        reception: buildSendRecord('reception'),
        patient: buildSendRecord('patient'),
      },
      patientSummary,
    };

    console.log('[PackageContext] Creating record with targets:', selectedTargets, '→ sendRecords:', record.sendRecords);
    
    setHistoryRecords((prev) => [record, ...prev]);
    
    return record;
  }, [packages, selectedPackage, patientInfo, oralCondition]);

  const performSend = async (
    target: 'reception' | 'patient',
    record: PlanRecord
  ): Promise<{ success: boolean; reason?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const success = Math.random() > 0.1;
    
    if (success) {
      return { success: true };
    } else {
      const reasons = ['网络连接超时', '候诊屏未在线', '患者手机未授权', '系统繁忙'];
      return { 
        success: false, 
        reason: reasons[Math.floor(Math.random() * reasons.length)] 
      };
    }
  };

  const sendToTarget = useCallback(async (
    recordId: string, 
    target: 'reception' | 'patient'
  ): Promise<boolean> => {
    const record = historyRecords.find(r => r.id === recordId);
    if (!record) return false;

    setHistoryRecords(prev => prev.map(r => {
      if (r.id !== recordId) return r;
      return {
        ...r,
        sendRecords: {
          ...r.sendRecords,
          [target]: {
            ...r.sendRecords[target],
            status: 'sending' as SendStatus,
          },
        },
      };
    }));

    const result = await performSend(target, record);

    setHistoryRecords(prev => prev.map(r => {
      if (r.id !== recordId) return r;
      
      const currentSendRecord = r.sendRecords[target];
      const now = new Date().toISOString();
      const newSendRecord: SendRecord = {
        ...currentSendRecord,
        status: result.success ? 'success' : 'failed',
        sentAt: now,
        failedReason: result.success ? undefined : result.reason,
        retryCount: result.success ? currentSendRecord.retryCount : currentSendRecord.retryCount + 1,
      };

      const otherTarget = target === 'reception' ? 'patient' : 'reception';
      const allSuccess = result.success && r.sendRecords[otherTarget].status === 'success';
      const anySuccess = result.success || r.sendRecords[otherTarget].status === 'success';

      return {
        ...r,
        status: anySuccess ? (allSuccess ? 'sent' : r.status) : r.status,
        sendRecords: {
          ...r.sendRecords,
          [target]: newSendRecord,
        },
      };
    }));

    return result.success;
  }, [historyRecords]);

  const retrySend = useCallback(async (
    recordId: string, 
    target: 'reception' | 'patient'
  ): Promise<boolean> => {
    return sendToTarget(recordId, target);
  }, [sendToTarget]);

  const updateRecordStatus = useCallback((recordId: string, status: PlanRecord['status']) => {
    setHistoryRecords(prev => prev.map(r => {
      if (r.id !== recordId) return r;
      return { ...r, status };
    }));
  }, []);

  const resetAll = useCallback(() => {
    console.log('[PackageContext] Resetting all state');
    setPatientInfo({});
    setOralCondition(defaultOralCondition);
    setPackages(null);
    setSelectedPackage('basic');
    setCurrentStep(1);
    setSearchKeyword('');
  }, []);

  const getRecordById = useCallback((id: string): PlanRecord | undefined => {
    return historyRecords.find(r => r.id === id);
  }, [historyRecords]);

  const getSendStatus = useCallback((
    record: PlanRecord, 
    target: 'reception' | 'patient'
  ): SendStatus => {
    return record.sendRecords?.[target]?.status || 'pending';
  }, []);

  const getSendTime = useCallback((
    record: PlanRecord, 
    target: 'reception' | 'patient'
  ): string => {
    const sentAt = record.sendRecords?.[target]?.sentAt;
    if (!sentAt) return '';
    return dayjs(sentAt).format('MM-DD HH:mm');
  }, []);

  return (
    <PackageContext.Provider
      value={{
        patientInfo,
        setPatientInfo,
        oralCondition,
        setOralCondition,
        packages,
        calculatePackages: handleCalculatePackages,
        selectedPackage,
        setSelectedPackage,
        toggleService,
        declineService,
        restoreService,
        historyRecords,
        filteredRecords,
        searchKeyword,
        setSearchKeyword,
        createRecord,
        sendToTarget,
        retrySend,
        updateRecordStatus,
        currentStep,
        setCurrentStep,
        resetAll,
        getRecordById,
        getSendStatus,
        getSendTime,
        patientAggregatedRecords,
        failedSendRecords,
        followupSearchKeyword,
        setFollowupSearchKeyword,
        filteredPatientRecords,
      }}
    >
      {children}
    </PackageContext.Provider>
  );
};

export const usePackage = (): PackageContextType => {
  const context = useContext(PackageContext);
  if (!context) {
    throw new Error('usePackage must be used within a PackageProvider');
  }
  return context;
};
