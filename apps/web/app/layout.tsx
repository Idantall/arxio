import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Inter as FontSans } from "next/font/google";
import { Montserrat } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import MainLayout from './main-layout';

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-heading",
});

export const metadata: Metadata = {
  title: 'ARXIO - סריקת אבטחה לקוד',
  description: 'פלטפורמה לזיהוי פגיעויות אבטחה בקוד',
};

// פונקציה שמדכאת אזהרות הידרציה
function suppressHydrationWarning() {
  return {
    suppressHydrationWarning: true,
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // קוד להפניה לדף שגיאות סופאבייס אם יש שגיאה בטעינה
              window.addEventListener('error', function(e) {
                if (
                  e.message && (
                    e.message.includes('supabaseKey is required') || 
                    e.message.includes('TypeError: Cannot read') && e.message.includes('supabase')
                  )
                ) {
                  console.error('Detected Supabase error, redirecting to error page');
                  // הפניה לדף שגיאה רק אם אנחנו לא כבר בדף השגיאה
                  if (!window.location.pathname.includes('/supabase-error')) {
                    window.location.href = '/supabase-error';
                  }
                }
              });
            `,
          }}
        />
      </head>
      <body className={`${fontSans.variable} ${montserrat.variable} font-sans antialiased`}>
        <ThemeProvider>
          <Providers>
            <MainLayout>{children}</MainLayout>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
