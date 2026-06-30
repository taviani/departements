import React, { useCallback, useEffect, useState } from 'react';
import {
  Keyboard,
  SafeAreaView,
  StatusBar,
  View,
} from 'react-native';
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
import SearchOverlay from './components/SearchOverlay';
import { useDepartementExplorer } from './hooks/useDepartementExplorer';
import { useDepartementLocation } from './hooks/useDepartementLocation';
import { useHorizontalSwipe } from './hooks/useHorizontalSwipe';
import { ensureNotificationChannels } from './utils/notificationChannels';
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
  const explorer = useDepartementExplorer();
  const location = useDepartementLocation();

  const handleRequestLocationAccess = useCallback(async () => {
    const foreground = await location.requestForegroundPermission();
    if (foreground !== 'granted') {
      return foreground;
    }
    return location.requestBackgroundPermission();
  }, [location]);
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
    ensureNotificationChannels().catch(() => {});
  }, []);

  const handleSplashFinish = useCallback(() => {
    setSplashVisible(false);
  }, []);

  const handleSwipeDown = useCallback(() => {
    location.resolveCurrentDepartementCode().then((code) => {
      if (code) {
        location.celebrateMatch(code);
      }
    });
  }, [location]);

  useEffect(() => {
    if (!location.matchCelebration?.number) {
      return;
    }

    explorer.handleGoToDepartementCode(location.matchCelebration.number);
  }, [explorer, location.matchCelebration?.number]);

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
        onSearch={explorer.openSearchOverlay}
        onFullList={explorer.openSearchWithFullList}
        onRandom={explorer.handleRandomRefresh}
        onNotifications={() => setNotificationsVisible(true)}
        onHelp={() => setHelpVisible(true)}
        onLegal={() => setLegalVisible(true)}
      />

      <NotificationsScreen
        visible={notificationsVisible}
        onClose={() => setNotificationsVisible(false)}
        onRequestLocationAccess={handleRequestLocationAccess}
        onRefreshLocationTracking={location.refreshTracking}
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

      {!splashVisible && location.matchCelebration ? (
        <MatchSplash
          departement={location.matchCelebration}
          onFinish={location.clearMatchCelebration}
        />
      ) : null}
    </View>
  );
}
