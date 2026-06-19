import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import { PackageService } from '../../types';
import { formatPrice, formatDateTime } from '../../utils/packageCalculator';

interface ServiceItemProps {
  service: PackageService;
  onToggle?: () => void;
  onDecline?: () => void;
  onRestore?: () => void;
  showPrice?: boolean;
  disabled?: boolean;
  showRestore?: boolean;
}

const ServiceItem: React.FC<ServiceItemProps> = ({
  service,
  onToggle,
  onDecline,
  onRestore,
  showPrice = true,
  disabled = false,
  showRestore = false,
}) => {
  const { serviceName, price, selected, declined, declinedReason, declinedAt } = service;

  const handleLeftClick = () => {
    if (disabled) return;
    if (declined) {
      if (showRestore && onRestore) {
        onRestore();
      }
      return;
    }
    if (onToggle) {
      onToggle();
    }
  };

  return (
    <View
      className={classnames(styles.serviceItem, {
        [styles.selected]: selected,
        [styles.declined]: declined,
        [styles.disabled]: disabled,
      })}
    >
      <View className={styles.serviceLeft} onClick={handleLeftClick}>
        <View
          className={classnames(styles.checkbox, {
            [styles.checked]: selected,
            [styles.declinedCheckbox]: declined,
            [styles.restoreCheckbox]: declined && showRestore,
          })}
        >
          {selected && !declined && <Text className={styles.checkIcon}>✓</Text>}
          {declined && !showRestore && <Text className={styles.declineIcon}>✕</Text>}
          {declined && showRestore && <Text className={styles.restoreIcon}>↺</Text>}
        </View>
        <View className={styles.serviceInfo}>
          <Text className={styles.serviceName}>{serviceName}</Text>
          {declined && declinedReason && (
            <Text className={styles.declinedReason}>已告知未选择：{declinedReason}</Text>
          )}
          {declined && declinedAt && (
            <Text className={styles.declinedTime}>记录时间：{formatDateTime(declinedAt)}</Text>
          )}
          {declined && showRestore && (
            <Text className={styles.restoreHint}>点击可恢复选择</Text>
          )}
        </View>
      </View>
      <View className={styles.serviceRight}>
        {showPrice && (
          <Text className={classnames(styles.servicePrice, { [styles.inactive]: !selected || declined })}>
            {formatPrice(price)}
          </Text>
        )}
        {!disabled && selected && !declined && onDecline && (
          <View className={styles.declineBtn} onClick={onDecline}>
            <Text className={styles.declineText}>取消</Text>
          </View>
        )}
        {!disabled && declined && showRestore && onRestore && (
          <View className={styles.restoreBtn} onClick={onRestore}>
            <Text className={styles.restoreText}>恢复</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default ServiceItem;
