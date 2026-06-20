// 牙石等级
export type TartarLevel = 'none' | 'mild' | 'moderate' | 'severe';

// 色素沉着程度
export type PigmentationLevel = 'none' | 'mild' | 'moderate' | 'severe';

// 牙龈出血情况
export type BleedingLevel = 'none' | 'mild' | 'moderate' | 'severe';

// 口腔情况
export interface OralCondition {
  tartarLevel: TartarLevel;
  pigmentationLevel: PigmentationLevel;
  bleedingLevel: BleedingLevel;
  isFirstTime: boolean;
  notes?: string;
}

// 服务项目类型
export type ServiceType = 'ultrasonic' | 'airflow' | 'polishing' | 'medication' | 'observation';

// 服务项目
export interface ServiceItem {
  id: ServiceType;
  name: string;
  description: string;
  basePrice: number;
  duration: number;
  requiredForLevel: TartarLevel[];
  recommendedForLevel: PigmentationLevel[];
}

// 套餐内项目
export interface PackageService {
  serviceId: ServiceType;
  serviceName: string;
  price: number;
  duration: number;
  selected: boolean;
  declined: boolean;
  declinedReason?: string;
  declinedAt?: string;
}

// 套餐类型
export type PackageType = 'basic' | 'premium';

// 套餐
export interface Package {
  type: PackageType;
  name: string;
  description: string;
  services: PackageService[];
  totalPrice: number;
  totalDuration: number;
  speechScript: string;
  highlights: string[];
}

// 话术模板
export interface SpeechTemplate {
  basicIntro: string;
  premiumIntro: string;
  difference: string;
  declinedService: string;
  postCare: string[];
  observationIntro: string;
}

// 患者信息
export interface PatientInfo {
  name?: string;
  phone?: string;
  age?: number;
}

// 发送状态
export type SendStatus = 'pending' | 'sending' | 'success' | 'failed';

// 发送记录
export interface SendRecord {
  target: 'reception' | 'patient';
  status: SendStatus;
  sentAt?: string;
  failedReason?: string;
  retryCount: number;
}

// 患者端方案摘要
export interface PatientSummary {
  patientName: string;
  packageName: string;
  totalPrice: number;
  totalDuration: number;
  services: { name: string; price: number }[];
  declinedServices: { name: string; reason: string }[];
  postCare: string[];
  doctorName: string;
  createdAt: string;
}

// 方案记录
export interface PlanRecord {
  id: string;
  patientInfo: PatientInfo;
  oralCondition: OralCondition;
  selectedPackage: PackageType;
  packages: {
    basic: Package;
    premium: Package;
  };
  totalPrice: number;
  totalDuration: number;
  declinedServices: PackageService[];
  createdAt: string;
  status: 'draft' | 'sent' | 'confirmed' | 'completed';
  sendRecords: {
    reception: SendRecord;
    patient: SendRecord;
  };
  patientSummary?: PatientSummary;
}

// 全局状态持久化数据
export interface PersistedState {
  historyRecords: PlanRecord[];
  currentDraft: {
    patientInfo: PatientInfo;
    oralCondition: OralCondition;
    packages: { basic: Package; premium: Package };
    selectedPackage: PackageType;
    currentStep: number;
  } | null;
}

export interface PatientAggregatedRecord {
  patientName: string;
  patientPhone: string;
  latestRecord: PlanRecord;
  recordCount: number;
  declinedServices: PackageService[];
  lastVisitDate: string;
  sendStatus: {
    reception: SendStatus;
    patient: SendStatus;
  };
}

export interface FailedSendItem {
  record: PlanRecord;
  target: 'reception' | 'patient';
  failedReason: string;
  retryCount: number;
  lastFailedAt: string;
}

export interface FailedSendGroup {
  reception: FailedSendItem[];
  patient: FailedSendItem[];
}

// 步骤
export interface Step {
  id: number;
  title: string;
  completed: boolean;
}

// 选项
export interface OptionItem {
  value: string;
  label: string;
  description?: string;
}
