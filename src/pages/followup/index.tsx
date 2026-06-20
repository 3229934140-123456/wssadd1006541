import React, { useState } from 'react';
import { View, Text, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { usePackage } from '../../store/PackageContext';
import { SendStatus } from '../../types';
import { formatPrice, formatDuration, formatDateTime } from '../../utils/packageCalculator';
import styles from './index.module.scss';

const FollowupPage: React.FC = () => {
  const { 
    patientAggregatedRecords, 
    filteredPatientRecords, 
    followupSearchKeyword, 
    setFollowupSearchKeyword 
  } = usePackage();

  const getSendStatusIcon = (status: SendStatus): string => {
    switch (status) {
      case 'success': return '✓';
      case 'failed': return '✕';
      case 'sending': return '⏳';
      default: return '○';
    }
  };

  const getSendStatusColor = (status: SendStatus): string => {
    switch (status) {
      case 'success': return '#00b42a';
      case 'failed': return '#f53f3f';
      case 'sending': return '#028090';
      default: return '#86909c';
    }
  };

  const getSendStatusText = (status: SendStatus): string => {
    switch (status) {
      case 'success': return '已发送';
      case 'failed': return '发送失败';
      case 'sending': return '发送中';
      default: return '待发送';
    }
  };

  const handleRecordClick = (recordId: string) => {
    console.log('[Followup] Record clicked:', recordId);
    Taro.navigateTo({
      url: `/pages/detail/index?id=${recordId}`,
    });
  };

  const handleClearSearch = () => {
    setFollowupSearchKeyword('');
  };

  const handleGoToFailed = () => {
    Taro.navigateTo({
      url: '/pages/failed/index',
    });
  };

  return (
    <View className={styles.pageContainer}>
      <View className={styles.pageHeader}>
        <View className={styles.pageHeaderTop}>
          <View>
            <Text className={styles.pageTitle}>复诊跟进</Text>
            <Text className={styles.pageSubtitle}>按患者查看历史方案和沟通记录</Text>
          </View>
          <View className={styles.failedEntry} onClick={handleGoToFailed}>
            <Text className={styles.failedEntryIcon}>⚠️</Text>
            <Text className={styles.failedEntryText}>发送失败</Text>
          </View>
        </View>
      </View>

      <View className={styles.searchBox}>
        <Text className={styles.searchIcon}>🔍</Text>
        <Input
          className={styles.searchInput}
          placeholder="搜索患者姓名或电话"
          value={followupSearchKeyword}
          onInput={(e) => setFollowupSearchKeyword(e.detail.value)}
          confirmType="search"
        />
        {followupSearchKeyword && (
          <Text className={styles.searchClear} onClick={handleClearSearch}>✕</Text>
        )}
      </View>

      {followupSearchKeyword && (
        <View className={styles.searchResultHint}>
          <Text className={styles.searchResultText}>
            搜索 "{followupSearchKeyword}" 找到 {filteredPatientRecords.length} 位患者
          </Text>
        </View>
      )}

      <View className={styles.statsCard}>
        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{patientAggregatedRecords.length}</Text>
            <Text className={styles.statLabel}>患者总数</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>
              {patientAggregatedRecords.filter(p => p.declinedServices.length > 0).length}
            </Text>
            <Text className={styles.statLabel}>有未选项目</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>
              {patientAggregatedRecords.filter(p => 
                p.sendStatus.reception === 'failed' || p.sendStatus.patient === 'failed'
              ).length}
            </Text>
            <Text className={styles.statLabel}>发送失败</Text>
          </View>
        </View>
      </View>

      {filteredPatientRecords.length === 0 ? (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>👥</Text>
          <Text className={styles.emptyTitle}>暂无患者记录</Text>
          <Text className={styles.emptyDesc}>
            {followupSearchKeyword 
              ? '没有找到匹配的患者' 
              : '还没有创建过患者方案记录'}
          </Text>
        </View>
      ) : (
        <View className={styles.patientList}>
          {filteredPatientRecords.map((patient) => {
            const latestRecord = patient.latestRecord;
            const selectedPkg = latestRecord.packages[latestRecord.selectedPackage];
            
            return (
              <View
                key={`${patient.patientName}-${patient.patientPhone}`}
                className={styles.patientCard}
                onClick={() => handleRecordClick(latestRecord.id)}
              >
                <View className={styles.patientHeader}>
                  <View className={styles.patientInfo}>
                    <Text className={styles.patientName}>{patient.patientName}</Text>
                    <Text className={styles.patientPhone}>{patient.patientPhone}</Text>
                    <Text className={styles.visitCount}>就诊{patient.recordCount}次</Text>
                  </View>
                  <View className={styles.lastVisit}>
                    <Text className={styles.lastVisitLabel}>上次就诊</Text>
                    <Text className={styles.lastVisitDate}>
                      {formatDateTime(patient.lastVisitDate)}
                    </Text>
                  </View>
                </View>

                <View className={styles.packageSection}>
                  <View className={styles.packageInfo}>
                    <View className={styles.packageTag}>
                      {latestRecord.selectedPackage === 'basic' ? '基础套餐' : '加强套餐'}
                    </View>
                    <Text className={styles.packageName}>{selectedPkg.name}</Text>
                  </View>
                  <View className={styles.packagePrice}>
                    <Text className={styles.priceValue}>
                      {formatPrice(latestRecord.totalPrice)}
                    </Text>
                    <Text className={styles.durationValue}>
                      {formatDuration(latestRecord.totalDuration)}
                    </Text>
                  </View>
                </View>

                {patient.declinedServices.length > 0 && (
                  <View className={styles.declinedSection}>
                    <View className={styles.declinedHeader}>
                      <Text className={styles.declinedIcon}>⚠️</Text>
                      <Text className={styles.declinedTitle}>已告知未选择（{patient.declinedServices.length}项）</Text>
                    </View>
                    <View className={styles.declinedList}>
                      {patient.declinedServices.slice(0, 3).map((s, i) => (
                        <View key={s.serviceId} className={styles.declinedItem}>
                          <Text className={styles.declinedItemName}>{s.serviceName}</Text>
                          <Text className={styles.declinedItemReason}>- {s.declinedReason}</Text>
                        </View>
                      ))}
                      {patient.declinedServices.length > 3 && (
                        <Text className={styles.declinedMore}>还有{patient.declinedServices.length - 3}项...</Text>
                      )}
                    </View>
                  </View>
                )}

                <View className={styles.sendSection}>
                  <Text className={styles.sendTitle}>发送记录</Text>
                  <View className={styles.sendRow}>
                    <View 
                      className={styles.sendItem}
                      style={{ color: getSendStatusColor(patient.sendStatus.reception) }}
                    >
                      <Text className={styles.sendItemIcon}>🖥️</Text>
                      <Text className={styles.sendItemText}>前台候诊屏</Text>
                      <Text className={styles.sendItemStatus}>
                        {getSendStatusIcon(patient.sendStatus.reception)} {getSendStatusText(patient.sendStatus.reception)}
                      </Text>
                    </View>
                    <View 
                      className={styles.sendItem}
                      style={{ color: getSendStatusColor(patient.sendStatus.patient) }}
                    >
                      <Text className={styles.sendItemIcon}>📱</Text>
                      <Text className={styles.sendItemText}>患者手机</Text>
                      <Text className={styles.sendItemStatus}>
                        {getSendStatusIcon(patient.sendStatus.patient)} {getSendStatusText(patient.sendStatus.patient)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View className={styles.cardFooter}>
                  <Text className={styles.viewDetail}>查看详情 →</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

export default FollowupPage;
