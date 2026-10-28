import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { JobProvider } from '@/context/job-context';

export default function RootLayout() {
  return (
    <JobProvider>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="dark" />
    </JobProvider>
  );
}
