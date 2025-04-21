'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button } from '@arxio/ui';
import { PlusCircle } from 'lucide-react';
import { getUserProjects } from '@/lib/api/projects';
import { auth } from '@/lib/auth';
import { Project } from '@arxio/types';

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProjects() {
      try {
        const data = await getUserProjects();
        setProjects(data);
      } catch (error) {
        console.error('Failed to load projects:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadProjects();
  }, []);

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">דשבורד ARXIO</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">ברוכים הבאים ל-MVP</h2>
        <p className="mb-4">
          זוהי גרסת MVP בסיסית של המערכת. חלק מהפונקציונליות עדיין בפיתוח.
        </p>
        <div className="mt-4">
          <Link href="/project/new">
            <Button>פרויקט חדש</Button>
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">סקירת פרויקטים</h3>
          <p className="text-gray-600">אין פרויקטים פעילים</p>
        </div>
        
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">סריקות אחרונות</h3>
          <p className="text-gray-600">אין סריקות אחרונות</p>
        </div>
        
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">סטטיסטיקה</h3>
          <p className="text-gray-600">אין נתונים</p>
        </div>
      </div>
    </div>
  );
} 