"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader } from "lucide-react";

/**
 * רכיב מגן שבודק אם המשתמש מחובר ומורשה לגשת לדף
 * אם המשתמש לא מחובר, הוא מופנה לדף התחברות
 * אם המשתמש בתהליך טעינה, מוצג אנימציית טעינה
 */
export default function AuthGuard({ 
  children,
  requireAuth = true, // האם הדף דורש הרשאה
  redirectTo = "/auth/login", // לאן להפנות אם המשתמש לא מורשה
  loadingComponent // רכיב להצגה בזמן טעינה
}: { 
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  loadingComponent?: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  
  useEffect(() => {
    // אם תהליך בדיקת האימות הסתיים
    if (status !== "loading") {
      // מעדכן שסיימנו לבדוק
      setIsChecking(false);
      
      // אם הדף דורש הרשאה והמשתמש לא מחובר, מפנה לדף התחברות
      if (requireAuth && !session) {
        const callbackUrl = encodeURIComponent(pathname);
        router.push(`${redirectTo}?callbackUrl=${callbackUrl}`);
      }
    }
  }, [status, session, requireAuth, router, redirectTo, pathname]);
  
  // אם עדיין בודקים או בטעינה, מציג מסך טעינה
  if (isChecking || status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {loadingComponent || (
          <div className="flex flex-col items-center p-8">
            <Loader size={36} className="mb-4 animate-spin text-primary" />
            <p className="text-gray-600 dark:text-gray-400">טוען...</p>
          </div>
        )}
      </div>
    );
  }
  
  // אם הדף לא דורש הרשאה, או שהמשתמש מחובר, מציג את התוכן
  if (!requireAuth || (requireAuth && session)) {
    return <>{children}</>;
  }
  
  // מקרה קצה - לא אמור להגיע לכאן בגלל ההפניה ב-useEffect
  return null;
} 