import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

export interface InfoSection {
  heading?: string;
  body: string;
}

interface Props {
  title: string;
  intro?: string;
  sections: InfoSection[];
  updatedOn?: string;
}

export default function InfoScreenLayout({ title, intro, sections, updatedOn }: Props) {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {updatedOn && <Text style={styles.updated}>Last updated: {updatedOn}</Text>}
        {intro && <Text style={styles.intro}>{intro}</Text>}

        {sections.map((s, i) => (
          <View key={i} style={styles.section}>
            {s.heading && <Text style={styles.sectionHeading}>{s.heading}</Text>}
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    backgroundColor: colors.white, borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40, height: 40, justifyContent: 'center',
    alignItems: 'center', backgroundColor: colors.background,
    borderRadius: 10,
  },
  headerTitle: {
    fontSize: typography.lg, fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  content: { padding: spacing.base, gap: spacing.md, paddingBottom: spacing.xxl },
  updated: { fontSize: typography.xs, color: colors.textLight },
  intro: {
    fontSize: typography.base, color: colors.textSecondary,
    lineHeight: 22,
  },
  section: {
    backgroundColor: colors.white, borderRadius: 14,
    padding: spacing.base, gap: spacing.xs,
  },
  sectionHeading: {
    fontSize: typography.md, fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  sectionBody: {
    fontSize: typography.sm, color: colors.textSecondary, lineHeight: 21,
  },
});
