import React, { useEffect } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import { PackageProvider } from './store/PackageContext';
import './app.scss';

function App(props) {
  useEffect(() => {
    console.log('[App] App component mounted');
  }, []);

  useDidShow(() => {
    console.log('[App] App showed');
  });

  useDidHide(() => {
    console.log('[App] App hidden');
  });

  return (
    <PackageProvider>
      {props.children}
    </PackageProvider>
  );
}

export default App;
