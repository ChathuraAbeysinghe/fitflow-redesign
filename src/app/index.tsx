import { Redirect } from 'expo-router';
import { useApp } from '../data/AppState';

export default function Index() {
  const { data } = useApp();
  return <Redirect href={data.profile.onboarded ? '/(tabs)' : '/onboarding'} />;
}
