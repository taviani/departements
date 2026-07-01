import React from 'react';
import { Text } from 'react-native';
import { CURRENT_DEPARTEMENT_MATCH_LABEL } from '../utils/departementCopy';
import { styles } from '../styles/AppStyles';

export default function LocationHeart({ visible, size = 26, style }) {
  if (!visible) {
    return null;
  }

  return (
    <Text
      style={[styles.locationHeart, { fontSize: size, lineHeight: size * 1.15 }, style]}
      accessibilityLabel={CURRENT_DEPARTEMENT_MATCH_LABEL}
    >
      📍
    </Text>
  );
}
