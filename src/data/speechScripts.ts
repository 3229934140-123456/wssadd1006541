import { SpeechTemplate } from '../types';

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
};

export const getPackageHighlights = (type: 'basic' | 'premium'): string[] => {
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

export const getDeclinedScript = (serviceName: string): string => {
  return speechTemplates.declinedService.replace('{serviceName}', serviceName);
};
