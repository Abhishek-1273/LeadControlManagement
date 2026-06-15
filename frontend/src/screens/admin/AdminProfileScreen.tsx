import React from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, Alert, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const MenuItem = ({
    icon, label, onPress, color
}: {
    icon: string;
    label: string;
    onPress: () => void;
    color?: string;
}) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
        <View style={[styles.menuIcon, { backgroundColor: (color || colors.primary) + '15' }]}>
            <Ionicons name={icon as any} size={20} color={color || colors.primary} />
        </View>
        <Text style={[styles.menuLabel, color ? { color } : {}]}>{label}</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
    </TouchableOpacity>
);

export default function AdminProfileScreen() {
    const { user, logout } = useAuthStore();
    const navigation = useNavigation<any>();

    const handleLogout = () => {
        if (Platform.OS === 'web') {
            logout();
            return;
        }
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: logout },
        ]);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']} >
            <ScrollView showsVerticalScrollIndicator={true}>
                {/* Profile */}
                <View style={styles.profileSection}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {user?.name?.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <Text style={styles.name}>{user?.name}</Text>
                    <Text style={styles.email}>{user?.email}</Text>
                    <View style={styles.adminBadge}>
                        <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
                        <Text style={styles.adminText}>ADMIN</Text>
                    </View>
                </View>

                {/* Account Menu */}
                <Text style={styles.sectionTitle}>Account</Text>
                <View style={styles.menuCard}>
                    <MenuItem
                        icon="person-outline"
                        label="Edit Profile"
                        onPress={() => navigation.navigate('EditProfile')}
                    />
                    <View style={styles.divider} />
                    <MenuItem
                        icon="lock-closed-outline"
                        label="Change Password"
                        onPress={() => navigation.navigate('ChangePassword')}
                    />
                    <View style={styles.divider} />
                    <MenuItem
                        icon="notifications-outline"
                        label="Notifications"
                        onPress={() => navigation.navigate('Notifications')}
                    />
                    <View style={styles.divider} />
                    <MenuItem
                        icon="paper-plane-outline"
                        label="Send Notification"
                        onPress={() => navigation.navigate('SendNotification')}
                    />
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('Sidebar')}
                    >
                        <View style={[styles.menuIcon, { backgroundColor: colors.primaryLight }]}>
                            <Ionicons name="menu-outline" size={20} color={colors.primary} />
                        </View>
                        <Text style={styles.menuLabel}>More Options</Text>
                        <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background},
    sectionTitle: {
        fontSize: typography.xs, fontWeight: typography.bold,
        color: colors.textSecondary, letterSpacing: 1,
        textTransform: 'uppercase',
        paddingHorizontal: spacing.base,
        marginTop: spacing.md, marginBottom: spacing.xs,
    },
    profileSection: {
        alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm,
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
    name: {
        fontSize: typography.xl, fontWeight: typography.bold,
        color: colors.textPrimary,
    },
    email: { fontSize: typography.sm, color: colors.textSecondary },
    adminBadge: {
        flexDirection: 'row', alignItems: 'center',
        gap: spacing.xs, backgroundColor: colors.primaryLight,
        paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
        borderRadius: 20,
    },
    adminText: {
        fontSize: typography.xs, fontWeight: typography.bold,
        color: colors.primary, letterSpacing: 1,
    },
    menuCard: {
        backgroundColor: colors.white, marginHorizontal: spacing.base,
        borderRadius: 16, overflow: 'hidden', elevation: 1,
    },
    menuItem: {
        flexDirection: 'row', alignItems: 'center',
        padding: spacing.base, gap: spacing.md,
    },
    menuIcon: {
        width: 40, height: 40, borderRadius: 12,
        justifyContent: 'center', alignItems: 'center',
    },
    menuLabel: {
        flex: 1, fontSize: typography.base,
        fontWeight: typography.medium, color: colors.textPrimary,
    },
    divider: {
        height: 1, backgroundColor: colors.borderLight,
        marginLeft: spacing.base + 40 + spacing.md,
    },
    logoutBtn: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: spacing.sm,
        backgroundColor: '#FFF0F0', marginHorizontal: spacing.base,
        marginTop: spacing.md, padding: spacing.base, borderRadius: 14,
    },
    logoutText: {
        fontSize: typography.md, fontWeight: typography.semiBold,
        color: colors.error,
    },
    version: {
        textAlign: 'center', fontSize: typography.xs,
        color: colors.textLight, marginTop: spacing.xl,
        marginBottom: spacing.base,
    },
});
