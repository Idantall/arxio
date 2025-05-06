'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { redirect } from 'next/navigation';

export default function LogoutPage() {
  useEffect(() => {
    // התנתקות אוטומטית כשמגיעים לדף זה
    const handleLogout = async () => {
      try {
        await signOut({ callbackUrl: '/auth/login' });
      } catch (error) {
        console.error('שגיאה בהתנתקות:', error);
        // ניווט לדף ההתחברות אם הייתה שגיאה
        window.location.href = '/auth/login';
      }
    };

    handleLogout();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="flex items-center justify-center p-8 rounded-lg bg-gray-800 shadow-lg animate-pulse">
        <p className="text-lg">מתנתק מהמערכת...</p>
      </div>
    </div>
  );
} 