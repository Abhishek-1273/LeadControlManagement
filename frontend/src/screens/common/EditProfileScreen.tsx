import React, { useState } from 'react';
import { storage } from '../../utils/storage';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import axiosInstance from '../../api/axiosInstance';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

export default function EditProfileScreen() {
    const navigation = useNavigation();
    const {user} = useAuthStore();
    const [name, setName] = useState(user?.name || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        if (!name) {
            Toast.show({
                type: 'error',
                text1: 'Name Required ❌',
                text2: 'Please enter your name',
            });
            return;
        }
        setIsLoading(true);
        try {
            await axiosInstance.patch('/auth/profile', { name, phone });

            const updatedUser = { ...user!, name, phone };
            await storage.setUser(updatedUser);         
            useAuthStore.setState({ user: updatedUser });
            Toast.show({
                type: 'success',
                text1: 'Profile Updated ✅',
                text2: 'Your profile has been saved',
                visibilityTime: 2000,
            });
            navigation.goBack();
        } catch {
            Toast.show({
                type: 'error',
                text1: 'Update Failed ❌',
                text2: 'Could not update profile',
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
                <Text style={styles.title}>Edit Profile</Text>
                <TouchableOpacity
                    style={[styles.saveBtn, isLoading && { opacity: 0.6 }]}
                    onPress={handleSave}
                    disabled={isLoading}
                >
                    <Text style={styles.saveBtnText}>
                        {isLoading ? 'Saving...' : 'Save'}
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 300 }]}
                keyboardShouldPersistTaps="handled">

                {/* Avatar */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {name.charAt(0).toUpperCase() || 'U'}
                        </Text>
                    </View>
                    <Text style={styles.emailText}>{user?.email}</Text>
                    <View style={styles.roleBadge}>
                        <Text style={styles.roleText}>
                            {user?.role?.toUpperCase()}
                        </Text>
                    </View>
                </View>

                {/* Fields */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Personal Information</Text>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Full Name *</Text>
                        <View style={styles.fieldContainer}>
                            <Ionicons name="person-outline" size={18}
                                color={colors.primary} />
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                placeholder="Enter your name"
                                placeholderTextColor={colors.textLight}
                            />
                        </View>
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Phone</Text>
                        <View style={styles.fieldContainer}>
                            <Ionicons name="call-outline" size={18}
                                color={colors.primary} />
                            <TextInput
                                style={styles.input}
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="Enter phone number"
                                placeholderTextColor={colors.textLight}
                                keyboardType="phone-pad"
                            />
                        </View>
                    </View>

                    {/* Email — readonly */}
                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Email (Cannot be changed)</Text>
                        <View style={[styles.fieldContainer, styles.disabledField]}>
                            <Ionicons name="mail-outline" size={18}
                                color={colors.textSecondary} />
                            <Text style={styles.disabledText}>{user?.email}</Text>
                        </View>
                    </View>
                </View>

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
    avatarSection: {
        alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.sm,
    },
    avatar: {
        width: 90, height: 90, borderRadius: 45,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center', alignItems: 'center',
    },
    avatarText: {
        fontSize: typography.xxl, fontWeight: typography.bold,
        color: colors.primary,
    },
    emailText: { fontSize: typography.sm, color: colors.textSecondary },
    roleBadge: {
        backgroundColor: colors.primaryLight,
        paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
        borderRadius: 20,
    },
    roleText: {
        fontSize: typography.xs, fontWeight: typography.bold,
        color: colors.primary, letterSpacing: 1,
    },
    section: {
        backgroundColor: colors.white, borderRadius: 16,
        padding: spacing.base, gap: spacing.md,
    },
    sectionTitle: {
        fontSize: typography.md, fontWeight: typography.bold,
        color: colors.textPrimary, marginBottom: spacing.xs,
    },
    fieldGroup: { gap: spacing.xs },
    label: {
        fontSize: typography.sm, fontWeight: typography.semiBold,
        color: colors.textPrimary,
    },
    fieldContainer: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.background, borderRadius: 12,
        paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
        gap: spacing.sm, borderWidth: 1, borderColor: colors.border,
    },
    input: { flex: 1, fontSize: typography.base, color: colors.textPrimary },
    disabledField: { backgroundColor: colors.borderLight },
    disabledText: {
        flex: 1, fontSize: typography.base, color: colors.textSecondary,
    },
});