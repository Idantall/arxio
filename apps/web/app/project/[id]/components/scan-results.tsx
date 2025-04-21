"use client";

import { useState, useEffect } from "react";
import { Finding, ScanStatus, Severity, ScanType } from "@arxio/types";
import { SeverityBadge, Tabs, TabsList, TabsTrigger, TabsContent } from "@arxio/ui";
import { io, Socket } from "socket.io-client";
import { useToast } from "@/components/ui/use-toast";

interface ScanResultsProps {
  projectId: string;
}

// Mock findings for demo purposes
const mockFindings: Finding[] = [
  {
    id: "1",
    scanId: "scan1",
    severity: Severity.CRITICAL,
    ruleId: "javascript.react.security.audit.react-dangerouslysetinnerhtml-warning",
    title: "Dangerous use of dangerouslySetInnerHTML",
    description: "Using dangerouslySetInnerHTML can expose your application to XSS attacks.",
    filePath: "src/App.js",
    lineStart: 19,
    lineEnd: 19,
    resolved: false,
  },
  {
    id: "2",
    scanId: "scan1",
    severity: Severity.HIGH,
    ruleId: "javascript.react.security.audit.react-no-unvalidated-json",
    title: "Unvalidated JSON from localStorage",
    description: "Parsing unvalidated JSON from localStorage can lead to injection attacks.",
    filePath: "src/App.js",
    lineStart: 8,
    lineEnd: 8,
    resolved: false,
  },
  {
    id: "3",
    scanId: "scan1",
    severity: Severity.MEDIUM,
    ruleId: "javascript.express.security.audit.express-no-csrf-protection",
    title: "Missing CSRF protection",
    description: "Application may be vulnerable to Cross-Site Request Forgery (CSRF) attacks.",
    filePath: "src/server.js",
    lineStart: 15,
    lineEnd: 15,
    resolved: false,
  },
];

export function ScanResults({ projectId }: ScanResultsProps) {
  const { toast } = useToast();
  const [findings, setFindings] = useState<Finding[]>(mockFindings);
  const [scanStatus, setScanStatus] = useState<ScanStatus>(ScanStatus.SUCCESS);
  const [currentSeverityFilter, setCurrentSeverityFilter] = useState<string>("all");
  const [socket, setSocket] = useState<Socket | null>(null);
  
  // Initialize WebSocket connection for real-time updates
  useEffect(() => {
    // This would connect to your real WebSocket server in production
    const socketInstance = io("/ws/scans", {
      path: `/api/socketio`,
      autoConnect: false,
    });
    
    setSocket(socketInstance);
    
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []);
  
  // Set up WebSocket event listeners
  useEffect(() => {
    if (!socket) return;
    
    socket.on("connect", () => {
      console.log("Socket connected");
      socket.emit("subscribe", { projectId });
    });
    
    socket.on("scan:progress", (data) => {
      // Update scan progress
      setScanStatus(data.status);
      
      toast({
        title: "Scan Update",
        description: data.message,
      });
    });
    
    socket.on("scan:finding", (data) => {
      // Add new finding
      setFindings(prev => [...prev, data.finding]);
      
      toast({
        title: `New ${data.finding.severity} Finding`,
        description: data.finding.title,
        variant: data.finding.severity === Severity.CRITICAL || 
                data.finding.severity === Severity.HIGH 
                ? "destructive" : "default",
      });
    });
    
    socket.on("scan:completed", (data) => {
      setScanStatus(ScanStatus.SUCCESS);
      
      toast({
        title: "Scan Completed",
        description: `Found ${data.findings_count} issues`,
        variant: "success",
      });
    });
    
    socket.on("scan:error", (data) => {
      setScanStatus(ScanStatus.ERROR);
      
      toast({
        title: "Scan Error",
        description: data.message,
        variant: "destructive",
      });
    });
    
    socket.connect();
    
    return () => {
      socket.off("connect");
      socket.off("scan:progress");
      socket.off("scan:finding");
      socket.off("scan:completed");
      socket.off("scan:error");
    };
  }, [socket, projectId, toast]);
  
  // Filter findings by severity
  const filteredFindings = currentSeverityFilter === "all"
    ? findings
    : findings.filter(finding => finding.severity === currentSeverityFilter);
  
  // Count findings by severity
  const findingCounts = {
    all: findings.length,
    [Severity.CRITICAL]: findings.filter(f => f.severity === Severity.CRITICAL).length,
    [Severity.HIGH]: findings.filter(f => f.severity === Severity.HIGH).length,
    [Severity.MEDIUM]: findings.filter(f => f.severity === Severity.MEDIUM).length,
    [Severity.LOW]: findings.filter(f => f.severity === Severity.LOW).length,
    [Severity.INFO]: findings.filter(f => f.severity === Severity.INFO).length,
  };
  
  // Handle click on a finding to navigate to the file
  const handleFindingClick = (finding: Finding) => {
    // In a real app, this would navigate to the file in the code viewer
    console.log("Navigate to file:", finding.filePath, "line:", finding.lineStart);
  };

  return (
    <div className="h-full flex flex-col">
      <Tabs 
        defaultValue="all" 
        value={currentSeverityFilter}
        onValueChange={setCurrentSeverityFilter}
        className="w-full p-4"
      >
        <TabsList>
          <TabsTrigger value="all">
            All ({findingCounts.all})
          </TabsTrigger>
          <TabsTrigger value={Severity.CRITICAL}>
            Critical ({findingCounts[Severity.CRITICAL]})
          </TabsTrigger>
          <TabsTrigger value={Severity.HIGH}>
            High ({findingCounts[Severity.HIGH]})
          </TabsTrigger>
          <TabsTrigger value={Severity.MEDIUM}>
            Medium ({findingCounts[Severity.MEDIUM]})
          </TabsTrigger>
          <TabsTrigger value={Severity.LOW}>
            Low ({findingCounts[Severity.LOW]})
          </TabsTrigger>
          <TabsTrigger value={Severity.INFO}>
            Info ({findingCounts[Severity.INFO]})
          </TabsTrigger>
        </TabsList>
        
        <div className="mt-4 h-full">
          {scanStatus === ScanStatus.RUNNING && (
            <div className="bg-blue-50 text-blue-700 p-4 mb-4 rounded-md text-sm">
              A scan is currently running. Results will appear in real-time as they are found.
            </div>
          )}
          
          {scanStatus === ScanStatus.ERROR && (
            <div className="bg-red-50 text-red-700 p-4 mb-4 rounded-md text-sm">
              The last scan encountered an error. Please try again.
            </div>
          )}
          
          {filteredFindings.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No findings in this category
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFindings.map(finding => (
                <div 
                  key={finding.id}
                  className="border rounded-md p-4 hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleFindingClick(finding)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center mb-2">
                        <SeverityBadge severity={finding.severity} className="mr-2" />
                        <span className="text-sm text-muted-foreground">{finding.ruleId}</span>
                      </div>
                      <h3 className="font-medium">{finding.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{finding.description}</p>
                    </div>
                  </div>
                  
                  {finding.filePath && (
                    <div className="mt-3 text-sm bg-muted p-2 rounded">
                      <div className="font-mono text-xs">
                        {finding.filePath}:{finding.lineStart}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Tabs>
    </div>
  );
} 