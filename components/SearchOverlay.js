import React, { useEffect, useRef } from 'react';
import {
  FlatList,
  Keyboard,
  Modal,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DepartementItem from './DepartementItem';
import { ACCENT_COLOR } from '../constants/mapTheme';
import { formatDepartementCount } from '../utils/departementCopy';
import { styles } from '../styles/AppStyles';

export default function SearchOverlay({
  visible,
  searchQuery,
  isSearchEmpty,
  showFullList,
  filteredDepartements,
  onSearchChange,
  onClose,
  onListToggle,
  onDepartementPress,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (!visible) {
      return;
    }
    const focusTimer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
    return () => clearTimeout(focusTimer);
  }, [visible]);

  const showList = !isSearchEmpty || showFullList;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.searchOverlayRoot}>
        <Pressable
          style={styles.searchOverlayBackdrop}
          onPress={onClose}
          accessibilityLabel="Fermer la recherche"
        />
        <SafeAreaView style={styles.searchOverlayPanel}>
          <View style={styles.searchOverlayHeader}>
            <Text style={styles.searchOverlayTitle}>Rechercher</Text>
            <TouchableOpacity
              style={styles.searchOverlayCloseButton}
              onPress={onClose}
              accessibilityLabel="Fermer la recherche"
            >
              <Ionicons name="close" size={28} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchOverlaySearchRow}>
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder="Rechercher par numéro ou nom..."
              value={searchQuery}
              onChangeText={onSearchChange}
              clearButtonMode="while-editing"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              blurOnSubmit
              onSubmitEditing={Keyboard.dismiss}
            />
            {isSearchEmpty && (
              <TouchableOpacity
                style={[
                  styles.iconButton,
                  showFullList && styles.iconButtonActive,
                ]}
                onPress={onListToggle}
                accessibilityLabel={
                  showFullList ? 'Masquer la liste' : 'Afficher la liste'
                }
              >
                <Ionicons
                  name="list"
                  size={22}
                  color={showFullList ? '#fff' : ACCENT_COLOR}
                />
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.searchOverlayCount}>
            {formatDepartementCount(filteredDepartements.length)}
          </Text>

          {showList && (
            <FlatList
              data={filteredDepartements}
              renderItem={({ item }) => (
                <DepartementItem item={item} onPress={onDepartementPress} />
              )}
              keyExtractor={(item) => item.number}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
              initialNumToRender={12}
              maxToRenderPerBatch={12}
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
      </View>
    </Modal>
  );
}
