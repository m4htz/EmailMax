'use client'

import { useState } from 'react';
import { Bell, Search, Mail, HelpCircle, Menu, X } from 'lucide-react';
import { useAuth } from '@/lib/store/useAuth';

export function Header() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'U';
  const notifications = [
    { id: 1, title: "Nova conta conectada", read: false },
    { id: 2, title: "Aquecimento concluído", read: true },
  ];
  const unreadCount = notifications.filter(n => !n.read).length;

  const toggleMobileMenu = () => {
    const newState = !mobileMenuOpen;
    setMobileMenuOpen(newState);
    
    // Dispara evento para a sidebar
    const event = new CustomEvent('toggleMobileMenu', { 
      detail: { open: newState } 
    });
    window.dispatchEvent(event);
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4 lg:px-6 shadow-sm">
      <div className="flex items-center lg:hidden">
        <button 
          onClick={toggleMobileMenu}
          className="p-2 rounded-md text-slate-500 hover:bg-slate-100"
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      <div className={`${searchFocused ? 'flex-1 max-w-xl' : 'w-64'} transition-all duration-200 hidden md:block`}>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Pesquisar..."
            className="h-9 w-full rounded-md border border-slate-200 pl-8 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        <div className="hidden md:flex items-center space-x-3 mr-2">
          <button className="p-1.5 rounded-full hover:bg-slate-100 transition-colors">
            <HelpCircle className="h-5 w-5 text-slate-600" />
          </button>
          <button className="p-1.5 rounded-full hover:bg-slate-100 transition-colors">
            <Mail className="h-5 w-5 text-slate-600" />
          </button>
        </div>

        <div className="relative">
          <button 
            className="relative p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="h-5 w-5 text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg border border-slate-200 z-50">
              <div className="p-3 border-b border-slate-100">
                <h3 className="font-medium">Notificações</h3>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.map(notification => (
                  <div key={notification.id} className={`p-3 border-b border-slate-100 last:border-0 flex items-start ${notification.read ? '' : 'bg-blue-50'}`}>
                    <div className={`w-2 h-2 rounded-full mt-1.5 mr-3 ${notification.read ? 'bg-slate-300' : 'bg-blue-500'}`}></div>
                    <div>
                      <p className="text-sm">{notification.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Agora mesmo</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-2 border-t border-slate-100">
                <button className="w-full text-center text-xs text-blue-600 hover:underline py-1">
                  Ver todas as notificações
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium">
            {userInitial}
          </div>
          <span className="text-sm font-medium hidden md:block">
            {user?.email?.split('@')[0] || 'Usuário'}
          </span>
        </div>
      </div>
    </header>
  );
} 