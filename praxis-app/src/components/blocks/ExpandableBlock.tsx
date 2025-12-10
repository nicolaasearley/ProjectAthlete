import React, { useRef, useState, useEffect, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  Animated,
} from 'react-native';
import { useTheme } from '@theme';
import { Card } from '@components';
import { Ionicons } from '@expo/vector-icons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export type ExpandableBlockType =
  | 'warmup'
  | 'strength'
  | 'accessory'
  | 'conditioning'
  | 'cooldown';

interface ExpandableBlockProps {
  title: string;
  subtitle?: string;
  type: ExpandableBlockType;
  durationMinutes?: number;
  defaultExpanded?: boolean;
  children: ReactNode;
}

export const ExpandableBlock: React.FC<ExpandableBlockProps> = ({
  title,
  subtitle,
  type,
  durationMinutes,
  defaultExpanded = false,
  children,
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const rotateAnim = useRef(new Animated.Value(defaultExpanded ? 1 : 0)).current;
  const contentOpacity = useRef(new Animated.Value(defaultExpanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: expanded ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();

    Animated.timing(contentOpacity, {
      toValue: expanded ? 1 : 0,
      duration: 160,
      useNativeDriver: true,
    }).start();
  }, [expanded, rotateAnim, contentOpacity]);

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  const chevronRotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const typeLabel = (() => {
    switch (type) {
      case 'warmup':
        return 'Warm-Up';
      case 'strength':
        return 'Strength';
      case 'accessory':
        return 'Accessory';
      case 'conditioning':
        return 'Conditioning';
      case 'cooldown':
        return 'Cooldown';
      default:
        return '';
    }
  })();

  return (
    <Card
      variant="elevated"
      padding="lg"
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface2,
          borderColor: theme.colors.surface3,
        },
      ]}
    >
      <TouchableOpacity
        onPress={handleToggle}
        activeOpacity={0.8}
        style={styles.headerRow}
      >
        <View
          style={[
            styles.leftAccent,
            { backgroundColor: theme.colors.primary },
          ]}
        />

        <View style={styles.headerTextContainer}>
          <Text
            style={[
              styles.blockType,
              {
                color: theme.colors.textMuted,
                fontFamily: theme.typography.fonts.body,
                fontSize: theme.typography.sizes.bodySmall,
              },
            ]}
          >
            {typeLabel}
          </Text>
          <Text
            style={[
              styles.title,
              {
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.fonts.headingMedium,
                fontSize: theme.typography.sizes.h4,
              },
            ]}
          >
            {title}
          </Text>

          {(subtitle || durationMinutes) && (
            <View style={styles.subtitleRow}>
              {subtitle ? (
                <Text
                  style={[
                    styles.subtitle,
                    {
                      color: theme.colors.textMuted,
                      fontFamily: theme.typography.fonts.body,
                      fontSize: theme.typography.sizes.bodySmall,
                    },
                  ]}
                >
                  {subtitle}
                </Text>
              ) : null}
              {durationMinutes != null && (
                <Text
                  style={[
                    styles.duration,
                    {
                      color: theme.colors.textMuted,
                      fontFamily: theme.typography.fonts.body,
                      fontSize: theme.typography.sizes.bodySmall,
                    },
                  ]}
                >
                  • {durationMinutes} min
                </Text>
              )}
            </View>
          )}
        </View>

        <Animated.View
          style={[
            styles.chevronContainer,
            {
              transform: [{ rotate: chevronRotation }],
              borderColor: theme.colors.primary,
            },
          ]}
        >
          <Ionicons
            name="chevron-down"
            size={18}
            color={theme.colors.primary}
          />
        </Animated.View>
      </TouchableOpacity>

      {expanded && (
        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: contentOpacity,
              borderTopColor: theme.colors.surface3,
            },
          ]}
        >
          {children}
        </Animated.View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftAccent: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: 999,
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  blockType: {
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontWeight: '600',
  },
  subtitleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  subtitle: {
    marginRight: 6,
  },
  duration: {
    opacity: 0.9,
  },
  chevronContainer: {
    width: 32,
    height: 32,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  contentContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 12,
    paddingTop: 12,
  },
});

export default ExpandableBlock;

