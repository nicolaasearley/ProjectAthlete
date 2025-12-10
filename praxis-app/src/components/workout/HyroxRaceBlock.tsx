import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@theme';
import type {
  HyroxRaceSimulation,
  HyroxStation,
} from '@engine/conditioning/conditioningHyroxRace';

interface HyroxRaceBlockProps {
  race: HyroxRaceSimulation;
}

export function HyroxRaceBlock({ race }: HyroxRaceBlockProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface2 }]}>
      <Text
        style={[
          styles.title,
          {
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.fonts.headingMedium,
          },
        ]}
      >
        HYROX Race Simulation
      </Text>

      <Text
        style={[
          styles.subtitle,
          {
            color: theme.colors.textSecondary,
            marginBottom: theme.spacing.md,
          },
        ]}
      >
        Readiness scaling: x{race.readinessFactor.toFixed(2)}
      </Text>

      {race.stations.map((s, idx) => (
        <View
          key={idx}
          style={[styles.station, { borderColor: theme.colors.surface3 }]}
        >
          <Text
            style={[
              styles.stationTitle,
              { color: theme.colors.textPrimary },
            ]}
          >
            {idx + 1}. {s.title}
          </Text>

          <Text style={[styles.details, { color: theme.colors.textMuted }]}>
            {renderStationDetails(s)}
          </Text>
        </View>
      ))}
    </View>
  );
}

function renderStationDetails(s: HyroxStation): string {
  if (s.type === 'run') return `${s.distance_m}m`;

  if (s.type === 'machine')
    return `${s.distance_m}m (${s.machine})`;

  if (s.type === 'fallback')
    return `${s.exercise} – ${s.distance_m ?? ''}`;

  if (s.type === 'sled_push')
    return `${s.load_kg ?? 'N/A'}kg • ${s.meters}m`;

  if (s.type === 'sled_pull')
    return `${s.load_kg ?? 'N/A'}kg • ${s.meters}m`;

  if (s.type === 'carry') return `${s.meters}m @ ${s.load_kg}kg`;

  if (s.type === 'lunges') return `${s.meters}m @ ${s.load_kg}kg`;

  if (s.type === 'burpee_broad_jump') return `${s.meters}m`;

  if (s.type === 'wall_balls') return `${s.reps} reps @ ${s.ball_kg}kg`;

  return 'Unknown';
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  station: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  stationTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  details: {
    marginTop: 4,
    fontSize: 14,
  },
});

export default HyroxRaceBlock;

