"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { 
  Search, 
  Code, 
  GitBranch, 
  Shield, 
  BarChart, 
  Bell, 
  Settings, 
  User,
  LogOut,
  Loader
} from 'lucide-react';
import AuthGuard from '@/components/auth-guard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // פונקציה להתנתקות
  const handleSignOut = async () => {
    setIsLoading(true);
    await signOut({ redirect: false });
    router.push('/auth/login');
  };

  // חישוב האות הראשונה של שם המשתמש
  const userInitial = session?.user?.name ? session.user.name.charAt(0) : 
                      session?.user?.email ? session.user.email.charAt(0).toUpperCase() : 'A';

  // קבלת שם המשתמש להצגה
  const displayName = session?.user?.name || 
                     (session?.user?.email ? session.user.email.split('@')[0] : 'משתמש');

  return (
    <AuthGuard>
      <div className="fixed inset-0 flex w-full h-full overflow-hidden bg-white dark:bg-gray-900">
        {/* סרגל צד */}
        <aside className="w-64 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm h-full flex-shrink-0">
          <div className="flex h-16 items-center justify-center border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Image 
                src="/logo.png" 
                alt="Arxio Logo" 
                width={120} 
                height={40}
                priority={true}
                className="h-auto dark:brightness-0 dark:invert"
              />
            </div>
          </div>
          
          <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100%-4rem)]">
            <Link 
              href="/dashboard" 
              className={`flex items-center py-2 px-3 rounded-md transition-colors rtl:space-x-reverse ${
                pathname === '/dashboard' 
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              <BarChart size={18} className="ml-2 rtl:mr-2 rtl:ml-0" />
              <span>דשבורד</span>
            </Link>
            
            <Link 
              href="/dashboard/projects" 
              className={`flex items-center py-2 px-3 rounded-md transition-colors rtl:space-x-reverse ${
                pathname.startsWith('/dashboard/projects') 
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              <Code size={18} className="ml-2 rtl:mr-2 rtl:ml-0" />
              <span>פרויקטים</span>
            </Link>
            
            <Link 
              href="/dashboard/scans" 
              className={`flex items-center py-2 px-3 rounded-md transition-colors rtl:space-x-reverse ${
                pathname.startsWith('/dashboard/scans') 
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              <Shield size={18} className="ml-2 rtl:mr-2 rtl:ml-0" />
              <span>סריקות אבטחה</span>
            </Link>
            
            <Link 
              href="/dashboard/reports" 
              className={`flex items-center py-2 px-3 rounded-md transition-colors rtl:space-x-reverse ${
                pathname.startsWith('/dashboard/reports') 
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              <BarChart size={18} className="ml-2 rtl:mr-2 rtl:ml-0" />
              <span>דוחות</span>
            </Link>
            
            <Link 
              href="/dashboard/user" 
              className={`flex items-center py-2 px-3 rounded-md transition-colors rtl:space-x-reverse ${
                pathname.startsWith('/dashboard/user') 
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              <User size={18} className="ml-2 rtl:mr-2 rtl:ml-0" />
              <span>פרופיל</span>
            </Link>
            
            <Link 
              href="/dashboard/settings" 
              className={`flex items-center py-2 px-3 rounded-md transition-colors rtl:space-x-reverse ${
                pathname.startsWith('/dashboard/settings') 
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              <Settings size={18} className="ml-2 rtl:mr-2 rtl:ml-0" />
              <span>הגדרות</span>
            </Link>
          </nav>
        </aside>
        
        {/* אזור תוכן ראשי */}
        <div className="flex flex-col flex-1 w-full overflow-hidden">
          {/* כותרת עליונה */}
          <header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center sticky top-0 z-10 px-6 flex-shrink-0">
            <div className="flex-1 flex items-center">
              <div className="relative w-64">
                <Search size={18} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="חפש..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10 pl-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <button className="p-2 rounded-full text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                <Bell size={20} />
              </button>
              
              <div className="relative">
                <button 
                  className="flex items-center space-x-2 rtl:space-x-reverse focus:outline-none"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  {session?.user?.image ? (
                    <Image 
                      src={session.user.image} 
                      alt={displayName} 
                      width={32} 
                      height={32} 
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-semibold">
                      {userInitial}
                    </div>
                  )}
                  <span className="text-gray-700 dark:text-gray-300 mr-2 rtl:ml-2 rtl:mr-0">
                    {displayName}
                  </span>
                </button>
                
                {showUserMenu && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-40">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium">{displayName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{session?.user?.email}</p>
                    </div>
                    <Link 
                      href="/dashboard/user" 
                      className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <User size={16} className="ml-2 rtl:mr-2 rtl:ml-0" />
                      <span>פרופיל משתמש</span>
                    </Link>
                    <button 
                      onClick={handleSignOut}
                      className="flex items-center px-4 py-2 text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-right"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader size={16} className="ml-2 rtl:mr-2 rtl:ml-0 animate-spin" />
                      ) : (
                        <LogOut size={16} className="ml-2 rtl:mr-2 rtl:ml-0" />
                      )}
                      <span>התנתקות</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>
          
          {/* תוכן עיקרי */}
          <main className="flex-1 p-6 overflow-auto bg-gray-50 dark:bg-gray-900">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
} 