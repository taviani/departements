import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppLogo from './AppLogo';
import { getHeaderSubtitle } from '../utils/departementCopy';
import { styles } from '../styles/AppStyles';

export default function AppHeader({ isDetailView, onMenuPress }) {
  const subtitle = getHeaderSubtitle({ isDetailView });

  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <AppLogo />
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={1}>
            Départements
          </Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <TouchableOpacity
          style={styles.headerMenuButton}
          onPress={onMenuPress}
          accessibilityLabel="Ouvrir le menu"
        >
          <Ionicons name="menu" size={28} color="#333" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
