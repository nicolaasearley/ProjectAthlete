import React from 'react';
import { Stack } from 'expo-router';
import { ThemeProvider } from '@/theme';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Tab navigator group */}
        <Stack.Screen name="(tabs)" />
        
        {/* Onboarding flow (nested stack) */}
        <Stack.Screen name="onboarding" />
        
        {/* Workout flow (nested stack) */}
        <Stack.Screen name="workout" />
        
        {/* Plan management (nested stack) */}
        <Stack.Screen name="plan" />
        
        {/* Progress tracking (nested stack) */}
        <Stack.Screen name="progress" />
        
        {/* Settings (nested stack) */}
        <Stack.Screen name="settings" />
        
        {/* Calendar view (nested stack) */}
        <Stack.Screen name="calendar" />
        
        {/* Standalone routes */}
        <Stack.Screen name="start" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="home" />
      </Stack>
    </ThemeProvider>
  );
}