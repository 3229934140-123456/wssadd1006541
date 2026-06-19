import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Taro from '@tarojs/taro';
import {
  OralCondition,
  Package,
  PackageType,
  PatientInfo,
  PlanRecord,
  PackageService,
} from '../types';
import { calculatePackages, recalculatePackage, generateId } from '../utils/packageCalculator';
import { mockHistoryRecords } from '../data/historyRecords';
import dayjs from 'dayjs';

interface PackageContextType {
  patientInfo: PatientInfo;
  setPatientInfo: (info: PatientInfo) => void;
  oralCondition: OralCondition;
  setOralCondition: (condition: OralCondition) => void;
  packages: { basic: Package; premium: Package } | null;
  calculatePackages: () => void;
  selectedPackage: PackageType;
  setSelectedPackage: (type: PackageType) => void;
  toggleService: (packageType: PackageType, serviceId: string) => void;
  declineService: (packageType: PackageType, serviceId: string, reason: string) => void;
  historyRecords: PlanRecord[];
  saveRecord: (sendTo: ('reception' | 'patient')[]) => PlanRecord;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  resetAll: () => void;
  getCurrentRecord: () => PlanRecord | null;
}

const defaultOralCondition: OralCondition = {
  tartarLevel: 'none',
  pigmentationLevel: 'none',
  bleedingLevel: 'none',
  isFirstTime: false,
};

const PackageContext = createContext<PackageContextType | undefined>(undefined);

export const PackageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({});
  const [oralCondition, setOralCondition] = useState<OralCondition>(defaultOralCondition);
  const [packages, setPackages] = useState<{ basic: Package; premium: Package } | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<PackageType>('basic');
  const [historyRecords, setHistoryRecords] = useState<PlanRecord[]>(mockHistoryRecords);
  const [currentStep, setCurrentStep] = useState<number>(1);

  const handleCalculatePackages = useCallback(() => {
    console.log('[PackageContext] Calculating packages with condition:', oralCondition);
    const result = calculatePackages(oralCondition);
    setPackages(result);
    console.log('[PackageContext] Packages calculated:', result);
  }, [oralCondition]);

  const toggleService = useCallback((packageType: PackageType, serviceId: string) => {
    if (!packages) return;
    
    console.log('[PackageContext] Toggling service:', packageType, serviceId);
    
    setPackages((prev) => {
      if (!prev) return prev;
      
      const targetPkg = prev[packageType];
      const updatedServices = targetPkg.services.map((s) => {
        if (s.serviceId === serviceId && !s.declined) {
          return { ...s, selected: !s.selected };
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
          return { ...s, selected: false, declined: true, declinedReason: reason };
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

  const saveRecord = useCallback((sendTo: ('reception' | 'patient')[]): PlanRecord => {
    if (!packages) {
      throw new Error('Packages not calculated');
    }

    const pkg = packages[selectedPackage];
    const declinedServices = pkg.services.filter((s) => s.declined) as PackageService[];

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
      status: 'sent',
      sentTo,
    };

    console.log('[PackageContext] Saving record:', record);
    
    setHistoryRecords((prev) => [record, ...prev]);
    
    return record;
  }, [packages, selectedPackage, patientInfo, oralCondition]);

  const resetAll = useCallback(() => {
    console.log('[PackageContext] Resetting all state');
    setPatientInfo({});
    setOralCondition(defaultOralCondition);
    setPackages(null);
    setSelectedPackage('basic');
    setCurrentStep(1);
  }, []);

  const getCurrentRecord = useCallback((): PlanRecord | null => {
    if (!packages) return null;
    
    const pkg = packages[selectedPackage];
    const declinedServices = pkg.services.filter((s) => s.declined) as PackageService[];

    return {
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
    };
  }, [packages, selectedPackage, patientInfo, oralCondition]);

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
        historyRecords,
        saveRecord,
        currentStep,
        setCurrentStep,
        resetAll,
        getCurrentRecord,
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
