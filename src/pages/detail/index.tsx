import React, { useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import { usePackage } from '../../store/PackageContext';
import { speechTemplates } from '../../data/speechScripts';
import { tartarLevelOptions, pigmentationLevelOptions, bleedingLevelOptions } from '../../data/oralConditions';
import { formatPrice, formatDuration } from '../../utils/packageCalculator';
import styles from './index.module.scss';

const statusMap = {
  draft: { label: '草稿', className: styles.statusDraft },
  sent: { label: '已发送', className: styles.statusSent },
  confirmed: { label: '已确认', className: styles.statusConfirmed },
  completed: { label: '已完成', className: styles.statusCompleted },
};

const DetailPage: React.FC = () => {
  const router = useRouter();
  const { historyRecords } = usePackage();

  const recordId = router.params.id;

  const record = useMemo(() => {
    return historyRecords.find(r => r.id === recordId);
  }, [historyRecords, recordId]);

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
            </View>
            <Text className={classnames(styles.servicePrice, styles.servicePriceInactive)}>
              {formatPrice(service.price)}
            </Text>
          </View>
        ))}
      </View>

      {record.sentTo && record.sentTo.length > 0 && (
        <View className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>📤</Text>
            发送对象
          </Text>
          <View className={styles.sendInfo}>
            <View className={styles.sendInfoItem}>
              <Text className={styles.sendInfoIcon}>🖥️</Text>
              <Text
                className={classnames(
                  styles.sendInfoText,
                  record.sentTo.includes('reception') && styles.sendInfoActive
                )}
              >
                {record.sentTo.includes('reception') ? '已发送到前台' : '未发送到前台'}
              </Text>
            </View>
            <View className={styles.sendInfoItem}>
              <Text className={styles.sendInfoIcon}>📱</Text>
              <Text
                className={classnames(
                  styles.sendInfoText,
                  record.sentTo.includes('patient') && styles.sendInfoActive
                )}
              >
                {record.sentTo.includes('patient') ? '已发送到患者' : '未发送到患者'}
              </Text>
            </View>
          </View>
        </View>
      )}

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
    </View>
  );
};

export default DetailPage;
