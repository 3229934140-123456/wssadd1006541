import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface StepIndicatorProps {
  currentStep: number;
  steps: { id: number; title: string }[];
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, steps }) => {
  return (
    <View className={styles.stepContainer}>
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <View className={styles.stepItem}>
            <View
              className={classnames(styles.stepCircle, {
                [styles.completed]: step.id < currentStep,
                [styles.active]: step.id === currentStep,
              })}
            >
              {step.id < currentStep ? (
                <Text className={styles.checkIcon}>✓</Text>
              ) : (
                <Text className={styles.stepNumber}>{step.id}</Text>
              )}
            </View>
            <Text
              className={classnames(styles.stepTitle, {
                [styles.activeTitle]: step.id <= currentStep,
              })}
            >
              {step.title}
            </Text>
          </View>
          {index < steps.length - 1 && (
            <View
              className={classnames(styles.stepLine, {
                [styles.lineCompleted]: step.id < currentStep,
              })}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );
};

export default StepIndicator;
