"use client";

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  AlertTriangle, 
  Shield, 
  Clock, 
  BarChart4, 
  FileText, 
  Code,
  Info,
  Download,
  RotateCw,
  Link as LinkIcon,
  Check,
  ChevronDown,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

// מידע לדוגמה עבור סריקה בודדת
const scanDetails = {
  id: 'SCAN-4521',
  name: 'הסריקה השבועית',
  type: 'סריקת אבטחה מקיפה',
  target: 'github.com/user/repo-1',
  targetUrl: 'https://github.com/user/repo-1',
  status: 'הושלם',
  startDate: '12 יולי, 2023 15:42',
  endDate: '12 יולי, 2023 15:56',
  duration: '14 דקות',
  issues: {
    critical: 2,
    high: 5,
    medium: 12,
    low: 8
  },
  summary: 'נמצאו 27 בעיות אבטחה, מתוכן 2 בחומרה קריטית ו-5 בחומרה גבוהה. מומלץ לטפל בבעיות הקריטיות בהקדם האפשרי.',
  vulnerabilities: [
    {
      id: 'VULN-4521-01',
      title: 'מפתח API חשוף בקוד',
      severity: 'critical',
      description: 'נמצא מפתח API שמוטמע ישירות בקוד במקום להשתמש במשתני סביבה או במנגנון אחסון מאובטח.',
      location: 'src/config/api.js:15',
      code: `const API_KEY = "3f7b8d92e5a6c1f0h4j2k1l3m5n7p9q0";\n\nfunction authenticateRequest(req) {\n  req.headers['X-API-Key'] = API_KEY;\n  return req;\n}`,
      recommendation: 'העבר את מפתח ה-API למשתנה סביבה והשתמש בו במקום לשמור אותו ישירות בקוד.',
      cwe: 'CWE-798',
      isFixed: false
    },
    {
      id: 'VULN-4521-02',
      title: 'SQL Injection אפשרית',
      severity: 'critical',
      description: 'זוהתה אפשרות ל-SQL Injection בגלל שימוש במחרוזות SQL לא מחוסנות. הרצת שאילתות עם קלט משתמש ללא טיהור מאפשרת התקפות.',
      location: 'src/services/users.js:42',
      code: `function getUserByUsername(username) {\n  const query = \`SELECT * FROM users WHERE username = '\${username}'\`;\n  return db.execute(query);\n}`,
      recommendation: 'השתמש בפרמטרים מתוחלפים (prepared statements) או שיטות ORM להגנה מפני SQL Injection.',
      cwe: 'CWE-89',
      isFixed: false
    },
    {
      id: 'VULN-4521-03',
      title: 'חולשת XSS בתצוגת נתוני משתמש',
      severity: 'high',
      description: 'זוהתה חולשת Cross-Site Scripting (XSS) בתצוגת נתוני משתמש. תוכן שמוזן על-ידי משתמש מוצג ישירות ב-HTML ללא סינון מתאים.',
      location: 'src/components/UserProfile.jsx:28',
      code: `function UserProfile({ user }) {\n  return (\n    <div>\n      <h2>פרופיל משתמש</h2>\n      <div dangerouslySetInnerHTML={{ __html: user.bio }} />\n    </div>\n  );\n}`,
      recommendation: 'השתמש בפונקציות טיהור HTML או התמר את התוכן לפורמט בטוח לפני הצגה.',
      cwe: 'CWE-79',
      isFixed: true
    }
  ]
};

function SeverityBadge({ severity }: { severity: string }) {
  let color = '';
  let icon = null;
  let text = '';
  
  switch(severity) {
    case 'critical':
      color = 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      icon = <AlertTriangle size={12} className="mr-1" />;
      text = 'קריטית';
      break;
    case 'high':
      color = 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      icon = <AlertTriangle size={12} className="mr-1" />;
      text = 'גבוהה';
      break;
    case 'medium':
      color = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      icon = <Info size={12} className="mr-1" />;
      text = 'בינונית';
      break;
    case 'low':
      color = 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      icon = <Info size={12} className="mr-1" />;
      text = 'נמוכה';
      break;
    default:
      color = 'bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-400';
      text = severity;
  }
  
  return (
    <span className={`px-2.5 py-0.5 rounded-md text-xs font-medium flex items-center w-fit ${color}`}>
      {icon}
      {text}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  let color = '';
  let icon = null;
  
  switch(status) {
    case 'הושלם':
      color = 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      icon = <Check size={14} className="mr-1" />;
      break;
    case 'בתהליך':
      color = 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      icon = <RotateCw size={14} className="mr-1 animate-spin" />;
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

function StatCard({ label, value, color, icon }: { label: string, value: React.ReactNode, color: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
          <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{value}</div>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <div className="relative mt-2 mb-4 rounded-md overflow-hidden">
      <pre className="bg-gray-100 dark:bg-gray-900 p-4 overflow-x-auto text-sm">
        <code className="text-gray-800 dark:text-gray-300 font-mono">
          {code.split('\n').map((line, i) => (
            <div key={i} className="whitespace-pre">
              {line}
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}

function VulnerabilityCard({ vulnerability, expanded, onToggle }: { 
  vulnerability: typeof scanDetails.vulnerabilities[0], 
  expanded: boolean, 
  onToggle: () => void 
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-4 overflow-hidden">
      <div 
        className="px-6 py-4 cursor-pointer flex justify-between items-center"
        onClick={onToggle}
      >
        <div className="flex items-center">
          <div className="mr-3">
            {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </div>
          <div>
            <div className="flex items-center mb-1">
              <h3 className="text-md font-medium text-gray-900 dark:text-white">{vulnerability.title}</h3>
              <SeverityBadge severity={vulnerability.severity} />
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-3">{vulnerability.id}</span>
              {vulnerability.isFixed && (
                <span className="ml-3 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                  <Check size={12} className="mr-1" />
                  תוקן
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{vulnerability.description}</p>
          </div>
        </div>
      </div>
      
      {expanded && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">תיאור</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">{vulnerability.description}</p>
          </div>
          
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">מיקום</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 font-mono">{vulnerability.location}</p>
          </div>
          
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">קוד פגיע</h4>
            <CodeBlock code={vulnerability.code} />
          </div>
          
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">המלצה לתיקון</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">{vulnerability.recommendation}</p>
          </div>
          
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">סיווג CWE</h4>
            <a 
              href={`https://cwe.mitre.org/data/definitions/${vulnerability.cwe.replace('CWE-', '')}.html`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
            >
              {vulnerability.cwe}
              <ExternalLink size={12} className="mr-1" />
            </a>
          </div>
          
          <div className="flex justify-end">
            <button className="bg-blue-600 text-white py-2 px-4 rounded-md text-sm flex items-center">
              <div className="mr-1">צפייה בפרטים נוספים</div>
              <ArrowLeft size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ScanDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState('vulnerabilities');
  const [expandedVulns, setExpandedVulns] = useState<Record<string, boolean>>({
    'VULN-4521-01': true, // לדוגמה, הראשון פתוח
  });
  
  const toggleVulnerability = (id: string) => {
    setExpandedVulns(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };
  
  return (
    <div className="space-y-6">
      {/* חזרה לרשימת הסריקות */}
      <div>
        <Link href="/dashboard/scans" className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline">
          <ArrowLeft size={16} className="mr-1" />
          חזרה לרשימת הסריקות
        </Link>
      </div>
      
      {/* כותרת ופרטי סריקה */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{scanDetails.name}</h1>
            <div className="flex items-center flex-wrap gap-3 mb-4">
              <StatusBadge status={scanDetails.status} />
              <span className="text-sm text-gray-500 dark:text-gray-400">{scanDetails.id}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">{scanDetails.type}</span>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">מטרה: </span>
                <a 
                  href={scanDetails.targetUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {scanDetails.target}
                </a>
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">תאריך התחלה: </span>
                {scanDetails.startDate}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">תאריך סיום: </span>
                {scanDetails.endDate}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">משך זמן: </span>
                {scanDetails.duration}
              </p>
            </div>
            
            <div className="text-sm text-gray-700 dark:text-gray-300 mt-4">
              <p className="font-medium mb-1">סיכום:</p>
              <p>{scanDetails.summary}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm flex items-center">
              <RotateCw size={16} className="ml-2" />
              הפעל סריקה מחדש
            </button>
            <button className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-md transition-colors text-sm flex items-center">
              <Download size={16} className="ml-2" />
              הורד דוח
            </button>
          </div>
        </div>
      </div>
      
      {/* סיכום בעיות */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="בעיות קריטיות"
          value={<div className="flex items-baseline">
            {scanDetails.issues.critical}
          </div>}
          color="bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400"
          icon={<AlertTriangle size={20} />}
        />
        <StatCard 
          label="בעיות בחומרה גבוהה"
          value={<div className="flex items-baseline">
            {scanDetails.issues.high}
          </div>}
          color="bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"
          icon={<AlertTriangle size={20} />}
        />
        <StatCard 
          label="בעיות בחומרה בינונית"
          value={<div className="flex items-baseline">
            {scanDetails.issues.medium}
          </div>}
          color="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400"
          icon={<AlertTriangle size={20} />}
        />
        <StatCard 
          label="בעיות בחומרה נמוכה"
          value={<div className="flex items-baseline">
            {scanDetails.issues.low}
          </div>}
          color="bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400"
          icon={<Shield size={20} />}
        />
      </div>
      
      {/* לשוניות המידע */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button 
            className={`px-6 py-3 text-sm font-medium ${activeTab === 'vulnerabilities' ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
            onClick={() => handleTabChange('vulnerabilities')}
          >
            פגיעויות שנמצאו
          </button>
          <button 
            className={`px-6 py-3 text-sm font-medium ${activeTab === 'report' ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
            onClick={() => handleTabChange('report')}
          >
            דוח מלא
          </button>
          <button 
            className={`px-6 py-3 text-sm font-medium ${activeTab === 'logs' ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
            onClick={() => handleTabChange('logs')}
          >
            לוגים
          </button>
        </div>
        
        <div className="p-6">
          {activeTab === 'vulnerabilities' && (
            <div>
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">פגיעויות שנמצאו ({scanDetails.vulnerabilities.length})</h2>
                <div className="flex space-x-2 space-x-reverse">
                  <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                    הרחב הכל
                  </button>
                  <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                    כווץ הכל
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                {scanDetails.vulnerabilities.map(vuln => (
                  <VulnerabilityCard 
                    key={vuln.id} 
                    vulnerability={vuln} 
                    expanded={!!expandedVulns[vuln.id]} 
                    onToggle={() => toggleVulnerability(vuln.id)} 
                  />
                ))}
              </div>
            </div>
          )}
          
          {activeTab === 'report' && (
            <div className="text-center py-12">
              <div className="inline-block p-3 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
                <FileText className="h-8 w-8 text-gray-500 dark:text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">דוח מלא זמין להורדה</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-md mx-auto">הדוח המלא כולל מידע מקיף על כל הפגיעויות, סיכום טכני, ניתוח סיכונים והמלצות מפורטות לתיקון.</p>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm flex items-center mx-auto">
                <Download size={16} className="ml-2" />
                הורד דוח מלא
              </button>
            </div>
          )}
          
          {activeTab === 'logs' && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">לוגים של הסריקה</h2>
              <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-auto max-h-96">
                <pre className="text-xs text-gray-800 dark:text-gray-300 font-mono whitespace-pre">
{`[2023-07-12 15:42:01] INFO: Starting scan SCAN-4521
[2023-07-12 15:42:03] INFO: Connecting to repository github.com/user/repo-1
[2023-07-12 15:42:05] INFO: Connected successfully, starting code analysis
[2023-07-12 15:42:10] INFO: Analyzing JavaScript files
[2023-07-12 15:42:15] WARNING: Found API key in src/config/api.js:15
[2023-07-12 15:42:20] WARNING: Potential SQL Injection in src/services/users.js:42
[2023-07-12 15:42:25] WARNING: XSS vulnerability in src/components/UserProfile.jsx:28
[2023-07-12 15:42:30] INFO: Analyzing Python files
[2023-07-12 15:42:35] WARNING: Unsafe deserialization in src/utils/parser.py:56
[2023-07-12 15:42:40] INFO: Analyzing configuration files
[2023-07-12 15:42:45] WARNING: Missing security headers in config/server.js
[2023-07-12 15:42:50] INFO: Scanning dependencies for known vulnerabilities
[2023-07-12 15:43:00] WARNING: Vulnerable dependency: axios@0.21.1 (CVE-2021-3749)
[2023-07-12 15:43:05] INFO: Starting dynamic analysis
[2023-07-12 15:55:30] INFO: Dynamic analysis completed
[2023-07-12 15:55:40] INFO: Generating report
[2023-07-12 15:56:00] INFO: Scan completed. Found 27 issues (2 critical, 5 high, 12 medium, 8 low)`}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 