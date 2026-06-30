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
import { helpMeta, helpSections } from '../constants/helpInfo';
import { ACCENT_COLOR } from '../constants/mapTheme';
import { styles } from '../styles/AppStyles';

function HelpSteps({ steps }) {
  if (!steps?.length) {
    return null;
  }

  return (
    <View style={styles.helpSteps}>
      {steps.map((step, index) => (
        <View key={step} style={styles.helpStepRow}>
          <View style={styles.helpStepBadge}>
            <Text style={styles.helpStepBadgeText}>{index + 1}</Text>
          </View>
          <Text style={styles.helpStepText}>{step}</Text>
        </View>
      ))}
    </View>
  );
}

export default function HelpScreen({ visible, onClose }) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.legalScreen}>
        <View style={styles.legalHeader}>
          <Text style={styles.legalTitle}>{helpMeta.title}</Text>
          <TouchableOpacity
            style={styles.legalCloseButton}
            onPress={onClose}
            accessibilityLabel="Fermer l'aide"
          >
            <Ionicons name="close" size={28} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.legalScroll}
          contentContainerStyle={styles.legalScrollContent}
        >
          <Text style={styles.legalIntro}>{helpMeta.intro}</Text>

          {helpSections.map((section) => (
            <View key={section.title} style={styles.legalSection}>
              <Text style={styles.legalSectionTitle}>{section.title}</Text>
              <HelpSteps steps={section.steps} />
              {section.paragraphs?.map((paragraph) => (
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

export function HelpLinkButton({ onPress, label = "Consulter l'aide" }) {
  return (
    <TouchableOpacity
      style={styles.helpLinkButton}
      onPress={onPress}
      accessibilityLabel={label}
    >
      <Ionicons name="help-circle-outline" size={20} color={ACCENT_COLOR} />
      <Text style={styles.helpLinkButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}
