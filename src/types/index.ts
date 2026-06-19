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
export type ServiceType = 'ultrasonic' | 'airflow' | 'polishing' | 'medication';

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
}

// 患者信息
export interface PatientInfo {
  name?: string;
  phone?: string;
  age?: number;
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
  sentTo?: ('reception' | 'patient')[];
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
