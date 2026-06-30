import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/AppStyles';

export default function LocationHeart({ visible, size = 26, style }) {
  if (!visible) {
    return null;
  }

  return (
    <Ionicons
      name="heart"
      size={size}
      color="#E91E63"
      style={[styles.locationHeart, style]}
      accessibilityLabel="C'est un match — vous êtes dans ce département"
    />
  );
}
