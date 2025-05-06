"use client"

import { useState, useEffect } from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({ children, ...props }: any) {
  const [mounted, setMounted] = useState(false)

  // הרכיב יוצג רק אחרי הרנדור הראשוני בלקוח
  useEffect(() => {
    setMounted(true)
  }, [])

  // במהלך ההידרציה הראשונית, נציג תוכן ריק למניעת בעיות הידרציה
  if (!mounted) {
    return <div style={{ visibility: "hidden" }}>{children}</div>
  }

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
} 