"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { LockIcon, MailIcon, UserIcon } from "lucide-react";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { signIn } from "next-auth/react";
import Image from "next/image";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "שם משתמש חייב להכיל לפחות 2 תווים",
  }),
  email: z.string().email({
    message: "נא להזין כתובת אימייל תקינה",
  }),
  password: z.string().min(8, {
    message: "סיסמה חייבת להכיל לפחות 8 תווים",
  }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "הסיסמאות אינן תואמות",
  path: ["confirmPassword"],
});

export default function RegisterPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isGitHubLoading, setIsGitHubLoading] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    setGeneralError(null);
    
    try {
      console.log('ניסיון לרשום משתמש:', values.email);
      
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('שגיאת רישום:', data);
        
        if (response.status === 409) {
          // אימייל כבר קיים
          form.setError("email", {
            type: "manual",
            message: data.message || "כתובת האימייל כבר רשומה במערכת",
          });
        } else {
          // שגיאה כללית
          setGeneralError(data.message || "שגיאה בעת הרישום. נסה שנית.");
        }
        return;
      }

      console.log('הרישום הושלם בהצלחה, מעביר לדף התחברות');
      
      // הרישום הצליח
      router.push("/auth/login?registered=true");
    } catch (error) {
      console.error("שגיאת רישום:", error);
      setGeneralError("שגיאה בעת הרישום. נסה שנית או פנה לתמיכה.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleGitHubLogin = async () => {
    setIsGitHubLoading(true);
    
    try {
      // עבור התחברות GitHub, אנו משתמשים ב-redirect: true כדי לאפשר את זרימת OAuth החיצונית
      await signIn("github", { callbackUrl: "/dashboard" });
    } catch (error) {
      console.error("שגיאת התחברות GitHub:", error);
      setGeneralError("אירעה שגיאה בעת ניסיון להתחבר עם GitHub");
      setIsGitHubLoading(false);
    }
  };

  return (
    <div className="min-h-screen max-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 p-4 overflow-hidden">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Image 
              src="/logo.png" 
              alt="Arxio Logo" 
              width={150} 
              height={50} 
              className="h-auto dark:brightness-0 dark:invert"
            />
          </div>
          <h1 className="text-3xl font-extrabold text-white">
            הצטרפו ל-ARXIO
          </h1>
          <p className="mt-2 text-sm text-gray-300">
            צרו חשבון חדש או התחברו עם GitHub
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden p-6 space-y-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">הרשמה</h2>
          
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block rtl:text-right">
                שם מלא
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="ישראל ישראלי"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  {...form.register("name")}
                  disabled={isSubmitting}
                />
              </div>
              {form.formState.errors.name && (
                <p className="text-sm text-red-500 rtl:text-right">{form.formState.errors.name.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block rtl:text-right">
                אימייל
              </label>
              <div className="relative">
                <MailIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  {...form.register("email")}
                  disabled={isSubmitting}
                />
              </div>
              {form.formState.errors.email && (
                <p className="text-sm text-red-500 rtl:text-right">{form.formState.errors.email.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block rtl:text-right">
                סיסמה
              </label>
              <div className="relative">
                <LockIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  {...form.register("password")}
                  disabled={isSubmitting}
                />
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-red-500 rtl:text-right">{form.formState.errors.password.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block rtl:text-right">
                אימות סיסמה
              </label>
              <div className="relative">
                <LockIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  {...form.register("confirmPassword")}
                  disabled={isSubmitting}
                />
              </div>
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-red-500 rtl:text-right">{form.formState.errors.confirmPassword.message}</p>
              )}
            </div>
            
            {generalError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative dark:bg-red-900/20 dark:border-red-800 dark:text-red-400" role="alert">
                <strong className="font-bold">שגיאה:</strong>
                <span className="block sm:inline"> {generalError}</span>
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "מתבצע רישום..." : "הרשמה"}
            </button>
          </form>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                או המשך עם
              </span>
            </div>
          </div>
          
          <button
            type="button"
            disabled={isGitHubLoading}
            onClick={handleGitHubLogin}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-black text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            {isGitHubLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <GitHubLogoIcon className="h-4 w-4" />
            )}
            {isGitHubLoading ? "מתחבר..." : "התחברות עם GitHub"}
          </button>
          
          <div className="text-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">כבר יש לכם חשבון? </span>
            <Link 
              href="/auth/login" 
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              התחברו כאן
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 