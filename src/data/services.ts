import { ServiceItem } from '../types';

export const serviceItems: ServiceItem[] = [
  {
    id: 'ultrasonic',
    name: '超声洁治',
    description: '使用超声波洁牙机去除牙石、牙菌斑',
    basePrice: 120,
    duration: 20,
    requiredForLevel: ['mild', 'moderate', 'severe'],
    recommendedForLevel: [],
  },
  {
    id: 'airflow',
    name: '喷砂',
    description: '使用高压喷砂去除色素沉着，恢复牙齿自然色泽',
    basePrice: 150,
    duration: 15,
    requiredForLevel: [],
    recommendedForLevel: ['mild', 'moderate', 'severe'],
  },
  {
    id: 'polishing',
    name: '抛光',
    description: '使用抛光膏抛光牙面，减少菌斑附着',
    basePrice: 80,
    duration: 10,
    requiredForLevel: [],
    recommendedForLevel: ['none', 'mild', 'moderate', 'severe'],
  },
  {
    id: 'medication',
    name: '上药护理',
    description: '牙周袋内上药，消炎止血，促进牙龈愈合',
    basePrice: 60,
    duration: 5,
    requiredForLevel: [],
    recommendedForLevel: [],
  },
];

export const priceMultiplier = {
  none: 1,
  mild: 1,
  moderate: 1.3,
  severe: 1.6,
};
