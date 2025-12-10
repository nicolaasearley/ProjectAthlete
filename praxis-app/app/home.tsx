import { Redirect } from 'expo-router';

// Legacy route: redirect to /today for backwards compatibility
export default function HomeRedirect() {
  return <Redirect href="/today" />;
}
