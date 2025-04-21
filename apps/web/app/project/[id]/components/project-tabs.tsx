"use client";

import { useState, useEffect } from "react";
import { Project, ScanType } from "@arxio/types";
import { Tabs, TabsList, TabsTrigger, TabsContent, Button } from "@arxio/ui";
import { CodeViewer } from "./code-viewer";
import { ScanResults } from "./scan-results";
import { startProjectScan } from "@/lib/api/projects";
import { Play, AlertTriangle } from "lucide-react";

interface ProjectTabsProps {
  project: Project;
}

export function ProjectTabs({ project }: ProjectTabsProps) {
  const [activeTab, setActiveTab] = useState("code");
  const [scanning, setScanning] = useState(false);
  const [scanType, setScanType] = useState<ScanType>(ScanType.SAST);
  const [message, setMessage] = useState<{title: string, description: string, type: 'success' | 'error' | 'warning' | null}>({ title: '', description: '', type: null });
  
  // Clear message after 5 seconds
  useEffect(() => {
    if (message.type) {
      const timer = setTimeout(() => {
        setMessage({ title: '', description: '', type: null });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);
  
  async function handleStartScan() {
    if (scanning) return;
    
    // DAST requires a deployed URL
    if (scanType === ScanType.DAST && !project.deployedUrl) {
      setMessage({
        title: "Deployed URL Required",
        description: "DAST scans require a deployed URL. Please add one in project settings.",
        type: 'error'
      });
      return;
    }
    
    setScanning(true);
    
    try {
      const result = await startProjectScan(project.id, scanType);
      
      setMessage({
        title: "Scan Started",
        description: `Your ${scanType} scan has been started.`,
        type: 'success'
      });
      
      // Automatically switch to results tab
      setActiveTab("results");
    } catch (error) {
      console.error("Failed to start scan:", error);
      setMessage({
        title: "Failed to Start Scan",
        description: "An error occurred while trying to start the scan.",
        type: 'error'
      });
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      {message.type && (
        <div className={`p-4 mb-4 ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 
          message.type === 'error' ? 'bg-red-100 text-red-800' : 
          'bg-yellow-100 text-yellow-800'
        }`}>
          <h4 className="text-sm font-medium">{message.title}</h4>
          <p className="text-sm">{message.description}</p>
        </div>
      )}
      
      <div className="border-b px-4 py-2 flex justify-between items-center">
        <Tabs 
          defaultValue="code" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="code">Code</TabsTrigger>
              <TabsTrigger value="results">Scan Results</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center space-x-2">
              <select 
                className="p-2 border rounded-md text-sm"
                value={scanType}
                onChange={(e) => setScanType(e.target.value as ScanType)}
              >
                <option value={ScanType.SAST}>SAST (Static Analysis)</option>
                <option value={ScanType.DAST}>DAST (Dynamic Analysis)</option>
              </select>
              
              <Button 
                onClick={handleStartScan}
                disabled={scanning}
                className="flex items-center"
              >
                <Play className="h-4 w-4 mr-2" />
                {scanning ? "Starting Scan..." : "Run Scan"}
              </Button>
              
              {scanType === ScanType.DAST && !project.deployedUrl && (
                <div className="flex items-center text-amber-500 text-sm">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  DAST requires deployed URL
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-4">
            <TabsContent value="code" className="m-0">
              <CodeViewer projectId={project.id} />
            </TabsContent>
            
            <TabsContent value="results" className="m-0">
              <ScanResults projectId={project.id} />
            </TabsContent>
            
            <TabsContent value="settings" className="m-0 p-4">
              <h2 className="text-xl font-bold mb-4">Project Settings</h2>
              <p className="text-muted-foreground">
                Settings will be implemented in a future update.
              </p>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
} 