import React, { useState } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { usePackage } from '../../store/PackageContext';
import { FailedSendItem } from '../../types';
import { formatPrice, formatDateTime } from '../../utils/packageCalculator';
import styles from './index.module.scss';

type TabType = 'reception' | 'patient';

const FailedPage: React.FC = () => {
  const { failedSendRecords, retrySend, getRecordById } = usePackage();
  const [activeTab, setActiveTab] = useState<TabType>('reception');
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const currentList = activeTab === 'reception' 
    ? failedSendRecords.reception 
    : failedSendRecords.patient;

  const totalFailed = failedSendRecords.reception.length + failedSendRecords.patient.length;

  const handleRetry = async (item: FailedSendItem) => {
    if (retryingId !== null) return;
    
    const id = `${item.record.id}-${item.target}`;
    const targetName = item.target === 'reception' ? '前台候诊屏' : '患者手机';
    setRetryingId(id);

    try {
      console.log('[Failed] Retrying send:', id);
      const success = await retrySend(item.record.id, item.target);
      
      if (success) {
        console.log('[Failed] Retry succeeded:', id);
        Taro.showToast({
          title: `${targetName}重发成功`,
          icon: 'success',
          duration: 2000,
        });
      } else {
        console.log('[Failed] Retry failed:', id);
        Taro.showToast({
          title: `${targetName}重发失败`,
          icon: 'none',
          duration: 2500,
        });
      }
    } catch (error) {
      console.error('[Failed] Retry error:', error);
      Taro.showToast({
        title: '重发出错，请稍后再试',
        icon: 'none',
        duration: 2500,
      });
    } finally {
      setRetryingId(null);
    }
  };

  const handleRetryAll = async () => {
    if (retryingId !== null) return;
    if (currentList.length === 0) return;

    const confirm = await new Promise<boolean>((resolve) => {
      Taro.showModal({
        title: '确认重试',
        content: `确定要重试当前${currentList.length}条失败记录吗？`,
        success: (res) => resolve(res.confirm),
      });
    });

    if (!confirm) return;

    let successCount = 0;
    let failCount = 0;

    for (const item of currentList) {
      const id = `${item.record.id}-${item.target}`;
      setRetryingId(id);
      try {
        const success = await retrySend(item.record.id, item.target);
        if (success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        failCount++;
      }
    }

    setRetryingId(null);
    Taro.showToast({
      title: `成功${successCount}条，失败${failCount}条`,
      icon: 'none',
      duration: 2500,
    });
  };

  const handleViewDetail = (recordId: string) => {
    Taro.navigateTo({
      url: `/pages/detail/index?id=${recordId}`,
    });
  };

  const handleBack = () => {
    Taro.navigateBack();
  };

  const getItemId = (item: FailedSendItem) => `${item.record.id}-${item.target}`;

  const renderFailedItem = (item: FailedSendItem) => {
    const itemId = getItemId(item);
    const isRetrying = retryingId === itemId;
    const record = getRecordById(item.record.id);
    
    if (!record) return null;

    const selectedPkg = record.packages[record.selectedPackage];
    const latestFailedAt = record.sendRecords[item.target].sentAt || item.lastFailedAt;
    const latestRetryCount = record.sendRecords[item.target].retryCount;
    const latestFailedReason = record.sendRecords[item.target].failedReason || item.failedReason;

    return (
      <View key={itemId} className={styles.failedCard}>
        <View className={styles.cardHeader}>
          <View className={styles.patientInfo}>
            <Text className={styles.patientName}>
              {record.patientInfo.name || '未命名患者'}
            </Text>
            <Text className={styles.patientPhone}>
              {record.patientInfo.phone || '未填写电话'}
            </Text>
          </View>
          <View 
            className={classnames(styles.retryBtn, isRetrying && styles.retryBtnLoading)}
            onClick={(e) => {
              e.stopPropagation();
              handleRetry(item);
            }}
          >
            <Text className={styles.retryBtnText}>
              {isRetrying ? '发送中...' : '重试'}
            </Text>
          </View>
        </View>

        <View className={styles.packageInfo} onClick={() => handleViewDetail(record.id)}>
          <View className={styles.packageLeft}>
            <View className={styles.packageTag}>
              {record.selectedPackage === 'basic' ? '基础' : '加强'}
            </View>
            <Text className={styles.packageName}>{selectedPkg.name}</Text>
          </View>
          <Text className={styles.packagePrice}>
            {formatPrice(record.totalPrice)}
          </Text>
        </View>

        <View className={styles.failedInfo}>
          <View className={styles.failedRow}>
            <Text className={styles.failedLabel}>失败原因</Text>
            <Text className={styles.failedReason}>{latestFailedReason}</Text>
          </View>
          <View className={styles.failedRow}>
            <Text className={styles.failedLabel}>重试次数</Text>
            <Text className={styles.failedValue}>{latestRetryCount}次</Text>
          </View>
          <View className={styles.failedRow}>
            <Text className={styles.failedLabel}>最后失败</Text>
            <Text className={styles.failedValue}>
              {formatDateTime(latestFailedAt)}
            </Text>
          </View>
        </View>

        <View className={styles.cardFooter}>
          <Text className={styles.viewDetail} onClick={() => handleViewDetail(record.id)}>
            查看详情 →
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View className={styles.pageContainer}>
      <View className={styles.pageHeader}>
        <View className={styles.headerLeft} onClick={handleBack}>
          <Text className={styles.backIcon}>←</Text>
        </View>
        <View className={styles.headerCenter}>
          <Text className={styles.pageTitle}>发送失败待处理</Text>
          <Text className={styles.pageSubtitle}>共{totalFailed}条待处理记录</Text>
        </View>
        <View className={styles.headerRight}>
          {currentList.length > 0 && (
            <Text 
              className={classnames(styles.batchRetry, retryingId && styles.batchRetryDisabled)}
              onClick={handleRetryAll}
            >
              全部重试
            </Text>
          )}
        </View>
      </View>

      <View className={styles.tabBar}>
        <View
          className={classnames(styles.tabItem, {
            [styles.tabItemActive]: activeTab === 'reception',
          })}
          onClick={() => setActiveTab('reception')}
        >
          <Text className={styles.tabIcon}>🖥️</Text>
          <Text className={styles.tabText}>前台候诊屏</Text>
          {failedSendRecords.reception.length > 0 && (
            <View className={styles.tabBadge}>
              <Text className={styles.tabBadgeText}>
                {failedSendRecords.reception.length}
              </Text>
            </View>
          )}
        </View>
        <View
          className={classnames(styles.tabItem, {
            [styles.tabItemActive]: activeTab === 'patient',
          })}
          onClick={() => setActiveTab('patient')}
        >
          <Text className={styles.tabIcon}>📱</Text>
          <Text className={styles.tabText}>患者手机</Text>
          {failedSendRecords.patient.length > 0 && (
            <View className={styles.tabBadge}>
              <Text className={styles.tabBadgeText}>
                {failedSendRecords.patient.length}
              </Text>
            </View>
          )}
        </View>
      </View>

      {currentList.length === 0 ? (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>✅</Text>
          <Text className={styles.emptyTitle}>暂无失败记录</Text>
          <Text className={styles.emptyDesc}>
            {activeTab === 'reception' 
              ? '前台候诊屏发送全部成功' 
              : '患者手机发送全部成功'}
          </Text>
        </View>
      ) : (
        <View className={styles.failedList}>
          {currentList.map(item => renderFailedItem(item))}
        </View>
      )}
    </View>
  );
};

export default FailedPage;
