import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import { OptionItem } from '../../types';

interface ConditionCardProps {
  title: string;
  options: OptionItem[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

const ConditionCard: React.FC<ConditionCardProps> = ({
  title,
  options,
  value,
  onChange,
  required = false,
}) => {
  return (
    <View className={styles.card}>
      <View className={styles.cardHeader}>
        <Text className={styles.cardTitle}>{title}</Text>
        {required && <Text className={styles.required}>*</Text>}
      </View>
      <View className={styles.optionsGrid}>
        {options.map((option) => (
          <View
            key={option.value}
            className={classnames(styles.optionItem, {
              [styles.optionSelected]: value === option.value,
            })}
            onClick={() => onChange(option.value)}
          >
            <View className={styles.optionContent}>
              <Text className={styles.optionLabel}>{option.label}</Text>
              {option.description && (
                <Text className={styles.optionDesc}>{option.description}</Text>
              )}
            </View>
            {value === option.value && (
              <View className={styles.checkMark}>
                <Text className={styles.checkIcon}>✓</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

export default ConditionCard;
