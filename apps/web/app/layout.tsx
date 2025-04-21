import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="he" dir="rtl">
      <body className="min-h-screen bg-background">
        {children}
      </body>
    </html>
  );
}
