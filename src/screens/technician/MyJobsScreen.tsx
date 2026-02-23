import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useMyJobs } from '../../hooks/useMyJobs';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Colors, FontSize, Radius } from '../../lib/constants';

const FILTERS = ['All', 'Today', 'Pending', 'In Progress', 'Completed'];

export function MyJobsScreen() {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const isHistory = route.name === 'History';

  const [activeFilter, setActiveFilter] = useState(isHistory ? 'Completed' : 'All');

  // Map purely UI filters to DB status or let hook fetch all and filter in memory
  // Actually, we'll fetch all MyJobs if no filter or we can pass filter to hook.
  // To keep it simple, fetch all assigned, then filter locally.
  const { jobs, isLoading, refetch } = useMyJobs();

  const getFilteredJobs = () => {
    if (!jobs) return [];
    if (isHistory || activeFilter === 'Completed') {
      return jobs.filter(j => j.status === 'completed');
    }
    
    let filtered = jobs.filter(j => j.status !== 'completed'); // Active generic
    
    if (activeFilter === 'Pending') filtered = filtered.filter(j => j.status === 'pending' || j.status === 'accepted');
    if (activeFilter === 'In Progress') filtered = filtered.filter(j => j.status === 'in_progress');
    if (activeFilter === 'Today') {
      const today = new Date().toISOString().split('T')[0];
      filtered = filtered.filter(j => j.scheduled_date?.startsWith(today));
    }
    return filtered;
  };

  const filteredJobs = getFilteredJobs();

  const renderJobCard = ({ item }: { item: any }) => {
    let priorityColor = 'transparent';
    if (item.priority === 'urgent') priorityColor = Colors.danger;
    else if (item.priority === 'high') priorityColor = Colors.accent;

    return (
      <Card
        style={[styles.card, { borderLeftColor: priorityColor, borderLeftWidth: item.priority === 'normal' ? 0 : 4 }]}
        onPress={() => navigation.navigate('JobDetail', { jobId: item.id })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.serviceName}>{item.services?.service_name || 'Service'}</Text>
          <Badge
            label={item.status.replace('_', ' ').toUpperCase()}
            variant={item.status === 'completed' ? 'success' : item.status === 'in_progress' ? 'info' : 'warning'}
          />
        </View>

        <Text style={styles.location}>
          {item.company_locations?.location_name || 'Location'}{item.flats ? ` — Flat ${item.flats.flat_number}` : ''}
        </Text>

        <View style={styles.cardFooter}>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.dateText}>
              {item.scheduled_date ? new Date(item.scheduled_date).toLocaleDateString() : 'Unscheduled'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </View>
      </Card>
    );
  };

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <Text style={styles.title}>{isHistory ? 'Job History' : 'My Jobs'}</Text>
      </View>

      {!isHistory && (
        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContainer}>
            {FILTERS.filter(f => f !== 'Completed').map(f => (
              <TouchableOpacity
                key={f}
                style={[styles.filterPill, activeFilter === f && styles.filterPillActive]}
                onPress={() => setActiveFilter(f)}
              >
                <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <FlatList
        data={filteredJobs}
        renderItem={renderJobCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={isLoading}
        onRefresh={refetch}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="build-outline" size={48} color={Colors.border} />
            <Text style={styles.emptyText}>No jobs assigned</Text>
          </View>
        }
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: 16,
  },
  title: {
    fontSize: FontSize.screenTitle,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  filterScroll: {
    marginBottom: 16,
  },
  filterContainer: {
    gap: 8,
    paddingRight: 16,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
  },
  filterText: {
    color: Colors.textMuted,
    fontWeight: '600',
    fontSize: FontSize.caption,
  },
  filterTextActive: {
    color: Colors.white,
  },
  listContent: {
    paddingBottom: 24,
  },
  card: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: FontSize.cardTitle,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  location: {
    fontSize: FontSize.body,
    color: Colors.textMuted,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    color: Colors.textMuted,
    fontSize: FontSize.caption,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 64,
  },
  emptyText: {
    color: Colors.textMuted,
    marginTop: 16,
    fontSize: FontSize.body,
  },
});
