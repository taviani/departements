import React, { useCallback, useEffect, useState } from 'react';
import {
  Keyboard,
  SafeAreaView,
  StatusBar,
  View,
} from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import AnimatedSplash from './components/AnimatedSplash';
import AppHeader from './components/AppHeader';
import AppMenu from './components/AppMenu';
import DepartementDetailStrip from './components/DepartementDetailStrip';
import FranceMap from './components/FranceMap';
import LegalInfoScreen from './components/LegalInfoScreen';
import NotificationsScreen from './components/NotificationsScreen';
import SearchOverlay from './components/SearchOverlay';
import { useDepartementExplorer } from './hooks/useDepartementExplorer';
import { useHorizontalSwipe } from './hooks/useHorizontalSwipe';
import { styles } from './styles/AppStyles';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [splashVisible, setSplashVisible] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [legalVisible, setLegalVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const explorer = useDepartementExplorer();

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  const handleSplashFinish = useCallback(() => {
    setSplashVisible(false);
  }, []);

  const swipeHandlers = useHorizontalSwipe({
    onSwipeLeft: explorer.handleRandomRefresh,
    onSwipeRight: explorer.openSearchOverlay,
  });

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.headerShell}>
        <StatusBar barStyle="dark-content" />
        <AppHeader
          isDetailView={explorer.isDetailView}
          onMenuPress={() => setMenuVisible(true)}
        />
      </SafeAreaView>

      <View style={styles.container}>
        <View
          style={styles.mainContent}
          testID="main-content"
          {...swipeHandlers}
        >
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
                onPress={explorer.handleDetailStripPress}
                onClose={explorer.handleDetailClose}
              />
            )}
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
        onLegal={() => setLegalVisible(true)}
      />

      <NotificationsScreen
        visible={notificationsVisible}
        onClose={() => setNotificationsVisible(false)}
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
      />

      {splashVisible && <AnimatedSplash onFinish={handleSplashFinish} />}
    </View>
  );
}
