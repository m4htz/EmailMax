'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { MainLayout } from '@/components/layout/main-layout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Adiciona a rota de emails às opções
  const routes = [
    { title: 'Overview', path: '/overview' },
    { title: 'Emails', path: '/emails' },
    { title: 'Contas de Email', path: '/email-accounts' },
    { title: 'Aquecimento', path: '/warmup' },
    { title: 'Configurações', path: '/settings' },
  ];

  return (
    <AuthGuard>
      <MainLayout routes={routes}>
        {children}
      </MainLayout>
    </AuthGuard>
  );
} 