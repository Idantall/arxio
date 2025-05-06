"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  AlertCircle, CheckCircle, Clock, Shield, Database, 
  Server, Code, FileText, Zap, Terminal, Github, GitBranch
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Button
} from "@arxio/ui";
import { useSession } from "next-auth/react";

// רכיב פשוט להצגת פס התקדמות
interface ProgressProps {
  value: number;
  className?: string;
}

const Progress: React.FC<ProgressProps> = ({ value, className = "" }) => {
  return (
    <div className={`w-full bg-gray-200 rounded-full ${className}`}>
      <div 
        className="bg-blue-600 rounded-full transition-all duration-500 ease-in-out" 
        style={{ width: `${value}%`, height: '100%' }}
      ></div>
    </div>
  );
};

// סוגי הצעדים האפשריים בתהליך הסריקה
type StepStatus = "completed" | "running" | "pending" | "failed";

type SubStep = {
  id: string;
  label: string;
  status: StepStatus;
};

type Step = {
  id: string;
  label: string;
  status: StepStatus;
  substeps?: SubStep[];
};

type LogEntry = {
  timestamp: string;
  level: "info" | "warning" | "error";
  message: string;
};

type ProgressData = {
  scanId?: string;
  projectId?: string;
  overallProgress: number;
  steps: Step[];
  scanType: "DAST" | "SAST" | "API";
  target: string;
  startTime: string;
  estimatedTime: number; // דקות משוערות לסיום
  status: "initializing" | "cloning" | "analyzing" | "scanning" | "finalizing" | "completed" | "failed";
  logs: LogEntry[];
  error?: string;
};

export default function ScanProgressPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  
  const scanId = searchParams.get("scanId");
  const name = searchParams.get("name") || "סריקה חדשה";
  const type = (searchParams.get("type") as "DAST" | "SAST" | "API") || "DAST";
  const target = searchParams.get("target") || "https://example.com";
  const projectId = searchParams.get("projectId");
  
  const [progress, setProgress] = useState<ProgressData>({
    scanId,
    projectId,
    overallProgress: 0,
    scanType: type,
    target,
    startTime: new Date().toISOString(),
    estimatedTime: type === "SAST" ? 15 : type === "DAST" ? 30 : 20,
    status: "initializing",
    steps: [],
    logs: [],
  });
  
  const [showLogs, setShowLogs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  
  // רק אם אין scanId, מתחיל סריקה חדשה
  useEffect(() => {
    if (!scanId && session?.user) {
      createNewScan();
    }
  }, [scanId, session]);
  
  // יצירת סריקה חדשה
  const createNewScan = async () => {
    if (!session?.user) {
      setError("נדרשת התחברות ליצירת סריקה");
      return;
    }
    
    try {
      const response = await fetch('/api/scans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type,
          target,
          userId: session.user.id,
          projectId,
          parameters: {} // ניתן להוסיף פרמטרים נוספים בהתאם לצורך
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'שגיאה ביצירת סריקה');
      }
      
      const data = await response.json();
      // עדכון ה-URL עם פרמטר ה-scanId החדש
      const newParams = new URLSearchParams(searchParams as any);
      newParams.set('scanId', data.scanId);
      if (data.projectId && !projectId) {
        newParams.set('projectId', data.projectId);
      }
      
      router.replace(`/dashboard/new-scan/progress?${newParams.toString()}`);
      
      // עדכון המצב המקומי
      setProgress(prev => ({
        ...prev,
        scanId: data.scanId,
        projectId: data.projectId || projectId
      }));
      
      // התחלת הפולינג לעדכונים
      setIsPolling(true);
      
    } catch (err: any) {
      console.error('שגיאה ביצירת סריקה:', err);
      setError(err.message || 'שגיאה ביצירת סריקה');
    }
  };
  
  // קבלת עדכוני התקדמות
  useEffect(() => {
    if (!scanId || !isPolling) return;
    
    let intervalId: NodeJS.Timeout;
    
    const fetchProgressUpdates = async () => {
      try {
        const response = await fetch(`/api/scans/progress?id=${scanId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            console.warn('נתוני התקדמות לא נמצאו, ממשיך בפולינג');
            return;
          }
          
          const errorData = await response.json();
          throw new Error(errorData.error || 'שגיאה בקבלת נתוני התקדמות');
        }
        
        const data = await response.json();
        setProgress(data);
        
        // אם הסריקה הסתיימה, מפסיק את הפולינג ומנתב לדף הסריקה
        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(intervalId);
          setIsPolling(false);
          
          if (data.status === 'completed') {
            // ממתין 2 שניות לפני ניתוב לדף הסריקה המלא
            setTimeout(() => {
              router.push(`/dashboard/scans/${scanId}`);
            }, 2000);
          }
        }
        
      } catch (err: any) {
        console.error('שגיאה בקבלת עדכוני התקדמות:', err);
        setError(err.message || 'שגיאה בקבלת עדכוני התקדמות');
      }
    };
    
    // מתחיל פולינג מיידית וממשיך כל 2 שניות
    fetchProgressUpdates();
    intervalId = setInterval(fetchProgressUpdates, 2000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [scanId, isPolling, router]);
  
  // במצב אידיאלי, היינו משתמשים ב-WebSocket במקום פולינג
  // לדוגמה: חיבור לנקודת קצה WebSocket, האזנה לעדכונים, וטיפול באירועים
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "running":
        return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />;
      case "failed":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };
  
  // פונקציה להצגת הזמן שנותר בפורמט מתאים
  const formatTimeRemaining = () => {
    const elapsedMinutes = Math.floor((Date.now() - new Date(progress.startTime).getTime()) / 60000);
    const remainingMinutes = Math.max(0, progress.estimatedTime - elapsedMinutes);
    
    if (remainingMinutes === 0) return "סיום בקרוב";
    return `${remainingMinutes} דקות נותרו`;
  };
  
  // בחירת האייקון המתאים לסוג הסריקה
  const getScanTypeIcon = () => {
    switch (progress.scanType) {
      case "DAST":
        return <Shield className="h-5 w-5" />;
      case "SAST":
        return <Code className="h-5 w-5" />;
      case "API":
        return <Server className="h-5 w-5" />;
      default:
        return <Shield className="h-5 w-5" />;
    }
  };
  
  return (
    <div className="container mx-auto p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold mb-3">{name}</h1>
          <div className="flex items-center justify-center space-x-3 space-x-reverse">
            <span className="flex items-center">
              {getScanTypeIcon()}
              <span className="mr-1">{progress.scanType}</span>
            </span>
            <span className="text-gray-400">|</span>
            <span className="text-gray-600 text-sm">{progress.target}</span>
          </div>
        </div>
        
        {error && (
          <Card className="mb-6 border-red-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-red-600">שגיאה</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <p>{error}</p>
              </div>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => router.push('/dashboard/new-scan')}
              >
                חזרה לדף הסריקה החדשה
              </Button>
            </CardContent>
          </Card>
        )}
        
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>התקדמות סריקה</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{Math.round(progress.overallProgress)}%</span>
                <span className="text-sm text-gray-500">{formatTimeRemaining()}</span>
              </div>
            </div>
            <CardDescription>
              {progress.status === "initializing" && "מאתחל את הסריקה..."}
              {progress.status === "cloning" && "מוריד את הקוד מהמאגר..."}
              {progress.status === "scanning" && "מבצע סריקה אקטיבית..."}
              {progress.status === "analyzing" && "מנתח ממצאים..."}
              {progress.status === "finalizing" && "מסיים ומייצר דו״ח..."}
              {progress.status === "completed" && "הסריקה הושלמה!"}
              {progress.status === "failed" && "הסריקה נכשלה."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <Progress value={progress.overallProgress} className="h-2" />
            </div>
            
            <div className="space-y-6">
              {/* מידע על הפרויקט */}
              {progress.projectId && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center">
                    <Database className="h-5 w-5 text-green-500 mr-2" />
                    <div>
                      <p className="font-medium">פרויקט חדש נוצר</p>
                      <p className="text-sm text-gray-500">מזהה: {progress.projectId}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/projects/${progress.projectId}`)}>
                    צפה בפרויקט
                  </Button>
                </div>
              )}
              
              {/* תצוגת שגיאה */}
              {progress.error && (
                <div className="flex items-center p-3 bg-red-50 rounded-md">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  <div>
                    <p className="font-medium text-red-600">שגיאה בביצוע הסריקה</p>
                    <p className="text-sm text-red-500">{progress.error}</p>
                  </div>
                </div>
              )}
              
              {/* רשימת הצעדים */}
              <div className="space-y-3">
                {progress.steps.map((step) => (
                  <div key={step.id} className="space-y-2">
                    <div className="flex items-center">
                      {getStatusIcon(step.status)}
                      <span className={`mr-2 font-medium ${
                        step.status === "running" ? "text-blue-600" : 
                        step.status === "completed" ? "text-green-600" : 
                        step.status === "failed" ? "text-red-600" : "text-gray-600"
                      }`}>
                        {step.label}
                      </span>
                    </div>
                    
                    {/* תת-צעדים אם יש */}
                    {step.substeps && step.status !== "pending" && (
                      <div className="mr-6 mt-1 space-y-1 border-r-2 border-gray-100 pr-3">
                        {step.substeps.map((substep) => (
                          <div key={substep.id} className="flex items-center">
                            {getStatusIcon(substep.status)}
                            <span className={`mr-2 text-sm ${
                              substep.status === "running" ? "text-blue-600" : 
                              substep.status === "completed" ? "text-green-600" : 
                              substep.status === "failed" ? "text-red-600" : "text-gray-600"
                            }`}>
                              {substep.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="ghost" 
              className="w-full"
              onClick={() => setShowLogs(!showLogs)}
            >
              {showLogs ? "הסתר לוגים" : "הצג לוגים"}
            </Button>
          </CardFooter>
        </Card>
        
        {/* לוגים */}
        {showLogs && (
          <Card>
            <CardHeader>
              <CardTitle>לוגי סריקה</CardTitle>
              <CardDescription>פרטי התהליך בזמן אמת</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-gray-200 p-4 rounded-md font-mono text-sm h-80 overflow-y-auto">
                {progress.logs.length > 0 ? (
                  progress.logs.map((log, index) => (
                    <div key={index} className="pb-1">
                      <span className="text-gray-400">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{" "}
                      <span className={`${
                        log.level === "error" ? "text-red-400" : 
                        log.level === "warning" ? "text-yellow-400" : "text-green-400"
                      }`}>
                        {log.level.toUpperCase()}
                      </span>{" "}
                      <span>{log.message}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-400 py-8">טרם נרשמו לוגים</div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 