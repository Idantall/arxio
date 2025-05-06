import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  // בדיקה בסיסית של משתני הסביבה
  const environmentInfo = {
    supabase: {
      url: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      anonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      serviceKey: Boolean(process.env.SUPABASE_SERVICE_KEY),
      urlValue: maskString(process.env.NEXT_PUBLIC_SUPABASE_URL || ''),
      anonKeyValue: maskString(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''),
      serviceKeyValue: maskString(process.env.SUPABASE_SERVICE_KEY || '')
    },
    nextAuth: {
      url: Boolean(process.env.NEXTAUTH_URL),
      secret: Boolean(process.env.NEXTAUTH_SECRET)
    },
    github: {
      clientId: Boolean(process.env.GITHUB_CLIENT_ID),
      clientSecret: Boolean(process.env.GITHUB_CLIENT_SECRET)
    },
    node: {
      env: process.env.NODE_ENV,
      version: process.version,
    },
    runtime: {
      timestamp: new Date().toISOString(),
      serverTime: new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })
    }
  };

  // מידע על הבקשה
  const requestInfo = {
    headers: {
      // הצגת המידע העיקרי מהדפדפן ללא מידע רגיש
      userAgent: maskString(String(process.env.USER_AGENT || '')),
      referer: maskString(String(process.env.HTTP_REFERER || '')),
      host: maskString(String(process.env.HTTP_HOST || ''))
    }
  };

  return NextResponse.json({
    message: 'מידע דיבאג סופאבייס',
    environment: environmentInfo,
    request: requestInfo,
    guide: [
      'אם אתה רואה false לאחד מהמפתחות של סופאבייס, זה מעיד על בעיה בטעינת משתני הסביבה',
      'ודא שיש לך קובץ .env.local בתיקיית apps/web עם הגדרות תקינות',
      'הפעל את הסקריפט scripts/update-env.js כדי ליצור קובץ הגדרות חדש',
      'הפעל מחדש את שרת הפיתוח לאחר עדכון הקובץ'
    ]
  });
}

// פונקציית עזר להסתרת מידע רגיש
function maskString(input: string): string {
  if (!input || input.length === 0) return '';
  
  // אם המחרוזת קצרה מ-8 תווים, הצג את התו הראשון והאחרון
  if (input.length < 8) {
    return `${input.charAt(0)}*****${input.charAt(input.length - 1)}`;
  }
  
  // אחרת, הצג את 3 התווים הראשונים ו-3 האחרונים
  const prefix = input.substring(0, 3);
  const suffix = input.substring(input.length - 3);
  const maskedLength = input.length - 6;
  const stars = '*'.repeat(Math.min(maskedLength, 10));
  
  return `${prefix}${stars}${suffix}`;
} 