import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@theme';
import { useUserStore, usePlanStore } from '@core/store';
import { generateInitialPlan } from '@core/engine';
import dayjs from 'dayjs';
import { trackEvent, trackScreen } from '@core/analytics';

export default function GeneratingPlanScreen() {
  const theme = useTheme();
  const { userProfile, setHasCompletedOnboarding, preferences, hasProfile } = useUserStore();
  const { setPlanDays, getTodayPlan } = usePlanStore();

  useEffect(() => {
    trackScreen('generating_plan');
    
    const generateAndNavigate = async () => {
      try {
        // 1. Mark onboarding as completed FIRST, before any checks
        console.log('[GeneratingPlanScreen] Setting onboarding as completed...');
        setHasCompletedOnboarding(true);
        
        // 2. Wait a brief moment for state to persist
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // 3. Check hasProfile after setting onboarding complete
        const profileStatus = hasProfile();
        console.log('[GeneratingPlanScreen] hasProfile check:', {
          hasProfile: profileStatus,
          hasCompletedOnboarding: useUserStore.getState().hasCompletedOnboarding,
          goal: preferences.goal,
          experienceLevel: preferences.experienceLevel,
          trainingDaysPerWeek: preferences.trainingDaysPerWeek,
        });
        
        trackEvent('plan_generation_started', {
          hasProfile: profileStatus,
        });

        if (!userProfile) {
          // If no user profile, navigate anyway (shouldn't happen in normal flow)
          setTimeout(() => {
            router.replace('/today');
          }, 2000);
          return;
        }

        // Get today's date in yyyy-mm-dd format
        const startDate = dayjs().format('YYYY-MM-DD');

        // TODO: Remove mock when generateInitialPlan is implemented
        // For now, mock the call with setTimeout since engine is not implemented
        setTimeout(async () => {
          try {
            const planDays = generateInitialPlan(userProfile, startDate);
            setPlanDays(planDays);
            trackEvent('plan_generation_completed', {
              status: 'success',
              daysGenerated: planDays.length,
            });
          } catch (error) {
            // Engine not implemented yet, continue with empty plan
            console.log('Plan generation not yet implemented, continuing...');
            trackEvent('plan_generation_completed', { status: 'fallback' });
          }

          // Verify state before navigation
          const finalCheck = hasProfile();
          console.log('[GeneratingPlanScreen] Final hasProfile check before navigation:', finalCheck);
          
          // Navigate to today's workout if available, otherwise fallback to /start
          const todayWorkout = getTodayPlan();
          if (todayWorkout) {
            console.log('[GeneratingPlanScreen] Navigating to today workout:', todayWorkout.id);
            router.replace({
              pathname: '/workout/overview',
              params: { planDayId: todayWorkout.id },
            });
          } else {
            console.log('[GeneratingPlanScreen] No workout found for today, navigating to /start');
            router.replace('/start');
          }
        }, 2000); // 2 second delay for loading animation
      } catch (error) {
        console.error('Error generating plan:', error);
        // Navigate anyway after delay
        trackEvent('plan_generation_completed', { status: 'error' });
        setTimeout(() => {
          const finalCheck = hasProfile();
          console.log('[GeneratingPlanScreen] Error path - hasProfile check:', finalCheck);
          
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
        }, 2000);
      }
    };

    generateAndNavigate();
  }, [userProfile, setPlanDays, setHasCompletedOnboarding, preferences, hasProfile, getTodayPlan]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.appBg }]}
      edges={['top', 'bottom']}
    >
      <View style={[styles.content, { paddingHorizontal: theme.spacing.xl }]}>
        <View
          style={[styles.logoContainer, { marginBottom: theme.spacing.xxl }]}
        >
          <Text
            style={[
              styles.logo,
              {
                color: theme.colors.acidGreen,
                fontSize: 64,
              },
            ]}
          >
            [PRAXIS ICON]
          </Text>
        </View>

        <ActivityIndicator
          size="large"
          color={theme.colors.acidGreen}
          style={{ marginBottom: theme.spacing.xl }}
        />

        <Text
          style={[
            styles.title,
            {
              color: theme.colors.textPrimary,
              fontFamily: theme.typography.fonts.heading,
              fontSize: theme.typography.sizes.h2,
              marginBottom: theme.spacing.md,
            },
          ]}
        >
          Building Your Training Plan…
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
          This may take a moment.
        </Text>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontWeight: 'bold',
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
});
