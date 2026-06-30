import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/AppStyles';

const MENU_ITEMS = [
  { id: 'search', label: 'Rechercher', icon: 'search' },
  { id: 'list', label: 'Tous les départements', icon: 'list' },
  { id: 'random', label: 'Département au hasard', icon: 'shuffle' },
  { id: 'notifications', label: 'Notifications', icon: 'notifications-outline' },
  { id: 'help', label: 'Aide', icon: 'help-circle-outline' },
  { id: 'legal', label: 'Informations légales', icon: 'document-text' },
];

export default function AppMenu({
  visible,
  onClose,
  onSearch,
  onFullList,
  onRandom,
  onNotifications,
  onHelp,
  onLegal,
}) {
  const handlers = {
    search: onSearch,
    list: onFullList,
    random: onRandom,
    notifications: onNotifications,
    help: onHelp,
    legal: onLegal,
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.menuOverlayRoot}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Fermer le menu"
        />
        <View style={styles.menuPanel}>
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                index === MENU_ITEMS.length - 1 && styles.menuItemLast,
              ]}
              onPress={() => {
                handlers[item.id]?.();
                onClose();
              }}
              accessibilityLabel={item.label}
            >
              <Ionicons name={item.icon} size={22} color="#2196F3" />
              <Text style={styles.menuItemLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
}
