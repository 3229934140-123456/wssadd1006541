import React, { useState, useMemo } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { usePackage } from '../../store/PackageContext';
import StepIndicator from '../../components/StepIndicator';
import { speechTemplates } from '../../data/speechScripts';
import { tartarLevelOptions, pigmentationLevelOptions, bleedingLevelOptions } from '../../data/oralConditions';
import { formatPrice, formatDuration, formatDateTime } from '../../utils/packageCalculator';
import { SendStatus, PlanRecord } from '../../types';
import styles from './index.module.scss';

const steps = [
  { id: 1, title: '口腔评估' },
  { id: 2, title: '套餐建议' },
  { id: 3, title: '方案确认' },
  { id: 4, title: '发送完成' },
];

const sendOptions = [
  { id: 'reception' as const, name: '前台候诊屏', desc: '发送到前台电脑显示', icon: '🖥️' },
  { id: 'patient' as const, name: '患者手机', desc: '发送方案摘要给患者', icon: '📱' },
];

const ConfirmPage: React.FC = () => {
  const {
    patientInfo,
    oralCondition,
    packages,
    selectedPackage,
    createRecord,
    sendToTarget,
    retrySend,
    getSendStatus,
    getSendTime,
    setCurrentStep,
    resetAll,
  } = usePackage();

  const [selectedSendTo, setSelectedSendTo] = useState<('reception' | 'patient')[]>(['reception']);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPatientSummary, setShowPatientSummary] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<PlanRecord | null>(null);
  const [isSending, setIsSending] = useState(false);

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

  const toggleSendOption = (id: 'reception' | 'patient') => {
    if (currentRecord) return;
    setSelectedSendTo(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      }
      return [...prev, id];
    });
  };

  const getStatusText = (status: SendStatus): string => {
    switch (status) {
      case 'pending': return '待发送';
      case 'sending': return '发送中...';
      case 'success': return '已发送';
      case 'failed': return '发送失败';
      default: return '未知';
    }
  };

  const getStatusColor = (status: SendStatus): string => {
    switch (status) {
      case 'pending': return '#86909c';
      case 'sending': return '#028090';
      case 'success': return '#00b42a';
      case 'failed': return '#f53f3f';
      default: return '#86909c';
    }
  };

  const handleSend = async () => {
    if (selectedSendTo.length === 0) {
      Taro.showToast({
        title: '请至少选择一个发送对象',
        icon: 'none',
        duration: 2000,
      });
      return;
    }

    setIsSending(true);

    try {
      const record = createRecord();
      setCurrentRecord(record);

      const sendPromises = selectedSendTo.map(target => 
        sendToTarget(record.id, target)
      );

      const results = await Promise.all(sendPromises);
      const allSuccess = results.every(r => r);

      setCurrentStep(4);
      
      if (allSuccess) {
        setShowSuccess(true);
      }
    } catch (error) {
      console.error('[Confirm] Send failed:', error);
      Taro.showToast({
        title: '发送失败，请重试',
        icon: 'none',
        duration: 2000,
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleRetry = async (target: 'reception' | 'patient') => {
    if (!currentRecord) return;

    try {
      const success = await retrySend(currentRecord.id, target);
      if (success) {
        Taro.showToast({
          title: '重发成功',
          icon: 'success',
          duration: 1500,
        });
      } else {
        Taro.showToast({
          title: '重发失败，请稍后再试',
          icon: 'none',
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('[Confirm] Retry failed:', error);
    }
  };

  const handlePreviewPatientSummary = () => {
    setShowPatientSummary(true);
  };

  const handleClosePatientSummary = () => {
    setShowPatientSummary(false);
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    setCurrentRecord(null);
    resetAll();
    Taro.switchTab({
      url: '/pages/assessment/index',
    });
  };

  const handleBack = () => {
    if (currentRecord) {
      Taro.showModal({
        title: '确认返回',
        content: '当前方案已创建记录，返回将不保留未完成的发送状态。是否继续？',
        success: (res) => {
          if (res.confirm) {
            setCurrentRecord(null);
            setCurrentStep(2);
            Taro.switchTab({
              url: '/pages/package/index',
            });
          }
        },
      });
      return;
    }
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
              {service.declinedAt && (
                <Text className={styles.serviceTime}>记录时间：{formatDateTime(service.declinedAt)}</Text>
              )}
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
        <View className={styles.sendOptionsHeader}>
          <Text className={styles.sendOptionsTitle}>发送到</Text>
          {!currentRecord && patientInfo.phone && (
            <Text className={styles.previewLink} onClick={handlePreviewPatientSummary}>
              👁️ 预览患者端摘要
            </Text>
          )}
        </View>
        {sendOptions.map((option) => {
          const status = currentRecord ? getSendStatus(currentRecord, option.id) : 'pending' as SendStatus;
          const sendTime = currentRecord ? getSendTime(currentRecord, option.id) : '';
          const isSelected = selectedSendTo.includes(option.id);
          const isDisabled = !!currentRecord;

          return (
            <View
              key={option.id}
              className={classnames(styles.sendOptionItem, {
                [styles.sendOptionDisabled]: isDisabled,
              })}
              onClick={() => !isDisabled && toggleSendOption(option.id)}
            >
              <View className={styles.sendOptionLeft}>
                <Text className={styles.sendOptionIcon}>{option.icon}</Text>
                <View className={styles.sendOptionInfo}>
                  <Text className={styles.sendOptionName}>{option.name}</Text>
                  <Text className={styles.sendOptionDesc}>{option.desc}</Text>
                  {sendTime && (
                    <Text className={styles.sendTime}>发送时间：{sendTime}</Text>
                  )}
                  {status === 'failed' && currentRecord && (
                    <Text className={styles.sendFailedReason}>
                      失败原因：{currentRecord.sendRecords[option.id].failedReason}
                    </Text>
                  )}
                </View>
              </View>
              <View className={styles.sendOptionRight}>
                {isDisabled ? (
                  <View className={styles.sendStatusContainer}>
                    <Text 
                      className={styles.sendStatus}
                      style={{ color: getStatusColor(status) }}
                    >
                      {status === 'sending' ? '⏳ ' : status === 'success' ? '✓ ' : status === 'failed' ? '✕ ' : ''}
                      {getStatusText(status)}
                    </Text>
                    {status === 'failed' && (
                      <Text 
                        className={styles.retryBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRetry(option.id);
                        }}
                      >
                        重试
                      </Text>
                    )}
                  </View>
                ) : (
                  <View
                    className={classnames(styles.checkbox, {
                      [styles.checkboxChecked]: isSelected,
                    })}
                  >
                    {isSelected && (
                      <Text className={styles.checkIcon}>✓</Text>
                    )}
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>

      <View className={styles.bottomActionBar}>
        <View className={styles.actionButtons}>
          {!currentRecord ? (
            <Button
              className={styles.sendBtn}
              disabled={selectedSendTo.length === 0 || isSending}
              loading={isSending}
              onClick={handleSend}
            >
              <Text className={styles.btnText}>{isSending ? '发送中...' : '确认并发送'}</Text>
            </Button>
          ) : (
            <Button
              className={styles.sendBtn}
              onClick={handleSuccessClose}
            >
              <Text className={styles.btnText}>完成，新建下一位</Text>
            </Button>
          )}
        </View>
        <Button className={styles.backBtn} onClick={handleBack}>
          {currentRecord ? '取消本次方案' : '返回修改套餐'}
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

      {showPatientSummary && currentPkg && (
        <View className={styles.summaryOverlay} onClick={handleClosePatientSummary}>
          <View className={styles.summaryModal} onClick={(e) => e.stopPropagation()}>
            <View className={styles.summaryModalHeader}>
              <Text className={styles.summaryModalTitle}>📱 患者端方案摘要</Text>
              <Text className={styles.summaryModalClose} onClick={handleClosePatientSummary}>✕</Text>
            </View>
            <View className={styles.patientSummaryCard}>
              <View className={styles.patientSummaryHeader}>
                <Text className={styles.patientSummaryClinic}>🦷 悦齿口腔诊所</Text>
                <Text className={styles.patientSummaryDate}>{new Date().toLocaleDateString()}</Text>
              </View>
              
              <View className={styles.patientSummarySection}>
                <Text className={styles.patientSummaryName}>{patientInfo.name || '尊敬的患者'} 您好：</Text>
                <Text className={styles.patientSummaryPackage}>
                  您选择的 <Text className={styles.patientSummaryPackageName}>{currentPkg.name}</Text>
                </Text>
              </View>

              <View className={styles.patientSummaryDivider} />

              <View className={styles.patientSummarySection}>
                <Text className={styles.patientSummarySectionTitle}>📋 治疗项目</Text>
                {selectedServices.map((s, i) => (
                  <View key={i} className={styles.patientSummaryItem}>
                    <Text className={styles.patientSummaryItemName}>{s.serviceName}</Text>
                    <Text className={styles.patientSummaryItemPrice}>{formatPrice(s.price)}</Text>
                  </View>
                ))}
                {declinedServices.length > 0 && (
                  <>
                    <View className={styles.patientSummaryDividerSmall} />
                    <Text className={styles.patientSummarySectionTitle}>📝 已告知未选择</Text>
                    {declinedServices.map((s, i) => (
                      <View key={i} className={styles.patientSummaryItemDeclined}>
                        <Text className={styles.patientSummaryItemName}>{s.serviceName}</Text>
                        <Text className={styles.patientSummaryItemDesc}>{s.declinedReason}</Text>
                      </View>
                    ))}
                  </>
                )}
              </View>

              <View className={styles.patientSummaryDivider} />

              <View className={styles.patientSummaryTotal}>
                <Text className={styles.patientSummaryTotalLabel}>预计总费用</Text>
                <Text className={styles.patientSummaryTotalPrice}>{formatPrice(currentPkg.totalPrice)}</Text>
              </View>
              <View className={styles.patientSummaryTotal}>
                <Text className={styles.patientSummaryTotalLabel}>预计用时</Text>
                <Text className={styles.patientSummaryTotalValue}>{formatDuration(currentPkg.totalDuration)}</Text>
              </View>

              <View className={styles.patientSummaryDivider} />

              <View className={styles.patientSummarySection}>
                <Text className={styles.patientSummarySectionTitle}>⚠️ 术后注意事项</Text>
                {speechTemplates.postCare.slice(0, 3).map((item, i) => (
                  <Text key={i} className={styles.patientSummaryNote}>• {item}</Text>
                ))}
              </View>

              <View className={styles.patientSummaryFooter}>
                <Text className={styles.patientSummaryDoctor}>主治医师：张医生</Text>
                <Text className={styles.patientSummaryContact}>咨询电话：400-888-8888</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default ConfirmPage;
