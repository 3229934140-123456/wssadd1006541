import React, { useState, useMemo } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { usePackage } from '../../store/PackageContext';
import StepIndicator from '../../components/StepIndicator';
import { speechTemplates } from '../../data/speechScripts';
import { tartarLevelOptions, pigmentationLevelOptions, bleedingLevelOptions } from '../../data/oralConditions';
import { formatPrice, formatDuration } from '../../utils/packageCalculator';
import styles from './index.module.scss';

const steps = [
  { id: 1, title: '口腔评估' },
  { id: 2, title: '套餐建议' },
  { id: 3, title: '方案确认' },
  { id: 4, title: '发送完成' },
];

const sendOptions = [
  { id: 'reception', name: '前台候诊屏', desc: '发送到前台电脑显示', icon: '🖥️' },
  { id: 'patient', name: '患者手机', desc: '发送短信/微信给患者', icon: '📱' },
];

const ConfirmPage: React.FC = () => {
  const {
    patientInfo,
    oralCondition,
    packages,
    selectedPackage,
    saveRecord,
    setCurrentStep,
    resetAll,
  } = usePackage();

  const [selectedSendTo, setSelectedSendTo] = useState<string[]>(['reception']);
  const [showSuccess, setShowSuccess] = useState(false);

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

  const currentPkg = useMemo(() => {
    if (!packages) return null;
    return packages[selectedPackage];
  }, [packages, selectedPackage]);

  const selectedServices = useMemo(() => {
    if (!currentPkg) return [];
    return currentPkg.services.filter(s => s.selected && !s.declined);
  }, [currentPkg]);

  const declinedServices = useMemo(() => {
    if (!currentPkg) return [];
    return currentPkg.services.filter(s => s.declined);
  }, [currentPkg]);

  const toggleSendOption = (id: string) => {
    setSelectedSendTo(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      }
      return [...prev, id];
    });
  };

  const handleSend = () => {
    if (selectedSendTo.length === 0) {
      Taro.showToast({
        title: '请至少选择一个发送对象',
        icon: 'none',
        duration: 2000,
      });
      return;
    }

    try {
      const record = saveRecord(selectedSendTo as ('reception' | 'patient')[]);
      console.log('[Confirm] Record saved:', record);
      
      setCurrentStep(4);
      setShowSuccess(true);
    } catch (error) {
      console.error('[Confirm] Save record failed:', error);
      Taro.showToast({
        title: '保存失败，请重试',
        icon: 'none',
        duration: 2000,
      });
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    resetAll();
    Taro.switchTab({
      url: '/pages/assessment/index',
    });
  };

  const handleBack = () => {
    setCurrentStep(2);
    Taro.switchTab({
      url: '/pages/package/index',
    });
  };

  const handleGoToAssessment = () => {
    Taro.switchTab({
      url: '/pages/assessment/index',
    });
  };

  if (!packages || !currentPkg) {
    return (
      <View className={styles.pageContainer}>
        <StepIndicator currentStep={3} steps={steps} />
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>🦷</Text>
          <Text className={styles.emptyTitle}>还没有方案数据</Text>
          <Text className={styles.emptyDesc}>请先完成口腔评估和套餐选择</Text>
          <Button className={styles.emptyBtn} onClick={handleGoToAssessment}>
            去评估
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.pageContainer}>
      <StepIndicator currentStep={3} steps={steps} />

      <Text className={styles.pageTitle}>方案确认</Text>
      <Text className={styles.pageSubtitle}>请核对以下信息，确认无误后发送</Text>

      <View className={styles.summaryCard}>
        <View className={styles.summaryRow}>
          <Text className={styles.summaryLabel}>套餐类型</Text>
          <Text className={styles.summaryValue}>{currentPkg.name}</Text>
        </View>
        <View className={styles.summaryRow}>
          <Text className={styles.summaryLabel}>预计费用</Text>
          <Text className={styles.summaryTotal}>{formatPrice(currentPkg.totalPrice)}</Text>
        </View>
        <View className={styles.summaryRow}>
          <Text className={styles.summaryLabel}>预计用时</Text>
          <Text className={styles.summaryDuration}>{formatDuration(currentPkg.totalDuration)}</Text>
        </View>
      </View>

      <View className={styles.patientCard}>
        <Text className={styles.cardTitle}>
          <Text className={styles.cardIcon}>👤</Text>
          患者信息
        </Text>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>姓名</Text>
          <Text className={styles.infoValue}>{patientInfo.name || '未填写'}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>电话</Text>
          <Text className={styles.infoValue}>{patientInfo.phone || '未填写'}</Text>
        </View>
      </View>

      <View className={styles.conditionCard}>
        <Text className={styles.cardTitle}>
          <Text className={styles.cardIcon}>📋</Text>
          口腔情况
        </Text>
        <View className={styles.conditionTags}>
          {conditionLabels.map((label, index) => (
            <Text key={index} className={styles.conditionTag}>{label}</Text>
          ))}
        </View>
      </View>

      <View className={styles.servicesCard}>
        <Text className={styles.cardTitle}>
          <Text className={styles.cardIcon}>✅</Text>
          服务项目
        </Text>
        {selectedServices.map((service) => (
          <View key={service.serviceId} className={styles.serviceItem}>
            <View className={styles.serviceLeft}>
              <Text className={styles.serviceName}>{service.serviceName}</Text>
            </View>
            <Text className={styles.servicePrice}>{formatPrice(service.price)}</Text>
          </View>
        ))}
        {declinedServices.map((service) => (
          <View key={service.serviceId} className={classnames(styles.serviceItem, styles.serviceDeclined)}>
            <View className={styles.serviceLeft}>
              <Text className={styles.serviceName}>
                {service.serviceName}
                <Text className={styles.serviceDeclinedLabel}>已告知未选择</Text>
              </Text>
              <Text className={styles.serviceDesc}>原因：{service.declinedReason}</Text>
            </View>
            <Text className={classnames(styles.servicePrice, styles.servicePriceInactive)}>
              {formatPrice(service.price)}
            </Text>
          </View>
        ))}
      </View>

      <View className={styles.noticeCard}>
        <Text className={styles.cardTitle}>
          <Text className={styles.cardIcon}>⚠️</Text>
          注意事项
        </Text>
        <View className={styles.noticeList}>
          {speechTemplates.postCare.map((item, index) => (
            <View key={index} className={styles.noticeItem}>
              <View className={styles.noticeDot} />
              <Text className={styles.noticeText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.sendOptions}>
        <Text className={styles.sendOptionsTitle}>发送到</Text>
        {sendOptions.map((option) => (
          <View
            key={option.id}
            className={styles.sendOptionItem}
            onClick={() => toggleSendOption(option.id)}
          >
            <View className={styles.sendOptionLeft}>
              <Text className={styles.sendOptionIcon}>{option.icon}</Text>
              <View className={styles.sendOptionInfo}>
                <Text className={styles.sendOptionName}>{option.name}</Text>
                <Text className={styles.sendOptionDesc}>{option.desc}</Text>
              </View>
            </View>
            <View
              className={classnames(styles.checkbox, {
                [styles.checkboxChecked]: selectedSendTo.includes(option.id),
              })}
            >
              {selectedSendTo.includes(option.id) && (
                <Text className={styles.checkIcon}>✓</Text>
              )}
            </View>
          </View>
        ))}
      </View>

      <View className={styles.bottomActionBar}>
        <View className={styles.actionButtons}>
          <Button
            className={styles.sendBtn}
            disabled={selectedSendTo.length === 0}
            onClick={handleSend}
          >
            <Text className={styles.btnText}>确认并发送</Text>
          </Button>
        </View>
        <Button className={styles.backBtn} onClick={handleBack}>
          返回修改套餐
        </Button>
      </View>

      {showSuccess && (
        <View className={styles.successOverlay} onClick={handleSuccessClose}>
          <View className={styles.successCard} onClick={(e) => e.stopPropagation()}>
            <View className={styles.successIcon}>
              <Text className={styles.successIconText}>✓</Text>
            </View>
            <Text className={styles.successTitle}>发送成功！</Text>
            <Text className={styles.successDesc}>
              方案已发送到{selectedSendTo.includes('reception') ? '前台候诊屏' : ''}
              {selectedSendTo.length === 2 ? '和' : ''}
              {selectedSendTo.includes('patient') ? '患者手机' : ''}
            </Text>
            <Button className={styles.successBtn} onClick={handleSuccessClose}>
              <Text className={styles.btnText}>完成，新建下一位</Text>
            </Button>
          </View>
        </View>
      )}
    </View>
  );
};

export default ConfirmPage;
