import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Middleware להגנת נתיבים ברמת האפליקציה
 * הקוד בודק אם המשתמש מחובר בנתיבים שדורשים הרשאה
 * אם המשתמש לא מחובר, הוא מופנה לדף ההתחברות
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // בדיקה האם הנתיב דורש הרשאה
  const isProtectedRoute = 
    pathname.startsWith('/dashboard') || 
    pathname.startsWith('/api/projects') ||
    pathname.startsWith('/api/scans');
  
  // אם זה נתיב פומבי, אפשר להמשיך
  if (!isProtectedRoute) {
    return NextResponse.next();
  }
  
  // בדיקת אימות המשתמש
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET
  });
  
  // לוג לדיבאג (רק בסביבת פיתוח)
  if (process.env.NODE_ENV === 'development') {
    console.log(`בדיקת הרשאה לנתיב: ${pathname}`);
    console.log('מצב אימות:', token ? 'משתמש מחובר' : 'משתמש לא מחובר');
  }
  
  // אם המשתמש לא מחובר, הפנייה לדף התחברות
  if (!token) {
    // שמירת הנתיב המקורי כדי לחזור אליו אחרי ההתחברות
    const url = new URL('/auth/login', request.url);
    url.searchParams.set('callbackUrl', pathname);
    
    return NextResponse.redirect(url);
  }
  
  // המשתמש מחובר, אפשר להמשיך
  return NextResponse.next();
}

/**
 * הגדרת הנתיבים שעליהם הקוד יפעל
 * זה מאפשר למידלוור לפעול רק על הנתיבים הנדרשים
 */
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/projects/:path*',
    '/api/scans/:path*',
  ],
}; 