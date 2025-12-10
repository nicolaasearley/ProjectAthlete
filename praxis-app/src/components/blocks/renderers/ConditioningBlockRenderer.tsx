import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@theme';

interface ConditioningBlockRendererProps {
  block: any;
}

export const ConditioningBlockRenderer: React.FC<
  ConditioningBlockRendererProps
> = ({ block }) => {
  const theme = useTheme();
  const conditioning = block?.conditioning;

  if (!conditioning) {
    return null;
  }

  const {
    mode,
    workSeconds,
    restSeconds,
    rounds,
    targetZone,
    notes,
  } = conditioning;

  const totalMinutes =
    mode === 'interval' && workSeconds && restSeconds && rounds
      ? Math.round(((workSeconds + restSeconds) * rounds) / 60)
      : block.estimatedDurationMinutes;

  return (
    <View>
      <Text
        style={{
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fonts.body,
          fontSize: theme.typography.sizes.body,
          marginBottom: theme.spacing.sm,
        }}
      >
        Conditioning Prescription
      </Text>

      <View
        style={[
          styles.container,
          { borderColor: theme.colors.surface3 },
        ]}
      >
        <View style={styles.row}>
          <Text
            style={[
              styles.label,
              {
                color: theme.colors.textMuted,
                fontFamily: theme.typography.fonts.body,
              },
            ]}
          >
            Format
          </Text>
          <Text
            style={[
              styles.value,
              {
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.fonts.body,
              },
            ]}
          >
            {mode === 'interval' ? 'Intervals' : 'Steady State'}
          </Text>
        </View>

        {mode === 'interval' && workSeconds && restSeconds && rounds && (
          <View style={styles.row}>
            <Text
              style={[
                styles.label,
                {
                  color: theme.colors.textMuted,
                  fontFamily: theme.typography.fonts.body,
                },
              ]}
            >
              Structure
            </Text>
            <Text
              style={[
                styles.value,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.fonts.body,
                },
              ]}
            >
              {rounds} x {Math.round(workSeconds / 60)}' / {Math.round(restSeconds / 60)}' rest
            </Text>
          </View>
        )}

        {targetZone && (
          <View style={styles.row}>
            <Text
              style={[
                styles.label,
                {
                  color: theme.colors.textMuted,
                  fontFamily: theme.typography.fonts.body,
                },
              ]}
            >
              Target Zone
            </Text>
            <Text
              style={[
                styles.value,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.fonts.body,
                },
              ]}
            >
              Zone {targetZone}
            </Text>
          </View>
        )}

        {totalMinutes != null && (
          <View style={styles.row}>
            <Text
              style={[
                styles.label,
                {
                  color: theme.colors.textMuted,
                  fontFamily: theme.typography.fonts.body,
                },
              ]}
            >
              Estimated Duration
            </Text>
            <Text
              style={[
                styles.value,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.fonts.body,
                },
              ]}
            >
              ~{totalMinutes} min
            </Text>
          </View>
        )}
      </View>

      {notes ? (
        <Text
          style={{
            marginTop: theme.spacing.sm,
            color: theme.colors.textMuted,
            fontFamily: theme.typography.fonts.body,
            fontSize: theme.typography.sizes.bodySmall,
          }}
        >
          {notes}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
  },
  value: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export default ConditioningBlockRenderer;

