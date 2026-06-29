import React, { memo } from 'react';
import { Text, View } from 'react-native';
import { styles } from '../../styles/FranceMapStyles';

const LABEL_CONTAINER_WIDTH = 168;

const PrefectureLabelOverlay = memo(({ name, position }) => {
  if (!name || !position) {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      style={[
        styles.labelContainer,
        {
          left: position.x - LABEL_CONTAINER_WIDTH / 2,
          top: position.y + 6,
        },
      ]}
    >
      <View style={styles.labelDotMarker} />
      <Text style={styles.labelText} numberOfLines={2}>
        {name}
      </Text>
    </View>
  );
});

PrefectureLabelOverlay.displayName = 'PrefectureLabelOverlay';

export default PrefectureLabelOverlay;
