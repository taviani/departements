import React from 'react';
import {
  Alert,
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
import { canUseBackgroundLocationUpdates } from '../utils/backgroundLocationSupport';
import { HelpLinkButton } from './HelpScreen';
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

const showLocationPermissionAlert = (foregroundStatus, backgroundRequired) => {
  if (foregroundStatus !== 'granted') {
    Alert.alert(
      'Localisation requise',
      'Autorisez la localisation pour recevoir une alerte lorsque vous changez de département.',
      [
        { text: 'Plus tard', style: 'cancel' },
        { text: 'Ouvrir les réglages', onPress: () => Linking.openSettings() },
      ]
    );
    return;
  }

  if (backgroundRequired) {
    Alert.alert(
      'Accès en arrière-plan requis',
      'Pour être alerté en déplacement, choisissez « Toujours autoriser » dans Réglages > Localisation > Départements.',
      [
        { text: 'Plus tard', style: 'cancel' },
        { text: 'Ouvrir les réglages', onPress: () => Linking.openSettings() },
      ]
    );
  }
};

const showExpoGoLimitedTrackingAlert = () => {
  Alert.alert(
    'Suivi limité à l\'app ouverte',
    'En Expo Go, les alertes de passage fonctionnent uniquement lorsque l\'application est ouverte. Installez la version compilée pour les alertes en déplacement.',
    [{ text: 'Compris' }]
  );
};

export default function NotificationsScreen({
  visible,
  onClose,
  onRequestLocationAccess,
  onRefreshLocationTracking,
  onOpenHelp,
}) {
  const {
    settings,
    loading,
    permissionLabel,
    locationPermissionLabel,
    needsBackgroundLocationHint,
    setEnabled,
    setDailyDepartement,
    setAppUpdates,
    setDepartementChanges,
    refreshPermission,
  } = useNotificationSettings(visible);

  const handleSetEnabled = async (enabled) => {
    const success = await setEnabled(enabled);
    if (success) {
      await onRefreshLocationTracking?.();
    }
  };

  const handleDepartementChanges = async (enabled) => {
    try {
      if (enabled) {
        const status = await onRequestLocationAccess?.();
        if (status !== 'granted') {
          const [{ foreground }, backgroundRequired] = await Promise.all([
            refreshPermission(),
            canUseBackgroundLocationUpdates(),
          ]);
          showLocationPermissionAlert(foreground, backgroundRequired);
          return;
        }
      }

      await setDepartementChanges(enabled);
      await onRefreshLocationTracking?.();

      if (enabled) {
        const backgroundRequired = await canUseBackgroundLocationUpdates();
        if (!backgroundRequired) {
          showExpoGoLimitedTrackingAlert();
        }
      }
    } catch (error) {
      console.error('Failed to update department change alerts:', error);
      Alert.alert(
        'Activation impossible',
        'Une erreur est survenue lors de l\'activation du suivi. Réessayez ou consultez l\'aide.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleOpenSettings = async () => {
    await refreshPermission();
    await Linking.openSettings();
  };

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

          {onOpenHelp ? <HelpLinkButton onPress={onOpenHelp} /> : null}

          <View style={styles.notificationStatusCard}>
            <Text style={styles.legalSectionTitle}>Autorisations système</Text>

            <View style={styles.notificationStatusBlock}>
              <Text style={styles.notificationStatusLabel}>Notifications</Text>
              <Text style={styles.notificationStatusValue}>{permissionLabel}</Text>
            </View>

            <View style={styles.notificationStatusBlock}>
              <Text style={styles.notificationStatusLabel}>Localisation</Text>
              <Text style={styles.notificationStatusValue}>
                {locationPermissionLabel}
              </Text>
              {needsBackgroundLocationHint ? (
                <Text style={styles.notificationStatusHint}>
                  Choisissez « Toujours autoriser » pour les alertes en déplacement.
                </Text>
              ) : null}
            </View>
          </View>

          <SettingRow
            label="Activer les notifications"
            description="Autorise l'application à vous envoyer des alertes."
            value={settings.enabled}
            onValueChange={handleSetEnabled}
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
              label="Passage de département"
              description="Alerte quand vous entrez dans un nouveau département. Nécessite l'accès « Toujours » pour fonctionner en déplacement (précision ~300 m)."
              value={settings.departementChanges}
              onValueChange={handleDepartementChanges}
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
            onPress={handleOpenSettings}
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
