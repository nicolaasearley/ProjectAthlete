import { Stack } from 'expo-router';
import { ThemeProvider } from '@/theme/ThemeProvider';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ title: 'Root' }} />
      </Stack>
    </ThemeProvider>
  );
}
