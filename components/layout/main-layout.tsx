import Link from 'next/link';
import { Sidebar } from '@/components/ui/sidebar';
import { Header } from '@/components/ui/header';
import { OAuthRefreshProvider } from '@/components/layout/oauth-refresh-provider';
import { Toaster } from '@/components/ui/toaster';

interface Route {
  title: string;
  path: string;
}

interface MainLayoutProps {
  children: React.ReactNode;
  routes?: Route[];
}

export function MainLayout({ children, routes }: MainLayoutProps) {
  return (
    <OAuthRefreshProvider>
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <Sidebar customRoutes={routes} />
        
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="container mx-auto max-w-7xl">
              <div className="animate-in fade-in duration-500">
                {children}
              </div>
            </div>
          </main>
          
          <footer className="border-t border-slate-200 py-3 px-6 text-center text-sm text-slate-500 bg-white">
            <p>EmailMax &copy; {new Date().getFullYear()} - Sistema de Gerenciamento e Automação de Email</p>
          </footer>
        </div>
      </div>
      <Toaster />
    </OAuthRefreshProvider>
  );
} 