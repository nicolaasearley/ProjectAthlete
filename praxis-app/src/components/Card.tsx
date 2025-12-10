import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@theme';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated';
  padding?: keyof typeof import('../theme/spacing').spacing;
}

export default function Card({
  children,
  style,
  variant = 'default',
  padding = 'lg',
}: CardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: variant === 'elevated' ? theme.colors.surface2 : theme.colors.surface1,
          padding: theme.spacing[padding],
          borderRadius: theme.radius.xl,
        },
        variant === 'elevated' && theme.shadows.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
});
