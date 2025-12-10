import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@theme';
import { PraxisButton } from '@components';
import { useUserStore } from '@core/store/useUserStore';
import { usePlanStore } from '@core/store';
import { generateTrainingCycle } from '@engine/generation/generateTrainingCycle';

export default function OnboardingCompleteScreen() {
  const theme = useTheme();
  const router = useRouter();
  const {
    setHasCompletedOnboarding,
    updateUserProfile,
    preferences,
    distanceUnits,
    strengthNumbers,
    hasProfile,
  } = useUserStore();
  const { setPlan, getTodayPlan } = usePlanStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleGeneratePlan = async () => {
    setIsLoading(true);

    try {
      // 1. Mark onboarding as completed FIRST
      console.log('[OnboardingCompleteScreen] Setting onboarding as completed...');
      setHasCompletedOnboarding(true);
      
      // 2. Wait a brief moment for state to persist
      await new Promise(resolve => setTimeout(resolve, 100));

      // 3. Ensure a basic userProfile exists
      try {
        updateUserProfile({
          preferences,
          strengthNumbers,
          distanceUnits,
          updatedAt: new Date().toISOString(),
        });
      } catch (profileError) {
        // Guard against missing pieces
        console.warn('[OnboardingCompleteScreen] Could not update user profile:', profileError);
      }

      // 4. Log for debugging
      console.log('[OnboardingCompleteScreen] completed, preferences:', preferences);
      const { hasProfile } = useUserStore.getState();
      console.log('[OnboardingCompleteScreen] hasProfile check:', hasProfile());

      // Get today's date in yyyy-mm-dd format
      const startDate = new Date().toISOString().slice(0, 10);

      // Generate a 4-week training cycle
      const cycle = generateTrainingCycle({
        startDate,
        goal: preferences.goal || 'general',
        experienceLevel: (preferences.experienceLevel as any) || 'beginner',
        trainingDaysPerWeek: preferences.trainingDaysPerWeek || 3,
        equipmentIds: preferences.equipmentIds || [],
        units: 'metric',
        weeks: 4,
        strengthNumbers:
          Object.keys(strengthNumbers).length > 0
            ? strengthNumbers
            : undefined,
      });

      // Flatten the weeks array into a single array of WorkoutPlanDay
      const fullPlan = cycle.weeks.flat();

      // Save to plan store
      setPlan(fullPlan);

      // TODO: Save cycle metadata to Supabase once backend integration exists.
      // TODO: Store cycle.id for analytics and history tracking.

      // 5. Verify state before navigation
      const finalCheck = hasProfile();
      console.log('[OnboardingCompleteScreen] Final hasProfile check before navigation:', finalCheck);

      // 6. Navigate to today's workout if available, otherwise fallback to /start
      const todayWorkout = getTodayPlan();
      if (todayWorkout) {
        console.log('[OnboardingCompleteScreen] Navigating to today workout:', todayWorkout.id);
        router.replace({
          pathname: '/workout/overview',
          params: { planDayId: todayWorkout.id },
        });
      } else {
        console.log('[OnboardingCompleteScreen] No workout found for today, navigating to /start');
        router.replace('/start');
      }
    } catch (error) {
      console.error('[OnboardingCompleteScreen] Error generating training plan:', error);
      // Navigate anyway, even if generation fails
      const { hasProfile } = useUserStore.getState();
      console.log('[OnboardingCompleteScreen] Error path - hasProfile check:', hasProfile());
      
      // Try to navigate to today's workout, fallback to /start
      const todayWorkout = getTodayPlan();
      if (todayWorkout) {
        router.replace({
          pathname: '/workout/overview',
          params: { planDayId: todayWorkout.id },
        });
      } else {
        router.replace('/start');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.appBg }]}
      edges={['top', 'bottom']}
    >
      <View style={[styles.content, { paddingHorizontal: theme.spacing.xl }]}>
        <View style={[styles.header, { marginBottom: theme.spacing.xxl }]}>
          <Text
            style={[
              styles.title,
              {
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.fonts.heading,
                fontSize: theme.typography.sizes.h1,
                marginBottom: theme.spacing.md,
              },
            ]}
          >
            You're All Set!
          </Text>
          <Text
            style={[
              styles.subtitle,
              {
                color: theme.colors.textMuted,
                fontFamily: theme.typography.fonts.body,
                fontSize: theme.typography.sizes.body,
              },
            ]}
          >
            Let's build your personalized training plan based on your goals and
            preferences.
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <PraxisButton
            title="Generate My Plan"
            onPress={handleGeneratePlan}
            size="large"
            loading={isLoading}
            disabled={isLoading}
          />
          {isLoading && (
            <Text
              style={[
                styles.loadingText,
                {
                  color: theme.colors.textMuted,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.bodySmall,
                  marginTop: theme.spacing.md,
                },
              ]}
            >
              Generating…
            </Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  loadingText: {
    textAlign: 'center',
  },
});
