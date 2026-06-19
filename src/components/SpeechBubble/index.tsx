import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface SpeechBubbleProps {
  text: string;
  type?: 'doctor' | 'tip';
  showDoctorIcon?: boolean;
}

const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  text,
  type = 'doctor',
  showDoctorIcon = true,
}) => {
  return (
    <View className={classnames(styles.bubbleContainer, type === 'tip' && styles.tipContainer)}>
      {type === 'doctor' && showDoctorIcon && (
        <View className={styles.avatar}>
          <Text className={styles.avatarIcon}>👨‍⚕️</Text>
        </View>
      )}
      <View className={classnames(styles.bubble, styles[`bubble${type.charAt(0).toUpperCase() + type.slice(1)}`])}>
        {type === 'doctor' && <Text className={styles.bubbleLabel}>医生话术</Text>}
        <Text className={styles.bubbleText}>{text}</Text>
      </View>
    </View>
  );
};

export default SpeechBubble;
