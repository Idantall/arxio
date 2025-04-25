"use client";

import React, { useState } from 'react';
import { Download, Calendar, Filter, ArrowDown, ArrowUp, Eye } from 'lucide-react';

// מידע לדוגמה עבור הדוחות
const reportsData = [
  { 
    id: 'REP-7829',
    date: '25 יוני, 2023',
    type: 'סריקת אבטחה',
    status: 'הושלם',
    targets: 3,
    findings: 8,
    severity: 'גבוהה'
  },
  { 
    id: 'REP-7830',
    date: '18 יוני, 2023',
    type: 'סריקת קוד',
    status: 'הושלם',
    targets: 1,
    findings: 3,
    severity: 'בינונית'
  },
  { 
    id: 'REP-7831',
    date: '12 יוני, 2023',
    type: 'סריקת אבטחה',
    status: 'הושלם',
    targets: 2,
    findings: 0,
    severity: 'נמוכה'
  },
  { 
    id: 'REP-7832',
    date: '10 יוני, 2023',
    type: 'סריקת REST API',
    status: 'הושלם',
    targets: 1,
    findings: 12,
    severity: 'קריטית'
  },
  { 
    id: 'REP-7833',
    date: '5 יוני, 2023',
    type: 'סריקת אבטחה',
    status: 'הושלם',
    targets: 4,
    findings: 2,
    severity: 'בינונית'
  },
  { 
    id: 'REP-7834',
    date: '1 יוני, 2023',
    type: 'סריקת קוד',
    status: 'הושלם',
    targets: 1,
    findings: 5,
    severity: 'גבוהה'
  }
];

// פונקציית עזר להצגת סרגל התקדמות צבעוני
function ProgressBar({ value, max, color }: { value: number, max: number, color: string }) {
  const percentage = Math.min(Math.round((value / max) * 100), 100);
  
  return (
    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
      <div 
        className={`h-2 rounded-full ${color}`} 
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

// פונקציית עזר להצגת תגית חומרה
function SeverityBadge({ severity }: { severity: string }) {
  let color = '';
  
  switch(severity) {
    case 'קריטית':
      color = 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      break;
    case 'גבוהה':
      color = 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      break;
    case 'בינונית':
      color = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      break;
    case 'נמוכה':
      color = 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      break;
    default:
      color = 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  }
  
  return (
    <span className={`px-2.5 py-0.5 rounded-md text-xs font-medium ${color}`}>
      {severity}
    </span>
  );
}

export default function ReportsPage() {
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [timeRange, setTimeRange] = useState('month');
  
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  const sortedReports = [...reportsData].sort((a, b) => {
    if (sortField === 'findings') {
      return sortDirection === 'asc' ? a.findings - b.findings : b.findings - a.findings;
    }
    
    // סדר לפי מזהה כברירת מחדל (לפי תאריך)
    return sortDirection === 'asc' 
      ? a.id.localeCompare(b.id) 
      : b.id.localeCompare(a.id);
  });
  
  return (
    <div className="space-y-6">
      {/* כותרת הדף ופעולות */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">דוחות וסטטיסטיקות</h1>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <select 
              className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md py-2 pl-10 pr-4 text-sm leading-tight focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="week">7 ימים אחרונים</option>
              <option value="month">30 ימים אחרונים</option>
              <option value="quarter">רבעון אחרון</option>
              <option value="year">שנה אחרונה</option>
            </select>
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          </div>
          
          <button className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm">
            <Download size={14} />
            ייצוא נתונים
          </button>
        </div>
      </div>
      
      {/* כרטיסי סטטיסטיקה */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">סך הסריקות</h3>
          <div className="mt-1 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">148</p>
            <span className="mr-2 text-sm text-green-600 dark:text-green-400">+12.5%</span>
          </div>
          <div className="mt-3">
            <ProgressBar value={148} max={200} color="bg-blue-600" />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">74% מהכמות החודשית</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">ממוצע פגיעויות לסריקה</h3>
          <div className="mt-1 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">4.2</p>
            <span className="mr-2 text-sm text-red-600 dark:text-red-400">+2.3%</span>
          </div>
          <div className="mt-3">
            <ProgressBar value={4.2} max={10} color="bg-orange-500" />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">חומרה ממוצעת: בינונית</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">זמן סריקה ממוצע</h3>
          <div className="mt-1 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">14 דקות</p>
            <span className="mr-2 text-sm text-green-600 dark:text-green-400">-10.2%</span>
          </div>
          <div className="mt-3">
            <ProgressBar value={14} max={60} color="bg-green-500" />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">זמן מהיר ביחס לממוצע בתעשייה</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">פגיעויות קריטיות</h3>
          <div className="mt-1 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">12</p>
            <span className="mr-2 text-sm text-red-600 dark:text-red-400">+3</span>
          </div>
          <div className="mt-3">
            <ProgressBar value={12} max={50} color="bg-red-600" />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">יש לטפל בהקדם</p>
          </div>
        </div>
      </div>
      
      {/* גרפים (מיוצגים כדי להמחשה) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">סריקות לאורך זמן</h3>
          
          {/* מקום לגרף - כאן ניתן להשתמש ב- Chart.js או ספריה דומה */}
          <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">כאן יוצג גרף סריקות לפי זמן</p>
          </div>
          
          <div className="mt-3 flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>אפריל</span>
            <span>מאי</span>
            <span>יוני</span>
            <span>יולי</span>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">התפלגות פגיעויות לפי חומרה</h3>
          
          {/* מקום לגרף - כאן ניתן להשתמש ב- Chart.js או ספריה דומה */}
          <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">כאן יוצג גרף פאי של פגיעויות לפי חומרה</p>
          </div>
          
          <div className="mt-3 grid grid-cols-4 gap-2">
            <div className="flex items-center">
              <div className="h-3 w-3 rounded-full bg-red-500 mr-1"></div>
              <span className="text-xs text-gray-500 dark:text-gray-400">קריטית</span>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-3 rounded-full bg-orange-500 mr-1"></div>
              <span className="text-xs text-gray-500 dark:text-gray-400">גבוהה</span>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-3 rounded-full bg-yellow-500 mr-1"></div>
              <span className="text-xs text-gray-500 dark:text-gray-400">בינונית</span>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-3 rounded-full bg-green-500 mr-1"></div>
              <span className="text-xs text-gray-500 dark:text-gray-400">נמוכה</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* טבלת דוחות */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">דוחות אחרונים</h3>
          
          <div className="flex items-center">
            <button className="mr-2 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
              <Filter size={18} />
            </button>
            <select className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md py-1 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option>כל הדוחות</option>
              <option>סריקות אבטחה</option>
              <option>סריקות קוד</option>
              <option>סריקות API</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/20">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('id')}
                >
                  <div className="flex items-center">
                    מזהה דוח
                    {sortField === 'id' && (
                      sortDirection === 'asc' ? 
                        <ArrowUp className="h-3 w-3 mr-1" /> : 
                        <ArrowDown className="h-3 w-3 mr-1" />
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  תאריך
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  סוג סריקה
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('findings')}
                >
                  <div className="flex items-center">
                    ממצאים
                    {sortField === 'findings' && (
                      sortDirection === 'asc' ? 
                        <ArrowUp className="h-3 w-3 mr-1" /> : 
                        <ArrowDown className="h-3 w-3 mr-1" />
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  חומרה
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  פעולות
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {report.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {report.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {report.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {report.findings}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <SeverityBadge severity={report.severity} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex justify-end space-x-3 space-x-reverse">
                      <button 
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        title="צפייה בדוח"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                        title="הורדת דוח"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            מציג <span className="font-medium">{reportsData.length}</span> מתוך <span className="font-medium">24</span> דוחות
          </p>
          
          <div className="flex space-x-1 space-x-reverse">
            <button className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
              הקודם
            </button>
            <button className="px-3 py-1 bg-blue-600 border border-blue-600 rounded-md text-sm text-white">
              1
            </button>
            <button className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
              2
            </button>
            <button className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
              3
            </button>
            <button className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
              הבא
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 