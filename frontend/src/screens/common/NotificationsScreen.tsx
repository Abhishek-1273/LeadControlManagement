import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useNotificationStore, NotificationItem } from '../../store/notificationStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const TYPE_META: Record<
  NotificationItem['type'],
  { icon: any; color: string }
> = {
  info: { icon: 'information-circle', color: colors.statusNew },
  success: { icon: 'checkmark-circle', color: colors.success },
  warning: { icon: 'warning', color: colors.warning },
  alert: { icon: 'alert-circle', color: colors.error },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const {
    notifications, unreadCount, isLoading,
    fetchNotifications, markAsRead, markAllRead, deleteNotification,
  } = useNotificationStore();

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const handleDelete = (id: string) => {
    if (Platform.OS === 'web') {
      deleteNotification(id);
      return;
    }
    Alert.alert('Delete', 'Delete this notification?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteNotification(id) },
    ]);
  };

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const meta = TYPE_META[item.type] || TYPE_META.info;
    return (
      <TouchableOpacity
        style={[styles.card, !item.isRead && styles.cardUnread]}
        activeOpacity={0.7}
        onPress={() => !item.isRead && markAsRead(item._id)}
        onLongPress={() => handleDelete(item._id)}
      >
        <View style={[styles.iconWrap, { backgroundColor: meta.color + '15' }]}>
          <Ionicons name={meta.icon} size={22} color={meta.color} />
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardTopRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.title}
            </Text>
            {!item.isRead && <View style={styles.dot} />}
          </View>
          <Text style={styles.cardMessage}>{item.message}</Text>
          <Text style={styles.cardTime}>{timeAgo(item.createdAt)}</Text>
        </View>
        <TouchableOpacity
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPress={() => handleDelete(item._id)}
        >
          <Ionicons name="trash-outline" size={18} color={colors.textLight} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.readAll}>Read all</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 56 }} />
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={
          notifications.length === 0 ? styles.emptyWrap : styles.listContent
        }
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchNotifications}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="notifications-off-outline" size={40} color={colors.textLight} />
              </View>
              <Text style={styles.emptyTitle}>No notifications</Text>
              <Text style={styles.emptySub}>
                You&apos;re all caught up. New updates will show up here.
              </Text>
            </View>
          ) : null
        }
      />
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
  readAll: {
    fontSize: typography.sm, fontWeight: typography.semiBold,
    color: colors.primary, width: 56, textAlign: 'right',
  },
  listContent: { padding: spacing.base, gap: spacing.sm },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.white, borderRadius: 14,
    padding: spacing.base, elevation: 1,
  },
  cardUnread: {
    borderLeftWidth: 3, borderLeftColor: colors.primary,
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  cardBody: { flex: 1, gap: 2 },
  cardTopRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', gap: spacing.sm,
  },
  cardTitle: {
    flex: 1, fontSize: typography.base, fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  dot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary,
  },
  cardMessage: {
    fontSize: typography.sm, color: colors.textSecondary, lineHeight: 19,
  },
  cardTime: {
    fontSize: typography.xs, color: colors.textLight, marginTop: 4,
  },
  emptyWrap: { flexGrow: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', padding: spacing.xl, gap: spacing.sm },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.borderLight,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.md, fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  emptySub: {
    fontSize: typography.sm, color: colors.textSecondary,
    textAlign: 'center', paddingHorizontal: spacing.xl,
  },
});
