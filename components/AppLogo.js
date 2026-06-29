import React from 'react';
import { Image } from 'react-native';
import { styles } from '../styles/AppStyles';

export default function AppLogo() {
  return (
    <Image
      source={require('../assets/logo.png')}
      style={styles.logo}
      accessibilityLabel="Logo France"
    />
  );
}
