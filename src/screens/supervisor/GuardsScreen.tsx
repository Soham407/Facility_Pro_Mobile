import React, { useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Callout } from 'react-native-maps';
import { useSupervisorData } from '../../hooks/useSupervisorData';
import { Colors, Radius, Spacing } from '../../lib/constants';

const { height } = Dimensions.get('window');

export function GuardsScreen() {
  const { data } = useSupervisorData();
  const mapRef = useRef<MapView>(null);
  
  const [selectedGuard, setSelectedGuard] = useState<string | null>(null);

  const guards = data?.clockedInGuards || [];
  const guardPositions = data?.guardPositions || new Map();

  const handleGuardSelect = (guardId: string) => {
    setSelectedGuard(guardId);
    const pos = guardPositions.get(guardId);
    if (pos && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: pos.latitude,
        longitude: pos.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 1000);
    }
  };

  const MemoizedMarkers = useMemo(() => {
    return guards.map((guard) => {
      const pos = guardPositions.get(guard.guard_id);
      if (!pos) return null;

      const outdated = pos.minutes_ago > 15;
      let statusColor: string = Colors.success;
      if (pos.minutes_ago > 30) statusColor = Colors.danger;
      else if (pos.minutes_ago > 10) statusColor = Colors.accent;

      return (
        <Marker
          key={`marker-${guard.guard_id}`}
          coordinate={{ latitude: pos.latitude, longitude: pos.longitude }}
          onPress={() => setSelectedGuard(guard.guard_id)}
        >
          <View style={[styles.markerPip, { backgroundColor: statusColor }]}>
            <Text style={styles.markerText}>{guard.first_name[0]}{guard.last_name[0]}</Text>
          </View>
          <Callout tooltip>
            <View style={styles.calloutCard}>
              <Text style={styles.calloutName}>{guard.first_name} {guard.last_name}</Text>
              <Text style={styles.calloutStatus}>Seen {Math.floor(pos.minutes_ago)}m ago</Text>
              {outdated && <Text style={styles.outdatedLabel}>Position outdated</Text>}
            </View>
          </Callout>
        </Marker>
      );
    });
  }, [guards, guardPositions]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        userInterfaceStyle="dark"
        initialRegion={{
          latitude: 19.0760, // Sample default coordinates
          longitude: 72.8777,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
      >
        {MemoizedMarkers}
      </MapView>

      <View style={styles.bottomSheet}>
        <View style={styles.sheetHandle} />
        <FlatList
          data={guards}
          keyExtractor={(item) => item.guard_id}
          renderItem={({ item }) => {
            const pos = guardPositions.get(item.guard_id);
            const m = pos?.minutes_ago || 999;
            const isSelected = selectedGuard === item.guard_id;
            
            let statusBadge: string = Colors.success;
            if (m > 30) statusBadge = Colors.danger;
            else if (m > 10) statusBadge = Colors.accent;

            return (
              <TouchableOpacity
                style={[styles.listItem, isSelected && styles.listItemSelected]}
                onPress={() => handleGuardSelect(item.guard_id)}
              >
                <View style={styles.listAvatar}>
                  <Text style={styles.listAvatarText}>{item.first_name[0]}{item.last_name[0]}</Text>
                  <View style={[styles.statusDot, { backgroundColor: statusBadge }]} />
                </View>
                <View style={styles.listBody}>
                  <Text style={styles.listName}>{item.first_name} {item.last_name}</Text>
                  <Text style={styles.listLocation}>Location ID: {item.location_id}</Text>
                </View>
                <View style={styles.listRight}>
                  <Text style={styles.listTime}>{pos ? `${Math.floor(m)}m ago` : 'N/A'}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  markerPip: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  markerText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  calloutCard: {
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 140,
  },
  calloutName: {
    color: Colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  calloutStatus: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  outdatedLabel: {
    color: Colors.danger,
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 4,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.4,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: Radius.button,
  },
  listItemSelected: {
    backgroundColor: Colors.border,
  },
  listAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listAvatarText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  listBody: {
    flex: 1,
    marginLeft: 12,
  },
  listName: {
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  listLocation: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  listRight: {
    alignItems: 'flex-end',
  },
  listTime: {
    color: Colors.accent,
    fontSize: 12,
    fontWeight: 'bold',
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
  },
});
