import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * שילוב של clsx ו-tailwind-merge ליצירת פונקציה שימושית 
 * לניהול מחלקות CSS בצורה דינמית
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
} 