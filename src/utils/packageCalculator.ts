import { OralCondition, Package, PackageService, ServiceItem, TartarLevel } from '../types';
import { serviceItems, priceMultiplier } from '../data/services';
import { speechTemplates, getPackageHighlights } from '../data/speechScripts';

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

export const calculatePackages = (condition: OralCondition): { basic: Package; premium: Package } => {
  const { tartarLevel, pigmentationLevel, bleedingLevel, isFirstTime } = condition;

  const basicServices: PackageService[] = serviceItems.map((service) => {
    const isRequired = service.requiredForLevel.includes(tartarLevel);
    const isBleeding = bleedingLevel !== 'none';
    
    let selected = false;
    if (service.id === 'ultrasonic' && tartarLevel !== 'none') selected = true;
    if (service.id === 'polishing' && tartarLevel !== 'none') selected = true;
    if (service.id === 'medication' && isBleeding) selected = true;

    return {
      serviceId: service.id,
      serviceName: service.name,
      price: calculateServicePrice(service, tartarLevel, pigmentationLevel),
      duration: calculateServiceDuration(service, tartarLevel),
      selected,
      declined: false,
    };
  });

  const premiumServices: PackageService[] = serviceItems.map((service) => {
    let selected = false;
    if (service.id === 'ultrasonic' && tartarLevel !== 'none') selected = true;
    if (service.id === 'airflow' && pigmentationLevel !== 'none') selected = true;
    if (service.id === 'polishing') selected = true;
    if (service.id === 'medication') selected = true;

    return {
      serviceId: service.id,
      serviceName: service.name,
      price: calculateServicePrice(service, tartarLevel, pigmentationLevel),
      duration: calculateServiceDuration(service, tartarLevel),
      selected,
      declined: false,
    };
  });

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

  return {
    basic: {
      type: 'basic',
      name: '必要处理套餐',
      description: '解决核心问题，性价比之选',
      services: basicServices,
      totalPrice: basicTotals.price,
      totalDuration: basicTotals.duration,
      speechScript: firstTimeNote + speechTemplates.basicIntro,
      highlights: getPackageHighlights('basic'),
    },
    premium: {
      type: 'premium',
      name: '舒适加强套餐',
      description: '全面清洁护理，舒适体验',
      services: premiumServices,
      totalPrice: premiumTotals.price,
      totalDuration: premiumTotals.duration,
      speechScript: firstTimeNote + speechTemplates.premiumIntro,
      highlights: getPackageHighlights('premium'),
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

export const formatPrice = (price: number): string => {
  return `¥${price}`;
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
};

export const generateId = (): string => {
  return 'rec' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};
