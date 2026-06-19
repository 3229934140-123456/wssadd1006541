import React, { useMemo } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { usePackage } from '../../store/PackageContext';
import StepIndicator from '../../components/StepIndicator';
import PackageCard from '../../components/PackageCard';
import SpeechBubble from '../../components/SpeechBubble';
import { speechTemplates, getDeclinedScript, getDeclinedReasonOptions } from '../../data/speechScripts';
import { tartarLevelOptions, pigmentationLevelOptions, bleedingLevelOptions } from '../../data/oralConditions';
import { PackageType, PackageService } from '../../types';
import styles from './index.module.scss';

const steps = [
  { id: 1, title: '口腔评估' },
  { id: 2, title: '套餐建议' },
  { id: 3, title: '方案确认' },
  { id: 4, title: '发送完成' },
];

const PackagePage: React.FC = () => {
  const {
    oralCondition,
    packages,
    selectedPackage,
    setSelectedPackage,
    toggleService,
    declineService,
    restoreService,
    setCurrentStep,
  } = usePackage();

  const conditionLabels = useMemo(() => {
    const labels: string[] = [];
    
    const tartarOpt = tartarLevelOptions.find(o => o.value === oralCondition.tartarLevel);
    if (tartarOpt) labels.push(`牙石${tartarOpt.label}`);
    
    if (oralCondition.pigmentationLevel !== 'none') {
      const pigmentOpt = pigmentationLevelOptions.find(o => o.value === oralCondition.pigmentationLevel);
      if (pigmentOpt) labels.push(`${pigmentOpt.label}色素沉着`);
    }
    
    if (oralCondition.bleedingLevel !== 'none') {
      const bleedingOpt = bleedingLevelOptions.find(o => o.value === oralCondition.bleedingLevel);
      if (bleedingOpt) labels.push(`${bleedingOpt.label}牙龈出血`);
    }
    
    if (oralCondition.isFirstTime) labels.push('初次洁牙');
    
    return labels;
  }, [oralCondition]);

  const hasValidSelection = useMemo(() => {
    if (!packages) return false;
    const pkg = packages[selectedPackage];
    return pkg.services.some(s => s.selected && !s.declined);
  }, [packages, selectedPackage]);

  const handleDecline = (packageType: PackageType, serviceId: string) => {
    const pkg = packages?.[packageType];
    if (!pkg) return;

    const service = pkg.services.find(s => s.serviceId === serviceId) as PackageService;
    if (service.declined) {
      Taro.showModal({
        title: '已记录为拒绝项',
        content: `${service.serviceName} 已标记为"已告知未选择"，原因：${service.declinedReason || '未说明'}。\n\n是否恢复为已选择？`,
        confirmText: '恢复选择',
        cancelText: '保持拒绝',
        success: (res) => {
          if (res.confirm) {
            restoreService(packageType, serviceId);
            Taro.showToast({
              title: '已恢复',
              icon: 'success',
              duration: 1500,
            });
          }
        },
      });
      return;
    }

    const reasonOptions = getDeclinedReasonOptions();
    
    Taro.showActionSheet({
      itemList: reasonOptions.map(o => o.label),
      success: (res) => {
        const reason = reasonOptions[res.tapIndex].value;
        
        declineService(packageType, serviceId, reason);
        
        const script = getDeclinedScript(service.serviceName, reason);
        Taro.showModal({
          title: '已记录，建议话术',
          content: script,
          showCancel: false,
          confirmText: '知道了',
        });
        
        console.log('[Package] Service declined:', serviceId, reason);
      },
    });
  };

  const handleNext = () => {
    if (!hasValidSelection) {
      Taro.showToast({
        title: '请至少选择一个服务项目',
        icon: 'none',
        duration: 2000,
      });
      return;
    }

    setCurrentStep(3);
    console.log('[Package] Navigating to confirm page');
    Taro.switchTab({
      url: '/pages/confirm/index',
    });
  };

  const handleBack = () => {
    setCurrentStep(1);
    Taro.switchTab({
      url: '/pages/assessment/index',
    });
  };

  const handleGoToAssessment = () => {
    Taro.switchTab({
      url: '/pages/assessment/index',
    });
  };

  if (!packages) {
    return (
      <View className={styles.pageContainer}>
        <StepIndicator currentStep={2} steps={steps} />
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>🦷</Text>
          <Text className={styles.emptyTitle}>还没有评估数据</Text>
          <Text className={styles.emptyDesc}>请先完成口腔情况评估，系统将自动生成套餐建议</Text>
          <Button className={styles.emptyBtn} onClick={handleGoToAssessment}>
            去评估
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.pageContainer}>
      <StepIndicator currentStep={2} steps={steps} />

      <Text className={styles.pageTitle}>套餐建议</Text>
      <Text className={styles.pageSubtitle}>根据患者口腔情况智能推荐两档方案</Text>

      <View className={styles.conditionSummary}>
        <Text className={styles.conditionTitle}>📋 患者口腔情况</Text>
        <View className={styles.conditionTags}>
          {conditionLabels.map((label, index) => (
            <Text key={index} className={styles.conditionTag}>{label}</Text>
          ))}
        </View>
      </View>

      <View className={styles.speechSection}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>💬</Text>
          医生话术建议
        </Text>
        <SpeechBubble text={packages.basic.speechScript} />
        <SpeechBubble text={packages.premium.speechScript} />
      </View>

      <View className={styles.differenceCard}>
        <Text className={styles.differenceTitle}>
          <Text className={styles.sectionIcon}>⚖️</Text>
          两档方案区别
        </Text>
        <Text className={styles.differenceContent}>{speechTemplates.difference}</Text>
      </View>

      <View className={styles.priceNote}>
        <Text className={styles.priceNoteIcon}>💡</Text>
        <Text className={styles.priceNoteText}>
          点击勾选框可调整选择；取消勾选将自动记录为"已告知未选择"；点击"拒绝"按钮可选择具体原因
        </Text>
      </View>

      <View className={styles.packagesSection}>
        <PackageCard
          pkg={packages.basic}
          selected={selectedPackage === 'basic'}
          onSelect={() => setSelectedPackage('basic')}
          onToggleService={(serviceId) => toggleService('basic', serviceId)}
          onDeclineService={(serviceId) => handleDecline('basic', serviceId)}
          onRestoreService={(serviceId) => restoreService('basic', serviceId)}
          showRestore={true}
        />
        <PackageCard
          pkg={packages.premium}
          selected={selectedPackage === 'premium'}
          onSelect={() => setSelectedPackage('premium')}
          onToggleService={(serviceId) => toggleService('premium', serviceId)}
          onDeclineService={(serviceId) => handleDecline('premium', serviceId)}
          onRestoreService={(serviceId) => restoreService('premium', serviceId)}
          showRestore={true}
        />
      </View>

      <View className={styles.bottomActionBar}>
        <Button
          className={styles.nextBtn}
          disabled={!hasValidSelection}
          onClick={handleNext}
        >
          <Text className={styles.btnText}>下一步，确认方案</Text>
        </Button>
        <Button className={styles.backBtn} onClick={handleBack}>
          返回修改评估
        </Button>
      </View>
    </View>
  );
};

export default PackagePage;
