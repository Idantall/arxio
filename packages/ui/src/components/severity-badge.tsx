import * as React from "react";
import { cn } from "../lib/utils";

type SeverityLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";

interface SeverityBadgeProps {
  severity: SeverityLevel;
  className?: string;
}

const severityConfig: Record<SeverityLevel, { color: string; icon: string }> = {
  CRITICAL: {
    color: "bg-red-600 text-white",
    icon: "🔥",
  },
  HIGH: {
    color: "bg-red-400 text-white",
    icon: "⚠️",
  },
  MEDIUM: {
    color: "bg-orange-400 text-white",
    icon: "⚠",
  },
  LOW: {
    color: "bg-yellow-300 text-gray-800",
    icon: "ℹ️",
  },
  INFO: {
    color: "bg-blue-300 text-gray-800",
    icon: "📌",
  }
};

/**
 * A badge component that displays security finding severity levels
 * with appropriate colors and icons
 */
export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const config = severityConfig[severity];
  
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
        config.color,
        className
      )}
    >
      <span className="mr-1">{config.icon}</span>
      {severity}
    </span>
  );
} 