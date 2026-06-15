import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const APP_VERSION = '1.0.0';

const FEATURES = [
  { icon: 'people-outline', text: 'Capture and organize leads in one place' },
  { icon: 'git-branch-outline', text: 'Assign leads to the right team members' },
  { icon: 'time-outline', text: 'Track follow-ups and lead timelines' },
  { icon: 'notifications-outline', text: 'Stay updated with instant notifications' },
];

export default function AboutScreen() {
  const navigation = useNavigation<any>();
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.logoWrap}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>LM</Text>
          </View>
          <Text style={styles.appName}>Lead Manager</Text>
          <Text style={styles.version}>Version {APP_VERSION}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>About the App</Text>
          <Text style={styles.cardBody}>
            Lead Manager is a simple, powerful tool that helps teams capture,
            assign, and follow up on leads efficiently. Built for sales and
            support teams who want to stay organized and never miss an opportunity.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>What You Can Do</Text>
          <View style={styles.featureList}>
            {FEATURES.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <Ionicons name={f.icon as any} size={18} color={colors.primary} />
                </View>
                <Text style={styles.featureText}>{f.text}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.copyright}>
          © 2026 Lead Manager | All rights reserved.
        </Text>
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
  logoWrap: { alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.xs },
  logo: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm,
  },
  logoText: {
    fontSize: typography.xl, fontWeight: typography.bold, color: colors.white,
  },
  appName: {
    fontSize: typography.lg, fontWeight: typography.bold, color: colors.textPrimary,
  },
  version: { fontSize: typography.sm, color: colors.textSecondary },
  card: {
    backgroundColor: colors.white, borderRadius: 14,
    padding: spacing.base, gap: spacing.sm,
  },
  cardTitle: {
    fontSize: typography.md, fontWeight: typography.bold, color: colors.textPrimary,
  },
  cardBody: { fontSize: typography.sm, color: colors.textSecondary, lineHeight: 21 },
  featureList: { gap: spacing.md },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  featureIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  featureText: { flex: 1, fontSize: typography.sm, color: colors.textPrimary },
  copyright: {
    textAlign: 'center', fontSize: typography.xs,
    color: colors.textLight, marginTop: spacing.base,
  },
});
