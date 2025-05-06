"use client";

import React from "react";
import { Toaster } from "@arxio/ui";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
} 