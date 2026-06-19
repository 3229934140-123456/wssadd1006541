import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import { Package } from '../../types';
import ServiceItem from '../ServiceItem';
import { formatDuration } from '../../utils/packageCalculator';

interface PackageCardProps {
  pkg: Package;
  selected: boolean;
  onSelect: () => void;
  onToggleService?: (serviceId: string) => void;
  onDeclineService?: (serviceId: string) => void;
  onRestoreService?: (serviceId: string) => void;
  showActions?: boolean;
  showRestore?: boolean;
  disabled?: boolean;
}

const PackageCard: React.FC<PackageCardProps> = ({
  pkg,
  selected,
  onSelect,
  onToggleService,
  onDeclineService,
  onRestoreService,
  showActions = true,
  showRestore = false,
  disabled = false,
}) => {
  const isBasic = pkg.type === 'basic';

  return (
    <View
      className={classnames(styles.packageCard, {
        [styles.selected]: selected,
        [styles.basic]: isBasic,
        [styles.premium]: !isBasic,
        [styles.disabled]: disabled,
      })}
      onClick={!disabled ? onSelect : undefined}
    >
      <View className={styles.cardHeader}>
        <View className={styles.headerLeft}>
          <View className={classnames(styles.packageBadge, isBasic ? styles.basicBadge : styles.premiumBadge)}>
            <Text className={styles.badgeText}>{isBasic ? '基础' : '加强'}</Text>
          </View>
          <Text className={styles.packageName}>{pkg.name}</Text>
        </View>
        <View className={styles.packagePrice}>
          <Text className={styles.priceSymbol}>¥</Text>
          <Text className={styles.priceValue}>{pkg.totalPrice}</Text>
        </View>
      </View>

      <Text className={styles.packageDesc}>{pkg.description}</Text>

      <View className={styles.highlights}>
        {pkg.highlights.map((highlight, index) => (
          <View key={index} className={styles.highlightTag}>
            <Text className={styles.highlightText}>{highlight}</Text>
          </View>
        ))}
      </View>

      <View className={styles.divider} />

      <View className={styles.servicesList}>
        {pkg.services.map((service) => (
          <ServiceItem
            key={service.serviceId}
            service={service}
            onToggle={showActions && onToggleService ? () => onToggleService(service.serviceId) : undefined}
            onDecline={showActions && onDeclineService ? () => onDeclineService(service.serviceId) : undefined}
            onRestore={showRestore && onRestoreService ? () => onRestoreService(service.serviceId) : undefined}
            showRestore={showRestore}
            disabled={disabled || !selected}
          />
        ))}
      </View>

      <View className={styles.cardFooter}>
        <View className={styles.durationInfo}>
          <Text className={styles.durationLabel}>预计用时</Text>
          <Text className={styles.durationValue}>{formatDuration(pkg.totalDuration)}</Text>
        </View>
        {selected && (
          <View className={styles.selectedIndicator}>
            <Text className={styles.selectedText}>已选择</Text>
          </View>
        )}
      </View>

      {selected && (
        <View className={styles.cornerCheck}>
          <Text className={styles.cornerCheckIcon}>✓</Text>
        </View>
      )}
    </View>
  );
};

export default PackageCard;
