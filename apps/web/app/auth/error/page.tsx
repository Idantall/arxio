"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircleIcon, ArrowLeftIcon } from "lucide-react";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const [errorType, setErrorType] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    // קבלת פרמטרי השגיאה מה-URL
    const error = searchParams.get("error");
    
    if (error) {
      setErrorType(error);
      
      // מיפוי סוגי שגיאות לתיאור מפורט בעברית
      const errorMessages: Record<string, string> = {
        "Configuration": "שגיאת תצורה במערכת האימות. אנא פנה למנהל המערכת.",
        "AccessDenied": "הגישה נדחתה. אין לך הרשאות מתאימות.",
        "Verification": "הקישור לאימות פג תוקף או כבר נוצל.",
        "OAuthSignin": "אירעה שגיאה בתהליך ההתחברות עם ספק החיצוני.",
        "OAuthCallback": "אירעה שגיאה בקבלת התשובה מספק האימות החיצוני.",
        "OAuthCreateAccount": "לא ניתן ליצור חשבון משתמש עם ספק האימות החיצוני.",
        "EmailCreateAccount": "לא ניתן ליצור חשבון משתמש עם האימייל שסופק.",
        "Callback": "שגיאה בתהליך התגובה מספק האימות.",
        "OAuthAccountNotLinked": "כבר קיים חשבון עם כתובת האימייל הזו. התחבר עם השיטה המקורית.",
        "EmailSignin": "לא ניתן לשלוח אימייל לכתובת שצוינה.",
        "CredentialsSignin": "פרטי ההתחברות שגויים. אנא בדוק את האימייל והסיסמה שלך.",
        "SessionRequired": "נדרשת התחברות לצפייה בדף זה.",
        "Default": "אירעה שגיאה לא צפויה בתהליך האימות. אנא נסה שוב."
      };
      
      setErrorMessage(errorMessages[error] || errorMessages["Default"]);
    } else {
      setErrorMessage("אירעה שגיאה לא מזוהה. אנא נסה להתחבר שוב.");
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 shadow-lg rounded-lg overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
              <AlertCircleIcon className="h-6 w-6 text-red-600 dark:text-red-300" />
            </div>
            
            <h1 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
              שגיאת התחברות
            </h1>
            
            <p className="mt-2 text-center text-gray-600 dark:text-gray-400">
              {errorMessage}
            </p>
          </div>
          
          <div className="mt-8 space-y-4">
            <Link 
              href="/auth/login" 
              className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowLeftIcon className="ml-2 -mr-1 h-4 w-4" />
              חזרה לדף ההתחברות
            </Link>
            
            <div className="text-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                אם אתה ממשיך לראות שגיאה זו, אנא 
              </span>{" "}
              <Link href="/contact" className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
                צור קשר עם התמיכה
              </Link>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 sm:px-8">
          <div className="text-xs text-center text-gray-500 dark:text-gray-400">
            קוד שגיאה: {errorType || "לא מוגדר"}
          </div>
        </div>
      </div>
    </div>
  );
} 