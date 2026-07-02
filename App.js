import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import AnimatedSplash from './components/AnimatedSplash';
import MatchSplash from './components/MatchSplash';
import AppHeader from './components/AppHeader';
import AppMenu from './components/AppMenu';
import DepartementDetailStrip from './components/DepartementDetailStrip';
import FranceMap from './components/FranceMap';
import LegalInfoScreen from './components/LegalInfoScreen';
import HelpScreen from './components/HelpScreen';
import NotificationsScreen from './components/NotificationsScreen';
import VisitJourneyScreen from './components/VisitJourneyScreen';
import LocationRecommendationModal from './components/LocationRecommendationModal';
import SearchOverlay from './components/SearchOverlay';
import { useDepartementExplorer } from './hooks/useDepartementExplorer';
import { useDepartementLocation } from './hooks/useDepartementLocation';
import { useVisitHistory } from './hooks/useVisitHistory';
import { useHorizontalSwipe } from './hooks/useHorizontalSwipe';
import { visitHistoryCopy } from './constants/visitHistoryCopy';
import {
  canRecordVisitHistory,
  getLocationPermissionLevel,
} from './utils/locationPermissionLevel';
import {
  ensureAppLaunchCounted,
  dismissLocationRecommendationForever,
  getAppLaunchCount,
  shouldShowLocationRecommendation,
} from './utils/locationRecommendationStorage';
import { ensureNotificationChannels } from './utils/notificationChannels';
import { notifyDepartementChange } from './utils/departementGeofenceNotifications';
import { styles } from './styles/AppStyles';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [splashVisible, setSplashVisible] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [legalVisible, setLegalVisible] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [journeyVisible, setJourneyVisible] = useState(false);
  const [locationRecommendationVisible, setLocationRecommendationVisible] =
    useState(false);
  const visitHistory = useVisitHistory({ visible: journeyVisible });
  const location = useDepartementLocation({
    onVisitHistoryUpdated: visitHistory.reload,
  });

  const celebrateIfCurrentDepartement = useCallback(
    async (code) => {
      if (!code || location.matchCelebration?.number === code) {
        return;
      }

      if (location.isCurrentDepartement(code)) {
        location.celebrateMatch(code);
        return;
      }

      const currentCode = await location.resolveCurrentDepartementCode();
      if (currentCode === code) {
        location.celebrateMatch(code);
      }
    },
    [
      location.celebrateMatch,
      location.isCurrentDepartement,
      location.matchCelebration?.number,
      location.resolveCurrentDepartementCode,
    ]
  );

  const explorer = useDepartementExplorer({
    onDepartementDisplayed: celebrateIfCurrentDepartement,
  });

  const handleRequestLocationAccess = useCallback(async () => {
    const foreground = await location.requestForegroundPermission();
    if (foreground !== 'granted') {
      return foreground;
    }
    return location.requestBackgroundPermission();
  }, [location.requestForegroundPermission, location.requestBackgroundPermission]);

  const handleGoToDepartementCodeRef = useRef(explorer.handleGoToDepartementCode);
  handleGoToDepartementCodeRef.current = explorer.handleGoToDepartementCode;

  useEffect(() => {
    if (!location.matchCelebration?.number) {
      return;
    }

    handleGoToDepartementCodeRef.current(location.matchCelebration.number);
  }, [location.matchCelebration?.number]);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
    ensureNotificationChannels().catch(() => {});
    ensureAppLaunchCounted().catch(() => {});
  }, []);

  const handleSplashFinish = useCallback(() => {
    setSplashVisible(false);
  }, []);

  useEffect(() => {
    if (splashVisible) {
      return;
    }

    let active = true;

    const maybeShowRecommendation = async () => {
      const [foreground, background, launchCount] = await Promise.all([
        Location.getForegroundPermissionsAsync(),
        Location.getBackgroundPermissionsAsync(),
        getAppLaunchCount(),
      ]);
      const permissionLevel = getLocationPermissionLevel(
        foreground.status,
        background.status
      );
      const show = await shouldShowLocationRecommendation({
        permissionLevel,
        launchCount,
      });
      if (active && show) {
        setLocationRecommendationVisible(true);
      }
    };

    maybeShowRecommendation();

    return () => {
      active = false;
    };
  }, [splashVisible]);

  const showMapHint = !canRecordVisitHistory(visitHistory.permissionLevel);

  const mapVisitIntensity = useMemo(() => {
    if (
      !visitHistory.consent?.historyEnabled ||
      !visitHistory.settings?.showVisitedOnMap
    ) {
      return undefined;
    }
    return visitHistory.visitIntensityByCode;
  }, [
    visitHistory.consent?.historyEnabled,
    visitHistory.settings?.showVisitedOnMap,
    visitHistory.visitIntensityByCode,
  ]);

  const handleSwipeDown = useCallback(() => {
    location.resolveCurrentDepartementCode().then((code) => {
      if (code) {
        location.celebrateMatch(code);
      }
    });
  }, [location.resolveCurrentDepartementCode, location.celebrateMatch]);

  const swipeHandlers = useHorizontalSwipe({
    onSwipeLeft: explorer.handleRandomRefresh,
    onSwipeRight: explorer.openSearchOverlay,
    onSwipeDown: handleSwipeDown,
  });

  return (
    <View style={styles.root}>
      <View style={styles.gestureShell} testID="gesture-shell" {...swipeHandlers}>
        <SafeAreaView style={styles.headerShell}>
          <StatusBar barStyle="dark-content" />
          <AppHeader
            isDetailView={explorer.isDetailView}
            onMenuPress={() => setMenuVisible(true)}
          />
          {showMapHint ? (
            <Text style={styles.mapHint}>{visitHistoryCopy.mapHint}</Text>
          ) : null}
        </SafeAreaView>

        <View style={styles.container}>
          <View style={styles.mainContent} testID="main-content">
            <View style={styles.mapContainer}>
              <FranceMap
                style={
                  explorer.selectedDepartement ? styles.mapAboveStrip : styles.mapFull
                }
                selectedCode={explorer.selectedDepartement?.number}
                detailCode={explorer.zoomedCode}
                highlightedCodes={explorer.mapHighlightedCodes}
                visitIntensityByCode={mapVisitIntensity}
                onDepartmentPress={explorer.handleMapDepartmentPress}
                onZoomChange={explorer.handleMapZoomChange}
              />

              {explorer.selectedDepartement && (
                <DepartementDetailStrip
                  item={explorer.selectedDepartement}
                  isDetailView={explorer.isDetailView}
                  isCurrentLocation={location.isCurrentDepartement(
                    explorer.selectedDepartement.number
                  )}
                  onPress={explorer.handleDetailStripPress}
                  onClose={explorer.handleDetailClose}
                />
              )}
            </View>
          </View>
        </View>
      </View>

      <AppMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onJourney={() => setJourneyVisible(true)}
        onNotifications={() => setNotificationsVisible(true)}
        onHelp={() => setHelpVisible(true)}
        onLegal={() => setLegalVisible(true)}
      />

      <VisitJourneyScreen
        visible={journeyVisible}
        onClose={() => setJourneyVisible(false)}
        onRequestLocationAccess={handleRequestLocationAccess}
        onRefreshLocationTracking={location.refreshTracking}
        visitHistory={visitHistory}
      />

      <NotificationsScreen
        visible={notificationsVisible}
        onClose={() => setNotificationsVisible(false)}
        onRequestLocationAccess={handleRequestLocationAccess}
        onRefreshLocationTracking={location.refreshTracking}
        onPreviewDepartementChange={async () => {
          await notifyDepartementChange('75', { preview: true });
          location.celebrateMatch('75');
        }}
        onOpenHelp={() => {
          setNotificationsVisible(false);
          setHelpVisible(true);
        }}
      />

      <HelpScreen
        visible={helpVisible}
        onClose={() => setHelpVisible(false)}
      />

      <LegalInfoScreen
        visible={legalVisible}
        onClose={() => setLegalVisible(false)}
      />

      <SearchOverlay
        visible={explorer.searchOverlayVisible}
        searchQuery={explorer.searchQuery}
        isSearchEmpty={explorer.isSearchEmpty}
        showFullList={explorer.showFullList}
        filteredDepartements={explorer.filteredDepartements}
        onSearchChange={explorer.handleSearchChange}
        onClose={explorer.closeSearchOverlay}
        onListToggle={explorer.handleListToggle}
        onDepartementPress={explorer.handleDepartementPress}
        isCurrentDepartement={location.isCurrentDepartement}
      />

      {splashVisible && <AnimatedSplash onFinish={handleSplashFinish} />}

      {!splashVisible && location.matchCelebration && !notificationsVisible && !journeyVisible ? (
        <MatchSplash
          departement={location.matchCelebration}
          onFinish={location.clearMatchCelebration}
        />
      ) : null}

      <LocationRecommendationModal
        visible={locationRecommendationVisible}
        onLater={() => setLocationRecommendationVisible(false)}
        onEnable={async () => {
          setLocationRecommendationVisible(false);
          await handleRequestLocationAccess();
          await location.refreshTracking();
          visitHistory.reload();
        }}
        onDismissForever={async () => {
          setLocationRecommendationVisible(false);
          await dismissLocationRecommendationForever();
        }}
      />
    </View>
  );
}
