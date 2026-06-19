import React, { useState } from 'react';
import { View, Text, Input, Switch, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { usePackage } from '../../store/PackageContext';
import StepIndicator from '../../components/StepIndicator';
import ConditionCard from '../../components/ConditionCard';
import { tartarLevelOptions, pigmentationLevelOptions, bleedingLevelOptions } from '../../data/oralConditions';
import { isValidCondition } from '../../utils/packageCalculator';
import { TartarLevel, PigmentationLevel, BleedingLevel } from '../../types';
import styles from './index.module.scss';

const steps = [
  { id: 1, title: '口腔评估' },
  { id: 2, title: '套餐建议' },
  { id: 3, title: '方案确认' },
  { id: 4, title: '发送完成' },
];

const AssessmentPage: React.FC = () => {
  const {
    patientInfo,
    setPatientInfo,
    oralCondition,
    setOralCondition,
    calculatePackages,
    setCurrentStep,
    resetAll,
  } = usePackage();

  const [name, setName] = useState(patientInfo.name || '');
  const [phone, setPhone] = useState(patientInfo.phone || '');

  const handleTartarChange = (value: string) => {
    console.log('[Assessment] Tartar level changed:', value);
    setOralCondition({
      ...oralCondition,
      tartarLevel: value as TartarLevel,
    });
  };

  const handlePigmentationChange = (value: string) => {
    console.log('[Assessment] Pigmentation level changed:', value);
    setOralCondition({
      ...oralCondition,
      pigmentationLevel: value as PigmentationLevel,
    });
  };

  const handleBleedingChange = (value: string) => {
    console.log('[Assessment] Bleeding level changed:', value);
    setOralCondition({
      ...oralCondition,
      bleedingLevel: value as BleedingLevel,
    });
  };

  const handleFirstTimeChange = (checked: boolean) => {
    console.log('[Assessment] First time changed:', checked);
    setOralCondition({
      ...oralCondition,
      isFirstTime: checked,
    });
  };

  const handleNext = () => {
    setPatientInfo({
      ...patientInfo,
      name: name || undefined,
      phone: phone || undefined,
    });

    const success = calculatePackages();
    if (success) {
      setCurrentStep(2);
      console.log('[Assessment] Navigating to package page');
      Taro.switchTab({
        url: '/pages/package/index',
      });
    }
  };

  const handleReset = () => {
    Taro.showModal({
      title: '确认重置',
      content: '确定要清空所有已填信息吗？',
      success: (res) => {
        if (res.confirm) {
          setName('');
          setPhone('');
          resetAll();
          console.log('[Assessment] All info reset');
        }
      },
    });
  };

  const canProceed = isValidCondition(oralCondition);

  return (
    <View className={styles.pageContainer}>
      <StepIndicator currentStep={1} steps={steps} />

      <Text className={styles.pageTitle}>口腔情况评估</Text>
      <Text className={styles.pageSubtitle}>请根据检查结果勾选患者口腔情况</Text>

      <View className={styles.infoCard}>
        <Text className={styles.infoTitle}>患者信息（可选）</Text>
        <View className={styles.inputGroup}>
          <View className={styles.inputItem}>
            <Text className={styles.inputLabel}>患者姓名</Text>
            <Input
              className={styles.input}
              placeholder="请输入患者姓名"
              value={name}
              onInput={(e) => setName(e.detail.value)}
            />
          </View>
          <View className={styles.inputItem}>
            <Text className={styles.inputLabel}>联系电话</Text>
            <Input
              className={styles.input}
              type="number"
              placeholder="请输入联系电话"
              value={phone}
              onInput={(e) => setPhone(e.detail.value)}
            />
          </View>
        </View>
      </View>

      <ConditionCard
        title="牙石等级"
        options={tartarLevelOptions}
        value={oralCondition.tartarLevel}
        onChange={handleTartarChange}
      />

      <ConditionCard
        title="色素沉着"
        options={pigmentationLevelOptions}
        value={oralCondition.pigmentationLevel}
        onChange={handlePigmentationChange}
      />

      <ConditionCard
        title="牙龈出血"
        options={bleedingLevelOptions}
        value={oralCondition.bleedingLevel}
        onChange={handleBleedingChange}
      />

      <View className={styles.switchCard}>
        <View className={styles.switchInfo}>
          <Text className={styles.switchTitle}>初次洁牙</Text>
          <Text className={styles.switchDesc}>患者是否为第一次洁牙</Text>
        </View>
        <Switch
          checked={oralCondition.isFirstTime}
          onChange={(e) => handleFirstTimeChange(e.detail.value)}
          color="#00A896"
        />
      </View>

      <View className={styles.hintCard}>
        <Text className={styles.hintText}>
          💡 即使没有牙石，如有色素沉着、牙龈出血或初次洁牙，也可以生成相应的护理建议
        </Text>
      </View>

      <View className={styles.bottomActionBar}>
        <Button
          className={styles.nextBtn}
          disabled={!canProceed}
          onClick={handleNext}
        >
          <Text className={styles.btnText}>下一步，生成套餐</Text>
        </Button>
        <Button className={styles.resetBtn} onClick={handleReset}>
          重置所有
        </Button>
      </View>
    </View>
  );
};

export default AssessmentPage;
