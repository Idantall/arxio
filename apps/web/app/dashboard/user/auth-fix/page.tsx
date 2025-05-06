"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from "@arxio/ui";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@arxio/ui";
import { Loader2, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AuthFixPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isFixing, setIsFixing] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    userId?: string;
    error?: string;
  } | null>(null);

  // אם המשתמש אינו מחובר, הפנה אותו לדף הכניסה
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  const handleFixAuth = async () => {
    if (!session?.user?.email) {
      setResult({
        success: false,
        error: 'אין מידע על המשתמש המחובר. אנא התחבר מחדש.'
      });
      return;
    }

    setIsFixing(true);
    setResult(null);

    try {
      const response = await fetch('/api/fix-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: session.user.email,
          oldId: session.user.id || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message || 'פרטי האימות תוקנו בהצלחה!',
          userId: data.userId
        });
      } else {
        setResult({
          success: false,
          error: data.error || 'אירעה שגיאה בתיקון פרטי האימות'
        });
      }
    } catch (error) {
      console.error('שגיאה בתיקון אימות:', error);
      setResult({
        success: false,
        error: 'שגיאה בלתי צפויה בתיקון האימות'
      });
    } finally {
      setIsFixing(false);
    }
  };

  // אם המשתמש עדיין לא מחובר, הצג מסך טעינה
  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="container mx-auto py-12 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary mb-4" />
          <h3 className="text-xl font-medium">טוען...</h3>
          <p className="text-muted-foreground mt-2">אנא המתן בזמן שאנו בודקים את פרטי המשתמש שלך</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">תיקון בעיות אימות</h1>

      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>תיקון בעיות גישה ואימות</CardTitle>
          <CardDescription>
            השתמש בעמוד זה כדי לתקן בעיות גישה במערכת, כגון הרשאות חסרות או שגיאות בזיהוי חשבונך
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-medium">פרטי המשתמש המחובר:</h3>
            <div className="mt-2 text-sm">
              <div><span className="font-medium">שם:</span> {session?.user?.name || 'לא זוהה'}</div>
              <div><span className="font-medium">אימייל:</span> {session?.user?.email || 'לא זוהה'}</div>
              <div><span className="font-medium">מזהה משתמש:</span> {session?.user?.id || 'לא זוהה'}</div>
            </div>
          </div>

          {result && (
            <div className={`p-4 rounded-lg border ${
              result.success 
                ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300" 
                : "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
            }`}>
              <div className="flex items-center">
                {result.success ? (
                  <CheckCircle className="h-4 w-4 mr-2" />
                ) : (
                  <AlertCircle className="h-4 w-4 mr-2" />
                )}
                <h3 className="font-medium">
                  {result.success ? 'תיקון הושלם בהצלחה' : 'שגיאה בתיקון האימות'}
                </h3>
              </div>
              <p className="mt-1">
                {result.success 
                  ? result.message
                  : result.error || 'אירעה שגיאה בתיקון פרטי האימות'}
              </p>
              
              {result.success && result.userId && (
                <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm">
                  <span className="font-medium">מזהה המשתמש החדש:</span> {result.userId}
                </div>
              )}
            </div>
          )}

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-lg">
            <h3 className="font-medium text-amber-800 dark:text-amber-400 flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              מתי להשתמש בכלי זה?
            </h3>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
              השתמש בכלי זה אם אתה נתקל בשגיאות כמו "מזהה משתמש לא תקין" או שאין לך גישה לפרויקטים וסריקות שיצרת.
              הכלי יתקן אי-התאמות בין מערכת ההתחברות לבין מסד הנתונים.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
            disabled={isFixing}
          >
            חזרה ללוח הבקרה
          </Button>
          
          <Button
            onClick={handleFixAuth}
            disabled={isFixing}
          >
            {isFixing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                מתקן...
              </>
            ) : (
              <>
                תקן בעיות אימות
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {result?.success && (
        <div className="mt-8 text-center">
          <Button asChild variant="link">
            <Link href="/dashboard" className="flex items-center">
              חזור ללוח הבקרה
              <ArrowRight className="mr-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
} 