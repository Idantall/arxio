'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, FolderGit2, PlusCircle, Settings, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/projects', label: 'Projects', icon: FolderGit2 },
  { href: '/dashboard/new-project', label: 'New Project', icon: PlusCircle },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <motion.aside
      initial={{ width: 80 }}
      whileHover={{ width: 224 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="group fixed right-0 top-0 h-screen bg-[#0f172a] shadow-xl z-50 flex flex-col text-gray-300"
    >
      <div className="flex-1 py-6 space-y-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-2 rounded-md transition-colors
              ${active ? 'bg-teal-600 text-black' : 'hover:bg-[#1e293b]'}`}
            >
              <Icon size={20} />
              <span className="text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
      <button
        onClick={() => signOut({ callbackUrl: '/auth/login' })}
        className="flex items-center gap-3 px-4 py-3 text-sm text-red-300 hover:text-red-500"
      >
        <LogOut size={20} />
        <span className="opacity-0 group-hover:opacity-100 transition-opacity">Logout</span>
      </button>
    </motion.aside>
  );
} 