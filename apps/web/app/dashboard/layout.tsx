"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Search, 
  Code, 
  GitBranch, 
  Shield, 
  BarChart, 
  Bell, 
  Settings, 
  User,
  LogOut
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-900">
      {/* סרגל צד */}
      <aside className="fixed inset-y-0 z-10 w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex h-16 items-center justify-center border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <div className="h-8 w-8 rounded-md bg-gradient-to-br from-blue-600 to-indigo-600"></div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Arxio</h1>
          </div>
        </div>
        
        <nav className="p-4 space-y-2">
          <Link 
            href="/dashboard" 
            className={`flex items-center py-2 px-3 rounded-md transition-colors rtl:space-x-reverse ${
              pathname === '/dashboard' 
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
            }`}
          >
            <BarChart size={18} className="mr-2 rtl:ml-2 rtl:mr-0" />
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
            <Code size={18} className="mr-2 rtl:ml-2 rtl:mr-0" />
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
            <Shield size={18} className="mr-2 rtl:ml-2 rtl:mr-0" />
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
            <BarChart size={18} className="mr-2 rtl:ml-2 rtl:mr-0" />
            <span>דוחות</span>
          </Link>
          
          <Link 
            href="/dashboard/settings" 
            className={`flex items-center py-2 px-3 rounded-md transition-colors rtl:space-x-reverse ${
              pathname.startsWith('/dashboard/settings') 
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
            }`}
          >
            <Settings size={18} className="mr-2 rtl:ml-2 rtl:mr-0" />
            <span>הגדרות</span>
          </Link>
        </nav>
      </aside>
      
      {/* אזור תוכן ראשי */}
      <div className="flex flex-col flex-1 ml-64 rtl:mr-64 rtl:ml-0">
        {/* כותרת עליונה */}
        <header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center sticky top-0 z-10 px-6">
          <div className="flex-1 flex items-center">
            <div className="relative w-64">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="חפש..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-semibold">
                  י
                </div>
                <span className="text-gray-700 dark:text-gray-300">ישראל ישראלי</span>
              </button>
              
              {showUserMenu && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <Link 
                    href="/dashboard/profile" 
                    className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <User size={16} className="mr-2 rtl:ml-2 rtl:mr-0" />
                    <span>פרופיל משתמש</span>
                  </Link>
                  <Link 
                    href="/auth/logout" 
                    className="flex items-center px-4 py-2 text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <LogOut size={16} className="mr-2 rtl:ml-2 rtl:mr-0" />
                    <span>התנתקות</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>
        
        {/* תוכן עיקרי */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
} 