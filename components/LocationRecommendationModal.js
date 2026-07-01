import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { visitHistoryCopy } from '../constants/visitHistoryCopy';
import { ACCENT_COLOR } from '../constants/mapTheme';
import { styles } from '../styles/AppStyles';

export default function LocationRecommendationModal({
  visible,
  onLater,
  onEnable,
  onDismissForever,
}) {
  const copy = visitHistoryCopy.globalRecommendation;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onLater}
    >
      <View style={localStyles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onLater} />
        <View style={localStyles.card}>
          <Text style={localStyles.title}>{copy.title}</Text>
          <Text style={localStyles.message}>{copy.message}</Text>
          <TouchableOpacity
            style={[styles.notificationSystemButton, localStyles.primaryButton]}
            onPress={onEnable}
          >
            <Text style={styles.notificationSystemButtonText}>{copy.enable}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={localStyles.secondaryButton} onPress={onLater}>
            <Text style={localStyles.secondaryText}>{copy.later}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={localStyles.dismissButton}
            onPress={onDismissForever}
          >
            <Text style={localStyles.dismissText}>{copy.dismissForever}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const localStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    color: '#555',
    marginBottom: 4,
  },
  primaryButton: {
    marginTop: 4,
    backgroundColor: '#E3F2FD',
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  secondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: ACCENT_COLOR,
  },
  dismissButton: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  dismissText: {
    fontSize: 14,
    color: '#888',
  },
});
