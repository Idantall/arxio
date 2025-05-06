"use client";

import React from 'react';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div suppressHydrationWarning={true}>{children}</div>;
} 