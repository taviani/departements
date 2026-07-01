import React, { useCallback, useState } from 'react';
import {
  Alert,
  InteractionManager,
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
import { visitHistoryCopy } from '../constants/visitHistoryCopy';
import { ACCENT_COLOR } from '../constants/mapTheme';
import {
  canRecordVisitHistory,
  hasRecommendedLocationAccess,
} from '../utils/locationPermissionLevel';
import { isValidVisitSession } from '../utils/visitHistory';
import { styles } from '../styles/AppStyles';

function SettingRow({ label, description, value, onValueChange }) {
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
        trackColor={{ false: '#d0d0d0', true: '#90CAF9' }}
        thumbColor={value ? ACCENT_COLOR : '#f4f4f4'}
        accessibilityLabel={label}
      />
    </View>
  );
}

const deferAfterModal = (callback) => {
  InteractionManager.runAfterInteractions(() => {
    setTimeout(callback, 300);
  });
};

const formatSessionLine = (session) => {
  const entered = new Date(session.enteredAt);
  const date = entered.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const time = entered.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  let durationLabel = 'En cours';
  if (session.exitedAt) {
    const minutes = Math.round(
      (new Date(session.exitedAt).getTime() - entered.getTime()) / 60000
    );
    durationLabel = visitHistoryCopy.sessionDuration(minutes);
  }

  const valid = isValidVisitSession(session) ? ' · visité' : '';
  return `${session.departementCode} · ${date} ${time} · ${durationLabel}${valid}`;
};

export default function VisitJourneyScreen({
  visible,
  onClose,
  onRequestLocationAccess,
  onRefreshLocationTracking,
  visitHistory,
}) {
  const {
    loading,
    consent,
    settings,
    sessions,
    stats,
    permissionLevel,
    showLocationBanner,
    showPartialTrackingInfo,
    emptyMessage,
    setHistoryEnabled,
    setShowVisitedOnMap,
    deleteHistory,
    dismissBanner,
    reload,
  } = visitHistory;

  const [showDetailHistory, setShowDetailHistory] = useState(false);

  const showConsentLocationAlert = useCallback(
    (foregroundStatus) => {
      const copy = visitHistoryCopy.consentEnable;
      const buttons = [
        { text: copy.later, style: 'cancel' },
        {
          text: copy.authorize,
          onPress: () => {
            onRequestLocationAccess?.().then(() => {
              onRefreshLocationTracking?.();
              reload();
            });
          },
        },
      ];

      if (foregroundStatus === 'denied') {
        buttons.push({
          text: copy.openSettings,
          onPress: () => Linking.openSettings(),
        });
      }

      Alert.alert(copy.title, copy.message, buttons);
    },
    [onRefreshLocationTracking, onRequestLocationAccess, reload]
  );

  const showPartialTrackingAlert = useCallback(() => {
    const copy = visitHistoryCopy.partialTracking;
    Alert.alert(copy.title, copy.message, [
      { text: copy.continue, style: 'cancel' },
      {
        text: copy.enableFull,
        onPress: () => Linking.openSettings(),
      },
    ]);
  }, []);

  const handleHistoryToggle = useCallback(
    async (enabled) => {
      if (enabled) {
        if (!canRecordVisitHistory(permissionLevel)) {
          deferAfterModal(() => showConsentLocationAlert(permissionLevel));
        }

        await setHistoryEnabled(true);
        await reload();
        onRefreshLocationTracking?.();

        if (
          canRecordVisitHistory(permissionLevel) &&
          !hasRecommendedLocationAccess(permissionLevel)
        ) {
          deferAfterModal(showPartialTrackingAlert);
        }
        return;
      }

      const copy = visitHistoryCopy.consentDisable;
      Alert.alert(copy.title, copy.message, [
        {
          text: copy.keep,
          onPress: async () => {
            await setHistoryEnabled(false);
            await reload();
          },
        },
        {
          text: copy.delete,
          style: 'destructive',
          onPress: async () => {
            await deleteHistory();
            await setHistoryEnabled(false);
            await reload();
          },
        },
      ]);
    },
    [
      deleteHistory,
      permissionLevel,
      reload,
      setHistoryEnabled,
      showConsentLocationAlert,
      showPartialTrackingAlert,
    ]
  );

  const handleBannerAction = useCallback(() => {
    if (permissionLevel === 'foreground') {
      Linking.openSettings();
      return;
    }

    onRequestLocationAccess?.().then(() => {
      onRefreshLocationTracking?.();
      reload();
    });
  }, [
    onRefreshLocationTracking,
    onRequestLocationAccess,
    permissionLevel,
    reload,
  ]);

  const bannerText =
    permissionLevel === 'foreground'
      ? visitHistoryCopy.banner.foregroundOnly
      : visitHistoryCopy.banner.noLocation;

  const bannerActionLabel =
    permissionLevel === 'foreground'
      ? visitHistoryCopy.banner.settings
      : visitHistoryCopy.banner.activate;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.legalScreen}>
        <View style={styles.legalHeader}>
          <Text style={styles.legalTitle}>{visitHistoryCopy.screenTitle}</Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.legalCloseButton}
            accessibilityLabel="Fermer"
          >
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.visitJourneyContent}>
          {showLocationBanner ? (
            <View style={styles.visitBanner}>
              <Text style={styles.visitBannerText}>{bannerText}</Text>
              <View style={styles.visitBannerActions}>
                <TouchableOpacity onPress={dismissBanner}>
                  <Text style={styles.visitBannerDismiss}>Masquer</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleBannerAction}>
                  <Text style={styles.visitBannerAction}>{bannerActionLabel}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {showPartialTrackingInfo ? (
            <Text style={styles.visitPartialInfo}>
              {visitHistoryCopy.partialTracking.message}
            </Text>
          ) : null}

          <View style={styles.visitProgressCard}>
            <Text style={styles.visitProgressValue}>
              {visitHistoryCopy.progressLabel(
                stats.visitedCount,
                stats.totalSlots
              )}
            </Text>
            <View style={styles.visitProgressTrack}>
              <View
                style={[
                  styles.visitProgressFill,
                  { width: `${Math.round(stats.progressRatio * 100)}%` },
                ]}
              />
            </View>
            {stats.totalPassages > 0 ? (
              <Text style={styles.visitProgressSubtext}>
                {visitHistoryCopy.totalPassages(stats.totalPassages)}
              </Text>
            ) : (
              <Text style={styles.visitProgressSubtext}>{emptyMessage}</Text>
            )}
          </View>

          <View style={styles.notificationSection}>
            <SettingRow
              label={visitHistoryCopy.historyToggle.label}
              description={visitHistoryCopy.historyToggle.description}
              value={Boolean(consent?.historyEnabled)}
              onValueChange={handleHistoryToggle}
            />
            <SettingRow
              label={visitHistoryCopy.mapToggle.label}
              description={visitHistoryCopy.mapToggle.description}
              value={Boolean(settings?.showVisitedOnMap)}
              onValueChange={setShowVisitedOnMap}
            />
          </View>

          {stats.topDepartments.length > 0 ? (
            <View style={styles.visitTopSection}>
              <Text style={styles.visitSectionTitle}>
                {visitHistoryCopy.topDepartmentsTitle}
              </Text>
              {stats.topDepartments.map((item) => (
                <View key={item.code} style={styles.visitTopRow}>
                  <Text style={styles.visitTopCode}>{item.number}</Text>
                  <Text style={styles.visitTopName}>{item.name}</Text>
                  <Text style={styles.visitTopCount}>{item.count}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.visitLinksSection}>
            <TouchableOpacity
              style={styles.visitLinkRow}
              onPress={() => setShowDetailHistory((current) => !current)}
            >
              <Text style={styles.visitLinkText}>
                {visitHistoryCopy.links.detail}
              </Text>
              <Ionicons
                name={showDetailHistory ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={ACCENT_COLOR}
              />
            </TouchableOpacity>

            {showDetailHistory ? (
              <View style={styles.visitSessionList}>
                {loading ? (
                  <Text style={styles.visitSessionEmpty}>Chargement…</Text>
                ) : sessions.length === 0 ? (
                  <Text style={styles.visitSessionEmpty}>{emptyMessage}</Text>
                ) : (
                  [...sessions]
                    .reverse()
                    .slice(0, 50)
                    .map((session) => (
                      <Text key={session.id} style={styles.visitSessionLine}>
                        {formatSessionLine(session)}
                      </Text>
                    ))
                )}
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.visitLinkRow}
              onPress={() =>
                Alert.alert(
                  visitHistoryCopy.links.export,
                  visitHistoryCopy.links.exportComingSoon
                )
              }
            >
              <Text style={styles.visitLinkText}>
                {visitHistoryCopy.links.export}
              </Text>
              <Ionicons name="download-outline" size={20} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.visitLinkRow}
              onPress={() =>
                Alert.alert(
                  visitHistoryCopy.links.delete,
                  visitHistoryCopy.links.deleteComingSoon
                )
              }
            >
              <Text style={[styles.visitLinkText, styles.visitLinkMuted]}>
                {visitHistoryCopy.links.delete}
              </Text>
              <Ionicons name="trash-outline" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
