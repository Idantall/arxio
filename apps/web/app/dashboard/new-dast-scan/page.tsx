'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, AlertTriangle, RefreshCw, Check } from 'lucide-react';

export default function NewDastScanPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [url, setUrl] = useState('https://idanss.com');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scanCreated, setScanCreated] = useState(false);
  const [scanResults, setScanResults] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // בדיקת פרטי משתמש בטעינת הדף
  useEffect(() => {
    const checkUser = async () => {
      try {
        if (session?.user?.email) {
          // ניסיון לקבל מזהה לפי אימייל
          const response = await fetch(`/api/user/get-id`);
          const data = await response.json();
          
          if (data.userId) {
            console.log('נמצא מזהה משתמש:', data.userId);
            setUserId(data.userId);
          } else {
            console.log('לא נמצא מזהה למשתמש, משתמש באימייל כמזהה חלופי');
            setUserId(session.user.email);
          }
        }
      } catch (error) {
        console.error('שגיאה בבדיקת פרטי משתמש:', error);
      }
    };
    
    if (status === 'authenticated') {
      checkUser();
    }
  }, [session, status]);
  
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    try {
      if (!url.trim()) {
        throw new Error('נא להזין כתובת URL לסריקה');
      }
      
      // ודא שיש פרוטוקול בכתובת
      let targetUrl = url;
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl;
      }
      
      // נתוני הסריקה
      const scanData = {
        name: `DAST סריקת - ${new URL(targetUrl).hostname}`,
        type: 'DAST',
        target: targetUrl,
        userId: userId || session?.user?.email || 'anonymous-user',
        parameters: {
          depth: 2,
          excludeUrls: [],
          includeSubdomains: true
        }
      };
      
      console.log('שולח בקשת סריקה:', scanData);
      
      // שליחת בקשת הסריקה
      const response = await fetch('/api/scans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scanData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'אירעה שגיאה ביצירת הסריקה');
      }
      
      console.log('סריקה נוצרה בהצלחה:', data);
      setScanResults(data);
      setScanCreated(true);
      
      // בדיקת סטטוס הסריקה אחרי יצירה
      checkScanStatus(data.scanId);
      
    } catch (error) {
      console.error('שגיאה ביצירת סריקה:', error);
      setError(error instanceof Error ? error.message : 'אירעה שגיאה ביצירת הסריקה');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // פונקציית בדיקת סטטוס הסריקה
  const checkScanStatus = async (scanId: string) => {
    try {
      // מחלץ את המזהה ללא התחילית 
      const actualId = scanId.startsWith('scan-') ? scanId.substring(5) : scanId;
      
      // שליחת בקשה לבדיקת סטטוס
      const response = await fetch(`/api/scans?id=${actualId}`);
      const data = await response.json();
      
      console.log('סטטוס סריקה:', data);
      
      if (response.ok && data) {
        // עדכון תוצאות הסריקה
        setScanResults(prevResults => ({
          ...prevResults,
          status: data.status,
          startTime: data.start_time,
          completedAt: data.completed_at,
          findingsCount: data.findings_count
        }));
        
        // אם הסריקה עדיין מתבצעת, בדוק שוב בעוד 3 שניות
        if (data.status === 'running' || data.status === 'pending') {
          setTimeout(() => checkScanStatus(scanId), 3000);
        }
      }
    } catch (error) {
      console.error('שגיאה בבדיקת סטטוס סריקה:', error);
    }
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/dashboard" className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mr-4">
            <ArrowLeft size={18} className="ml-1 rtl:rotate-180" />
            <span>חזרה לדשבורד</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">סריקת DAST חדשה</h1>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/20 dark:border-red-800">
            <div className="flex items-center">
              <AlertTriangle size={18} className="text-red-600 dark:text-red-400 ml-2" />
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}
        
        {scanCreated ? (
          <div className="space-y-6">
            <div className="p-4 bg-green-50 border border-green-200 rounded-md dark:bg-green-900/20 dark:border-green-800">
              <div className="flex items-center">
                <Check size={18} className="text-green-600 dark:text-green-400 ml-2" />
                <p className="text-green-600 dark:text-green-400">הסריקה נוצרה בהצלחה!</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">פרטי הסריקה</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-md">
                  <p className="text-sm text-gray-500 dark:text-gray-400">מזהה סריקה</p>
                  <p className="font-medium">{scanResults?.scanId || 'לא זמין'}</p>
                </div>
                
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-md">
                  <p className="text-sm text-gray-500 dark:text-gray-400">סטטוס</p>
                  <div className="flex items-center">
                    {scanResults?.status === 'running' || scanResults?.status === 'pending' ? (
                      <RefreshCw size={16} className="mr-1 animate-spin text-blue-500" />
                    ) : scanResults?.status === 'completed' ? (
                      <Check size={16} className="mr-1 text-green-500" />
                    ) : (
                      <AlertTriangle size={16} className="mr-1 text-yellow-500" />
                    )}
                    <p className="font-medium">
                      {scanResults?.status === 'pending' ? 'ממתין לעיבוד' : 
                       scanResults?.status === 'running' ? 'מתבצע' :
                       scanResults?.status === 'completed' ? 'הושלם' :
                       scanResults?.status || 'ממתין להתחלה'}
                    </p>
                  </div>
                </div>
                
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-md">
                  <p className="text-sm text-gray-500 dark:text-gray-400">כתובת יעד</p>
                  <div className="flex items-center">
                    <p className="font-medium truncate">{url}</p>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-500 hover:text-blue-600">
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
                
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-md">
                  <p className="text-sm text-gray-500 dark:text-gray-400">ממצאים</p>
                  <p className="font-medium">{scanResults?.findingsCount !== undefined ? scanResults.findingsCount : 'טרם נמצאו'}</p>
                </div>
              </div>
              
              <div className="mt-6">
                <button 
                  onClick={() => router.push('/dashboard')}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md text-gray-800 dark:text-gray-200"
                >
                  חזרה לדשבורד
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                כתובת URL לסריקה
              </label>
              <input
                id="url"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                הזן את כתובת ה-URL שברצונך לסרוק. הסריקה תבדוק את האתר לגילוי פגיעויות אבטחה.
              </p>
            </div>
            
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={16} className="ml-2 animate-spin" />
                    מתחיל סריקה...
                  </>
                ) : (
                  'התחל סריקה'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
} 