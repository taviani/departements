import React, { useState, useMemo } from 'react';
import {
  Text,
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { departements } from './data/departements';
import { styles } from './styles/AppStyles';

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

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartement, setSelectedDepartement] = useState(null);

  const filteredDepartements = useMemo(() => {
    if (!searchQuery.trim()) {
      return departements;
    }

    const query = searchQuery.toLowerCase().trim();
    return departements.filter(
      (dept) =>
        dept.number.toLowerCase().includes(query) ||
        dept.name.toLowerCase().includes(query) ||
        dept.region.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleDepartementPress = (departement) => {
    setSelectedDepartement(departement);
  };

  const handleBackPress = () => {
    setSelectedDepartement(null);
  };

  if (selectedDepartement) {
    return (
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
            <Text style={styles.detailRegion}>Région: {selectedDepartement.region}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Départements de France</Text>
        <Text style={styles.subtitle}>
          {filteredDepartements.length} département{filteredDepartements.length > 1 ? 's' : ''}
        </Text>
      </View>
      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher par numéro ou nom..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <FlatList
        data={filteredDepartements}
        renderItem={({ item }) => (
          <DepartementItem item={item} onPress={handleDepartementPress} />
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
          length: 70, // Approximate height of each item
          offset: 70 * index,
          index,
        })}
      />
    </SafeAreaView>
  );
}

