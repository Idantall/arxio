"use client";

import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  BarChart, 
  RefreshCw, 
  AlertTriangle, 
  ShieldCheck,
  FileCode,
  GitBranch,
  Clock,
  Link,
  Filter,
  ArrowUpDown
} from 'lucide-react';

// נתוני דוגמה לסריקות
const scansData = [
  {
    id: 'SCAN-4521',
    name: 'הסריקה השבועית',
    type: 'סריקת אבטחה מקיפה',
    target: 'github.com/user/repo-1',
    status: 'הושלם',
    date: '12 יולי, 2023 15:42',
    duration: '14 דקות',
    issues: {
      critical: 2,
      high: 5,
      medium: 12,
      low: 8
    }
  },
  {
    id: 'SCAN-4522',
    name: 'בדיקת API',
    type: 'סריקת REST API',
    target: 'api.example.com/v2',
    status: 'בתהליך',
    date: '13 יולי, 2023 10:15',
    duration: '8 דקות',
    issues: {
      critical: 0,
      high: 3,
      medium: 6,
      low: 4
    }
  },
  {
    id: 'SCAN-4523',
    name: 'קוד פרונטאנד',
    type: 'סריקת קוד',
    target: 'github.com/user/frontend-app',
    status: 'הושלם',
    date: '10 יולי, 2023 09:23',
    duration: '10 דקות',
    issues: {
      critical: 0,
      high: 0,
      medium: 4,
      low: 7
    }
  },
  {
    id: 'SCAN-4524',
    name: 'מיקרוסרוויס תשלומים',
    type: 'סריקת אבטחה מקיפה',
    target: 'github.com/user/payments-ms',
    status: 'נכשל',
    date: '8 יולי, 2023 16:37',
    duration: '2 דקות',
    issues: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    }
  },
  {
    id: 'SCAN-4525',
    name: 'בסיס נתונים',
    type: 'סריקת אבטחה',
    target: 'db.example.com',
    status: 'הושלם',
    date: '7 יולי, 2023 11:50',
    duration: '20 דקות',
    issues: {
      critical: 1,
      high: 3,
      medium: 8,
      low: 5
    }
  }
];

// סטטוס הסריקה באמצעות תגית צבעונית
function StatusBadge({ status }: { status: string }) {
  let color = '';
  let icon = null;
  
  switch(status) {
    case 'הושלם':
      color = 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      icon = <ShieldCheck size={14} className="mr-1" />;
      break;
    case 'בתהליך':
      color = 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      icon = <RefreshCw size={14} className="mr-1 animate-spin" />;
      break;
    case 'נכשל':
      color = 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      icon = <AlertTriangle size={14} className="mr-1" />;
      break;
    case 'ממתין':
      color = 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      icon = <Clock size={14} className="mr-1" />;
      break;
    default:
      color = 'bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-400';
  }
  
  return (
    <span className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center w-fit ${color}`}>
      {icon}
      {status}
    </span>
  );
}

// תגית סוג סריקה
function ScanTypeBadge({ type }: { type: string }) {
  let color = '';
  let icon = null;
  
  switch(type) {
    case 'סריקת אבטחה מקיפה':
      color = 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      icon = <ShieldCheck size={14} className="mr-1" />;
      break;
    case 'סריקת REST API':
      color = 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      icon = <Link size={14} className="mr-1" />;
      break;
    case 'סריקת קוד':
      color = 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      icon = <FileCode size={14} className="mr-1" />;
      break;
    case 'סריקת אבטחה':
      color = 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400';
      icon = <GitBranch size={14} className="mr-1" />;
      break;
    default:
      color = 'bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-400';
  }
  
  return (
    <span className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center w-fit ${color}`}>
      {icon}
      {type}
    </span>
  );
}

// קומפוננטה עבור קוביות המידע
function StatCard({ label, value, color, icon }: { label: string, value: string, color: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function ScansPage() {
  const [showNewScanModal, setShowNewScanModal] = useState(false);
  const [filter, setFilter] = useState('all');
  
  // פילטור של הסריקות
  const filteredScans = scansData.filter(scan => {
    if (filter === 'all') return true;
    if (filter === 'completed') return scan.status === 'הושלם';
    if (filter === 'inProgress') return scan.status === 'בתהליך';
    if (filter === 'failed') return scan.status === 'נכשל';
    if (filter === 'critical') return scan.issues.critical > 0;
    return true;
  });
  
  // פונקציה לפתיחת מודל סריקה חדשה
  const openNewScanModal = () => {
    setShowNewScanModal(true);
  };
  
  return (
    <div className="space-y-6">
      {/* כותרת הדף ופעולות */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">סריקות אבטחה</h1>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <input 
              type="text" 
              placeholder="חיפוש סריקות..." 
              className="py-2 pl-10 pr-4 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          </div>
          
          <button 
            onClick={openNewScanModal}
            className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm"
          >
            <Plus size={16} />
            סריקה חדשה
          </button>
        </div>
      </div>
      
      {/* קוביות סטטיסטיקה */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="סך הסריקות"
          value="148"
          color="bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
          icon={<BarChart size={20} />}
        />
        <StatCard 
          label="סריקות השבוע"
          value="24"
          color="bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400"
          icon={<BarChart size={20} />}
        />
        <StatCard 
          label="בעיות קריטיות"
          value="8"
          color="bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400"
          icon={<AlertTriangle size={20} />}
        />
        <StatCard 
          label="זמן סריקה ממוצע"
          value="12 דקות"
          color="bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
          icon={<Clock size={20} />}
        />
      </div>
      
      {/* פילטרים */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex flex-wrap gap-2">
        <button 
          className={`px-3 py-2 rounded-md text-sm font-medium ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
          onClick={() => setFilter('all')}
        >
          כל הסריקות
        </button>
        <button 
          className={`px-3 py-2 rounded-md text-sm font-medium ${filter === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
          onClick={() => setFilter('completed')}
        >
          הושלמו
        </button>
        <button 
          className={`px-3 py-2 rounded-md text-sm font-medium ${filter === 'inProgress' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
          onClick={() => setFilter('inProgress')}
        >
          בתהליך
        </button>
        <button 
          className={`px-3 py-2 rounded-md text-sm font-medium ${filter === 'failed' ? 'bg-red-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
          onClick={() => setFilter('failed')}
        >
          נכשלו
        </button>
        <button 
          className={`px-3 py-2 rounded-md text-sm font-medium ${filter === 'critical' ? 'bg-orange-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
          onClick={() => setFilter('critical')}
        >
          בעיות קריטיות
        </button>
      </div>
      
      {/* טבלת סריקות */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/20">
              <tr>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <div className="flex items-center cursor-pointer">
                    שם סריקה
                    <ArrowUpDown size={14} className="mr-1 opacity-50" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  סוג
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  מטרה
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  סטטוס
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  תאריך
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  משך
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  בעיות
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredScans.map((scan) => (
                <tr key={scan.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{scan.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{scan.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <ScanTypeBadge type={scan.type} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">{scan.target}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={scan.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">{scan.date}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">{scan.duration}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {scan.issues.critical > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                          {scan.issues.critical}
                        </span>
                      )}
                      {scan.issues.high > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
                          {scan.issues.high}
                        </span>
                      )}
                      {scan.issues.medium > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                          {scan.issues.medium}
                        </span>
                      )}
                      {scan.issues.low > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                          {scan.issues.low}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* לא נמצאו סריקות */}
        {filteredScans.length === 0 && (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
              <Search className="h-6 w-6 text-gray-500 dark:text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">לא נמצאו סריקות</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">נסה לשנות את הפילטרים או ליצור סריקה חדשה</p>
            <button 
              onClick={openNewScanModal}
              className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm"
            >
              <Plus size={16} />
              סריקה חדשה
            </button>
          </div>
        )}
      </div>
      
      {/* כאן יבוא המודל לסריקה חדשה - בגרסה הבסיסית אנחנו רק מציינים שזה יפותח בעתיד */}
      {showNewScanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">יצירת סריקה חדשה</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">שם הסריקה</label>
                <input 
                  type="text" 
                  placeholder="הזן שם לסריקה..."
                  className="w-full py-2 px-3 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">סוג הסריקה</label>
                <select className="w-full py-2 px-3 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option>סריקת אבטחה מקיפה</option>
                  <option>סריקת REST API</option>
                  <option>סריקת קוד</option>
                  <option>סריקת אבטחה</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">מטרה</label>
                <input 
                  type="text" 
                  placeholder="URL של API, כתובת של שרת, או repo של Github..."
                  className="w-full py-2 px-3 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">תיאור</label>
                <textarea 
                  placeholder="תיאור אופציונלי של הסריקה..."
                  className="w-full py-2 px-3 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 h-20"
                />
              </div>
              
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="schedule-scan"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="schedule-scan" className="mr-2 block text-sm text-gray-700 dark:text-gray-300">
                  תזמן סריקה עתידית
                </label>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3 space-x-reverse">
              <button 
                onClick={() => setShowNewScanModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                ביטול
              </button>
              <button 
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm"
              >
                התחל סריקה
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}