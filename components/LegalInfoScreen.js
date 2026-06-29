import React from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { legalMeta, legalSections } from '../constants/legalInfo';
import { styles } from '../styles/AppStyles';

export default function LegalInfoScreen({ visible, onClose }) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.legalScreen}>
        <View style={styles.legalHeader}>
          <Text style={styles.legalTitle}>Informations légales</Text>
          <TouchableOpacity
            style={styles.legalCloseButton}
            onPress={onClose}
            accessibilityLabel="Fermer les informations légales"
          >
            <Ionicons name="close" size={28} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.legalScroll}
          contentContainerStyle={styles.legalScrollContent}
        >
          <Text style={styles.legalIntro}>
            Documents requis pour la distribution sur l&apos;App Store et Google
            Play. Dernière mise à jour : {legalMeta.lastUpdated}.
          </Text>

          {legalSections.map((section) => (
            <View key={section.title} style={styles.legalSection}>
              <Text style={styles.legalSectionTitle}>{section.title}</Text>
              {section.paragraphs.map((paragraph) => (
                <Text key={paragraph} style={styles.legalParagraph}>
                  {paragraph}
                </Text>
              ))}
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
