"use client";

import React, { useState } from 'react';
import { Save, Moon, Sun, Bell, Lock, Globe, PieChart } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    theme: 'system',
    language: 'he',
    notifications: {
      email: true,
      browser: true,
      scan_completed: true,
      vulnerability_found: true,
      weekly_report: true
    },
    privacy: {
      share_analytics: true,
      save_scan_history: true
    }
  });

  const handleThemeChange = (theme: string) => {
    setSettings(prev => ({ ...prev, theme }));
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSettings(prev => ({ ...prev, language: e.target.value }));
  };

  const toggleNotification = (key: string) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key as keyof typeof prev.notifications]
      }
    }));
  };

  const togglePrivacy = (key: string) => {
    setSettings(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: !prev.privacy[key as keyof typeof prev.privacy]
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">הגדרות</h1>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center">
          <Save size={16} className="ml-2 rtl:mr-2 rtl:ml-0" />
          שמור שינויים
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* הגדרות ראשיות */}
        <div className="lg:col-span-2 space-y-6">
          {/* הגדרות ממשק */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md">
                <Globe size={18} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">הגדרות ממשק</h3>
            </div>
            
            <div className="space-y-6">
              {/* ערכת נושא */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ערכת נושא</label>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleThemeChange('light')}
                    className={`px-4 py-2 rounded-md flex items-center gap-2 ${
                      settings.theme === 'light' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    <Sun size={16} />
                    בהיר
                  </button>
                  <button
                    onClick={() => handleThemeChange('dark')}
                    className={`px-4 py-2 rounded-md flex items-center gap-2 ${
                      settings.theme === 'dark' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    <Moon size={16} />
                    כהה
                  </button>
                  <button
                    onClick={() => handleThemeChange('system')}
                    className={`px-4 py-2 rounded-md flex items-center gap-2 ${
                      settings.theme === 'system' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    מערכת
                  </button>
                </div>
              </div>

              {/* שפה */}
              <div>
                <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">שפה</label>
                <select
                  id="language"
                  value={settings.language}
                  onChange={handleLanguageChange}
                  className="w-full py-2 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="he">עברית</option>
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                  <option value="ru">Русский</option>
                </select>
              </div>
            </div>
          </div>

          {/* הגדרות התראות */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md">
                <Bell size={18} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">הגדרות התראות</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">התראות במייל</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">קבל התראות לתיבת הדואר</p>
                </div>
                <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                  <input
                    type="checkbox"
                    id="email-toggle"
                    checked={settings.notifications.email}
                    onChange={() => toggleNotification('email')}
                    className="opacity-0 w-0 h-0"
                  />
                  <label
                    htmlFor="email-toggle"
                    className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-all duration-300 ${
                      settings.notifications.email ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 bg-white dark:bg-gray-100 w-4 h-4 rounded-full transition-all duration-300 ${
                        settings.notifications.email ? 'transform translate-x-6 rtl:-translate-x-6' : ''
                      }`}
                    ></span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">התראות דפדפן</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">קבל התראות בדפדפן</p>
                </div>
                <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                  <input
                    type="checkbox"
                    id="browser-toggle"
                    checked={settings.notifications.browser}
                    onChange={() => toggleNotification('browser')}
                    className="opacity-0 w-0 h-0"
                  />
                  <label
                    htmlFor="browser-toggle"
                    className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-all duration-300 ${
                      settings.notifications.browser ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 bg-white dark:bg-gray-100 w-4 h-4 rounded-full transition-all duration-300 ${
                        settings.notifications.browser ? 'transform translate-x-6 rtl:-translate-x-6' : ''
                      }`}
                    ></span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">סיום סריקה</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">התראות כאשר סריקה מסתיימת</p>
                </div>
                <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                  <input
                    type="checkbox"
                    id="scan-toggle"
                    checked={settings.notifications.scan_completed}
                    onChange={() => toggleNotification('scan_completed')}
                    className="opacity-0 w-0 h-0"
                  />
                  <label
                    htmlFor="scan-toggle"
                    className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-all duration-300 ${
                      settings.notifications.scan_completed ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 bg-white dark:bg-gray-100 w-4 h-4 rounded-full transition-all duration-300 ${
                        settings.notifications.scan_completed ? 'transform translate-x-6 rtl:-translate-x-6' : ''
                      }`}
                    ></span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">מציאת חולשות</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">התראות כאשר נמצאות חולשות חדשות</p>
                </div>
                <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                  <input
                    type="checkbox"
                    id="vuln-toggle"
                    checked={settings.notifications.vulnerability_found}
                    onChange={() => toggleNotification('vulnerability_found')}
                    className="opacity-0 w-0 h-0"
                  />
                  <label
                    htmlFor="vuln-toggle"
                    className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-all duration-300 ${
                      settings.notifications.vulnerability_found ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 bg-white dark:bg-gray-100 w-4 h-4 rounded-full transition-all duration-300 ${
                        settings.notifications.vulnerability_found ? 'transform translate-x-6 rtl:-translate-x-6' : ''
                      }`}
                    ></span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">דוח שבועי</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">קבל דוח שבועי של פעילות</p>
                </div>
                <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                  <input
                    type="checkbox"
                    id="report-toggle"
                    checked={settings.notifications.weekly_report}
                    onChange={() => toggleNotification('weekly_report')}
                    className="opacity-0 w-0 h-0"
                  />
                  <label
                    htmlFor="report-toggle"
                    className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-all duration-300 ${
                      settings.notifications.weekly_report ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 bg-white dark:bg-gray-100 w-4 h-4 rounded-full transition-all duration-300 ${
                        settings.notifications.weekly_report ? 'transform translate-x-6 rtl:-translate-x-6' : ''
                      }`}
                    ></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* פרטיות ואבטחה */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md">
                <Lock size={18} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">פרטיות ואבטחה</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">שתף נתוני שימוש</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">עזור לנו לשפר את המוצר</p>
                </div>
                <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                  <input
                    type="checkbox"
                    id="analytics-toggle"
                    checked={settings.privacy.share_analytics}
                    onChange={() => togglePrivacy('share_analytics')}
                    className="opacity-0 w-0 h-0"
                  />
                  <label
                    htmlFor="analytics-toggle"
                    className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-all duration-300 ${
                      settings.privacy.share_analytics ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 bg-white dark:bg-gray-100 w-4 h-4 rounded-full transition-all duration-300 ${
                        settings.privacy.share_analytics ? 'transform translate-x-6 rtl:-translate-x-6' : ''
                      }`}
                    ></span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">שמור היסטוריית סריקות</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">שמור היסטוריה של כל הסריקות שבוצעו</p>
                </div>
                <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                  <input
                    type="checkbox"
                    id="history-toggle"
                    checked={settings.privacy.save_scan_history}
                    onChange={() => togglePrivacy('save_scan_history')}
                    className="opacity-0 w-0 h-0"
                  />
                  <label
                    htmlFor="history-toggle"
                    className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-all duration-300 ${
                      settings.privacy.save_scan_history ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 bg-white dark:bg-gray-100 w-4 h-4 rounded-full transition-all duration-300 ${
                        settings.privacy.save_scan_history ? 'transform translate-x-6 rtl:-translate-x-6' : ''
                      }`}
                    ></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md">
                <PieChart size={18} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">נתוני מערכת</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between py-2">
                <span className="text-gray-600 dark:text-gray-400">גרסה</span>
                <span className="font-medium text-gray-900 dark:text-white">1.2.5</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600 dark:text-gray-400">סריקות שנותרו</span>
                <span className="font-medium text-gray-900 dark:text-white">42 / חודש</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600 dark:text-gray-400">נפח אחסון</span>
                <span className="font-medium text-gray-900 dark:text-white">2.1GB / 5GB</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600 dark:text-gray-400">סטטוס שרת</span>
                <span className="text-green-600 dark:text-green-400 font-medium">פעיל</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 