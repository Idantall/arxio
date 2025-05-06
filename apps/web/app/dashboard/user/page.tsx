"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { 
  User, Edit, CreditCard, Shield, Key, LogOut, 
  Zap, BarChart2, CheckCircle, Clock, AlertTriangle, Info, XCircle
} from 'lucide-react';

// הגדרות של מגבלות התוכניות השונות
const PLAN_LIMITS = {
  free: {
    max_scans_per_month: 5,
    max_concurrent_scans: 1,
    allowed_scan_types: ['dast'],
    label: 'חינם',
    color: 'blue',
    icon: User
  },
  pro: {
    max_scans_per_month: 50,
    max_concurrent_scans: 3,
    allowed_scan_types: ['dast', 'sast', 'api'],
    label: 'מקצועי',
    color: 'emerald',
    icon: Shield
  },
  enterprise: {
    max_scans_per_month: 0, // ללא הגבלה
    max_concurrent_scans: 10,
    allowed_scan_types: ['dast', 'sast', 'api'],
    label: 'ארגוני',
    color: 'purple',
    icon: Zap
  }
};

export default function UserPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [usageStats, setUsageStats] = useState({
    scansThisMonth: 0,
    activeScans: 0,
    totalScans: 0,
    plan: 'free',
    planExpiry: null
  });
  // הוספת סטייט להודעות התראה
  const [userAlert, setUserAlert] = useState<{
    type: 'warning' | 'info' | 'success';
    message: string;
  } | null>(null);
  
  const [user, setUser] = useState({
    name: 'ישראל ישראלי',
    email: 'israel@example.com',
    planType: 'חינם', // ברירת מחדל
    avatar: ''
  });

  // טעינת נתוני המשתמש והסטטיסטיקות
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // נניח שיש לנו API שמספק את נתוני התוכנית והשימוש
        const response = await fetch('/api/user/plan-info');
        const data = await response.json();
        
        if (data.success) {
          // עדכון הסטטיסטיקות
          setUsageStats({
            scansThisMonth: data.scansThisMonth || 0,
            activeScans: data.activeScans || 0,
            totalScans: data.totalScans || 0,
            plan: data.plan || 'free',
            planExpiry: data.planExpiry
          });
          
          // עדכון נתוני המשתמש
          setUser({
            name: session?.user?.name || 'משתמש',
            email: session?.user?.email || 'user@example.com',
            planType: PLAN_LIMITS[data.plan || 'free'].label,
            avatar: session?.user?.image || ''
          });
          
          // בדיקה אם המשתמש מתקרב למגבלות התוכנית
          checkUserLimits({
            plan: data.plan || 'free',
            scansThisMonth: data.scansThisMonth || 0,
            activeScans: data.activeScans || 0
          });
        }
      } catch (error) {
        console.error('שגיאה בטעינת נתוני משתמש:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (session) {
      loadUserData();
    }
  }, [session]);

  // בדיקת מגבלות תוכנית המשתמש
  const checkUserLimits = ({ plan, scansThisMonth, activeScans }) => {
    const planLimits = PLAN_LIMITS[plan];
    
    // בדיקת מגבלת סריקות חודשיות
    if (planLimits.max_scans_per_month > 0) {
      const scanLimit = planLimits.max_scans_per_month;
      const usagePercent = (scansThisMonth / scanLimit) * 100;
      
      if (usagePercent >= 100) {
        setUserAlert({
          type: 'warning',
          message: `הגעת למגבלת הסריקות החודשיות (${scanLimit}). שדרג את התוכנית כדי לבצע סריקות נוספות.`
        });
        return;
      } else if (usagePercent >= 80) {
        setUserAlert({
          type: 'warning',
          message: `השתמשת ב-${scansThisMonth} מתוך ${scanLimit} סריקות חודשיות (${Math.round(usagePercent)}%). מומלץ לשדרג את התוכנית.`
        });
        return;
      }
    }
    
    // בדיקת מגבלת סריקות מקבילות
    const concurrentLimit = planLimits.max_concurrent_scans;
    const concurrentPercent = (activeScans / concurrentLimit) * 100;
    
    if (concurrentPercent >= 90) {
      setUserAlert({
        type: 'info',
        message: `אתה מריץ ${activeScans} מתוך ${concurrentLimit} סריקות מותרות במקביל.`
      });
      return;
    }
    
    // בדיקת מגבלות סוגי סריקה
    if (planLimits.allowed_scan_types.length < 3 && plan !== 'enterprise') {
      setUserAlert({
        type: 'info',
        message: `שדרוג התוכנית יאפשר לך גישה לסוגי סריקות נוספים.`
      });
      return;
    }
  };

  // המרת ערך למחרוזת "ללא הגבלה" אם הוא 0
  const formatLimit = (limit) => {
    return limit === 0 ? 'ללא הגבלה' : limit;
  };

  // חישוב אחוז שימוש (עבור פס ההתקדמות)
  const calculateUsagePercent = (used, limit) => {
    if (limit === 0) return 0; // אם אין הגבלה, מציגים 0%
    return Math.min(Math.round((used / limit) * 100), 100);
  };
  
  // קביעת צבע לפי רמת השימוש
  const getUsageColor = (percent) => {
    if (percent < 50) return 'bg-emerald-500';
    if (percent < 80) return 'bg-amber-500';
    return 'bg-red-500';
  };

  // קבלת מערך של סוגי סריקות מותרים בצורת תווית
  const getAllowedScanTypes = (plan) => {
    const types = PLAN_LIMITS[plan || 'free'].allowed_scan_types;
    return types.map(type => {
      switch(type) {
        case 'dast': return { name: 'DAST', color: 'bg-green-100 text-green-800' };
        case 'sast': return { name: 'SAST', color: 'bg-blue-100 text-blue-800' };
        case 'api': return { name: 'API', color: 'bg-purple-100 text-purple-800' };
        default: return { name: type.toUpperCase(), color: 'bg-gray-100 text-gray-800' };
      }
    });
  };

  // קביעת צבע לפי סוג התוכנית
  const getPlanStyles = (plan) => {
    const planInfo = PLAN_LIMITS[plan || 'free'];
    const colors = {
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400',
      purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
    };
    
    return colors[planInfo.color] || colors.blue;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">פרופיל משתמש</h1>
      </div>

      {/* הצגת התראות למשתמש */}
      {userAlert && (
        <div className={`p-4 rounded-lg ${
          userAlert.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
          userAlert.type === 'info' ? 'bg-blue-50 border-blue-200 text-blue-800' :
          'bg-emerald-50 border-emerald-200 text-emerald-800'
        } border flex items-start`}>
          <div className="flex-shrink-0 mr-3">
            {userAlert.type === 'warning' ? (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            ) : userAlert.type === 'info' ? (
              <Info className="w-5 h-5 text-blue-600" />
            ) : (
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            )}
          </div>
          <div className="flex-grow">
            <p className="text-sm font-medium">{userAlert.message}</p>
          </div>
          <button 
            className="ml-4 text-gray-500 hover:text-gray-700"
            onClick={() => setUserAlert(null)}
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      )}

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
                  <div className={`px-3 py-1.5 ${getPlanStyles(usageStats.plan)} rounded-full text-sm font-medium flex items-center`}>
                    {React.createElement(PLAN_LIMITS[usageStats.plan]?.icon || User, { size: 14, className: "ml-1.5 rtl:mr-1.5 rtl:ml-0" })}
                    {user.planType}
                  </div>
                  {usageStats.planExpiry && (
                    <div className="px-3 py-1.5 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 rounded-full text-sm font-medium flex items-center">
                      <Clock size={14} className="ml-1.5 rtl:mr-1.5 rtl:ml-0" />
                      תוקף: {usageStats.planExpiry}
                    </div>
                  )}
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

          {/* סטטיסטיקות שימוש */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <BarChart2 className="ml-2 rtl:mr-2 rtl:ml-0" size={20} />
              סטטיסטיקות שימוש
            </h3>

            <div className="space-y-6">
              {/* סריקות חודשיות */}
              <div>
                <div className="flex justify-between mb-2">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900 dark:text-white">סריקות בחודש הנוכחי</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {usageStats.scansThisMonth} מתוך {formatLimit(PLAN_LIMITS[usageStats.plan]?.max_scans_per_month)}
                    </span>
                  </div>
                  {PLAN_LIMITS[usageStats.plan]?.max_scans_per_month > 0 && usageStats.scansThisMonth >= PLAN_LIMITS[usageStats.plan]?.max_scans_per_month && (
                    <span className="flex items-center text-red-600 text-sm">
                      <AlertTriangle size={14} className="ml-1 rtl:mr-1 rtl:ml-0" />
                      הגעת למגבלה
                    </span>
                  )}
                </div>
                {PLAN_LIMITS[usageStats.plan]?.max_scans_per_month > 0 && (
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${getUsageColor(calculateUsagePercent(usageStats.scansThisMonth, PLAN_LIMITS[usageStats.plan]?.max_scans_per_month))}`}
                      style={{ width: `${calculateUsagePercent(usageStats.scansThisMonth, PLAN_LIMITS[usageStats.plan]?.max_scans_per_month)}%` }}
                    ></div>
                  </div>
                )}
              </div>

              {/* סריקות פעילות */}
              <div>
                <div className="flex justify-between mb-2">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900 dark:text-white">סריקות פעילות כעת</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {usageStats.activeScans} מתוך {PLAN_LIMITS[usageStats.plan]?.max_concurrent_scans}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${getUsageColor(calculateUsagePercent(usageStats.activeScans, PLAN_LIMITS[usageStats.plan]?.max_concurrent_scans))}`}
                    style={{ width: `${calculateUsagePercent(usageStats.activeScans, PLAN_LIMITS[usageStats.plan]?.max_concurrent_scans)}%` }}
                  ></div>
                </div>
              </div>

              {/* סך כל הסריקות */}
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="font-medium text-gray-900 dark:text-white">סך הכל סריקות שבוצעו</span>
                <div className="mt-1 flex items-center">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{usageStats.totalScans}</span>
                  <CheckCircle className="mr-2 text-emerald-500" size={16} />
                </div>
              </div>

              {/* סוגי סריקות מותרים */}
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="font-medium text-gray-900 dark:text-white mb-2 block">סוגי סריקות זמינים</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {getAllowedScanTypes(usageStats.plan).map((type, index) => (
                    <span key={index} className={`px-2.5 py-1 rounded-full text-xs font-medium ${type.color}`}>
                      {type.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* אבטחת חשבון */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Shield className="ml-2 rtl:mr-2 rtl:ml-0" size={20} />
              אבטחת חשבון
            </h3>

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
          {/* מידע על התוכנית */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <CreditCard className="ml-2 rtl:mr-2 rtl:ml-0" size={20} />
              פרטי תוכנית
            </h3>
            
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border ${getPlanStyles(usageStats.plan).replace('bg-', 'border-').replace(' text-', ' ')}`}>
                <div className="flex items-center mb-2">
                  {React.createElement(PLAN_LIMITS[usageStats.plan]?.icon || User, { 
                    size: 20, 
                    className: getPlanStyles(usageStats.plan).replace('bg-', 'text-').split(' ')[1]
                  })}
                  <span className="text-lg font-bold mr-2 rtl:ml-2 rtl:mr-0 text-gray-900 dark:text-white">
                    תוכנית {user.planType}
                  </span>
                </div>
                
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">סריקות חודשיות:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatLimit(PLAN_LIMITS[usageStats.plan]?.max_scans_per_month)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">סריקות במקביל:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{PLAN_LIMITS[usageStats.plan]?.max_concurrent_scans}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">סוגי סריקות:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {PLAN_LIMITS[usageStats.plan]?.allowed_scan_types.length}
                    </span>
                  </div>
                </div>
                
                <Link 
                  href="/dashboard/user/upgrade"
                  className="mt-4 block w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-md transition-colors"
                >
                  שדרג לתוכנית גבוהה יותר
                </Link>
              </div>
            </div>
          </div>
          
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