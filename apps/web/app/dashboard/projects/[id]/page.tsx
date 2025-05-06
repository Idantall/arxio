"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Button, 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Badge,
  Alert,
  AlertTitle,
  AlertDescription
} from "@arxio/ui";
import { 
  ArrowLeft, 
  Code, 
  FileText, 
  Globe, 
  Shield, 
  Clock,
  Play,
  Settings,
  Users,
  Trash2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Link as LinkIcon,
  Calendar,
  BarChart
} from "lucide-react";

// טיפוסים
type ProjectStatus = "active" | "inactive" | "archived";
type SecurityStatus = "critical" | "high" | "medium" | "low" | "secure";

interface ScanResult {
  id: string;
  type: "sast" | "dast" | "api";
  status: "completed" | "failed" | "running" | "pending";
  startedAt: string;
  completedAt?: string;
  findingsCount: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
}

interface ProjectData {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  securityStatus: SecurityStatus;
  lastScan: string | null;
  nextScan: string | null;
  target: string;
  repositoryType: "web" | "api" | "mobile" | "repo";
  recentScans: ScanResult[];
  teamMembers: number;
  created_at: string;
  updated_at: string;
}

export default function ProjectPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // קריאה אמיתית ל-API
        const response = await fetch(`/api/projects/${params.id}`);
        
        if (!response.ok) {
          throw new Error(`שגיאה בשליפת פרויקט: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // המרת הנתונים מתבנית ה-API לתבנית הנדרשת בממשק
        setProject({
          ...data,
          securityStatus: computeSecurityStatus(data),
          recentScans: await fetchRecentScans(params.id)
        });
      } catch (error) {
        console.error("שגיאה בטעינת הפרויקט:", error);
        setError(error instanceof Error ? error.message : "שגיאה בלתי ידועה בטעינת פרויקט");
        
        // טעינת נתוני דוגמה במקרה של שגיאה
        setProject(getMockProject(params.id));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProject();
  }, [params.id]);

  const computeSecurityStatus = (project: any): SecurityStatus => {
    // לוגיקה לחישוב רמת האבטחה על פי נתוני הפרויקט
    return "medium"; // ערך ברירת מחדל
  };

  const fetchRecentScans = async (projectId: string): Promise<ScanResult[]> => {
    // זו אמורה להיות קריאה אמיתית ל-API
    try {
      const response = await fetch(`/api/projects/${projectId}/scans`);
      if (!response.ok) {
        throw new Error(`שגיאה בשליפת סריקות: ${response.status}`);
      }
      const scans = await response.json();
      return scans || [];
    } catch (error) {
      console.error("שגיאה בשליפת סריקות:", error);
      return []; // מחזיר מערך ריק במקום דוגמאות
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "לא זמין";
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('he-IL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return "לא זמין";
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return "היום";
    } else if (diffDays === 1) {
      return "אתמול";
    } else if (diffDays < 7) {
      return `לפני ${diffDays} ימים`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `לפני ${weeks} שבועות`;
    } else {
      const months = Math.floor(diffDays / 30);
      return `לפני ${months} חודשים`;
    }
  };

  const getSecurityStatusBadge = (status: SecurityStatus) => {
    const statusConfig = {
      critical: { className: "bg-red-600 text-white", label: "קריטי" },
      high: { className: "bg-orange-500 text-white", label: "גבוה" },
      medium: { className: "bg-yellow-500 text-white", label: "בינוני" },
      low: { className: "bg-blue-500 text-white", label: "נמוך" },
      secure: { className: "bg-green-600 text-white", label: "מאובטח" },
    };
    
    const config = statusConfig[status];
    
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getProjectStatusBadge = (status: ProjectStatus) => {
    const statusConfig = {
      active: { className: "bg-green-100 text-green-800", label: "פעיל" },
      inactive: { className: "bg-gray-100 text-gray-800", label: "לא פעיל" },
      archived: { className: "bg-purple-100 text-purple-800", label: "בארכיון" },
    };
    
    const config = statusConfig[status];
    
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getTypeIcon = (type: ProjectData["repositoryType"]) => {
    switch (type) {
      case "web":
        return <LinkIcon className="h-4 w-4" />;
      case "api":
        return <Code className="h-4 w-4" />;
      case "mobile":
        return <FileText className="h-4 w-4" />;
      case "repo":
        return <Globe className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getScanTypeIcon = (type: ScanResult["type"]) => {
    switch (type) {
      case "sast":
        return <Code className="h-4 w-4" />;
      case "dast":
        return <Globe className="h-4 w-4" />;
      case "api":
        return <FileText className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getScanStatusBadge = (status: ScanResult["status"]) => {
    const statusConfig = {
      completed: { className: "bg-green-100 text-green-800", label: "הושלם", icon: <CheckCircle className="h-4 w-4 mr-1" /> },
      failed: { className: "bg-red-100 text-red-800", label: "נכשל", icon: <XCircle className="h-4 w-4 mr-1" /> },
      running: { className: "bg-blue-100 text-blue-800", label: "בביצוע", icon: <Clock className="h-4 w-4 mr-1" /> },
      pending: { className: "bg-gray-100 text-gray-800", label: "ממתין", icon: <Clock className="h-4 w-4 mr-1" /> },
    };
    
    const config = statusConfig[status];
    
    return (
      <Badge variant="outline" className={config.className}>
        <span className="flex items-center">
          {config.icon}
          {config.label}
        </span>
      </Badge>
    );
  };

  const getTotalIssues = (findings: ScanResult["findingsCount"]) => {
    const { critical, high, medium, low, info } = findings;
    return critical + high + medium + low + info;
  };

  const handleRunScan = () => {
    router.push(`/dashboard/scans/new?projectId=${params.id}`);
  };

  const handleEditProject = () => {
    router.push(`/dashboard/projects/${params.id}/edit`);
  };

  const handleBackToProjects = () => {
    router.push("/dashboard/projects");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 w-32 bg-gray-200 rounded mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-40 bg-gray-200 rounded"></div>
            <div className="h-40 bg-gray-200 rounded"></div>
            <div className="h-40 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>שגיאה בטעינת הפרויקט</AlertTitle>
          <AlertDescription>
            {error || "לא ניתן לטעון את פרטי הפרויקט. אנא נסה שוב מאוחר יותר."}
          </AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" onClick={handleBackToProjects}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          חזרה לרשימת הפרויקטים
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <button 
            onClick={handleBackToProjects}
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            חזרה לרשימת הפרויקטים
          </button>
          <div className="flex items-center">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <div className="flex ml-3 space-x-2 rtl:space-x-reverse">
              {getProjectStatusBadge(project.status)}
              {getSecurityStatusBadge(project.securityStatus)}
            </div>
          </div>
          <p className="text-gray-500 mt-1">{project.description || "אין תיאור"}</p>
        </div>
        
        <div className="flex mt-4 md:mt-0 space-x-3 rtl:space-x-reverse">
          <Button variant="outline" onClick={handleEditProject}>
            <Settings className="h-4 w-4 mr-2" />
            הגדרות
          </Button>
          <Button onClick={handleRunScan}>
            <Play className="h-4 w-4 mr-2" />
            הפעל סריקה
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">סקירה כללית</TabsTrigger>
          <TabsTrigger value="scans">סריקות</TabsTrigger>
          <TabsTrigger value="issues">ממצאים</TabsTrigger>
          <TabsTrigger value="settings">הגדרות</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">פרטי פרויקט</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm text-gray-500">סוג</dt>
                    <dd className="font-medium flex items-center">
                      {getTypeIcon(project.repositoryType)}
                      <span className="ml-1">
                        {
                          {
                            web: "אתר אינטרנט",
                            api: "ממשק API",
                            mobile: "אפליקציית מובייל",
                            repo: "מאגר קוד"
                          }[project.repositoryType]
                        }
                      </span>
                    </dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm text-gray-500">כתובת יעד</dt>
                    <dd className="font-medium break-all">{project.target}</dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm text-gray-500">נוצר ב</dt>
                    <dd className="font-medium">{formatDate(project.created_at)}</dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm text-gray-500">עודכן לאחרונה</dt>
                    <dd className="font-medium">{formatTimeAgo(project.updated_at)}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">סטטוס אבטחה</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center mb-4">
                  <Shield className={`h-10 w-10 ${
                    {
                      critical: "text-red-500",
                      high: "text-orange-500",
                      medium: "text-yellow-500",
                      low: "text-blue-500",
                      secure: "text-green-500"
                    }[project.securityStatus]
                  }`} />
                  <div className="ml-3">
                    <p className="font-medium">
                      {
                        {
                          critical: "סיכון קריטי",
                          high: "סיכון גבוה",
                          medium: "סיכון בינוני",
                          low: "סיכון נמוך",
                          secure: "מאובטח"
                        }[project.securityStatus]
                      }
                    </p>
                    <p className="text-sm text-gray-500">סטטוס אבטחה נוכחי</p>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500 mb-1">סריקה אחרונה</div>
                  {project.lastScan ? (
                    <div>
                      <p className="font-medium">{formatTimeAgo(project.lastScan)}</p>
                      <p className="text-xs text-gray-500">{formatDate(project.lastScan)}</p>
                    </div>
                  ) : (
                    <p className="text-sm font-medium">לא בוצעה סריקה</p>
                  )}
                </div>
                
                <div className="mt-2">
                  <div className="text-sm text-gray-500 mb-1">סריקה הבאה</div>
                  {project.nextScan ? (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                      <span>{formatDate(project.nextScan)}</span>
                    </div>
                  ) : (
                    <p className="text-sm font-medium">לא מתוזמנת</p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">פעולות מהירות</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={handleRunScan}>
                  <Play className="h-4 w-4 mr-2" />
                  הפעל סריקה חדשה
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => router.push(`/dashboard/scans?projectId=${params.id}`)}>
                  <BarChart className="h-4 w-4 mr-2" />
                  צפה בכל הסריקות
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={handleEditProject}>
                  <Settings className="h-4 w-4 mr-2" />
                  ערוך הגדרות פרויקט
                </Button>
                <Button variant="outline" className="w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="h-4 w-4 mr-2" />
                  מחק פרויקט
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>סריקות אחרונות</CardTitle>
                <Button variant="link" onClick={() => router.push(`/dashboard/scans?projectId=${params.id}`)}>
                  צפה בכל הסריקות
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {project.recentScans.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-500 mb-4">לא בוצעו סריקות לפרויקט זה</p>
                  <Button onClick={handleRunScan}>
                    <Play className="h-4 w-4 mr-2" />
                    הפעל סריקה חדשה
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {project.recentScans.map((scan) => (
                    <div key={scan.id} className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/dashboard/scans/${scan.id}`)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {getScanTypeIcon(scan.type)}
                          <span className="font-medium mx-2">
                            {
                              {
                                sast: "סריקה סטטית (SAST)",
                                dast: "סריקה דינמית (DAST)",
                                api: "סריקת API"
                              }[scan.type]
                            }
                          </span>
                          {getScanStatusBadge(scan.status)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {scan.completedAt ? formatTimeAgo(scan.completedAt) : formatTimeAgo(scan.startedAt)}
                        </div>
                      </div>
                      
                      {scan.status === "completed" && (
                        <div className="mt-2 flex items-center">
                          <div className="flex items-center mr-4">
                            <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-1"></span>
                            <span className="text-sm">{scan.findingsCount.critical} קריטי</span>
                          </div>
                          <div className="flex items-center mr-4">
                            <span className="inline-block w-3 h-3 bg-orange-500 rounded-full mr-1"></span>
                            <span className="text-sm">{scan.findingsCount.high} גבוה</span>
                          </div>
                          <div className="flex items-center mr-4">
                            <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full mr-1"></span>
                            <span className="text-sm">{scan.findingsCount.medium} בינוני</span>
                          </div>
                          <div className="flex items-center">
                            <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-1"></span>
                            <span className="text-sm">{scan.findingsCount.low} נמוך</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="scans">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>היסטוריית סריקות</CardTitle>
                <Button onClick={handleRunScan}>
                  <Play className="h-4 w-4 mr-2" />
                  סריקה חדשה
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* תוכן מפורט של היסטוריית הסריקות יושלם בשלב הבא */}
              <div className="text-center py-12">
                <p className="text-gray-500">העמוד עדיין בבנייה</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="issues">
          <Card>
            <CardHeader>
              <CardTitle>ממצאי אבטחה</CardTitle>
              <CardDescription>כל הממצאים שהתגלו בסריקות האבטחה של פרויקט זה</CardDescription>
            </CardHeader>
            <CardContent>
              {/* תוכן מפורט של ממצאי האבטחה יושלם בשלב הבא */}
              <div className="text-center py-12">
                <p className="text-gray-500">העמוד עדיין בבנייה</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>הגדרות פרויקט</CardTitle>
              <CardDescription>ניהול ההגדרות והתצורה של הפרויקט</CardDescription>
            </CardHeader>
            <CardContent>
              {/* תוכן מפורט של הגדרות הפרויקט יושלם בשלב הבא */}
              <div className="text-center py-12">
                <p className="text-gray-500">העמוד עדיין בבנייה</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// פונקציות עזר לנתוני דוגמה
function getMockProject(id: string): ProjectData {
  return {
    id,
    name: "פרויקט לדוגמה",
    description: "תיאור של פרויקט לדוגמה לצורכי הדגמה",
    status: "active",
    securityStatus: "medium",
    lastScan: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    nextScan: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    target: "https://example.com",
    repositoryType: "web",
    recentScans: [], // רשימת סריקות ריקה במקום קריאה לפונקציית getMockScans
    teamMembers: 3,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  };
} 