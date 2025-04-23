"use client";

import { PropsWithChildren } from "react";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@arxio/ui";

export function Providers({ children }: PropsWithChildren) {
  return (
    <SessionProvider>
      {children}
      <Toaster />
    </SessionProvider>
  );
} 