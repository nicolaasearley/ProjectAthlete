import { View, Text } from 'react-native';
import { useTheme } from '@theme';

export default function SettingsScreen() {
  const theme = useTheme();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.appBg,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text
        style={{
          color: theme.colors.textPrimary,
          fontSize: 22,
          fontFamily: theme.typography.fonts.headingMedium,
        }}
      >
        Settings (Coming Soon)
      </Text>
    </View>
  );
}

