'use client';
import Link from 'next/link';
import { ThemeToggle } from './theme-toggle';
import { usePathname } from 'next/navigation';

const titles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/projects': 'Projects',
  '/dashboard/new-project': 'Create Project',
  '/settings': 'Settings',
  '/docs': 'Documentation',
  '/pricing': 'Pricing',
};

export default function Topbar() {
  const pathname = usePathname();
  // מציאת כותרת מתאימה או ברירת מחדל
  const title = Object.keys(titles).find((k) => pathname.startsWith(k))
    ? titles[Object.keys(titles).find((k) => pathname.startsWith(k)) as string]
    : 'ARXIO';

  return (
    <header className="sticky top-0 z-40 w-full h-14 backdrop-blur-md bg-black/30 flex items-center justify-between px-4 border-b border-white/10">
      <h1 className="text-lg font-semibold text-white">{title}</h1>
      <nav className="flex items-center gap-4">
        <Link href="/docs" className="text-sm text-gray-300 hover:text-white">
          Docs
        </Link>
        <Link href="/pricing" className="text-sm text-gray-300 hover:text-white">
          Pricing
        </Link>
        <ThemeToggle />
      </nav>
    </header>
  );
} 