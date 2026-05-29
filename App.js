import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Text,
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';
import AnimatedSplash from './components/AnimatedSplash';
import { departements } from './data/departements';
import { styles } from './styles/AppStyles';

SplashScreen.preventAutoHideAsync().catch(() => {});

const AppLogo = () => (
  <Image
    source={require('./assets/logo.png')}
    style={styles.logo}
    accessibilityLabel="Logo France"
  />
);

const DepartementItem = ({ item, onPress, onRegionPress }) => (
  <TouchableOpacity style={styles.item} onPress={() => onPress(item)}>
    <View style={styles.itemContent}>
      <Text style={styles.itemNumber}>{item.number}</Text>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <TouchableOpacity onPress={() => onRegionPress(item.region)}>
          <Text style={[styles.itemRegion, styles.regionLink]}>{item.region}</Text>
        </TouchableOpacity>
      </View>
    </View>
  </TouchableOpacity>
);

const pickRandomDepartement = (current) => {
  if (departements.length <= 1) {
    return departements[0];
  }

  let next = current;
  while (next === current) {
    next = departements[Math.floor(Math.random() * departements.length)];
  }
  return next;
};

const FeaturedDepartementCard = ({ item, onPress, onRefresh, onRegionPress }) => (
  <View style={styles.featuredContainer}>
    <TouchableOpacity
      style={styles.randomButton}
      onPress={onRefresh}
      accessibilityLabel="Afficher un autre département au hasard"
    >
      <Ionicons name="shuffle" size={18} color="#2196F3" />
      <Text style={styles.randomButtonText}>Au hasard</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.featuredCard}
      onPress={() => onPress(item)}
      activeOpacity={0.9}
    >
      <Text style={styles.featuredNumber}>{item.number}</Text>
      <Text style={styles.featuredName}>{item.name}</Text>
      <TouchableOpacity onPress={() => onRegionPress(item.region)}>
        <Text style={[styles.featuredRegion, styles.regionLink]}>{item.region}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  </View>
);

export default function App() {
  const [splashVisible, setSplashVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartement, setSelectedDepartement] = useState(null);
  const [randomDepartement, setRandomDepartement] = useState(
    () => pickRandomDepartement(null)
  );
  const [showFullList, setShowFullList] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(null);

  const isSearchEmpty = !searchQuery.trim();
  const showFeatured = isSearchEmpty && !showFullList && !selectedRegion;
  const showList = !isSearchEmpty || showFullList || selectedRegion;

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  const handleSplashFinish = useCallback(() => {
    setSplashVisible(false);
  }, []);

  const filteredDepartements = useMemo(() => {
    let data = departements;

    if (selectedRegion) {
      data = data.filter((dept) => dept.region === selectedRegion);
    }

    if (!searchQuery.trim()) {
      return data;
    }

    const query = searchQuery.toLowerCase().trim();
    return data.filter(
      (dept) =>
        dept.number.toLowerCase().includes(query) ||
        dept.name.toLowerCase().includes(query) ||
        dept.region.toLowerCase().includes(query)
    );
  }, [searchQuery, selectedRegion]);

  const listData = filteredDepartements;

  const handleDepartementPress = (departement) => {
    setSelectedDepartement(departement);
  };

  const handleBackPress = () => {
    setSelectedDepartement(null);
  };

  const handleSearchChange = (text) => {
    setSearchQuery(text);
    if (!text.trim() && !selectedRegion) {
      setShowFullList(false);
    }
  };

  const handleRegionPress = (region) => {
    setSelectedDepartement(null);
    setSelectedRegion(region);
    setShowFullList(true);
    setSearchQuery('');
  };

  const handleRegionBack = () => {
    setSelectedRegion(null);
    if (!searchQuery.trim()) {
      setShowFullList(false);
    }
  };

  const handleListToggle = () => {
    setShowFullList((prev) => !prev);
  };

  const handleRandomRefresh = useCallback(() => {
    setRandomDepartement((current) => pickRandomDepartement(current));
  }, []);

  const mainContent = selectedDepartement ? (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Détails du Département</Text>
      </View>
      <View style={styles.detailContainer}>
        <View style={styles.detailCard}>
          <Text style={styles.detailNumber}>{selectedDepartement.number}</Text>
          <Text style={styles.detailName}>{selectedDepartement.name}</Text>
          <TouchableOpacity onPress={() => handleRegionPress(selectedDepartement.region)}>
            <Text style={[styles.detailRegion, styles.regionLink]}>
              Région: {selectedDepartement.region}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  ) : (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <AppLogo />
          <View style={styles.headerText}>
            <Text style={styles.title}>
              {selectedRegion || 'Départements de France'}
            </Text>
            <Text style={styles.subtitle}>
              {selectedRegion
                ? `${listData.length} département${listData.length > 1 ? 's' : ''}`
                : showFeatured
                  ? 'Découvrez au hasard'
                  : `${listData.length} département${listData.length > 1 ? 's' : ''}`}
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
          />
          {isSearchEmpty && !selectedRegion && (
            <TouchableOpacity
              style={[styles.listToggle, showFullList && styles.listToggleActive]}
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

      {selectedRegion && (
        <View style={styles.regionBar}>
          <TouchableOpacity style={styles.regionBackButton} onPress={handleRegionBack}>
            <Text style={styles.backButtonText}>← Retour</Text>
          </TouchableOpacity>
        </View>
      )}

      {showFeatured && (
        <FeaturedDepartementCard
          item={randomDepartement}
          onPress={handleDepartementPress}
          onRefresh={handleRandomRefresh}
          onRegionPress={handleRegionPress}
        />
      )}

      {showList && (
        <FlatList
          data={listData}
          renderItem={({ item }) => (
            <DepartementItem
              item={item}
              onPress={handleDepartementPress}
              onRegionPress={handleRegionPress}
            />
          )}
          keyExtractor={(item) => item.number}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={true}
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
    </SafeAreaView>
  );

  return (
    <>
      {mainContent}
      {splashVisible && <AnimatedSplash onFinish={handleSplashFinish} />}
    </>
  );
}

