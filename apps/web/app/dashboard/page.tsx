"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Code, GitBranch, Shield, BarChart, Bell, Settings, ExternalLink } from 'lucide-react';

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const projects = [
    {
      id: 'proj-1',
      name: 'API Gateway',
      description: 'שער API מאובטח עם אימות JWT',
      repoUrl: 'https://github.com/username/api-gateway',
      lastScan: '2023-04-20',
      vulnerabilities: 2,
      critical: 1,
    },
    {
      id: 'proj-2',
      name: 'Payment Service',
      description: 'מיקרו-שירות לעיבוד תשלומים',
      repoUrl: 'https://github.com/username/payment-service',
      lastScan: '2023-04-18',
      vulnerabilities: 0,
      critical: 0,
    },
    {
      id: 'proj-3',
      name: 'User Portal',
      description: 'פורטל משתמשים עם אימות דו-שלבי',
      repoUrl: 'https://github.com/username/user-portal',
      lastScan: '2023-04-15',
      vulnerabilities: 5,
      critical: 0,
    },
  ];

  const recentScans = [
    {
      id: 'scan-1',
      projectName: 'API Gateway',
      timestamp: '20 באפריל, 2023 13:45',
      vulnerabilities: 2,
      status: 'completed',
    },
    {
      id: 'scan-2',
      projectName: 'Payment Service',
      timestamp: '18 באפריל, 2023 10:30',
      vulnerabilities: 0,
      status: 'completed',
    },
    {
      id: 'scan-3',
      projectName: 'User Portal',
      timestamp: '15 באפריל, 2023 15:20',
      vulnerabilities: 5,
      status: 'completed',
    },
  ];

  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">דשבורד</h1>
        <Link 
          href="/dashboard/new-project" 
          className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-md shadow-sm"
        >
          <Plus size={16} className="mr-2 rtl:ml-2 rtl:mr-0" />
          <span>פרויקט חדש</span>
        </Link>
      </div>

      {/* סטטיסטיקות */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 border border-gray-200 dark:border-gray-700">
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{projects.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">סך הפרויקטים</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 border border-gray-200 dark:border-gray-700">
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{recentScans.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">סריקות שבוצעו</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 border border-gray-200 dark:border-gray-700">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {projects.reduce((sum, project) => sum + project.vulnerabilities, 0)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">פגיעויות שזוהו</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 border border-gray-200 dark:border-gray-700">
          <div className="text-3xl font-bold text-red-600 dark:text-red-400">
            {projects.reduce((sum, project) => sum + project.critical, 0)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">פגיעויות קריטיות</div>
        </div>
      </div>

      {/* גריד ראשי */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* פרויקטים */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">הפרויקטים שלך</h2>
            <Link href="/dashboard/projects" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              הצג הכל
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredProjects.map(project => (
              <div key={project.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{project.name}</h3>
                  <a 
                    href={project.repoUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    <GitBranch size={16} />
                  </a>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{project.description}</p>
                
                <div className="flex justify-between items-center text-xs mb-3">
                  <div className="text-gray-600 dark:text-gray-400">
                    סריקה אחרונה: {project.lastScan}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    project.vulnerabilities > 0 
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-600' 
                      : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-600'
                  }`}>
                    {project.vulnerabilities} פגיעויות
                  </span>
                  
                  {project.critical > 0 && (
                    <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-600">
                      {project.critical} קריטיות
                    </span>
                  )}
                </div>
                
                <div className="flex gap-2 mt-auto">
                  <Link 
                    href={`/dashboard/projects/${project.id}`} 
                    className="flex-1 text-center px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md transition-colors"
                  >
                    פרטי פרויקט
                  </Link>
                  <Link 
                    href={`/dashboard/projects/${project.id}/scan`} 
                    className="flex-1 text-center px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                  >
                    סרוק עכשיו
                  </Link>
                </div>
              </div>
            ))}
            
            <Link 
              href="/dashboard/new-project" 
              className="flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
            >
              <Plus size={24} className="mb-2" />
              <span>הוסף פרויקט חדש</span>
            </Link>
          </div>
        </div>
        
        {/* פעילות אחרונה */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">פעילות אחרונה</h2>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
            {recentScans.map(scan => (
              <div key={scan.id} className="p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 p-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md">
                    <Shield size={16} />
                  </div>
                  
                  <div className="ml-3 rtl:mr-3 rtl:ml-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">{scan.projectName}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{scan.timestamp}</span>
                    </div>
                    
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      הסריקה הושלמה עם {scan.vulnerabilities} פגיעויות שזוהו
                    </p>
                    
                    <Link 
                      href={`/dashboard/scans/${scan.id}`} 
                      className="mt-2 inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      צפה בתוצאות
                      <ExternalLink size={12} className="ml-1 rtl:mr-1 rtl:ml-0" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 