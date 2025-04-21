"use client";

import { useState } from "react";

interface ScanResultsProps {
  projectId: string;
}

export function ScanResults({ projectId }: ScanResultsProps) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center p-8">
        <h3 className="text-xl font-semibold mb-2">סריקות אבטחה</h3>
        <p className="text-muted-foreground">
          מידע על סריקות אבטחה והממצאים יופיע כאן.
          <br />
          מזהה פרויקט: {projectId}
        </p>
      </div>
    </div>
  );
} 