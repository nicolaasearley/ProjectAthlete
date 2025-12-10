import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@theme';

interface CooldownBlockRendererProps {
  block: any;
}

export const CooldownBlockRenderer: React.FC<CooldownBlockRendererProps> = ({
  block,
}) => {
  const theme = useTheme();
  const items = block?.cooldownItems ?? block?.items ?? [];

  if (!items.length) {
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
        Cooldown & Reset
      </Text>

      <View style={styles.listContainer}>
        {items.map((item: string, index: number) => (
          <View key={index} style={styles.row}>
            <View style={styles.bullet} />
            <Text
              style={{
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.fonts.body,
                fontSize: theme.typography.sizes.bodySmall,
              }}
            >
              {item}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    borderRadius: 16,
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 999,
    marginRight: 8,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
});

export default CooldownBlockRenderer;

