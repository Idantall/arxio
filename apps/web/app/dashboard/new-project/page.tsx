'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ArrowLeft, Github, GitBranch, AlertTriangle } from 'lucide-react';
import { useSession } from 'next-auth/react';

const projectSchema = z.object({
  name: z.string().min(3, { 
    message: 'שם הפרויקט חייב להכיל לפחות 3 תווים' 
  }),
  description: z.string().min(5, { 
    message: 'תיאור הפרויקט חייב להכיל לפחות 5 תווים' 
  }),
  repositoryUrl: z.string().url({ 
    message: 'נא להזין כתובת URL תקינה של מאגר קוד' 
  }),
  branch: z.string().min(1, { 
    message: 'נא לבחור ענף' 
  }),
  scanType: z.enum(['static', 'dynamic', 'full'], {
    required_error: 'נא לבחור סוג סריקה'
  }),
});

type FormValues = z.infer<typeof projectSchema>;

export default function NewProjectPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [branchOptions, setBranchOptions] = useState(['main', 'develop', 'staging']);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  
  useEffect(() => {
    // בדיקת סשן בטעינה
    console.log('סשן נוכחי:', session);
  }, [session]);
  
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      description: '',
      repositoryUrl: '',
      branch: 'main',
      scanType: 'static',
    }
  });

  const selectedBranch = watch('branch');
  const selectedScanType = watch('scanType');

  const handleBranchSelect = (branch: string) => {
    setValue('branch', branch);
    setShowBranchDropdown(false);
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setGeneralError(null);
    
    try {
      console.log('יוצר פרויקט חדש:', data);
      console.log('מידע על המשתמש:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id || 'אין',
        email: session?.user?.email || 'אין'
      });
      
      // המרת הנתונים לפורמט שהשרת מצפה לקבל
      const projectData = {
        name: data.name,
        description: data.description,
        repository_url: data.repositoryUrl,
        repository_type: 'git', // ברירת מחדל
        repository_provider: 'github', // ברירת מחדל על סמך URL
        branch: data.branch,
        scan_type: data.scanType,
        auto_scan: true, // ברירת מחדל
        scan_interval: 'weekly', // ברירת מחדל
      };
      
      // בדיקת עירנות האימות לפני שליחת הבקשה
      const authCheckResponse = await fetch('/api/user/get-id');
      const authData = await authCheckResponse.json();
      
      console.log('בדיקת אימות:', authData);
      
      if (authData.error || !authData.userId) {
        setGeneralError('בעיית אימות משתמש. נדרש תיקון חשבון.');
        return;
      }
      
      // שליחת נתוני הפרויקט לשרת
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });
      
      // לנסות לקבל את הנתונים לפני בדיקת הסטטוס
      let responseData;
      try {
        responseData = await response.json();
        console.log('תשובה מהשרת:', responseData);
      } catch (e) {
        console.error('שגיאה בפענוח תשובת השרת:', e);
      }
      
      if (!response.ok) {
        console.error('תשובת שרת שלילית:', responseData);
        
        if (responseData?.code === 'INVALID_USER_ID' || responseData?.code === 'USER_NOT_FOUND' || responseData?.error?.includes('לא מורשה')) {
          setGeneralError('בעיית אימות משתמש. אנא עברו לדף תיקון האימות.');
        } else {
          throw new Error(responseData?.error || 'שגיאה ביצירת הפרויקט');
        }
        return;
      }
      
      // ניתוב לדף הפרויקט החדש או לדשבורד
      router.push('/dashboard');
    } catch (error) {
      console.error('שגיאה ביצירת פרויקט:', error);
      setGeneralError('אירעה שגיאה ביצירת הפרויקט. נא לנסות שוב.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/dashboard/projects" className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mr-4">
            <ArrowLeft size={18} className="ml-1 rtl:rotate-180" />
            <span>חזרה לפרויקטים</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">יצירת פרויקט חדש</h1>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        {generalError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/20 dark:border-red-800">
            <div className="flex items-center">
              <AlertTriangle size={18} className="text-red-600 dark:text-red-400 ml-2" />
              <p className="text-red-600 dark:text-red-400">{generalError}</p>
            </div>
            {generalError.includes('בעיית אימות') && (
              <div className="mt-3">
                <Link href="/auth/fix" className="px-3 py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-800/30 dark:hover:bg-red-800/50 text-red-700 dark:text-red-300 rounded-md text-sm flex items-center justify-center w-fit">
                  תיקון בעיות אימות
                </Link>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">פרטי פרויקט</h2>
              
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  שם הפרויקט
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="לדוגמה: Payment Gateway API"
                  className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white`}
                  {...register('name')}
                />
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  תיאור הפרויקט
                </label>
                <textarea
                  id="description"
                  placeholder="תיאור קצר של הפרויקט ומטרתו"
                  className={`w-full px-3 py-2 border ${errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white`}
                  rows={3}
                  {...register('description')}
                ></textarea>
                {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>}
              </div>
            </div>
            
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">מקור קוד</h2>
              
              <div className="space-y-2">
                <label htmlFor="repositoryUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  כתובת מאגר (GitHub, GitLab, Bitbucket)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Github size={18} className="text-gray-400" />
                  </div>
                  <input
                    id="repositoryUrl"
                    type="text"
                    placeholder="https://github.com/username/repository"
                    className={`w-full pl-10 pr-3 py-2 border ${errors.repositoryUrl ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white`}
                    {...register('repositoryUrl')}
                  />
                </div>
                {errors.repositoryUrl && <p className="mt-1 text-sm text-red-500">{errors.repositoryUrl.message}</p>}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="branch" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  ענף (Branch)
                </label>
                <div className="relative">
                  <button 
                    type="button"
                    className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
                    onClick={() => setShowBranchDropdown(!showBranchDropdown)}
                  >
                    <div className="flex items-center">
                      <GitBranch size={18} className="text-gray-400 ml-2" />
                      <span>{selectedBranch}</span>
                    </div>
                    <div className={`transform transition-transform ${showBranchDropdown ? 'rotate-180' : ''}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                        <path d="m6 9 6 6 6-6"/>
                      </svg>
                    </div>
                  </button>
                  
                  {showBranchDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
                      <ul className="py-1 max-h-60 overflow-auto">
                        {branchOptions.map((branch) => (
                          <li 
                            key={branch}
                            className={`px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${branch === selectedBranch ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                            onClick={() => handleBranchSelect(branch)}
                          >
                            {branch}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                {errors.branch && <p className="mt-1 text-sm text-red-500">{errors.branch.message}</p>}
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  סוג סריקה
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div className={`relative border ${selectedScanType === 'static' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'} rounded-md p-3 cursor-pointer hover:border-blue-400 dark:hover:border-blue-700`} onClick={() => setValue('scanType', 'static')}>
                    <input
                      type="radio"
                      id="static"
                      value="static"
                      className="sr-only"
                      {...register('scanType')}
                    />
                    <label htmlFor="static" className="cursor-pointer block text-center">
                      <span className={`font-medium ${selectedScanType === 'static' ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>סטטי (SAST)</span>
                      <p className={`text-xs mt-1 ${selectedScanType === 'static' ? 'text-blue-600 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}>סריקת קוד מקור</p>
                    </label>
                  </div>
                  
                  <div className={`relative border ${selectedScanType === 'dynamic' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'} rounded-md p-3 cursor-pointer hover:border-blue-400 dark:hover:border-blue-700`} onClick={() => setValue('scanType', 'dynamic')}>
                    <input
                      type="radio"
                      id="dynamic"
                      value="dynamic"
                      className="sr-only"
                      {...register('scanType')}
                    />
                    <label htmlFor="dynamic" className="cursor-pointer block text-center">
                      <span className={`font-medium ${selectedScanType === 'dynamic' ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>דינמי (DAST)</span>
                      <p className={`text-xs mt-1 ${selectedScanType === 'dynamic' ? 'text-blue-600 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}>סריקת API או אתר</p>
                    </label>
                  </div>
                  
                  <div className={`relative border ${selectedScanType === 'full' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'} rounded-md p-3 cursor-pointer hover:border-blue-400 dark:hover:border-blue-700`} onClick={() => setValue('scanType', 'full')}>
                    <input
                      type="radio"
                      id="full"
                      value="full"
                      className="sr-only"
                      {...register('scanType')}
                    />
                    <label htmlFor="full" className="cursor-pointer block text-center">
                      <span className={`font-medium ${selectedScanType === 'full' ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>מלא</span>
                      <p className={`text-xs mt-1 ${selectedScanType === 'full' ? 'text-blue-600 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}>סריקה סטטית ודינמית</p>
                    </label>
                  </div>
                </div>
                {errors.scanType && <p className="mt-1 text-sm text-red-500">{errors.scanType.message}</p>}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-4 rtl:space-x-reverse">
            <Link href="/dashboard/projects" className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              ביטול
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'שומר...' : 'צור פרויקט'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 