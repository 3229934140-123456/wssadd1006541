import { OptionItem } from '../types';

export const tartarLevelOptions: OptionItem[] = [
  { value: 'none', label: '0度', description: '无牙石' },
  { value: 'mild', label: '1度', description: '轻度牙石，颈部少量' },
  { value: 'moderate', label: '2度', description: '中度牙石，波及部分牙根' },
  { value: 'severe', label: '3度', description: '重度牙石，全口广泛' },
];

export const pigmentationLevelOptions: OptionItem[] = [
  { value: 'none', label: '无', description: '牙齿颜色正常' },
  { value: 'mild', label: '轻度', description: '少量色素沉着，烟渍/茶渍' },
  { value: 'moderate', label: '中度', description: '明显色素沉着' },
  { value: 'severe', label: '重度', description: '严重色素沉着' },
];

export const bleedingLevelOptions: OptionItem[] = [
  { value: 'none', label: '无', description: '牙龈健康，无出血' },
  { value: 'mild', label: '轻度', description: '探诊少量出血' },
  { value: 'moderate', label: '中度', description: '刷牙/咬硬物出血' },
  { value: 'severe', label: '重度', description: '自发性出血' },
];
