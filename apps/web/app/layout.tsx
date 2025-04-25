import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Inter as FontSans } from "next/font/google";
import { Montserrat } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" className="dark">
      <head />
      <body
        className={`min-h-screen bg-background font-sans antialiased ${fontSans.variable} ${montserrat.variable}`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <div className="pr-20 md:pr-24">
              <Topbar />
              <Sidebar />
              <main className="pt-16 px-4 md:px-8 pb-10">
                {children}
              </main>
            </div>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
