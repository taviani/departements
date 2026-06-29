import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getPrefectureName } from '../data/prefectures';
import { getDetailStripSubtitle } from '../utils/departementCopy';
import { styles } from '../styles/AppStyles';

export default function DepartementDetailStrip({
  item,
  isDetailView,
  onPress,
  onClose,
}) {
  const prefecture = getPrefectureName(item.number);
  const subtitle = getDetailStripSubtitle(item, prefecture);

  return (
    <View style={styles.detailStrip}>
      <TouchableOpacity
        style={styles.detailStripMain}
        onPress={onPress}
        activeOpacity={0.85}
        accessibilityLabel={
          isDetailView ? `Dézoomer ${item.name}` : `Zoomer sur ${item.name}`
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
            {subtitle}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.detailStripCloseButton}
        onPress={onClose}
        accessibilityLabel="Fermer les détails"
      >
        <Ionicons name="close" size={32} color="#666" />
      </TouchableOpacity>
    </View>
  );
}
