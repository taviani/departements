import React from 'react';
import {
  Linking,
  Modal,
  SafeAreaView,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ACCENT_COLOR } from '../constants/mapTheme';
import { useNotificationSettings } from '../hooks/useNotificationSettings';
import { styles } from '../styles/AppStyles';

function SettingRow({ label, description, value, onValueChange, disabled }) {
  return (
    <View style={styles.notificationRow}>
      <View style={styles.notificationRowText}>
        <Text style={styles.notificationRowLabel}>{label}</Text>
        {description ? (
          <Text style={styles.notificationRowDescription}>{description}</Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: '#d0d0d0', true: '#90CAF9' }}
        thumbColor={value ? ACCENT_COLOR : '#f4f4f4'}
        accessibilityLabel={label}
      />
    </View>
  );
}

export default function NotificationsScreen({ visible, onClose }) {
  const {
    settings,
    loading,
    permissionLabel,
    setEnabled,
    setDailyDepartement,
    setAppUpdates,
    refreshPermission,
  } = useNotificationSettings(visible);

  const categoriesDisabled = !settings.enabled || loading;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.legalScreen}>
        <View style={styles.legalHeader}>
          <Text style={styles.legalTitle}>Notifications</Text>
          <TouchableOpacity
            style={styles.legalCloseButton}
            onPress={onClose}
            accessibilityLabel="Fermer les notifications"
          >
            <Ionicons name="close" size={28} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.legalScroll}
          contentContainerStyle={styles.legalScrollContent}
        >
          <Text style={styles.legalIntro}>
            Gérez les notifications de l&apos;application. Les préférences sont
            enregistrées sur cet appareil.
          </Text>

          <View style={styles.notificationStatusCard}>
            <Text style={styles.notificationStatusLabel}>
              Autorisation système
            </Text>
            <Text style={styles.notificationStatusValue}>{permissionLabel}</Text>
          </View>

          <SettingRow
            label="Activer les notifications"
            description="Autorise l'application à vous envoyer des alertes."
            value={settings.enabled}
            onValueChange={setEnabled}
            disabled={loading}
          />

          <View style={styles.notificationSection}>
            <Text style={styles.legalSectionTitle}>Catégories</Text>
            <SettingRow
              label="Département du jour"
              description="Un rappel quotidien avec un département à découvrir."
              value={settings.dailyDepartement}
              onValueChange={setDailyDepartement}
              disabled={categoriesDisabled}
            />
            <SettingRow
              label="Actualités de l'application"
              description="Nouvelles versions et améliorations."
              value={settings.appUpdates}
              onValueChange={setAppUpdates}
              disabled={categoriesDisabled}
            />
          </View>

          <TouchableOpacity
            style={styles.notificationSystemButton}
            onPress={async () => {
              await refreshPermission();
              await Linking.openSettings();
            }}
            accessibilityLabel="Ouvrir les réglages système"
          >
            <Ionicons name="settings-outline" size={20} color={ACCENT_COLOR} />
            <Text style={styles.notificationSystemButtonText}>
              Ouvrir les réglages système
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
