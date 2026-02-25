import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSupervisorData } from '../../hooks/useSupervisorData';
import { Colors, FontSize, Radius, Spacing } from '../../lib/constants';

export function DashboardScreen() {
  const { data, isLoading, refetch } = useSupervisorData();
  const [refreshing, setRefreshing] = useState(false);

  // Auto refresh every 60s
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 60000);
    return () => clearInterval(interval);
  }, [refetch]);

  if (isLoading && !data) {
    return (
      <View style={[styles.container, styles.centerAll]}>
        <Text style={{ color: Colors.textMuted }}>Loading dashboard...</Text>
      </View>
    );
  }

  const { clockedInGuards, guardPositions, activeAlerts, todayStats } = data || {
    clockedInGuards: [], guardPositions: new Map(), activeAlerts: [], todayStats: { checkInCount: 0, visitorCount: 0, complianceAvg: 0 }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Text style={styles.headerTitle}>Supervisor Dashboard</Text>
      
      {/* Section A — Alert Banner */}
      {activeAlerts && activeAlerts.length > 0 && (
        <TouchableOpacity style={styles.alertCard} activeOpacity={0.8}>
          <Ionicons name="warning" size={24} color={Colors.white} />
          <Text style={styles.alertTitle}>⚠️ {activeAlerts.length} Active Alerts</Text>
        </TouchableOpacity>
      )}

      {/* Section B — Guard Status Grid */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>On Duty Now — {clockedInGuards.length} guards</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}>
          {clockedInGuards.map((guard) => {
            const pos = guardPositions.get(guard.guard_id);
            const minutesAgo = pos?.minutes_ago ?? 999;
            let statusColor: string = Colors.success;
            if (minutesAgo > 30) statusColor = Colors.danger;
            else if (minutesAgo > 10) statusColor = Colors.accent;

            return (
              <View key={guard.guard_id} style={styles.guardCard}>
                <View style={styles.avatarWrapper}>
                  <View style={[styles.avatarStatus, { backgroundColor: statusColor }]} />
                  <Text style={styles.avatarText}>{guard.first_name[0]}{guard.last_name[0]}</Text>
                </View>
                <Text style={styles.guardName} numberOfLines={1}>
                  {guard.first_name} {guard.last_name}
                </Text>
                <Text style={styles.guardSeen}>
                  {pos ? `${Math.floor(minutesAgo)}m ago` : 'No GPS yet'}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Section C — Today's Stats */}
      <View style={[styles.section, { paddingHorizontal: 16 }]}>
        <Text style={styles.sectionHeader}>Today's Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{todayStats.checkInCount}</Text>
            <Text style={styles.statLabel}>Check-ins</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{activeAlerts.length}</Text>
            <Text style={styles.statLabel}>Open Alerts</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{todayStats.visitorCount}</Text>
            <Text style={styles.statLabel}>Visitors</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{Math.round(todayStats.complianceAvg)}%</Text>
            <Text style={styles.statLabel}>Compliance</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerAll: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    paddingVertical: 24,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: FontSize.screenTitle,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  alertCard: {
    backgroundColor: '#7F1D1D',
    marginHorizontal: 16,
    borderRadius: Radius.card,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  alertTitle: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: FontSize.cardTitle,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    fontSize: FontSize.sectionTitle,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  guardCard: {
    width: 120,
    height: 140,
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  avatarStatus: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.surface,
    zIndex: 1,
  },
  avatarText: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 20,
  },
  guardName: {
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: 13,
    marginBottom: 4,
    textAlign: 'center',
  },
  guardSeen: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});
