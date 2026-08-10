import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth/require-auth';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

export default async function AdminPage() {
  const authed = await isAuthenticated();
  if (!authed) redirect('/login');

  return <AdminDashboard />;
}
