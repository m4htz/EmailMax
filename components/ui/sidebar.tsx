"use client"

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Mail, 
  Flame, 
  Settings,
  LogOut,
  ChevronDown,
  Plus,
  User,
  FileText,
  BarChart,
  MessageSquare,
  PanelRight,
  Network,
  BookOpen,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/store/useAuth";
import { createClient } from "@/utils/supabase/client";

interface NavItem {
  label: string;
  icon: React.ElementType;
  href?: string;
  active?: boolean;
  submenu?: NavItem[];
  expanded?: boolean;
}

interface CustomRoute {
  title: string;
  path: string;
}

interface SidebarProps {
  customRoutes?: CustomRoute[];
}

export function Sidebar({ customRoutes }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { clearAuth, user } = useAuth();
  const supabase = createClient();
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    // Fechar menu mobile quando a rota muda
    setIsMobileMenuOpen(false);
  }, [pathname]);
  
  // Disponibiliza função para abrir/fechar menu mobile
  useEffect(() => {
    // Evento personalizado para abrir o menu mobile a partir do header
    const handleMobileMenuToggle = (e: CustomEvent) => {
      setIsMobileMenuOpen(e.detail.open);
    };

    window.addEventListener('toggleMobileMenu' as any, handleMobileMenuToggle);
    
    return () => {
      window.removeEventListener('toggleMobileMenu' as any, handleMobileMenuToggle);
    };
  }, []);
  
  useEffect(() => {
    // Se temos rotas customizadas, as usamos para construir os itens de navegação
    if (customRoutes && customRoutes.length > 0) {
      const routesToNavItems: NavItem[] = customRoutes.map(route => {
        // Determina o ícone baseado no path
        let icon = LayoutDashboard;
        if (route.path.includes('email')) icon = Mail;
        else if (route.path.includes('warmup')) icon = Flame;
        else if (route.path.includes('settings')) icon = Settings;
        
        return {
          label: route.title,
          icon: icon,
          href: route.path,
          active: pathname === route.path || pathname?.startsWith(route.path + '/')
        };
      });
      
      setNavItems(routesToNavItems);
      return;
    }
    
    // Caso contrário, usamos os itens de navegação padrão
    setNavItems([
      {
        label: 'Dashboard',
        icon: LayoutDashboard,
        href: '/overview',
        active: pathname === '/overview',
      },
      {
        label: 'Contas de Email',
        icon: Mail,
        active: pathname?.startsWith('/email-accounts'),
        expanded: pathname?.startsWith('/email-accounts'),
        submenu: [
          {
            label: 'Todas as Contas',
            href: '/email-accounts',
            icon: User,
            active: pathname === '/email-accounts',
          },
          {
            label: 'Adicionar Conta',
            href: '/email-accounts/add',
            icon: Plus,
            active: pathname === '/email-accounts/add',
          }
        ]
      },
      {
        label: 'Aquecimento',
        icon: Flame,
        active: pathname?.startsWith('/warmup'),
        expanded: pathname?.startsWith('/warmup'),
        submenu: [
          {
            label: 'Visão Geral',
            href: '/warmup',
            icon: BarChart,
            active: pathname === '/warmup',
          },
          {
            label: 'Criar Plano',
            href: '/warmup/create',
            icon: FileText,
            active: pathname === '/warmup/create',
          }
        ]
      },
      {
        label: 'Ferramentas',
        icon: Network,
        active: pathname?.startsWith('/tools'),
        expanded: pathname?.startsWith('/tools'),
        submenu: [
          {
            label: 'Email Template',
            href: '/tools/templates',
            icon: MessageSquare,
            active: pathname?.startsWith('/tools/templates'),
          },
          {
            label: 'Verificador',
            href: '/tools/checker',
            icon: PanelRight,
            active: pathname?.startsWith('/tools/checker'),
          }
        ]
      },
      {
        label: 'Configurações',
        icon: Settings,
        href: '/settings',
        active: pathname?.startsWith('/settings'),
      },
    ]);
  }, [pathname, customRoutes]);

  const toggleSubmenu = (index: number) => {
    setNavItems(prev => {
      const newItems = [...prev];
      newItems[index] = {
        ...newItems[index],
        expanded: !newItems[index].expanded
      };
      return newItems;
    });
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      clearAuth();
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };
  
  // Classes para o menu mobile
  const mobileMenuClasses = cn(
    "fixed inset-0 z-50 lg:hidden", 
    isMobileMenuOpen ? "block" : "hidden"
  );

  return (
    <>
      {/* Sidebar Desktop */}
      <aside className={`h-full hidden lg:flex flex-col bg-slate-900 text-white shadow-xl transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
        <div className="px-3 py-4 border-b border-slate-700 flex items-center justify-between">
          <Link href="/overview" className={`block ${isCollapsed ? 'mx-auto' : ''}`}>
            {isCollapsed ? (
              <div className="bg-blue-500 w-8 h-8 rounded-md flex items-center justify-center text-white font-bold">
                E
              </div>
            ) : (
              <h1 className="text-2xl font-bold">EmailMax</h1>
            )}
          </Link>
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`text-slate-400 hover:text-white transition-colors ${isCollapsed ? 'hidden' : ''}`}
          >
            <ChevronDown className={`h-5 w-5 transform ${isCollapsed ? 'rotate-90' : ''}`} />
          </button>
        </div>
        
        <div className="flex-1 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
          <nav className="space-y-1 px-2">
            {navItems.map((item, index) => (
              <div key={index}>
                {item.href ? (
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center py-2 px-3 rounded-md transition-colors hover:bg-slate-800 group',
                      item.active ? 'bg-slate-800' : 'transparent'
                    )}
                  >
                    <item.icon className={cn(
                      'h-5 w-5 mr-3',
                      item.active ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-300'
                    )} />
                    {!isCollapsed && (
                      <span className={cn(
                        item.active ? 'font-medium text-white' : 'text-slate-300 group-hover:text-white'
                      )}>
                        {item.label}
                      </span>
                    )}
                  </Link>
                ) : (
                  <button
                    onClick={() => toggleSubmenu(index)}
                    className={cn(
                      'flex items-center w-full justify-between py-2 px-3 rounded-md transition-colors hover:bg-slate-800 group',
                      item.active ? 'bg-slate-800' : 'transparent'
                    )}
                  >
                    <div className="flex items-center">
                      <item.icon className={cn(
                        'h-5 w-5 mr-3',
                        item.active ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-300'
                      )} />
                      {!isCollapsed && (
                        <span className={cn(
                          item.active ? 'font-medium text-white' : 'text-slate-300 group-hover:text-white'
                        )}>
                          {item.label}
                        </span>
                      )}
                    </div>
                    {!isCollapsed && (
                      <ChevronDown className={`h-4 w-4 text-slate-400 transform transition-transform ${item.expanded ? 'rotate-180' : ''}`} />
                    )}
                  </button>
                )}
                
                {/* Submenu */}
                {item.submenu && item.expanded && !isCollapsed && (
                  <div className="ml-4 pl-3 border-l border-slate-700 mt-1 space-y-1">
                    {item.submenu.map((subItem, subIndex) => (
                      <Link
                        key={subIndex}
                        href={subItem.href || '#'}
                        className={cn(
                          'flex items-center py-1.5 px-3 rounded-md transition-colors hover:bg-slate-800 group',
                          subItem.active ? 'bg-slate-800 bg-opacity-70' : 'transparent'
                        )}
                      >
                        <subItem.icon className={cn(
                          'h-4 w-4 mr-3',
                          subItem.active ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-300'
                        )} />
                        <span className={cn(
                          'text-sm',
                          subItem.active ? 'font-medium text-white' : 'text-slate-300 group-hover:text-white'
                        )}>
                          {subItem.label}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
        
        {!isCollapsed && (
          <div className="px-3 py-2 mb-2">
            <div className="bg-slate-800 rounded-md p-2 mb-2">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="ml-2 text-sm truncate">
                  <p className="font-medium text-white truncate">
                    {user?.email?.split('@')[0] || 'Usuário'}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{user?.email || ''}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="p-3 border-t border-slate-700">
          <button 
            onClick={handleLogout}
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'w-full'} py-2 px-3 rounded-md text-slate-300 hover:bg-slate-800 hover:text-white transition-colors`}
          >
            <LogOut className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'} text-slate-400`} />
            {!isCollapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>
      
      {/* Overlay para menu mobile */}
      <div className={mobileMenuClasses}>
        {/* Fundo escuro semi-transparente */}
        <div 
          className="fixed inset-0 bg-slate-900 bg-opacity-80"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
        
        {/* Menu mobile */}
        <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-slate-900 text-white shadow-xl overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <Link href="/overview" className="block">
              <h1 className="text-xl font-bold">EmailMax</h1>
            </Link>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="py-4">
            <nav className="space-y-1 px-3">
              {navItems.map((item, index) => (
                <div key={index}>
                  {item.href ? (
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center py-2 px-3 rounded-md transition-colors hover:bg-slate-800 group',
                        item.active ? 'bg-slate-800' : 'transparent'
                      )}
                    >
                      <item.icon className={cn(
                        'h-5 w-5 mr-3',
                        item.active ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-300'
                      )} />
                      <span className={cn(
                        item.active ? 'font-medium text-white' : 'text-slate-300 group-hover:text-white'
                      )}>
                        {item.label}
                      </span>
                    </Link>
                  ) : (
                    <button
                      onClick={() => toggleSubmenu(index)}
                      className={cn(
                        'flex items-center w-full justify-between py-2 px-3 rounded-md transition-colors hover:bg-slate-800 group',
                        item.active ? 'bg-slate-800' : 'transparent'
                      )}
                    >
                      <div className="flex items-center">
                        <item.icon className={cn(
                          'h-5 w-5 mr-3',
                          item.active ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-300'
                        )} />
                        <span className={cn(
                          item.active ? 'font-medium text-white' : 'text-slate-300 group-hover:text-white'
                        )}>
                          {item.label}
                        </span>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-slate-400 transform transition-transform ${item.expanded ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                  
                  {/* Submenu Mobile */}
                  {item.submenu && item.expanded && (
                    <div className="ml-4 pl-3 border-l border-slate-700 mt-1 space-y-1">
                      {item.submenu.map((subItem, subIndex) => (
                        <Link
                          key={subIndex}
                          href={subItem.href || '#'}
                          className={cn(
                            'flex items-center py-1.5 px-3 rounded-md transition-colors hover:bg-slate-800 group',
                            subItem.active ? 'bg-slate-800 bg-opacity-70' : 'transparent'
                          )}
                        >
                          <subItem.icon className={cn(
                            'h-4 w-4 mr-3',
                            subItem.active ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-300'
                          )} />
                          <span className={cn(
                            'text-sm',
                            subItem.active ? 'font-medium text-white' : 'text-slate-300 group-hover:text-white'
                          )}>
                            {subItem.label}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>
          
          <div className="px-4 py-2 mb-2">
            <div className="bg-slate-800 rounded-md p-3">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="ml-3 text-sm truncate">
                  <p className="font-medium text-white truncate">
                    {user?.email?.split('@')[0] || 'Usuário'}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{user?.email || ''}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-4 border-t border-slate-700">
            <button 
              onClick={handleLogout}
              className="flex items-center w-full py-2 px-3 rounded-md text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <LogOut className="h-5 w-5 mr-3 text-slate-400" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
} 