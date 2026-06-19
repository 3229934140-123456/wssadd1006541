import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import { PackageService } from '../../types';
import { formatPrice } from '../../utils/packageCalculator';

interface ServiceItemProps {
  service: PackageService;
  onToggle?: () => void;
  onDecline?: () => void;
  showPrice?: boolean;
  disabled?: boolean;
}

const ServiceItem: React.FC<ServiceItemProps> = ({
  service,
  onToggle,
  onDecline,
  showPrice = true,
  disabled = false,
}) => {
  const { serviceName, price, selected, declined, declinedReason } = service;

  return (
    <View
      className={classnames(styles.serviceItem, {
        [styles.selected]: selected,
        [styles.declined]: declined,
        [styles.disabled]: disabled,
      })}
    >
      <View className={styles.serviceLeft} onClick={!disabled && !declined ? onToggle : undefined}>
        <View
          className={classnames(styles.checkbox, {
            [styles.checked]: selected,
            [styles.declinedCheckbox]: declined,
          })}
        >
          {selected && !declined && <Text className={styles.checkIcon}>✓</Text>}
          {declined && <Text className={styles.declineIcon}>✕</Text>}
        </View>
        <View className={styles.serviceInfo}>
          <Text className={styles.serviceName}>{serviceName}</Text>
          {declined && declinedReason && (
            <Text className={styles.declinedReason}>已告知未选择：{declinedReason}</Text>
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
      </View>
    </View>
  );
};

export default ServiceItem;
