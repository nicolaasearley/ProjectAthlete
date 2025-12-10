import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@theme';

interface StrengthBlockRendererProps {
  block: any;
}

export const StrengthBlockRenderer: React.FC<StrengthBlockRendererProps> = ({
  block,
}) => {
  const theme = useTheme();
  const main = block?.strengthMain;

  if (!main) {
    return null;
  }

  const { sets = [] } = main;

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
        Main Lift Prescription
      </Text>

      <View
        style={[
          styles.setsContainer,
          { borderColor: theme.colors.surface3 },
        ]}
      >
        {sets.map((set: any, index: number) => (
          <View
            key={index}
            style={[
              styles.setRow,
              index < sets.length - 1 && {
                borderBottomColor: theme.colors.surface3,
              },
            ]}
          >
            <Text
              style={[
                styles.setLabel,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.bodySmall,
                },
              ]}
            >
              Set {index + 1}
            </Text>
            <Text
              style={[
                styles.setDetail,
                {
                  color: theme.colors.textSecondary,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.bodySmall,
                },
              ]}
            >
              {set.targetReps} reps
              {set.targetPercent1RM
                ? ` @ ${Math.round(set.targetPercent1RM * 100)}%`
                : set.targetRpe
                ? ` @ RPE ${set.targetRpe}`
                : ''}
            </Text>
          </View>
        ))}
      </View>

      {block.notes ? (
        <Text
          style={{
            marginTop: theme.spacing.sm,
            color: theme.colors.textMuted,
            fontFamily: theme.typography.fonts.body,
            fontSize: theme.typography.sizes.bodySmall,
          }}
        >
          {block.notes}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  setsContainer: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    overflow: 'hidden',
  },
  setRow: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  setLabel: {
    fontWeight: '600',
  },
  setDetail: {
    textAlign: 'right',
  },
});

export default StrengthBlockRenderer;

