import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors } from '../../lib/constants';

interface Timestamps {
  [key: string]: string | null;
}

export interface StatusTimelineProps {
  currentStatus: string;
  timestamps: Timestamps;
}

const timelineNodes = [
  { key: 'requested', label: 'Requested' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'indent_forwarded', label: 'Indent Sent' },
  { key: 'po_issued', label: 'PO Raised' },
  { key: 'po_dispatched', label: 'Dispatched' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'completed', label: 'Completed / Feedback' },
];

export function StatusTimeline({ currentStatus, timestamps }: StatusTimelineProps) {
  const currentIndex = timelineNodes.findIndex(node => node.key === currentStatus);
  const safeCurrentIndex = currentIndex === -1 ? 0 : currentIndex; // default safely

  return (
    <View style={styles.container}>
      {timelineNodes.map((node, i) => {
        const isCompleted = i < safeCurrentIndex || Boolean(timestamps[node.key]);
        const isCurrent = i === safeCurrentIndex;
        const ts = timestamps[node.key];

        return (
          <TimelineNode
            key={node.key}
            label={node.label}
            timestamp={ts}
            isCompleted={isCompleted}
            isCurrent={isCurrent}
            isLast={i === timelineNodes.length - 1}
          />
        );
      })}
    </View>
  );
}

interface NodeProps {
  label: string;
  timestamp: string | null;
  isCompleted: boolean;
  isCurrent: boolean;
  isLast: boolean;
}

function TimelineNode({ label, timestamp, isCompleted, isCurrent, isLast }: NodeProps) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isCurrent) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isCurrent, pulse]);

  const displayTime = timestamp
    ? new Date(timestamp).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
      })
    : '';

  return (
    <View style={styles.nodeWrapper}>
      <View style={styles.circleContainer}>
        {isCompleted ? (
          <View style={[styles.circle, styles.circleCompleted]} />
        ) : isCurrent ? (
          <Animated.View style={[styles.circle, styles.circleCurrent, { transform: [{ scale: pulse }] }]} />
        ) : (
          <View style={[styles.circle, styles.circleFuture]} />
        )}
        {!isLast && (
          <View style={[styles.line, isCompleted ? styles.lineCompleted : styles.lineFuture]} />
        )}
      </View>

      <View style={styles.textContainer}>
        <Text style={[styles.label, isCurrent && styles.labelCurrent]}>{label}</Text>
        {displayTime ? (
          <Text style={styles.timestamp}>{displayTime}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  nodeWrapper: {
    flexDirection: 'row',
  },
  circleContainer: {
    alignItems: 'center',
    width: 24,
    marginRight: 16,
  },
  circle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    zIndex: 1, // ensure it overlaps line
  },
  circleCompleted: {
    backgroundColor: Colors.primary,
  },
  circleCurrent: {
    backgroundColor: Colors.accent,
  },
  circleFuture: {
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  line: {
    width: 2,
    flex: 1,
    marginTop: -8,
    marginBottom: -8,
  },
  lineCompleted: {
    backgroundColor: Colors.primary,
  },
  lineFuture: {
    backgroundColor: Colors.border,
    borderStyle: 'dashed',
    borderWidth: 1, // Optional: handle dashed in View? React Native doesn't support borderStyle dashed easily on individual sides without wrapping
  },
  textContainer: {
    flex: 1,
    paddingBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  labelCurrent: {
    color: Colors.accent,
    fontWeight: 'bold',
  },
  timestamp: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
});
