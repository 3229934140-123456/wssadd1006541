import React, { useState, useMemo } from 'react';
import { View, Text, Button, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { usePackage } from '../../store/PackageContext';
import { PlanRecord, SendStatus } from '../../types';
import { formatPrice, formatDuration, formatDateTime } from '../../utils/packageCalculator';
import styles from './index.module.scss';

const statusMap = {
  draft: { label: '草稿', className: styles.statusDraft },
  sent: { label: '已发送', className: styles.statusSent },
  confirmed: { label: '已确认', className: styles.statusConfirmed },
  completed: { label: '已完成', className: styles.statusCompleted },
};

const viewOptions = [
  { value: 'history', label: '历史记录' },
  { value: 'followup', label: '复诊跟进' },
];

const filterOptions = [
  { value: 'all', label: '全部' },
  { value: 'today', label: '今日' },
  { value: 'week', label: '本周' },
  { value: 'hasDeclined', label: '有拒绝项' },
];

const HistoryPage: React.FC = () => {
  const { 
    historyRecords, 
    filteredRecords: searchFilteredRecords, 
    searchKeyword, 
    setSearchKeyword,
    patientAggregatedRecords,
    filteredPatientRecords,
    followupSearchKeyword,
    setFollowupSearchKeyword,
  } = usePackage();
  const [activeView, setActiveView] = useState<'history' | 'followup'>('history');
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
    let records = [...searchFilteredRecords];
    
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
  }, [searchFilteredRecords, activeFilter]);

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

  const handleClearSearch = () => {
    if (activeView === 'history') {
      setSearchKeyword('');
    } else {
      setFollowupSearchKeyword('');
    }
  };

  const handleGoToFailed = () => {
    Taro.navigateTo({
      url: '/pages/failed/index',
    });
  };

  const currentSearchKeyword = activeView === 'history' ? searchKeyword : followupSearchKeyword;
  const currentSetSearchKeyword = activeView === 'history' ? setSearchKeyword : setFollowupSearchKeyword;
  const failedCount = patientAggregatedRecords.filter(p => 
    p.sendStatus.reception === 'failed' || p.sendStatus.patient === 'failed'
  ).length;

  return (
    <View className={styles.pageContainer}>
      <View className={styles.pageHeader}>
        <View className={styles.pageHeaderRow}>
          <View>
            <Text className={styles.pageTitle}>历史记录</Text>
            <Text className={styles.pageSubtitle}>
              {activeView === 'history' ? '查看过往患者方案和沟通记录' : '按患者查看复诊跟进记录'}
            </Text>
          </View>
          {failedCount > 0 && (
            <View className={styles.failedEntry} onClick={handleGoToFailed}>
              <Text className={styles.failedEntryIcon}>⚠️</Text>
              <Text className={styles.failedEntryText}>{failedCount}条失败</Text>
            </View>
          )}
        </View>
      </View>

      <View className={styles.viewTabs}>
        {viewOptions.map((option) => (
          <View
            key={option.value}
            className={classnames(styles.viewTabItem, {
              [styles.viewTabItemActive]: activeView === option.value,
            })}
            onClick={() => setActiveView(option.value as 'history' | 'followup')}
          >
            <Text className={styles.viewTabText}>{option.label}</Text>
          </View>
        ))}
      </View>

      <View className={styles.searchBox}>
        <Text className={styles.searchIcon}>🔍</Text>
        <Input
          className={styles.searchInput}
          placeholder={activeView === 'history' ? '搜索患者姓名或电话' : '搜索患者姓名或电话'}
          value={currentSearchKeyword}
          onInput={(e) => currentSetSearchKeyword(e.detail.value)}
          confirmType="search"
        />
        {currentSearchKeyword && (
          <Text className={styles.searchClear} onClick={handleClearSearch}>✕</Text>
        )}
      </View>

      {currentSearchKeyword && (
        <View className={styles.searchResultHint}>
          <Text className={styles.searchResultText}>
            搜索 "{currentSearchKeyword}" 找到 {activeView === 'history' ? filteredRecords.length : filteredPatientRecords.length} 
            {activeView === 'history' ? '条记录' : '位患者'}
          </Text>
        </View>
      )}

      {activeView === 'history' ? (
        <>
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
                {searchKeyword 
                  ? '没有找到匹配的患者记录' 
                  : activeFilter === 'all' 
                    ? '还没有创建过方案记录，快去创建第一个吧' 
                    : '当前筛选条件下暂无记录'}
              </Text>
              {searchKeyword ? (
                <Button className={styles.emptyBtn} onClick={handleClearSearch}>
                  <Text className={styles.btnText}>清除搜索</Text>
                </Button>
              ) : (
                <Button className={styles.emptyBtn} onClick={handleGoToAssessment}>
                  <Text className={styles.btnText}>去创建方案</Text>
                </Button>
              )}
            </View>
          ) : (
            <View className={styles.recordList}>
              {filteredRecords.map((record) => {
                const status = statusMap[record.status];
                const receptionStatus = record.sendRecords?.reception?.status || 'pending';
                const patientStatus = record.sendRecords?.patient?.status || 'pending';
                
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
                          <View 
                            className={styles.sendIconItem}
                            style={{ color: getSendStatusColor(receptionStatus) }}
                          >
                            <Text className={styles.sendIconChar}>🖥️</Text>
                            <Text className={styles.sendIconStatus}>{getSendStatusIcon(receptionStatus)}</Text>
                          </View>
                          <View 
                            className={styles.sendIconItem}
                            style={{ color: getSendStatusColor(patientStatus) }}
                          >
                            <Text className={styles.sendIconChar}>📱</Text>
                            <Text className={styles.sendIconStatus}>{getSendStatusIcon(patientStatus)}</Text>
                          </View>
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
        </>
      ) : (
        <>
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
                const getSendStatusText = (status: SendStatus) => {
                  switch (status) {
                    case 'success': return '✓ 已发送';
                    case 'failed': return '✕ 失败';
                    case 'sending': return '⏳ 发送中';
                    default: return '○ 待发送';
                  }
                };
                
                return (
                  <View
                    key={`${patient.patientName}-${patient.patientPhone}`}
                    className={styles.patientCard}
                    onClick={() => handleRecordClick(latestRecord)}
                  >
                    <View className={styles.patientHeader}>
                      <View className={styles.patientCardInfo}>
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
                      </View>
                    </View>

                    {patient.declinedServices.length > 0 && (
                      <View className={styles.declinedSection}>
                        <Text className={styles.declinedTitle}>
                          ⚠️ 已告知未选择（{patient.declinedServices.length}项）
                        </Text>
                        <View className={styles.declinedList}>
                          {patient.declinedServices.slice(0, 2).map((s, i) => (
                            <Text key={s.serviceId} className={styles.declinedItem}>
                              • {s.serviceName} - {s.declinedReason}
                            </Text>
                          ))}
                          {patient.declinedServices.length > 2 && (
                            <Text className={styles.declinedMore}>还有{patient.declinedServices.length - 2}项...</Text>
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
                            {getSendStatusText(patient.sendStatus.reception)}
                          </Text>
                        </View>
                        <View 
                          className={styles.sendItem}
                          style={{ color: getSendStatusColor(patient.sendStatus.patient) }}
                        >
                          <Text className={styles.sendItemIcon}>📱</Text>
                          <Text className={styles.sendItemText}>患者手机</Text>
                          <Text className={styles.sendItemStatus}>
                            {getSendStatusText(patient.sendStatus.patient)}
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
        </>
      )}
    </View>
  );
};

export default HistoryPage;
