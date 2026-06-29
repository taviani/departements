import { StyleSheet } from 'react-native';
import { PREFECTURE_LABEL } from '../constants/mapTheme';

const LABEL_CONTAINER_WIDTH = 168;

export const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  svg: {
    flex: 1,
    backgroundColor: '#fff',
  },
  labelContainer: {
    position: 'absolute',
    width: LABEL_CONTAINER_WIDTH,
    alignItems: 'center',
  },
  labelDotMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 2.5,
    borderColor: PREFECTURE_LABEL.border,
    marginBottom: 4,
  },
  labelText: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    color: PREFECTURE_LABEL.text,
    textAlign: 'center',
    backgroundColor: PREFECTURE_LABEL.background,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    overflow: 'hidden',
  },
});
