import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  Text,
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  Keyboard,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';
import AnimatedSplash from './components/AnimatedSplash';
import FranceMap from './components/FranceMap';
import { departements } from './data/departements';
import { filterDepartements } from './utils/departementSearch';
import { pickRandomDepartement } from './utils/randomDepartement';
import { styles } from './styles/AppStyles';

const departementsByNumber = Object.fromEntries(
  departements.map((dept) => [dept.number, dept])
);

SplashScreen.preventAutoHideAsync().catch(() => {});

const AppLogo = () => (
  <Image
    source={require('./assets/logo.png')}
    style={styles.logo}
    accessibilityLabel="Logo France"
  />
);

const DepartementItem = ({ item, onPress }) => (
  <TouchableOpacity style={styles.item} onPress={() => onPress(item)}>
    <View style={styles.itemContent}>
      <Text style={styles.itemNumber}>{item.number}</Text>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemRegion}>{item.region}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

const pickRandom = (current) => pickRandomDepartement(departements, current);

const DepartementDetailStrip = ({ item, isZoomed, onPress, onClose }) => (
  <View style={styles.detailStrip}>
    <TouchableOpacity
      style={styles.detailStripMain}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityLabel={
        isZoomed ? `Dézoomer ${item.name}` : `Zoomer sur ${item.name}`
      }
    >
      <Text
        style={styles.detailStripNumber}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {item.number}
      </Text>
      <View style={styles.detailStripInfo}>
        <Text
          style={styles.detailStripName}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
        >
          {item.name}
        </Text>
        <Text
          style={styles.detailStripRegion}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
        >
          {item.region}
        </Text>
      </View>
    </TouchableOpacity>
    <TouchableOpacity
      style={styles.detailStripCloseButton}
      onPress={onClose}
      accessibilityLabel="Fermer les détails"
    >
      <Ionicons name="close" size={28} color="#666" />
    </TouchableOpacity>
  </View>
);

export default function App() {
  const [splashVisible, setSplashVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartement, setSelectedDepartement] = useState(
    () => pickRandom(null)
  );
  const [showFullList, setShowFullList] = useState(false);
  const [isMapZoomed, setIsMapZoomed] = useState(false);
  const mapRef = useRef(null);
  const isMapZoomedRef = useRef(false);

  const isSearchEmpty = !searchQuery.trim();
  const showList = !isSearchEmpty || showFullList;

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  const handleSplashFinish = useCallback(() => {
    setSplashVisible(false);
  }, []);

  const filteredDepartements = useMemo(
    () => filterDepartements(departements, searchQuery),
    [searchQuery]
  );

  const listData = filteredDepartements;

  const handleDepartementPress = (departement) => {
    Keyboard.dismiss();
    setSelectedDepartement(departement);
  };

  const handleDetailStripPress = () => {
    if (!selectedDepartement) {
      return;
    }
    if (isMapZoomed) {
      mapRef.current?.resetZoom();
    } else {
      mapRef.current?.zoomToDepartment(selectedDepartement.number);
    }
  };

  const handleDetailClose = () => {
    Keyboard.dismiss();
    mapRef.current?.resetZoom();
    isMapZoomedRef.current = false;
    setIsMapZoomed(false);
    setSelectedDepartement(null);
  };

  const handleMapZoomChange = useCallback((zoomed) => {
    if (isMapZoomedRef.current === zoomed) {
      return;
    }
    isMapZoomedRef.current = zoomed;
    setIsMapZoomed(zoomed);
  }, []);

  const handleSearchChange = (text) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setShowFullList(false);
    }
  };

  const handleListToggle = () => {
    Keyboard.dismiss();
    setShowFullList((prev) => !prev);
  };

  const handleMapDepartmentPress = useCallback((code) => {
    Keyboard.dismiss();
    const departement = departementsByNumber[code];
    if (!departement) {
      return;
    }

    setSelectedDepartement(departement);

    if (isMapZoomedRef.current) {
      mapRef.current?.zoomToDepartment(departement.number);
    }
  }, []);

  const mapHighlightedCodes = useMemo(() => {
    if (!isSearchEmpty) {
      return filteredDepartements.map((dept) => dept.number);
    }
    return [];
  }, [filteredDepartements, isSearchEmpty]);

  const handleRandomRefresh = useCallback(() => {
    Keyboard.dismiss();
    setSelectedDepartement((current) => pickRandom(current));
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <AppLogo />
            <View style={styles.headerText}>
              <Text style={styles.title}>Départements de France</Text>
              <Text style={styles.subtitle}>
                {showList
                  ? `${listData.length} département${listData.length > 1 ? 's' : ''}`
                  : 'Touchez le détail pour zoomer / dézoomer'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher par numéro ou nom..."
              value={searchQuery}
              onChangeText={handleSearchChange}
              clearButtonMode="while-editing"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              blurOnSubmit
              onSubmitEditing={Keyboard.dismiss}
            />
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleRandomRefresh}
              accessibilityLabel="Afficher un département au hasard"
            >
              <Ionicons name="shuffle" size={22} color="#2196F3" />
            </TouchableOpacity>
            {isSearchEmpty && (
              <TouchableOpacity
                style={[styles.iconButton, showFullList && styles.iconButtonActive]}
                onPress={handleListToggle}
                accessibilityLabel={showFullList ? 'Masquer la liste' : 'Afficher la liste'}
              >
                <Ionicons
                  name="list"
                  size={22}
                  color={showFullList ? '#fff' : '#2196F3'}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.mainContent}>
          <View style={[styles.mapContainer, showList && styles.mapContainerCompact]}>
            <FranceMap
              ref={mapRef}
              selectedCode={selectedDepartement?.number}
              highlightedCodes={mapHighlightedCodes}
              onDepartmentPress={handleMapDepartmentPress}
              onZoomChange={handleMapZoomChange}
            />
          </View>

          {selectedDepartement && (
            <DepartementDetailStrip
              item={selectedDepartement}
              isZoomed={isMapZoomed}
              onPress={handleDetailStripPress}
              onClose={handleDetailClose}
            />
          )}

          {showList && (
            <FlatList
              data={listData}
              renderItem={({ item }) => (
                <DepartementItem item={item} onPress={handleDepartementPress} />
              )}
              keyExtractor={(item) => item.number}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={true}
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={10}
              removeClippedSubviews={true}
              getItemLayout={(data, index) => ({
                length: 70,
                offset: 70 * index,
                index,
              })}
            />
          )}
        </View>
      </SafeAreaView>
      {splashVisible && <AnimatedSplash onFinish={handleSplashFinish} />}
    </GestureHandlerRootView>
  );
}
