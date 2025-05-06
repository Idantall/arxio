"use client";

import { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn, Badge } from "@arxio/ui";

interface SidebarNavProps {
  items: {
    title: string;
    href: string;
    icon: LucideIcon;
    badge?: string;
  }[];
}

export function SidebarNav({ items }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <div className="grid gap-1">
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-muted",
              isActive ? "bg-muted font-medium text-foreground" : "text-muted-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
            {item.badge && (
              <Badge variant="secondary" className="mr-auto">
                {item.badge}
              </Badge>
            )}
          </Link>
        );
      })}
    </div>
  );
} 