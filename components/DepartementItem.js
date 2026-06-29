import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles/AppStyles';

export default function DepartementItem({ item, onPress }) {
  return (
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
}
