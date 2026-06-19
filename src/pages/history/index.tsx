import React, { useState, useMemo } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { usePackage } from '../../store/PackageContext';
import { PlanRecord } from '../../types';
import { formatPrice, formatDuration } from '../../utils/packageCalculator';
import styles from './index.module.scss';

const statusMap = {
  draft: { label: '草稿', className: styles.statusDraft },
  sent: { label: '已发送', className: styles.statusSent },
  confirmed: { label: '已确认', className: styles.statusConfirmed },
  completed: { label: '已完成', className: styles.statusCompleted },
};

const filterOptions = [
  { value: 'all', label: '全部' },
  { value: 'today', label: '今日' },
  { value: 'week', label: '本周' },
  { value: 'hasDeclined', label: '有拒绝项' },
];

const HistoryPage: React.FC = () => {
  const { historyRecords } = usePackage();
  const [activeFilter, setActiveFilter] = useState('all');

  const stats = useMemo(() => {
    const total = historyRecords.length;
    const totalRevenue = historyRecords.reduce((sum, r) => sum + r.totalPrice, 0);
    const declinedCount = historyRecords.filter(r => r.declinedServices.length > 0).length;
    const completedCount = historyRecords.filter(r => r.status === 'completed').length;
    
    return {
      total,
      totalRevenue,
      declinedCount,
      completedCount,
    };
  }, [historyRecords]);

  const filteredRecords = useMemo(() => {
    let records = [...historyRecords];
    
    if (activeFilter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      records = records.filter(r => r.createdAt.startsWith(today));
    } else if (activeFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      records = records.filter(r => new Date(r.createdAt) >= weekAgo);
    } else if (activeFilter === 'hasDeclined') {
      records = records.filter(r => r.declinedServices.length > 0);
    }
    
    return records;
  }, [historyRecords, activeFilter]);

  const handleRecordClick = (record: PlanRecord) => {
    console.log('[History] Record clicked:', record.id);
    Taro.navigateTo({
      url: `/pages/detail/index?id=${record.id}`,
    });
  };

  const handleGoToAssessment = () => {
    Taro.switchTab({
      url: '/pages/assessment/index',
    });
  };

  return (
    <View className={styles.pageContainer}>
      <View className={styles.pageHeader}>
        <Text className={styles.pageTitle}>历史记录</Text>
        <Text className={styles.pageSubtitle}>查看过往患者方案和沟通记录</Text>
      </View>

      <View className={styles.statsCard}>
        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.total}</Text>
            <Text className={styles.statLabel}>总记录</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>¥{stats.totalRevenue}</Text>
            <Text className={styles.statLabel}>总营收</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.completedCount}</Text>
            <Text className={styles.statLabel}>已完成</Text>
          </View>
        </View>
      </View>

      <View className={styles.filterBar}>
        {filterOptions.map((option) => (
          <View
            key={option.value}
            className={classnames(styles.filterItem, {
              [styles.filterItemActive]: activeFilter === option.value,
            })}
            onClick={() => setActiveFilter(option.value)}
          >
            <Text>{option.label}</Text>
          </View>
        ))}
      </View>

      {filteredRecords.length === 0 ? (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>📋</Text>
          <Text className={styles.emptyTitle}>暂无记录</Text>
          <Text className={styles.emptyDesc}>
            {activeFilter === 'all' 
              ? '还没有创建过方案记录，快去创建第一个吧' 
              : '当前筛选条件下暂无记录'}
          </Text>
          <Button className={styles.emptyBtn} onClick={handleGoToAssessment}>
            <Text className={styles.btnText}>去创建方案</Text>
          </Button>
        </View>
      ) : (
        <View className={styles.recordList}>
          {filteredRecords.map((record) => {
            const status = statusMap[record.status];
            return (
              <View
                key={record.id}
                className={styles.recordCard}
                onClick={() => handleRecordClick(record)}
              >
                <View className={styles.recordHeader}>
                  <View className={styles.patientInfo}>
                    <Text className={styles.patientName}>
                      {record.patientInfo.name || '未命名患者'}
                    </Text>
                    <Text className={styles.patientPhone}>
                      {record.patientInfo.phone || '未填写电话'}
                    </Text>
                  </View>
                  <View className={classnames(styles.statusBadge, status.className)}>
                    <Text>{status.label}</Text>
                  </View>
                </View>

                <View className={styles.recordBody}>
                  <View className={styles.packageInfo}>
                    <View style={{ marginBottom: 8 }}>
                      <Text className={styles.packageType}>
                        {record.selectedPackage === 'basic' ? '基础' : '加强'}
                      </Text>
                      <Text className={styles.packageName}>
                        {record.packages[record.selectedPackage].name}
                      </Text>
                    </View>
                    <View className={styles.sendIcons}>
                      {record.sentTo?.includes('reception') && (
                        <Text className={styles.sendIcon}>🖥️</Text>
                      )}
                      {record.sentTo?.includes('patient') && (
                        <Text className={styles.sendIcon}>📱</Text>
                      )}
                    </View>
                  </View>
                  <View className={styles.priceInfo}>
                    <Text className={styles.priceValue}>{formatPrice(record.totalPrice)}</Text>
                    <Text className={styles.durationValue}>{formatDuration(record.totalDuration)}</Text>
                  </View>
                </View>

                <View className={styles.recordFooter}>
                  <View className={styles.declinedInfo}>
                    {record.declinedServices.length > 0 ? (
                      <>
                        <Text className={styles.declinedIcon}>⚠️</Text>
                        <Text className={styles.declinedText}>
                          有{record.declinedServices.length}项已告知未选择
                        </Text>
                      </>
                    ) : (
                      <Text style={{ fontSize: 24, color: '#86909C' }}>无拒绝项</Text>
                    )}
                  </View>
                  <Text className={styles.recordTime}>{record.createdAt}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

export default HistoryPage;
