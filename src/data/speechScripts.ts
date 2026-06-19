import { SpeechTemplate, OralCondition, PackageService } from '../types';
import { tartarLevelOptions, pigmentationLevelOptions, bleedingLevelOptions } from './oralConditions';

export const speechTemplates: SpeechTemplate = {
  basicIntro: '根据您的口腔情况，我们有一个基础洁牙方案。主要包含超声洁治，可以有效去除牙石和牙菌斑，解决牙龈出血问题。价格比较实惠，是解决您目前问题的必要处理。',
  
  premiumIntro: '另外我们还有一个舒适加强方案，在基础洁牙的基础上，增加了喷砂和抛光。喷砂可以彻底去除烟渍、茶渍等色素沉着，让牙齿更白更亮；抛光可以让牙面更光滑，减少牙石再次沉积的速度。整个过程更舒适，效果也更持久。',
  
  difference: '两个方案的区别主要在于：基础方案解决"有没有病"的问题，把牙石去掉，炎症消下去，是必要处理；舒适加强方案是在解决问题的基础上，追求"好不好"，让牙齿更白、更光滑、更舒服。您可以根据自己的需求和预算来选择。',
  
  declinedService: '好的，我理解您的顾虑。{serviceName}这项我们就先不做了，我已经记录下来。您后续如果想做随时跟我说。其他项目我们还是按计划进行。',
  
  postCare: [
    '洁牙后2小时内不要进食，24小时内避免冷热酸甜刺激',
    '不要用舌头舔舐、手指触摸牙龈',
    '一周内不要食用过硬、过韧食物，避免用患侧咀嚼',
    '洁牙后少量出血属正常现象，如出血较多请及时复诊',
    '建议每半年到一年进行一次口腔检查和洁牙',
  ],

  observationIntro: '检查发现您目前没有明显牙石，口腔基础情况不错。不过{issues}，建议{recommendation}。我们可以做一个简单的口腔护理，或者您也可以先观察，定期复查。',
};

export const getObservationScript = (condition: OralCondition): string => {
  const issues: string[] = [];
  const recommendations: string[] = [];

  if (condition.pigmentationLevel !== 'none') {
    const pigmentLabel = pigmentationLevelOptions.find(o => o.value === condition.pigmentationLevel)?.label || '';
    issues.push(`有${pigmentLabel}色素沉着`);
    recommendations.push('做喷砂去除色素，让牙齿更白');
  }
  if (condition.bleedingLevel !== 'none') {
    const bleedingLabel = bleedingLevelOptions.find(o => o.value === condition.bleedingLevel)?.label || '';
    issues.push(`牙龈${bleedingLabel}出血`);
    recommendations.push('上药护理，帮助牙龈消炎止血');
  }
  if (condition.isFirstTime) {
    issues.push('这是您第一次洁牙');
    recommendations.push('做一次全面的口腔检查和基础护理');
  }

  if (issues.length === 0) {
    return '检查发现您的口腔情况非常好，没有牙石、色素沉着或牙龈出血问题。建议您每半年定期复查，保持良好的口腔卫生习惯。';
  }

  return speechTemplates.observationIntro
    .replace('{issues}', issues.join('，'))
    .replace('{recommendation}', recommendations.join('，同时'));
};

export const getPackageHighlights = (type: 'basic' | 'premium', condition?: OralCondition): string[] => {
  if (condition?.tartarLevel === 'none') {
    if (type === 'basic') {
      const highlights: string[] = ['口腔基础检查'];
      if (condition.bleedingLevel !== 'none') highlights.push('牙龈消炎护理');
      if (condition.isFirstTime) highlights.push('首次洁牙指导');
      if (highlights.length === 1) highlights.push('定期复查建议');
      return highlights;
    }
    const highlights: string[] = ['口腔全面检查'];
    if (condition.pigmentationLevel !== 'none') highlights.push('喷砂去除色素');
    if (condition.bleedingLevel !== 'none') highlights.push('牙周上药护理');
    highlights.push('牙面抛光护理');
    return highlights;
  }

  if (type === 'basic') {
    return [
      '去除牙石牙菌斑',
      '缓解牙龈炎症',
      '解决出血问题',
      '性价比高',
    ];
  }
  return [
    '深度清洁无死角',
    '去除色素美白牙齿',
    '光滑牙面防再沉积',
    '舒适体验效果持久',
  ];
};

export const getDeclinedScript = (serviceName: string, reason?: string): string => {
  let script = speechTemplates.declinedService.replace('{serviceName}', serviceName);
  if (reason) {
    script += ` 您提到的原因是：${reason}。`;
  }
  return script;
};

export const getDeclinedReasonOptions = (): { value: string; label: string }[] => [
  { value: '价格顾虑', label: '价格太贵，暂时不考虑' },
  { value: '时间紧张', label: '今天时间不够，下次再说' },
  { value: '害怕疼痛', label: '有点害怕，想再考虑一下' },
  { value: '觉得不需要', label: '感觉不需要，先观察看看' },
  { value: '其他原因', label: '其他原因' },
];

export const formatOralConditionSummary = (condition: OralCondition): string => {
  const parts: string[] = [];
  const tartarLabel = tartarLevelOptions.find(o => o.value === condition.tartarLevel)?.label || '';
  parts.push(`牙石：${tartarLabel}`);
  
  if (condition.pigmentationLevel !== 'none') {
    const pigmentLabel = pigmentationLevelOptions.find(o => o.value === condition.pigmentationLevel)?.label || '';
    parts.push(`色素：${pigmentLabel}`);
  }
  if (condition.bleedingLevel !== 'none') {
    const bleedingLabel = bleedingLevelOptions.find(o => o.value === condition.bleedingLevel)?.label || '';
    parts.push(`出血：${bleedingLabel}`);
  }
  if (condition.isFirstTime) {
    parts.push('初次洁牙');
  }
  
  return parts.join(' | ');
};

export const getDeclinedServicesSummary = (declinedServices: PackageService[]): string => {
  if (declinedServices.length === 0) return '';
  return declinedServices.map(s => `${s.serviceName}（${s.declinedReason || '未说明原因'}）`).join('、');
};
