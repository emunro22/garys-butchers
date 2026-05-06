import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { AdminShell } from '@/components/admin/admin-shell';

export const metadata = {
  title: 'Admin — Gary’s Butchers',
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/admin/login');
  return <AdminShell email={session.email}>{children}</AdminShell>;
}
