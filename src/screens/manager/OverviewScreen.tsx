import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useManagerData } from '../../hooks/useManagerData';
import { Colors, FontSize, Radius, Spacing } from '../../lib/constants';

export function OverviewScreen() {
  const { data, isLoading, refetch } = useManagerData();

  if (isLoading && !data) {
    return (
      <View style={[styles.container, styles.centerAll]}>
        <Text style={{ color: Colors.textMuted }}>Loading manager overview...</Text>
      </View>
    );
  }

  const { openServiceRequests, pendingLeaves, expiringItems, recentActivity } = data || {
    openServiceRequests: 0, pendingLeaves: [], expiringItems: 0, recentActivity: []
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Text style={styles.headerTitle}>Manager Overview</Text>

      {/* Top row — 4 KPI cards */}
      <View style={styles.kpiContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.kpiScroll}>
          <View style={[styles.kpiCard, { borderColor: openServiceRequests > 0 ? Colors.danger : Colors.border }]}>
            <Text style={styles.kpiNumber}>{openServiceRequests}</Text>
            <Text style={styles.kpiLabel}>Open Requests</Text>
          </View>
          <View style={[styles.kpiCard, { borderColor: pendingLeaves.length > 0 ? Colors.accent : Colors.border }]}>
            <Text style={styles.kpiNumber}>{pendingLeaves.length}</Text>
            <Text style={styles.kpiLabel}>Pending Leaves</Text>
          </View>
          <View style={[styles.kpiCard, { borderColor: expiringItems > 0 ? Colors.danger : Colors.border }]}>
            <Text style={styles.kpiNumber}>{expiringItems}</Text>
            <Text style={styles.kpiLabel}>Expiring Items</Text>
          </View>
        </ScrollView>
      </View>

      {/* Middle — Recent Activity Feed */}
      <View style={styles.feedSection}>
        <Text style={styles.sectionTitle}>Recent Activity (24h)</Text>
        <View style={styles.feedCard}>
          {recentActivity.length === 0 ? (
            <Text style={styles.emptyFeed}>No activity in the last 24 hours.</Text>
          ) : (
            recentActivity.map((item, index) => {
              let iconName: keyof typeof Ionicons.glyphMap = 'information-circle';
              let iconColor: string = Colors.primary;
              if (item.type === 'alert') { iconName = 'warning'; iconColor = Colors.danger; }
              if (item.type === 'leave') { iconName = 'calendar'; iconColor = Colors.accent; }
              if (item.type === 'service') { iconName = 'construct'; iconColor = Colors.success; }

              return (
                <TouchableOpacity key={item.id} style={[styles.feedItem, index < recentActivity.length - 1 && styles.borderBottom]}>
                  <View style={[styles.feedIconBox, { backgroundColor: iconColor + '20' }]}>
                    <Ionicons name={iconName} size={20} color={iconColor} />
                  </View>
                  <View style={styles.feedBody}>
                    <Text style={styles.feedTitle}>{item.title}</Text>
                    <Text style={styles.feedDesc} numberOfLines={1}>{item.description}</Text>
                  </View>
                  <Text style={styles.feedTime}>
                    {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </View>

      {/* Bottom — Quick Actions */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionsScroll}>
          <TouchableOpacity style={styles.actionBtn}>
            <View style={[styles.actionIconBox, { backgroundColor: Colors.surface }]}>
              <Ionicons name="chatbubble-ellipses" size={28} color={Colors.primary} />
            </View>
            <Text style={styles.actionLabel}>Raise Ticket</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <View style={[styles.actionIconBox, { backgroundColor: Colors.surface }]}>
              <Ionicons name="checkmark-done-circle" size={28} color={Colors.accent} />
            </View>
            <Text style={styles.actionLabel}>Approve Leaves</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <View style={[styles.actionIconBox, { backgroundColor: Colors.surface }]}>
              <Ionicons name="car" size={28} color={Colors.success} />
            </View>
            <Text style={styles.actionLabel}>Material Arrival</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <View style={[styles.actionIconBox, { backgroundColor: Colors.surface }]}>
              <Ionicons name="call" size={28} color={Colors.danger} />
            </View>
            <Text style={styles.actionLabel}>Contacts</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centerAll: { justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingVertical: 24, paddingBottom: 40 },
  headerTitle: { fontSize: FontSize.screenTitle, fontWeight: '700', color: Colors.textPrimary, marginHorizontal: 16, marginBottom: 20 },
  
  kpiContainer: { marginBottom: 32 },
  kpiScroll: { paddingHorizontal: 16, gap: 12 },
  kpiCard: { width: 140, height: 100, backgroundColor: Colors.surface, borderRadius: Radius.card, padding: 16, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center' },
  kpiNumber: { fontSize: 32, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  kpiLabel: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },

  feedSection: { marginBottom: 32, paddingHorizontal: 16 },
  sectionTitle: { fontSize: FontSize.sectionTitle, fontWeight: '600', color: Colors.textPrimary, marginBottom: 16 },
  feedCard: { backgroundColor: Colors.surface, borderRadius: Radius.card, borderWidth: 1, borderColor: Colors.border, paddingVertical: 8 },
  emptyFeed: { color: Colors.textMuted, padding: 16, textAlign: 'center', fontStyle: 'italic' },
  feedItem: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  feedIconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  feedBody: { flex: 1, marginLeft: 12 },
  feedTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
  feedDesc: { color: Colors.textMuted, fontSize: 13, marginTop: 2 },
  feedTime: { color: Colors.textMuted, fontSize: 12, marginLeft: 8 },

  actionsSection: { paddingHorizontal: 0 },
  actionsScroll: { paddingHorizontal: 16, gap: 16 },
  actionBtn: { alignItems: 'center', width: 80 },
  actionIconBox: { width: 64, height: 64, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  actionLabel: { color: Colors.textPrimary, fontSize: 12, textAlign: 'center', fontWeight: '500' },
});
