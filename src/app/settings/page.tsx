import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth/require-auth';
import { SettingsDashboard } from '@/components/settings/SettingsDashboard';

export default async function SettingsPage() {
  const authed = await isAuthenticated();
  if (!authed) redirect('/login');

  return <SettingsDashboard />;
}
