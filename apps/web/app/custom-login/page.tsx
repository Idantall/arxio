"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { MailIcon, LockIcon, GithubIcon } from "lucide-react";

// ציטוטים בנושא אבטחה מידע
const securityQuotes = [
  { quote: "אבטחת מידע היא לא מוצר, אלא תהליך.", author: "Bruce Schneier" },
  { quote: "אבטחה היא תמיד שרשרת; והיא חזקה כמו החוליה החלשה ביותר.", author: "Bruce Schneier" },
  { quote: "זה לא מספיק להיות בטוח, אתה צריך גם להרגיש בטוח.", author: "Amit Abraham" },
  { quote: "המידע שלך שווה יותר ממה שאתה חושב.", author: "Kevin Mitnick" },
  { quote: "הדרך הטובה ביותר לקבל סודות היא לתת את הרושם שאתה כבר יודע אותם.", author: "Robert Stephens" },
  { quote: "לא משנה כמה הטכנולוגיה מתקדמת, תמיד נשאר הגורם האנושי.", author: "Frank Abagnale" },
];

export default function CustomLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // בחירת ציטוט אקראי
  const randomQuote = securityQuotes[Math.floor(Math.random() * securityQuotes.length)];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error === "CredentialsSignin" ? "אימייל או סיסמה שגויים" : result.error);
        setLoading(false);
        return;
      }

      // אם הכל תקין, ניווט לדף הבית
      router.push("/dashboard");
    } catch (err) {
      setError("אירעה שגיאה. אנא נסה שוב מאוחר יותר.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* חלק ציטוט אבטחה */}
      <div className="hidden md:flex md:w-1/2 flex-col justify-center items-center p-10 bg-gradient-to-br from-blue-600 to-indigo-800 text-white">
        <div className="max-w-md text-center">
          <h2 className="text-3xl font-bold mb-6">ARXIO</h2>
          <blockquote className="text-xl mb-4 italic">"{randomQuote.quote}"</blockquote>
          <p className="text-sm">— {randomQuote.author}</p>
          
          <div className="mt-12 p-6 bg-white/10 backdrop-blur-sm rounded-xl">
            <h3 className="text-lg font-medium mb-3">האבטחה שלנו, היתרון שלכם</h3>
            <p className="text-sm mb-4">
              המערכת שלנו מאובטחת עם שיטות ההצפנה המתקדמות ביותר להגנה על הנתונים הרגישים שלכם.
            </p>
            <div className="flex justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-white"></div>
              <div className="w-2 h-2 rounded-full bg-white/60"></div>
              <div className="w-2 h-2 rounded-full bg-white/60"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* חלק טופס התחברות */}
      <div className="w-full md:w-1/2 flex justify-center items-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md space-y-8 bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">ברוכים השבים</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              התחברו לחשבון שלכם כדי להמשיך
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 rtl:text-right">
                  כתובת אימייל
                </label>
                <div className="relative">
                  <MailIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 rtl:text-right">
                  סיסמה
                </label>
                <div className="relative">
                  <LockIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="mr-2 block text-sm text-gray-700 dark:text-gray-300">
                  זכור אותי
                </label>
              </div>
              
              <div className="text-sm">
                <Link href="/auth/forgot-password" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
                  שכחת סיסמה?
                </Link>
              </div>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "מתחבר..." : "התחברות"}
              </button>
            </div>
          </form>
          
          <div className="relative mt-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400">
                או המשיכו עם
              </span>
            </div>
          </div>
          
          <div className="mt-4">
            <button
              onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-black text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              <GithubIcon className="h-4 w-4" />
              התחברות עם GitHub
            </button>
          </div>
          
          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            אין לכם חשבון?{" "}
            <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
              הרשמו עכשיו
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 