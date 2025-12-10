import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@theme';

interface AccessoryBlockRendererProps {
  block: any;
}

export const AccessoryBlockRenderer: React.FC<AccessoryBlockRendererProps> = ({
  block,
}) => {
  const theme = useTheme();
  const accessories = block?.accessory ?? [];

  if (!accessories.length) {
    return null;
  }

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
        Accessory Work
      </Text>

      <View style={styles.listContainer}>
        {accessories.map((item: any, index: number) => (
          <View
            key={index}
            style={[
              styles.row,
              { borderColor: theme.colors.surface3 },
              index === accessories.length - 1 && { borderBottomWidth: 0 },
            ]}
          >
            <View style={styles.bullet} />
            <View style={styles.textContainer}>
              <Text
                style={{
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.bodySmall,
                  marginBottom: 2,
                }}
              >
                {item.exerciseName ?? item.exerciseId}
              </Text>
              <Text
                style={{
                  color: theme.colors.textMuted,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.bodySmall,
                }}
              >
                {item.sets?.[0]?.targetReps
                  ? `${item.sets.length} x ${item.sets[0].targetReps} reps`
                  : `${item.sets?.length ?? 3} sets`}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 999,
    marginTop: 8,
    marginRight: 8,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  textContainer: {
    flex: 1,
  },
});

export default AccessoryBlockRenderer;

