import { Redirect } from 'expo-router';
import { View, Text } from 'react-native';
import { useUserStore } from '@core/store/useUserStore';
import { useTheme } from '@theme';

export default function Index() {
  const theme = useTheme();
  const _hasHydrated = useUserStore((s) => s._hasHydrated);
  const hasProfile = useUserStore((s) => s.hasProfile());

  // Wait for hydration before making routing decisions
  if (!_hasHydrated) {
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
            color: theme.colors.textMuted,
            fontFamily: theme.typography.fonts.body,
          }}
        >
          Loading...
        </Text>
      </View>
    );
  }

  const store = useUserStore.getState();

  console.log('[index.tsx] Route check:', {
    hasProfile,
    goal: store.preferences.goal,
    experienceLevel: store.preferences.experienceLevel,
    trainingDaysPerWeek: store.preferences.trainingDaysPerWeek,
    hasCompletedOnboarding: store.hasCompletedOnboarding,
  });

  if (hasProfile) {
    console.log('[index.tsx] Redirecting to /today');
    return <Redirect href="/today" />;
  }

  console.log('[index.tsx] Redirecting to onboarding');
  return <Redirect href="/onboarding/welcome" />;
}
