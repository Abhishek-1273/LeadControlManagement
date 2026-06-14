import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { useLeadStore } from '../../store/leadStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const QUICK_TEMPLATES = [
  'Customer is interested, will call back',
  'Not picking up, try later',
  'Asked for more details via WhatsApp',
  'Price too high, negotiating',
  'Wants to visit site first',
];

export default function AddNoteScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { leadId } = route.params || {};
  const { addNote } = useLeadStore();

  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!note.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Note Empty ❌',
        text2: 'Kuch toh likho!',
      });
      return;
    }
    setIsLoading(true);
    try {
      await addNote(leadId, note);
      Toast.show({
        type: 'success',
        text1: 'Note Saved ✅',
        text2: 'Note successfully save ho gaya',
        visibilityTime: 1500,
      });
      navigation.goBack();
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Save Failed ❌',
        text2: 'Note save nahi hua, try again',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Add Note</Text>
        <TouchableOpacity
          style={[styles.saveBtn, (!note.trim() || isLoading) && { opacity: 1 }]}
          onPress={handleSave}
          disabled={!note.trim() || isLoading}
        >
          <Text style={styles.saveBtnText}>
            {isLoading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          style={styles.noteInput}
          placeholder="Write a note..."
          placeholderTextColor={colors.textLight}
          value={note}
          onChangeText={setNote}
          multiline
          autoFocus
          textAlignVertical="top"
        />

        <Text style={styles.charCount}>{note.length} characters</Text>

        <Text style={styles.templateTitle}>Quick Templates</Text>
        <View style={styles.templateList}>
          {QUICK_TEMPLATES.map((template, index) => (
            <TouchableOpacity
              key={index}
              style={styles.templateChip}
              onPress={() => setNote(template)}
            >
              <Ionicons name="flash" size={14} color={colors.primary} />
              <Text style={styles.templateText} numberOfLines={1}>
                {template}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40, height: 40, justifyContent: 'center',
    alignItems: 'center', backgroundColor: colors.background, borderRadius: 10,
  },
  title: {
    fontSize: typography.lg, fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, borderRadius: 10,
  },
  saveBtnText: {
    color: colors.white, fontWeight: typography.bold,
    fontSize: typography.sm,
  },
  content: { padding: spacing.base, gap: spacing.md },
  noteInput: {
    fontSize: typography.base, color: colors.textPrimary,
    minHeight: 150, lineHeight: 24,
    backgroundColor: colors.background, borderRadius: 12,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  charCount: {
    fontSize: typography.xs, color: colors.textLight, textAlign: 'right',
  },
  templateTitle: {
    fontSize: typography.sm, fontWeight: typography.semiBold,
    color: colors.textPrimary, marginTop: spacing.sm,
  },
  templateList: { gap: spacing.sm },
  templateChip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.primaryLight, padding: spacing.md, borderRadius: 10,
  },
  templateText: { flex: 1, fontSize: typography.sm, color: colors.textPrimary },
});