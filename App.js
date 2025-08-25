import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { departements } from './data/departements';

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
        <Text style={styles.title}>Départements Français</Text>
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
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  list: {
    flex: 1,
  },
  item: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 5,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  itemNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    minWidth: 50,
    textAlign: 'center',
    marginRight: 15,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemRegion: {
    fontSize: 14,
    color: '#666',
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '500',
  },
  detailContainer: {
    flex: 1,
    padding: 20,
  },
  detailCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 15,
  },
  detailName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  detailRegion: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
