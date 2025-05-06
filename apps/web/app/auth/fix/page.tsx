'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { fixAuthIssues } from '@/lib/user-utils';
import { AlertTriangle, Info, Check, RefreshCw } from 'lucide-react';

export default function FixAuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(true);
  const { data: session, status, update } = useSession();
  const router = useRouter();

  // בדיקת מצב האימות בעת טעינת הדף
  useEffect(() => {
    async function checkAuthStatus() {
      if (session?.user?.email) {
        try {
          const response = await fetch('/api/user/get-id');
          const data = await response.json();
          setAuthStatus(data);
        } catch (err) {
          console.error('שגיאה בבדיקת מצב אימות:', err);
        } finally {
          setIsChecking(false);
        }
      } else {
        setIsChecking(false);
      }
    }

    if (status !== 'loading') {
      checkAuthStatus();
    }
  }, [status, session]);

  const handleFixAuth = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const fixResult = await fixAuthIssues(session?.user?.email || undefined);
      setResult(fixResult);
      
      // עדכון נתוני הסשן אחרי תיקון
      await update();
      
      // בדיקה מחודשת של מצב האימות
      const response = await fetch('/api/user/get-id');
      const data = await response.json();
      setAuthStatus(data);
      
      // הפניה לדף הבית אחרי 3 שניות
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
    } catch (err) {
      console.error('שגיאה בתיקון אימות:', err);
      setError(err instanceof Error ? err.message : 'שגיאה בלתי צפויה בתיקון אימות');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || isChecking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <RefreshCw size={20} className="animate-spin rtl:ml-2 ltr:mr-2" />
          <div>בודק מצב אימות...</div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="text-lg font-medium">יש להתחבר כדי לתקן בעיות אימות</div>
        <button
          onClick={() => router.push('/auth/login')}
          className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          התחברות
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="w-full max-w-md rounded-lg border p-6 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold">תיקון בעיות אימות</h1>
        
        <div className="mb-4 text-center">
          {session?.user?.email ? (
            <p className="text-lg">
              מחובר כ: <span className="font-medium">{session.user.email}</span>
            </p>
          ) : (
            <p className="text-red-600">אימייל לא נמצא בחשבון</p>
          )}
        </div>
        
        {/* מצב אימות נוכחי */}
        {authStatus && (
          <div className={`mb-6 p-4 rounded-md ${
            authStatus.valid 
              ? 'bg-green-50 dark:bg-green-900/20' 
              : 'bg-yellow-50 dark:bg-yellow-900/20'
          }`}>
            <div className="flex items-start">
              {authStatus.valid ? (
                <Check size={20} className="mt-0.5 text-green-600 dark:text-green-400 ml-2 flex-shrink-0" />
              ) : (
                <Info size={20} className="mt-0.5 text-yellow-600 dark:text-yellow-400 ml-2 flex-shrink-0" />
              )}
              <div>
                <p className={`font-medium ${
                  authStatus.valid 
                    ? 'text-green-700 dark:text-green-400' 
                    : 'text-yellow-700 dark:text-yellow-400'
                }`}>
                  {authStatus.valid 
                    ? 'מצב אימות תקין' 
                    : 'נמצאו בעיות באימות שלך'}
                </p>
                <p className="mt-1 text-sm">
                  {authStatus.valid 
                    ? `מזהה משתמש תקין: ${authStatus.userId}` 
                    : authStatus.reason || 'יש לתקן את האימות כדי להמשיך להשתמש במערכת'}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {result ? (
          <div className="mb-4 rounded-md bg-green-50 p-4 text-green-700 dark:bg-green-900/20 dark:text-green-300">
            <p className="font-medium">תיקון אימות הצליח!</p>
            <p className="mt-2 text-sm">
              המזהה החדש שלך: {result.userId}
              {result.oldUserId && (
                <span className="block text-xs">
                  (הוחלף ממזהה ישן: {result.oldUserId})
                </span>
              )}
            </p>
            <p className="mt-2 text-sm">מעביר לדף הבית...</p>
          </div>
        ) : error ? (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-300">
            <div className="flex items-start">
              <AlertTriangle size={20} className="mt-0.5 text-red-600 dark:text-red-400 ml-2 flex-shrink-0" />
              <div>
                <p className="font-medium">שגיאה בתיקון אימות</p>
                <p className="mt-1 text-sm">{error}</p>
              </div>
            </div>
          </div>
        ) : null}
        
        <button
          onClick={handleFixAuth}
          disabled={isLoading || !!result || (authStatus?.valid && !authStatus?.needFix)}
          className={`mt-4 w-full rounded-md px-4 py-2 text-white ${
            isLoading || result || (authStatus?.valid && !authStatus?.needFix)
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading 
            ? 'מתקן אימות...' 
            : result 
              ? 'אימות תוקן בהצלחה' 
              : authStatus?.valid && !authStatus?.needFix
                ? 'האימות שלך תקין'
                : 'תקן בעיות אימות'}
        </button>
        
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            אם אתה נתקל בבעיות, נסה{' '}
            <a href="/auth/logout" className="text-blue-600 hover:underline">
              להתנתק
            </a>{' '}
            ולהתחבר מחדש
          </p>
        </div>
      </div>
    </div>
  );
} 