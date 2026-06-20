import React, { useMemo, useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import { usePackage } from '../../store/PackageContext';
import { speechTemplates } from '../../data/speechScripts';
import { tartarLevelOptions, pigmentationLevelOptions, bleedingLevelOptions } from '../../data/oralConditions';
import { formatPrice, formatDuration, formatDateTime } from '../../utils/packageCalculator';
import { SendStatus, PlanRecord } from '../../types';
import styles from './index.module.scss';

const statusMap = {
  draft: { label: '草稿', className: styles.statusDraft },
  sent: { label: '已发送', className: styles.statusSent },
  confirmed: { label: '已确认', className: styles.statusConfirmed },
  completed: { label: '已完成', className: styles.statusCompleted },
};

const sendStatusMap: Record<SendStatus, { label: string; className: string; icon: string }> = {
  pending: { label: '待发送', className: styles.sendStatusPending, icon: '○' },
  sending: { label: '发送中', className: styles.sendStatusSending, icon: '⏳' },
  success: { label: '已发送', className: styles.sendStatusSuccess, icon: '✓' },
  failed: { label: '发送失败', className: styles.sendStatusFailed, icon: '✕' },
};

const targetMap = {
  reception: { label: '前台候诊屏', icon: '🖥️' },
  patient: { label: '患者手机', icon: '📱' },
};

const DetailPage: React.FC = () => {
  const router = useRouter();
  const { 
    historyRecords, 
    getSendStatus, 
    getSendTime, 
    retrySend,
    getRecordById 
  } = usePackage();
  const [showSummary, setShowSummary] = useState(false);
  const [retryingTarget, setRetryingTarget] = useState<'reception' | 'patient' | null>(null);

  const recordId = router.params.id;

  const record = useMemo(() => {
    return getRecordById(recordId || '');
  }, [getRecordById, recordId, historyRecords]);

  const conditionLabels = useMemo(() => {
    if (!record) return [];
    const labels: string[] = [];
    
    const tartarOpt = tartarLevelOptions.find(o => o.value === record.oralCondition.tartarLevel);
    if (tartarOpt) labels.push(`牙石${tartarOpt.label}`);
    
    if (record.oralCondition.pigmentationLevel !== 'none') {
      const pigmentOpt = pigmentationLevelOptions.find(o => o.value === record.oralCondition.pigmentationLevel);
      if (pigmentOpt) labels.push(`${pigmentOpt.label}色素沉着`);
    }
    
    if (record.oralCondition.bleedingLevel !== 'none') {
      const bleedingOpt = bleedingLevelOptions.find(o => o.value === record.oralCondition.bleedingLevel);
      if (bleedingOpt) labels.push(`${bleedingOpt.label}牙龈出血`);
    }
    
    if (record.oralCondition.isFirstTime) labels.push('初次洁牙');
    
    return labels;
  }, [record]);

  const selectedPkg = useMemo(() => {
    if (!record) return null;
    return record.packages[record.selectedPackage];
  }, [record]);

  const selectedServices = useMemo(() => {
    if (!selectedPkg) return [];
    return selectedPkg.services.filter(s => s.selected && !s.declined);
  }, [selectedPkg]);

  const declinedServices = useMemo(() => {
    if (!selectedPkg) return [];
    return selectedPkg.services.filter(s => s.declined);
  }, [selectedPkg]);

  const handleRetry = async (target: 'reception' | 'patient') => {
    if (!record) {
      Taro.showToast({ title: '记录不存在', icon: 'none' });
      return;
    }
    if (retryingTarget !== null) {
      return;
    }
    
    const targetName = target === 'reception' ? '前台候诊屏' : '患者手机';
    setRetryingTarget(target);
    
    try {
      console.log('[Detail] Retrying send to:', target);
      const success = await retrySend(record.id, target);
      
      if (success) {
        console.log('[Detail] Retry succeeded for:', target);
        Taro.showToast({ 
          title: `${targetName}重发成功`, 
          icon: 'success',
          duration: 2000
        });
      } else {
        console.log('[Detail] Retry failed for:', target);
        Taro.showToast({ 
          title: `${targetName}重发失败，请稍后再试`, 
          icon: 'none',
          duration: 2500
        });
      }
    } catch (error) {
      console.error('[Detail] Retry error:', error);
      Taro.showToast({ 
        title: '重发出错，请稍后再试', 
        icon: 'none',
        duration: 2500
      });
    } finally {
      setRetryingTarget(null);
    }
  };

  if (!record || !selectedPkg) {
    return (
      <View className={styles.pageContainer}>
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>📋</Text>
          <Text className={styles.emptyTitle}>记录不存在</Text>
          <Text className={styles.emptyDesc}>该方案记录可能已被删除或不存在</Text>
        </View>
      </View>
    );
  }

  const status = statusMap[record.status];
  const receptionStatus = getSendStatus(record, 'reception');
  const patientStatus = getSendStatus(record, 'patient');
  const receptionTime = getSendTime(record, 'reception');
  const patientTime = getSendTime(record, 'patient');

  const renderSendSection = (target: 'reception' | 'patient') => {
    const targetInfo = targetMap[target];
    const sendStatus = target === 'reception' ? receptionStatus : patientStatus;
    const sendTime = target === 'reception' ? receptionTime : patientTime;
    const statusInfo = sendStatusMap[sendStatus];
    const sendRecord = record.sendRecords?.[target];

    return (
      <View key={target} className={styles.sendSection}>
        <View className={styles.sendSectionHeader}>
          <View className={styles.sendTargetInfo}>
            <Text className={styles.sendTargetIcon}>{targetInfo.icon}</Text>
            <Text className={styles.sendTargetLabel}>{targetInfo.label}</Text>
          </View>
          <View className={classnames(styles.sendStatusBadge, statusInfo.className)}>
            <Text className={styles.sendStatusIcon}>{statusInfo.icon}</Text>
            <Text className={styles.sendStatusText}>{statusInfo.label}</Text>
          </View>
        </View>
        {sendTime && (
          <View className={styles.sendTimeRow}>
            <Text className={styles.sendTimeLabel}>发送时间</Text>
            <Text className={styles.sendTimeValue}>{sendTime}</Text>
          </View>
        )}
        {sendRecord?.retryCount > 0 && (
          <View className={styles.sendTimeRow}>
            <Text className={styles.sendTimeLabel}>重试次数</Text>
            <Text className={styles.sendTimeValue}>{sendRecord.retryCount}次</Text>
          </View>
        )}
        {sendStatus === 'failed' && sendRecord?.failedReason && (
          <View className={styles.sendFailedRow}>
            <Text className={styles.sendFailedLabel}>失败原因</Text>
            <Text className={styles.sendFailedValue}>{sendRecord.failedReason}</Text>
          </View>
        )}
        {(sendStatus === 'failed' || sendStatus === 'pending') && (
          <Button
            className={classnames(styles.retryBtn, retryingTarget === target && styles.retryBtnLoading)}
            onClick={() => handleRetry(target)}
            disabled={retryingTarget !== null}
          >
            <Text className={styles.retryBtnText}>
              {retryingTarget === target ? '发送中...' : sendStatus === 'failed' ? '重新发送' : '立即发送'}
            </Text>
          </Button>
        )}
      </View>
    );
  };

  return (
    <View className={styles.pageContainer}>
      <View className={styles.summaryCard}>
        <View className={styles.summaryRow}>
          <Text className={styles.summaryLabel}>套餐类型</Text>
          <Text className={styles.summaryValue}>{selectedPkg.name}</Text>
        </View>
        <View className={styles.summaryRow}>
          <Text className={styles.summaryLabel}>预计费用</Text>
          <Text className={styles.summaryTotal}>{formatPrice(record.totalPrice)}</Text>
        </View>
        <View className={styles.summaryRow}>
          <Text className={styles.summaryLabel}>预计用时</Text>
          <Text className={styles.summaryDuration}>{formatDuration(record.totalDuration)}</Text>
        </View>
      </View>

      <View className={styles.packageCompare}>
        <View
          className={classnames(
            styles.packageCompareItem,
            styles.packageCompareBasic,
            record.selectedPackage === 'basic' && styles.packageCompareSelected
          )}
        >
          <Text className={styles.packageCompareName}>基础套餐</Text>
          <Text className={styles.packageComparePrice}>
            {formatPrice(record.packages.basic.totalPrice)}
          </Text>
          {record.selectedPackage === 'basic' && (
            <Text className={styles.packageCompareTag}>已选</Text>
          )}
        </View>
        <View
          className={classnames(
            styles.packageCompareItem,
            styles.packageComparePremium,
            record.selectedPackage === 'premium' && styles.packageCompareSelected
          )}
        >
          <Text className={styles.packageCompareName}>加强套餐</Text>
          <Text className={styles.packageComparePrice}>
            {formatPrice(record.packages.premium.totalPrice)}
          </Text>
          {record.selectedPackage === 'premium' && (
            <Text className={styles.packageCompareTag}>已选</Text>
          )}
        </View>
      </View>

      <View className={styles.sectionCard}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>👤</Text>
          患者信息
        </Text>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>姓名</Text>
          <Text className={styles.infoValue}>{record.patientInfo.name || '未填写'}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>电话</Text>
          <Text className={styles.infoValue}>{record.patientInfo.phone || '未填写'}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>状态</Text>
          <View className={classnames(styles.statusBadge, status.className)}>
            <Text>{status.label}</Text>
          </View>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>创建时间</Text>
          <Text className={styles.infoValue}>{record.createdAt}</Text>
        </View>
      </View>

      <View className={styles.sectionCard}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>📋</Text>
          口腔情况
        </Text>
        <View className={styles.conditionTags}>
          {conditionLabels.map((label, index) => (
            <Text key={index} className={styles.conditionTag}>{label}</Text>
          ))}
        </View>
      </View>

      <View className={styles.sectionCard}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>✅</Text>
          已选服务项目
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
                <Text className={styles.serviceDesc}>
                  时间：{formatDateTime(service.declinedAt)}
                </Text>
              )}
            </View>
            <Text className={classnames(styles.servicePrice, styles.servicePriceInactive)}>
              {formatPrice(service.price)}
            </Text>
          </View>
        ))}
      </View>

      <View className={styles.sectionCard}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>📤</Text>
            发送状态
          </Text>
          {record.patientSummary && (
            <Text className={styles.previewLink} onClick={() => setShowSummary(true)}>
              预览患者端摘要
            </Text>
          )}
        </View>
        {renderSendSection('reception')}
        {renderSendSection('patient')}
      </View>

      <View className={styles.sectionCard}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>⚠️</Text>
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

      {showSummary && record.patientSummary && (
        <View className={styles.modalOverlay} onClick={() => setShowSummary(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>患者端方案摘要</Text>
              <Text className={styles.modalClose} onClick={() => setShowSummary(false)}>✕</Text>
            </View>
            <View className={styles.patientSummaryCard}>
              <View className={styles.patientSummaryHeader}>
                <Text className={styles.patientSummaryClinic}>🦷 悦齿口腔诊所</Text>
                <Text className={styles.patientSummaryDate}>
                  {new Date().toLocaleDateString()}
                </Text>
              </View>
              <View className={styles.patientSummaryPatient}>
                <Text className={styles.patientSummaryName}>
                  {record.patientSummary.patientName || '尊敬的患者'}
                </Text>
                <Text className={styles.patientSummaryPackage}>
                  {record.patientSummary.packageName}
                </Text>
              </View>
              <View className={styles.patientSummarySection}>
                <Text className={styles.patientSummarySectionTitle}>治疗项目</Text>
                {record.patientSummary.services.map((s, i) => (
                  <View key={i} className={styles.patientSummaryServiceRow}>
                    <Text className={styles.patientSummaryServiceName}>{s.name}</Text>
                    <Text className={styles.patientSummaryServicePrice}>{formatPrice(s.price)}</Text>
                  </View>
                ))}
                {record.patientSummary.declinedServices.length > 0 && (
                  <View className={styles.patientSummaryDeclined}>
                    <Text className={styles.patientSummaryDeclinedTitle}>已告知未选择：</Text>
                    {record.patientSummary.declinedServices.map((s, i) => (
                      <Text key={i} className={styles.patientSummaryDeclinedItem}>
                        • {s.name}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
              <View className={styles.patientSummaryTotalRow}>
                <Text className={styles.patientSummaryTotalLabel}>总计</Text>
                <Text className={styles.patientSummaryTotalPrice}>
                  {formatPrice(record.patientSummary.totalPrice)}
                </Text>
              </View>
              <View className={styles.patientSummaryDuration}>
                <Text>⏱️ 预计用时：{formatDuration(record.patientSummary.totalDuration)}</Text>
              </View>
              <View className={styles.patientSummarySection}>
                <Text className={styles.patientSummarySectionTitle}>术后注意事项</Text>
                {record.patientSummary.postCare.map((item, i) => (
                  <View key={i} className={styles.patientSummaryNoticeItem}>
                    <Text className={styles.patientSummaryNoticeDot}>•</Text>
                    <Text className={styles.patientSummaryNoticeText}>{item}</Text>
                  </View>
                ))}
              </View>
              <View className={styles.patientSummaryFooter}>
                <Text className={styles.patientSummaryDoctor}>
                  主治医生：{record.patientSummary.doctorName}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default DetailPage;
