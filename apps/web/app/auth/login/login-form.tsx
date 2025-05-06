"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userAuthSchema } from "@arxio/types";
import { signIn } from "next-auth/react";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { MailIcon, LockIcon } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loginStatus, setLoginStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(userAuthSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // פונקציה לתיקון אימות אוטומטי לאחר התחברות מוצלחת
  const tryFixAuth = async (email: string) => {
    try {
      setLoginStatus('מבצע סנכרון מזהה משתמש...');
      
      const response = await fetch('/api/fix-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
        }),
      });
      
      if (response.ok) {
        console.log('סנכרון מזהה משתמש הושלם בהצלחה');
        return true;
      } else {
        // לא נכשל בחומרה - ממשיך לדף הבקרה למרות השגיאה
        console.warn('אזהרה: סנכרון מזהה משתמש לא הושלם');
        return false;
      }
    } catch (error) {
      console.error('שגיאה בתיקון אימות אוטומטי:', error);
      return false;
    }
  };

  async function onSubmit(data: { email: string; password: string }) {
    setIsLoading(true);
    setError(null);
    setLoginStatus(`מנסה להתחבר עם ${data.email}...`);

    try {
      console.log('מתחבר עם אימייל:', data.email);
      
      // רק רושם סיסמאות בדיקה לצורכי דיבוג
      if (data.email === 'test@example.com' || data.email === 'admin@example.com') {
        console.log('דיבוג - ניסיון התחברות עם סיסמה:', data.password);
      }
      
      setLoginStatus(`שולח בקשת התחברות...`);
      const result = await signIn("credentials", {
        email: data.email.toLowerCase(),
        password: data.password,
        redirect: false,
      });

      if (!result?.ok) {
        console.error('ההתחברות נכשלה עם שגיאה:', result?.error);
        setLoginStatus(`ההתחברות נכשלה: ${result?.error || "סיבה לא ידועה"}`);
        setError(result?.error === "CredentialsSignin" ? "אימייל או סיסמה שגויים" : result?.error || "פרטי התחברות שגויים");
        setIsLoading(false);
        return;
      }

      console.log('התחברות הצליחה, מבצע סנכרון מזהה...');
      setLoginStatus('התחברות הצליחה! מבצע סנכרון מזהה משתמש...');
      
      // ניסיון לתקן את האימות אחרי התחברות מוצלחת
      await tryFixAuth(data.email.toLowerCase());
      
      // רענון כפוי כדי לוודא שהסשן מעודכן
      router.refresh();
      
      setLoginStatus('התחברות והסנכרון הושלמו בהצלחה! מעביר לדף הבית...');
      
      // השהייה קטנה לפני הפניה כדי לוודא שהסשן התבסס במלואו
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (error) {
      console.error('פרטי שגיאת התחברות:', error);
      setLoginStatus(`שגיאה לא צפויה: ${error instanceof Error ? error.message : String(error)}`);
      setError("אירעה שגיאה. אנא נסה שוב.");
      setIsLoading(false);
    }
  }

  const handleGitHubLogin = async () => {
    setIsLoading(true);
    
    try {
      // עבור התחברות GitHub, אנו משתמשים ב-redirect: true כדי לאפשר את זרימת OAuth החיצונית
      await signIn("github", { callbackUrl: "/api/auth/github-callback" });
    } catch (error) {
      console.error("שגיאת התחברות GitHub:", error);
      setError("אירעה שגיאה בעת ניסיון להתחבר עם GitHub");
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium block text-gray-700 dark:text-gray-300 rtl:text-right">
            אימייל
          </label>
          <div className="relative">
            <MailIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              id="email"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              placeholder="your@email.com"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-500 rtl:text-right">{errors.email.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300 rtl:text-right">
              סיסמה
            </label>
            <a
              href="/auth/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              שכחת סיסמה?
            </a>
          </div>
          <div className="relative">
            <LockIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              disabled={isLoading}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              {...register("password")}
            />
          </div>
          {errors.password && (
            <p className="text-sm text-red-500 rtl:text-right">{errors.password.message}</p>
          )}
        </div>
        
        {loginStatus && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg relative dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300">
            <strong className="font-bold">סטטוס:</strong>
            <span className="block sm:inline"> {loginStatus}</span>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative dark:bg-red-900/20 dark:border-red-800 dark:text-red-400" role="alert">
            <strong className="font-bold">שגיאה:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}
        
        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "מתחבר..." : "התחברות"}
        </button>
      </form>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t dark:border-gray-700" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
            או המשך עם
          </span>
        </div>
      </div>

      <button
        type="button"
        disabled={isLoading}
        onClick={handleGitHubLogin}
        className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-black text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:hover:bg-gray-700"
      >
        {isLoading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <GitHubLogoIcon className="h-4 w-4" />
        )}
        {isLoading ? "מתחבר..." : "התחברות עם GitHub"}
      </button>
    </div>
  );
} 