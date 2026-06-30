import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import LocationHeart from './LocationHeart';
import { CURRENT_DEPARTEMENT_MATCH_LABEL } from '../utils/departementCopy';
import { styles } from '../styles/AppStyles';

export default function DepartementItem({ item, onPress, isCurrentLocation }) {
  return (
    <TouchableOpacity style={styles.item} onPress={() => onPress(item)}>
      <View style={styles.itemContent}>
        <Text style={styles.itemNumber}>{item.number}</Text>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={isCurrentLocation ? styles.itemMatch : styles.itemRegion}>
            {isCurrentLocation ? CURRENT_DEPARTEMENT_MATCH_LABEL : item.region}
          </Text>
        </View>
        <LocationHeart visible={isCurrentLocation} />
      </View>
    </TouchableOpacity>
  );
}
