"use client";

import Link from "next/link";
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@arxio/ui";
import { AlertTriangle, FileKey, Home, RefreshCcw, Settings } from "lucide-react";

export default function SupabaseErrorPage() {
  // פונקציה לבדיקת מפתחות סופאבייס
  const checkEnvVariables = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    return {
      url: supabaseUrl ? true : false,
      key: supabaseKey ? true : false
    };
  };
  
  const envStatus = checkEnvVariables();
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <Card className="max-w-lg w-full shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-16 w-16 text-amber-500" />
          </div>
          <CardTitle className="text-2xl">שגיאת התחברות לסופאבייס</CardTitle>
          <CardDescription>
            המערכת נתקלה בבעיה בהתחברות למסד הנתונים
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium text-lg">סיבות אפשריות לשגיאה:</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>קובץ <code>.env.local</code> חסר או לא מכיל את המפתחות הנדרשים</li>
              <li>הגדרות מפתחות הסופאבייס לא נטענו כראוי</li>
              <li>חיבור לסופאבייס נחסם או אינו זמין</li>
              <li>חשבון הסופאבייס אינו פעיל</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium text-lg">בדיקת מפתחות:</h3>
            <div className="p-4 bg-muted rounded-md text-sm">
              <div className="flex items-center justify-between">
                <span>NEXT_PUBLIC_SUPABASE_URL:</span>
                <span className={envStatus.url ? "text-green-500" : "text-red-500"}>
                  {envStatus.url ? "נמצא ✓" : "חסר ✗"}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span>NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>
                <span className={envStatus.key ? "text-green-500" : "text-red-500"}>
                  {envStatus.key ? "נמצא ✓" : "חסר ✗"}
                </span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium text-lg">כיצד לפתור:</h3>
            <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
              <li className="pl-2">
                <span className="font-medium text-foreground">בדוק את קובץ <code>.env.local</code>:</span>
                <div className="mt-1 pl-6">
                  ודא שהקובץ קיים בתיקיית <code>/apps/web</code> ומכיל את המפתחות הנכונים.
                </div>
              </li>
              <li className="pl-2">
                <span className="font-medium text-foreground">הפעל את הסקריפט:</span>
                <div className="mt-1 pl-6 text-sm bg-muted p-2 rounded">
                  <code>node scripts/update-env.js</code>
                </div>
                <div className="mt-1 pl-6">
                  הסקריפט ייצור קובץ <code>.env.local</code> חדש עם המפתחות הנכונים.
                </div>
              </li>
              <li className="pl-2">
                <span className="font-medium text-foreground">הפעל מחדש את השרת:</span>
                <div className="mt-1 pl-6">
                  עצור את שרת הפיתוח והפעל אותו מחדש כדי שהמפתחות החדשים ייטענו:
                </div>
                <div className="mt-1 pl-6 text-sm bg-muted p-2 rounded">
                  <code>pnpm dev</code>
                </div>
              </li>
            </ol>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 pt-0">
          <Button asChild className="w-full" variant="outline">
            <Link href="/api/debug-supabase" target="_blank">
              <FileKey className="h-4 w-4 mr-2" /> בדוק הגדרות סופאבייס
            </Link>
          </Button>
          <div className="flex space-x-2 w-full">
            <Button asChild className="w-1/2" variant="outline">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" /> דף הבית
              </Link>
            </Button>
            <Button 
              className="w-1/2"
              onClick={() => {
                window.location.reload();
              }}
            >
              <RefreshCcw className="h-4 w-4 mr-2" /> רענן
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 