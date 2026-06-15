import React from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const APP_VERSION = '1.0.0';

const SidebarItem = ({ icon, label, onPress, color }: any) => (
    <TouchableOpacity style={styles.sidebarItem} onPress={onPress}>
        <View style={[styles.sidebarIcon,
        { backgroundColor: (color || colors.primary) + '15' }]}>
            <Ionicons name={icon} size={20} color={color || colors.primary} />
        </View>
        <Text style={[styles.sidebarLabel,
        color && { color }]}>{label}</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
    </TouchableOpacity>
);

export default function SidebarScreen() {
    const navigation = useNavigation<any>();
    const { user, logout } = useAuthStore();

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="close" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Menu</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>

                {/* User Card */}
                <View style={styles.userCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {user?.name?.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{user?.name}</Text>
                        <Text style={styles.userEmail}>{user?.email}</Text>
                        <View style={styles.roleBadge}>
                            <Text style={styles.roleText}>
                                {user?.role?.toUpperCase()}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* App Info */}
                <Text style={styles.sectionTitle}>App Info</Text>
                <View style={styles.section}>
                    <SidebarItem
                        icon="information-circle-outline"
                        label="About"
                        onPress={() => navigation.navigate('About')}
                    />
                    <View style={styles.divider} />
                    <SidebarItem
                        icon="document-text-outline"
                        label="Terms & Conditions"
                        onPress={() => navigation.navigate('Terms')}
                    />
                    <View style={styles.divider} />
                    <SidebarItem
                        icon="shield-checkmark-outline"
                        label="Privacy Policy"
                        onPress={() => navigation.navigate('Privacy')}
                    />
                    <View style={styles.divider} />
                    <SidebarItem
                        icon="help-circle-outline"
                        label="Help & Support"
                        onPress={() => navigation.navigate('HelpSupport')}
                    />
                </View>

                {/* Logout */}
                <View style={styles.section}>
                    <SidebarItem
                        icon="log-out-outline"
                        label="Logout"
                        onPress={logout}
                        color={colors.error}
                    />
                </View>

                {/* Version */}
                <View style={styles.versionContainer}>
                    <View style={styles.logoSmall}>
                        <Text style={styles.logoText}>LM</Text>
                    </View>
                    <Text style={styles.appName}>Lead Manager</Text>
                    <Text style={styles.version}>Version {APP_VERSION}</Text>
                    <Text style={styles.copyright}>
                        © 2026 Lead Manager | All rights reserved.
                    </Text>
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
    headerTitle: {
        fontSize: typography.lg, fontWeight: typography.bold,
        color: colors.textPrimary,
    },
    userCard: {
        flexDirection: 'row', alignItems: 'center',
        gap: spacing.md, backgroundColor: colors.white,
        margin: spacing.base, padding: spacing.base,
        borderRadius: 16, elevation: 1,
    },
    avatar: {
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center', alignItems: 'center',
    },
    avatarText: {
        fontSize: typography.xl, fontWeight: typography.bold,
        color: colors.primary,
    },
    userInfo: { flex: 1 },
    userName: {
        fontSize: typography.base, fontWeight: typography.bold,
        color: colors.textPrimary,
    },
    userEmail: { fontSize: typography.xs, color: colors.textSecondary },
    roleBadge: {
        backgroundColor: colors.primaryLight,
        paddingHorizontal: spacing.sm, paddingVertical: 2,
        borderRadius: 10, alignSelf: 'flex-start', marginTop: 4,
    },
    roleText: {
        fontSize: 10, fontWeight: typography.bold,
        color: colors.primary, letterSpacing: 1,
    },
    sectionTitle: {
        fontSize: typography.xs, fontWeight: typography.bold,
        color: colors.textSecondary, letterSpacing: 1,
        paddingHorizontal: spacing.base, marginBottom: spacing.xs,
        marginTop: spacing.sm, textTransform: 'uppercase',
    },
    section: {
        backgroundColor: colors.white, marginHorizontal: spacing.base,
        borderRadius: 16, overflow: 'hidden', marginBottom: spacing.sm,
        elevation: 1,
    },
    sidebarItem: {
        flexDirection: 'row', alignItems: 'center',
        padding: spacing.base, gap: spacing.md,
    },
    sidebarIcon: {
        width: 38, height: 38, borderRadius: 10,
        justifyContent: 'center', alignItems: 'center',
    },
    sidebarLabel: {
        flex: 1, fontSize: typography.base,
        fontWeight: typography.medium, color: colors.textPrimary,
    },
    divider: {
        height: 1, backgroundColor: colors.borderLight,
        marginLeft: spacing.base + 38 + spacing.md,
    },
    versionContainer: {
        alignItems: 'center', padding: spacing.xl, gap: spacing.xs,
    },
    logoSmall: {
        width: 50, height: 50, borderRadius: 25,
        backgroundColor: colors.primary,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: spacing.sm,
    },
    logoText: {
        fontSize: typography.lg, fontWeight: typography.bold,
        color: colors.white,
    },
    appName: {
        fontSize: typography.md, fontWeight: typography.bold,
        color: colors.textPrimary,
    },
    version: { fontSize: typography.sm, color: colors.textSecondary },
    copyright: {
        fontSize: typography.xs, color: colors.textLight,
        textAlign: 'center', marginTop: spacing.xs,
    },
});
