import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const SUPPORT_EMAIL = 'support@leadmanager.com';
const SUPPORT_PHONE = '+911234567890';

const FAQS = [
  {
    q: 'How do I change my password?',
    a: 'Go to the Menu or Settings, tap "Change Password", enter your current password and your new password, then save.',
  },
  {
    q: 'How are leads assigned to me?',
    a: 'Your administrator assigns leads to you. You will receive a notification whenever a new lead is assigned.',
  },
  {
    q: 'How do I add a follow-up?',
    a: 'Open a lead from your list, tap "Add Follow-Up", choose a date and add notes about your conversation.',
  },
  {
    q: 'Why am I not receiving notifications?',
    a: 'Make sure you are logged in and connected to the internet. Pull down to refresh on the Notifications screen to fetch the latest updates.',
  },
  {
    q: 'I forgot my password. What do I do?',
    a: 'Contact your administrator to reset your password, or reach out to our support team using the options below.',
  },
];

const ContactOption = ({ icon, label, value, onPress }: any) => (
  <TouchableOpacity style={styles.contactRow} onPress={onPress}>
    <View style={styles.contactIcon}>
      <Ionicons name={icon} size={20} color={colors.primary} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.contactLabel}>{label}</Text>
      <Text style={styles.contactValue}>{value}</Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
  </TouchableOpacity>
);

export default function HelpSupportScreen() {
  const navigation = useNavigation<any>();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Contact */}
        <Text style={styles.sectionTitle}>Get in touch</Text>
        <View style={styles.card}>
          <ContactOption
            icon="mail-outline"
            label="Email Support"
            value={SUPPORT_EMAIL}
            onPress={() =>
              Linking.openURL(
                `mailto:${SUPPORT_EMAIL}?subject=Lead Manager Support`
              )
            }
          />
          <View style={styles.divider} />
          <ContactOption
            icon="call-outline"
            label="Call Us"
            value={SUPPORT_PHONE}
            onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE}`)}
          />
          <View style={styles.divider} />
          <ContactOption
            icon="logo-whatsapp"
            label="WhatsApp"
            value="Chat with support"
            onPress={() =>
              Linking.openURL(`https://wa.me/${SUPPORT_PHONE.replace(/\D/g, '')}`)
            }
          />
        </View>

        {/* FAQ */}
        <Text style={styles.sectionTitle}>Frequently asked questions</Text>
        <View style={styles.card}>
          {FAQS.map((faq, i) => {
            const open = openIndex === i;
            return (
              <React.Fragment key={i}>
                <TouchableOpacity
                  style={styles.faqQuestion}
                  onPress={() => setOpenIndex(open ? null : i)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.faqQText}>{faq.q}</Text>
                  <Ionicons
                    name={open ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
                {open && <Text style={styles.faqAnswer}>{faq.a}</Text>}
                {i < FAQS.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            );
          })}
        </View>

        <Text style={styles.footerNote}>
          Our support team typically responds within 24 hours.
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
  content: { padding: spacing.base, gap: spacing.sm, paddingBottom: spacing.xxl },
  sectionTitle: {
    fontSize: typography.xs, fontWeight: typography.bold,
    color: colors.textSecondary, letterSpacing: 1,
    textTransform: 'uppercase', marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  card: {
    backgroundColor: colors.white, borderRadius: 14,
    overflow: 'hidden',
  },
  contactRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.base,
  },
  contactIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  contactLabel: {
    fontSize: typography.base, fontWeight: typography.semiBold,
    color: colors.textPrimary,
  },
  contactValue: { fontSize: typography.xs, color: colors.textSecondary },
  divider: {
    height: 1, backgroundColor: colors.borderLight,
    marginLeft: spacing.base,
  },
  faqQuestion: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', gap: spacing.md,
    padding: spacing.base,
  },
  faqQText: {
    flex: 1, fontSize: typography.sm, fontWeight: typography.semiBold,
    color: colors.textPrimary,
  },
  faqAnswer: {
    fontSize: typography.sm, color: colors.textSecondary, lineHeight: 21,
    paddingHorizontal: spacing.base, paddingBottom: spacing.base,
  },
  footerNote: {
    textAlign: 'center', fontSize: typography.xs,
    color: colors.textLight, marginTop: spacing.base,
  },
});
