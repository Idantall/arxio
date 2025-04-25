"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { User, Edit, CreditCard, Shield, Key, LogOut } from 'lucide-react';

export default function UserPage() {
  const [user, setUser] = useState({
    name: 'ישראל ישראלי',
    email: 'israel@example.com',
    planType: 'פרימיום',
    planExpiry: '20 ביוני, 2024',
    avatar: '/avatar-placeholder.png'
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">פרופיל משתמש</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* פרטי משתמש */}
        <div className="lg:col-span-2 space-y-4">
          {/* כרטיס פרופיל */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-shrink-0 flex justify-center">
                <div className="relative">
                  <div className="h-28 w-28 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white text-4xl font-medium overflow-hidden">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                    ) : (
                      user.name.charAt(0)
                    )}
                  </div>
                  <button className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full hover:bg-blue-700 transition-colors">
                    <Edit size={14} />
                  </button>
                </div>
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{user.name}</h2>
                  <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <div className="px-3 py-1.5 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded-full text-sm font-medium flex items-center">
                    <CreditCard size={14} className="ml-1.5 rtl:mr-1.5 rtl:ml-0" />
                    {user.planType}
                  </div>
                  <div className="px-3 py-1.5 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 rounded-full text-sm font-medium">
                    תוקף: {user.planExpiry}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Link 
                    href="/dashboard/user/edit" 
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md transition-colors flex items-center"
                  >
                    <Edit size={16} className="ml-2 rtl:mr-2 rtl:ml-0" />
                    ערוך פרופיל
                  </Link>
                  <Link 
                    href="/dashboard/user/plan" 
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center"
                  >
                    <CreditCard size={16} className="ml-2 rtl:mr-2 rtl:ml-0" />
                    שנה תוכנית
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          {/* אבטחת חשבון */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">אבטחת חשבון</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md">
                    <Key size={16} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">סיסמה</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">עודכנה לפני 3 חודשים</p>
                  </div>
                </div>
                <Link
                  href="/dashboard/user/change-password"
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md text-sm transition-colors"
                >
                  שנה
                </Link>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md">
                    <Shield size={16} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">אימות דו-שלבי</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">לא מופעל</p>
                  </div>
                </div>
                <Link
                  href="/dashboard/user/two-factor"
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md text-sm transition-colors"
                >
                  הפעל
                </Link>
              </div>
              
              <div className="flex justify-between items-center py-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md">
                    <LogOut size={16} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">התנתק מכל המכשירים</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">מתנתק מכל ההתקנים הפעילים</p>
                  </div>
                </div>
                <button
                  className="px-3 py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-800 dark:text-red-400 rounded-md text-sm transition-colors"
                >
                  התנתק
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* פעילות אחרונה */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">פעילות אחרונה</h3>
            
            <div className="space-y-4">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                <div className="flex justify-between mb-1">
                  <span className="font-medium text-gray-900 dark:text-white">התחברות</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">לפני שעה</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">התחברות מוצלחת מ-Chrome Windows</p>
              </div>
              
              <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                <div className="flex justify-between mb-1">
                  <span className="font-medium text-gray-900 dark:text-white">סיסמה שונתה</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">לפני 3 חודשים</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">שינוי סיסמה מוצלח</p>
              </div>
              
              <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                <div className="flex justify-between mb-1">
                  <span className="font-medium text-gray-900 dark:text-white">שדרוג תוכנית</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">לפני 6 חודשים</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">שדרוג תוכנית מבסיסית לפרימיום</p>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-medium text-gray-900 dark:text-white">הרשמה</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">לפני 8 חודשים</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">יצירת חשבון</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 