import { OralCondition, Package, PackageService, ServiceItem, TartarLevel, PatientSummary } from '../types';
import { serviceItems, priceMultiplier } from '../data/services';
import { speechTemplates, getPackageHighlights, getObservationScript } from '../data/speechScripts';

const calculateServicePrice = (
  service: ServiceItem,
  tartarLevel: TartarLevel,
  pigmentationLevel: string
): number => {
  const multiplier = priceMultiplier[tartarLevel];
  const pigmentMultiplier = priceMultiplier[pigmentationLevel as keyof typeof priceMultiplier] || 1;
  
  let finalPrice = service.basePrice * multiplier;
  
  if (service.id === 'airflow' && pigmentationLevel !== 'none') {
    finalPrice = service.basePrice * pigmentMultiplier;
  }
  
  return Math.round(finalPrice);
};

const calculateServiceDuration = (
  service: ServiceItem,
  tartarLevel: TartarLevel
): number => {
  const levelMultiplier = {
    none: 1,
    mild: 1,
    moderate: 1.2,
    severe: 1.5,
  };
  return Math.round(service.duration * levelMultiplier[tartarLevel]);
};

export const isValidCondition = (condition: OralCondition): boolean => {
  const { tartarLevel, pigmentationLevel, bleedingLevel, isFirstTime } = condition;
  if (tartarLevel !== 'none') return true;
  if (pigmentationLevel !== 'none') return true;
  if (bleedingLevel !== 'none') return true;
  if (isFirstTime) return true;
  return false;
};

export const calculatePackages = (condition: OralCondition): { basic: Package; premium: Package } => {
  const { tartarLevel, pigmentationLevel, bleedingLevel, isFirstTime } = condition;

  const hasTartar = tartarLevel !== 'none';
  const hasPigment = pigmentationLevel !== 'none';
  const hasBleeding = bleedingLevel !== 'none';

  const basicServices: PackageService[] = serviceItems.map((service) => {
    let selected = false;
    
    if (service.id === 'observation') {
      selected = !hasTartar;
    }
    if (service.id === 'ultrasonic') {
      selected = hasTartar;
    }
    if (service.id === 'polishing') {
      selected = hasTartar || hasPigment;
    }
    if (service.id === 'medication') {
      selected = hasBleeding;
    }
    if (service.id === 'airflow') {
      selected = false;
    }

    return {
      serviceId: service.id,
      serviceName: service.name,
      price: calculateServicePrice(service, tartarLevel, pigmentationLevel),
      duration: calculateServiceDuration(service, tartarLevel),
      selected,
      declined: false,
    };
  }).filter(s => s.selected || s.serviceId !== 'observation' || !hasTartar);

  const premiumServices: PackageService[] = serviceItems.map((service) => {
    let selected = false;
    
    if (service.id === 'observation') {
      selected = !hasTartar;
    }
    if (service.id === 'ultrasonic') {
      selected = hasTartar;
    }
    if (service.id === 'airflow') {
      selected = hasPigment;
    }
    if (service.id === 'polishing') {
      selected = true;
    }
    if (service.id === 'medication') {
      selected = hasBleeding || hasTartar;
    }

    return {
      serviceId: service.id,
      serviceName: service.name,
      price: calculateServicePrice(service, tartarLevel, pigmentationLevel),
      duration: calculateServiceDuration(service, tartarLevel),
      selected,
      declined: false,
    };
  }).filter(s => s.selected || s.serviceId !== 'observation' || !hasTartar);

  const calculateTotals = (services: PackageService[]) => {
    const selected = services.filter((s) => s.selected && !s.declined);
    return {
      price: selected.reduce((sum, s) => sum + s.price, 0),
      duration: selected.reduce((sum, s) => sum + s.duration, 0),
    };
  };

  const basicTotals = calculateTotals(basicServices);
  const premiumTotals = calculateTotals(premiumServices);

  const firstTimeNote = isFirstTime ? '由于您是第一次洁牙，我会特别注意操作轻柔。' : '';

  let basicScript = speechTemplates.basicIntro;
  let premiumScript = speechTemplates.premiumIntro;
  let basicName = '必要处理套餐';
  let premiumName = '舒适加强套餐';
  let basicDesc = '解决核心问题，性价比之选';
  let premiumDesc = '全面清洁护理，舒适体验';

  if (!hasTartar) {
    const observationScript = getObservationScript(condition);
    basicScript = observationScript;
    premiumScript = observationScript + ' 如果您想做一下护理，我们可以选择加强方案，包含喷砂和抛光，让牙齿更光滑美观。';
    basicName = '观察护理套餐';
    premiumName = '舒适护理套餐';
    basicDesc = '基础检查，定期观察';
    premiumDesc = '全面护理，美观舒适';
  }

  return {
    basic: {
      type: 'basic',
      name: basicName,
      description: basicDesc,
      services: basicServices,
      totalPrice: basicTotals.price,
      totalDuration: basicTotals.duration,
      speechScript: firstTimeNote + basicScript,
      highlights: getPackageHighlights('basic', condition),
    },
    premium: {
      type: 'premium',
      name: premiumName,
      description: premiumDesc,
      services: premiumServices,
      totalPrice: premiumTotals.price,
      totalDuration: premiumTotals.duration,
      speechScript: firstTimeNote + premiumScript,
      highlights: getPackageHighlights('premium', condition),
    },
  };
};

export const recalculatePackage = (pkg: Package): Package => {
  const selected = pkg.services.filter((s) => s.selected && !s.declined);
  return {
    ...pkg,
    services: pkg.services,
    totalPrice: selected.reduce((sum, s) => sum + s.price, 0),
    totalDuration: selected.reduce((sum, s) => sum + s.duration, 0),
  };
};

export const generatePatientSummary = (
  patientName: string,
  pkg: Package,
  declinedServices: PackageService[]
): PatientSummary => {
  const selectedServices = pkg.services.filter(s => s.selected && !s.declined);
  
  return {
    patientName: patientName || '患者',
    packageName: pkg.name,
    totalPrice: pkg.totalPrice,
    totalDuration: pkg.totalDuration,
    services: selectedServices.map(s => ({
      name: s.serviceName,
      price: s.price,
    })),
    declinedServices: declinedServices.map(s => ({
      name: s.serviceName,
      reason: s.declinedReason || '患者暂不考虑',
    })),
    postCare: speechTemplates.postCare,
    doctorName: '张医生',
    createdAt: new Date().toISOString(),
  };
};

export const formatPrice = (price: number): string => {
  return `¥${price}`;
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
};

export const formatDateTime = (isoString: string): string => {
  const date = new Date(isoString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${month}月${day}日 ${hours}:${minutes}`;
};

export const generateId = (): string => {
  return 'rec' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};
