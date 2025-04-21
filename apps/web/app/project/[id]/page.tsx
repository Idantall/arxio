"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Skeleton, Tabs, TabsContent, TabsList, TabsTrigger, Badge } from "@arxio/ui";
import { CodeIcon, AlertCircleIcon, PlayIcon, PauseIcon, FileIcon, FolderIcon, GitBranchIcon, GitForkIcon, SettingsIcon } from "lucide-react";
import { Editor } from "@monaco-editor/react";

interface Project {
  id: string;
  name: string;
  description: string;
  repositoryType: string;
  repositoryUrl: string | null;
  branch: string | null;
  localPath: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ScanResult {
  id: string;
  file: string;
  line: number;
  column: number;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  code: string;
  projectId: string;
}

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<ScanResult | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${params.id}`);
        if (!response.ok) {
          throw new Error("פרויקט לא נמצא");
        }
        const data = await response.json();
        setProject(data);
      } catch (err) {
        console.error("שגיאה בטעינת פרויקט:", err);
        router.push("/dashboard");
      } finally {
        setIsLoading(false);
      }
    };
    
    const fetchScanResults = async () => {
      try {
        const response = await fetch(`/api/projects/${params.id}/scans`);
        if (response.ok) {
          const data = await response.json();
          setScanResults(data);
        }
      } catch (err) {
        console.error("שגיאה בטעינת תוצאות סריקה:", err);
      }
    };
    
    fetchProject();
    fetchScanResults();
  }, [params.id, router]);
  
  const startScan = async () => {
    setIsScanning(true);
    setScanError(null);
    
    try {
      const response = await fetch(`/api/projects/${params.id}/scan`, {
        method: "POST",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "שגיאה בהתחלת הסריקה");
      }
      
      // כאן יש להתחבר לאירוע WebSocket לקבלת עדכונים בזמן אמת
      // setupWebSocket();
      
    } catch (err) {
      console.error("שגיאה בהתחלת סריקה:", err);
      setScanError(err instanceof Error ? err.message : "שגיאה לא צפויה אירעה");
      setIsScanning(false);
    }
  };
  
  const stopScan = async () => {
    try {
      await fetch(`/api/projects/${params.id}/scan/stop`, {
        method: "POST",
      });
      setIsScanning(false);
      
      // סגירת חיבור ה-WebSocket
      // closeWebSocket();
      
    } catch (err) {
      console.error("שגיאה בעצירת סריקה:", err);
    }
  };
  
  const fetchFileContent = async (filePath: string) => {
    try {
      const response = await fetch(`/api/projects/${params.id}/file?path=${encodeURIComponent(filePath)}`);
      if (!response.ok) {
        throw new Error("לא ניתן לטעון את תוכן הקובץ");
      }
      const data = await response.json();
      setFileContent(data.content);
    } catch (err) {
      console.error("שגיאה בטעינת תוכן הקובץ:", err);
      setFileContent("// שגיאה בטעינת תוכן הקובץ");
    }
  };
  
  const handleResultClick = (result: ScanResult) => {
    setSelectedResult(result);
    fetchFileContent(result.file);
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-8">
        <Skeleton className="h-12 w-1/3 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-40" />
          <Skeleton className="h-40 md:col-span-2" />
        </div>
      </div>
    );
  }
  
  if (!project) {
    return (
      <div className="container mx-auto p-8 text-center">
        <AlertCircleIcon className="h-16 w-16 mx-auto mb-4 text-destructive" />
        <h1 className="text-2xl font-bold mb-2">פרויקט לא נמצא</h1>
        <p className="mb-6">הפרויקט המבוקש אינו קיים או שאין לך הרשאות לצפות בו</p>
        <Button onClick={() => router.push("/dashboard")}>חזרה ללוח הבקרה</Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground mt-1">{project.description || "אין תיאור"}</p>
          
          <div className="flex mt-2 space-x-2">
            {project.repositoryType && (
              <Badge variant="outline" className="flex items-center space-x-1">
                <GitForkIcon className="h-3.5 w-3.5 ml-1" />
                <span>{project.repositoryType}</span>
              </Badge>
            )}
            {project.branch && (
              <Badge variant="outline" className="flex items-center space-x-1">
                <GitBranchIcon className="h-3.5 w-3.5 ml-1" />
                <span>{project.branch}</span>
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex space-x-2 mt-4 md:mt-0">
          {isScanning ? (
            <Button variant="destructive" onClick={stopScan}>
              <PauseIcon className="h-4 w-4 ml-2" />
              עצור סריקה
            </Button>
          ) : (
            <Button onClick={startScan}>
              <PlayIcon className="h-4 w-4 ml-2" />
              התחל סריקה
            </Button>
          )}
          
          <Button variant="outline" onClick={() => router.push(`/project/${project.id}/settings`)}>
            <SettingsIcon className="h-4 w-4 ml-2" />
            הגדרות
          </Button>
        </div>
      </div>
      
      {scanError && (
        <div className="flex items-center p-3 text-sm bg-destructive/15 text-destructive rounded-md mb-6">
          <AlertCircleIcon className="h-5 w-5 ml-2 shrink-0" />
          <p>{scanError}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>תוצאות סריקה</CardTitle>
            <CardDescription>
              {scanResults.length} ממצאים נמצאו
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[calc(100vh-20rem)] overflow-y-auto space-y-2 p-1">
              {scanResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CodeIcon className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>אין ממצאים</p>
                  <p className="text-sm">התחל סריקה כדי לאתר חולשות בפרויקט</p>
                </div>
              ) : (
                scanResults.map((result) => (
                  <div
                    key={result.id}
                    className={`border rounded-md p-3 cursor-pointer transition-colors ${
                      selectedResult?.id === result.id
                        ? "bg-primary/10 border-primary/50"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="flex justify-between mb-1">
                      <Badge variant={
                        result.severity === "critical" ? "destructive" :
                        result.severity === "high" ? "destructive" :
                        result.severity === "medium" ? "warning" : "outline"
                      }>
                        {result.severity === "critical" ? "קריטי" :
                         result.severity === "high" ? "גבוה" :
                         result.severity === "medium" ? "בינוני" : "נמוך"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {result.line}:{result.column}
                      </span>
                    </div>
                    <div className="flex items-start mt-1">
                      <FileIcon className="h-4 w-4 mt-0.5 ml-2 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="truncate text-sm font-medium">{result.file.split("/").pop()}</p>
                        <p className="text-xs text-muted-foreground truncate" dir="ltr">
                          {result.file}
                        </p>
                      </div>
                    </div>
                    <p className="mt-1 text-sm">{result.message}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle>
              {selectedResult ? (
                <div className="flex items-center">
                  <FileIcon className="h-5 w-5 ml-2" />
                  <span dir="ltr">{selectedResult.file}</span>
                </div>
              ) : (
                "צפייה בקוד"
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md overflow-hidden h-[calc(100vh-16rem)]">
              {selectedResult ? (
                <Editor
                  height="100%"
                  language="javascript" // צריך להתאים לפי סיומת הקובץ
                  theme="vs-dark"
                  value={fileContent}
                  options={{
                    readOnly: true,
                    minimap: { enabled: true },
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    automaticLayout: true
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <CodeIcon className="h-16 w-16 mb-4 opacity-20" />
                  <p>בחר ממצא מהרשימה כדי לצפות בקוד</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}