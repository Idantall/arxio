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
  Skeleton,
  toast
} from "@arxio/ui";
import { 
  Code, 
  FileText, 
  FolderOpen, 
  Link as LinkIcon, 
  MoreHorizontal, 
  Plus, 
  Search, 
  Shield, 
  Timer,
  Users,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// טיפוסים
type ProjectStatus = "active" | "inactive" | "archived";
type SecurityStatus = "critical" | "high" | "medium" | "low" | "secure";

interface ProjectData {
  id: string;
  name: string;
  status: ProjectStatus;
  securityStatus: SecurityStatus;
  lastScan: string | null;
  nextScan: string | null;
  target: string;
  type: "web" | "api" | "mobile" | "repo";
  issueCount: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  teamMembers: number;
}

// טיפוס לפרויקט מה-API
interface ApiProject {
  id: string;
  name: string;
  description: string;
  repository_type: string;
  repository_url: string | null;
  branch: string;
  local_path: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// פונקציה לבדיקת תקינות UUID - גרסה משופרת 
function isValidUUID(id: string): boolean {
  if (!id) return false;
  
  // קודם בודקים אם זה UUID תקני
  const standardUuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (standardUuidRegex.test(id)) {
    return true;
  }
  
  // בדיקה חלופית: אם זה לפחות מחרוזת ארוכה ללא רווחים (לאפשר Auth0/Firebase IDs)
  if (id.length >= 20 && !id.includes(' ')) {
    console.log(`מזהה ${id} לא UUID תקני אבל נראה תקין מספיק`);
    return true;
  }
  
  // בדיקה חלופית נוספת: UUID ללא מקפים (לפעמים מתקבל כך)
  const uuidWithoutHyphens = /^[0-9a-f]{32}$/i;
  if (uuidWithoutHyphens.test(id)) {
    console.log(`מזהה ${id} הוא UUID ללא מקפים`);
    return true;
  }
  
  return false;
}

export default function ProjectsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('מתחיל לטעון פרויקטים מסופאבייס');
        
        // שליפת הפרויקטים ישירות מסופאבייס
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (projectsError) {
          console.error(`שגיאה בשליפת פרויקטים מסופאבייס: ${projectsError.message}`);
          setError(`שגיאה בטעינת פרויקטים: ${projectsError.message}`);
          setProjects([]);
          
          toast({
            title: "שגיאה בטעינת פרויקטים",
            description: "לא ניתן לטעון את רשימת הפרויקטים. אנא נסה שוב מאוחר יותר.",
            variant: "destructive",
          });
          return;
        }
        
        console.log("פרויקטים התקבלו מסופאבייס:", projectsData?.length || 0);
        
        if (!projectsData || projectsData.length === 0) {
          console.log("לא נמצאו פרויקטים");
          setProjects([]);
          return;
        }
        
        // שליפת הסריקות האחרונות כדי להשלים את נתוני הפרויקטים
        const { data: scansData, error: scansError } = await supabase
          .from('scans')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (scansError) {
          console.warn(`שגיאה בשליפת סריקות: ${scansError.message}`);
        }
        
        // מיפוי הסריקות לפי פרויקט
        const projectScans: Record<string, any[]> = {};
        if (scansData) {
          scansData.forEach(scan => {
            if (scan.project_id) {
              if (!projectScans[scan.project_id]) {
                projectScans[scan.project_id] = [];
              }
              projectScans[scan.project_id].push(scan);
            }
          });
        }
        
        // המרת הנתונים מסופאבייס לתבנית הנדרשת בממשק
        const formattedProjects: ProjectData[] = projectsData.map(proj => {
          // מציאת הסריקה האחרונה לפרויקט זה
          const projectScansList = projectScans[proj.id] || [];
          const lastScan = projectScansList.length > 0 ? projectScansList[0] : null;
          
          // חישוב סיכום ממצאים
          const issueCount = {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            info: 0
          };
          
          // חישוב סיכום ממצאים מכל הסריקות
          projectScansList.forEach(scan => {
            // בדיקה אם findings_count הוא אובייקט עם שדות
            if (scan.findings_count && typeof scan.findings_count === 'object') {
              issueCount.critical += scan.findings_count.critical || 0;
              issueCount.high += scan.findings_count.high || 0;
              issueCount.medium += scan.findings_count.medium || 0;
              issueCount.low += scan.findings_count.low || 0;
              issueCount.info += scan.findings_count.info || 0;
            } 
            // בדיקה אם findings_count הוא מספר (סך כל הממצאים)
            else if (scan.findings_count && typeof scan.findings_count === 'number') {
              // אם יש רק מספר כולל, נניח שכולם ברמת חומרה בינונית
              issueCount.medium += scan.findings_count || 0;
            }
            // בדיקה אם יש מידע על ממצאים בשדה results 
            else if (scan.results && scan.results.summary) {
              issueCount.critical += scan.results.summary.critical || 0;
              issueCount.high += scan.results.summary.high || 0;
              issueCount.medium += scan.results.summary.medium || 0;
              issueCount.low += scan.results.summary.low || 0;
              issueCount.info += scan.results.summary.info || 0;
            }
          });
          
          // קביעת רמת האבטחה לפי הממצאים
          let securityStatus: SecurityStatus = "secure";
          if (issueCount.critical > 0) {
            securityStatus = "critical";
          } else if (issueCount.high > 0) {
            securityStatus = "high";
          } else if (issueCount.medium > 0) {
            securityStatus = "medium";
          } else if (issueCount.low > 0) {
            securityStatus = "low";
          }
          
          return {
            id: proj.id,
            name: proj.name,
            status: "active" as ProjectStatus, // ברירת מחדל לפרויקטים מהשרת
            securityStatus: securityStatus,
            lastScan: lastScan ? lastScan.completed_at || lastScan.created_at : null,
            nextScan: null, // אין כרגע מידע על סריקות מתוזמנות
            target: proj.repository_url || proj.local_path || proj.target || "-",
            type: mapRepositoryTypeToUiType(proj.repository_type || "repo"),
            issueCount: issueCount,
            teamMembers: 1 // ברירת מחדל
          };
        });
        
        setProjects(formattedProjects);
      } catch (error) {
        console.error("שגיאה לא צפויה בטעינת הפרויקטים:", error);
        setError(error instanceof Error ? error.message : "שגיאה בלתי ידועה בטעינת פרויקטים");
        setProjects([]);
        
        toast({
          title: "שגיאה בטעינת פרויקטים",
          description: "אירעה שגיאה לא צפויה. אנא נסה שוב מאוחר יותר.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProjects();
  }, []);
  
  // פונקציות עזר להמרת נתונים מהשרת
  const computeSecurityStatus = (project: ApiProject): SecurityStatus => {
    // לוגיקה לחישוב רמת האבטחה על פי נתוני הפרויקט
    // זה אמור להתבסס על ממצאי סריקות אבטחה אחרונות
    return "medium"; // ערך ברירת מחדל
  };
  
  const getLastScanDate = (project: ApiProject): string | null => {
    // אמור להגיע מטבלת סריקות
    return null;
  };
  
  const getNextScanDate = (project: ApiProject): string | null => {
    // אמור להגיע מטבלת סריקות מתוזמנות
    return null;
  };
  
  const mapRepositoryTypeToUiType = (repoType: string): "web" | "api" | "mobile" | "repo" => {
    switch (repoType.toLowerCase()) {
      case "website":
      case "web":
        return "web";
      case "api":
        return "api";
      case "mobile":
      case "app":
        return "mobile";
      case "git":
      case "github":
      case "gitlab":
      case "bitbucket":
      default:
        return "repo";
    }
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "לא מתוזמן";
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('he-IL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };
  
  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return "לא בוצע";
    
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
  
  const getTotalIssues = (project: ProjectData) => {
    const { critical, high, medium, low, info } = project.issueCount;
    return critical + high + medium + low + info;
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
  
  const getTypeIcon = (type: ProjectData["type"]) => {
    switch (type) {
      case "web":
        return <LinkIcon className="h-4 w-4" />;
      case "api":
        return <Code className="h-4 w-4" />;
      case "mobile":
        return <FileText className="h-4 w-4" />;
      case "repo":
        return <FolderOpen className="h-4 w-4" />;
      default:
        return null;
    }
  };
  
  const filterProjects = () => {
    let filtered = [...projects];
    
    // סינון לפי לשונית
    if (activeTab !== "all") {
      filtered = filtered.filter(project => project.status === activeTab);
    }
    
    // סינון לפי חיפוש
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(project => 
        project.name.toLowerCase().includes(query) || 
        project.target.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };
  
  const handleNewProject = () => {
    router.push("/dashboard/projects/new");
  };
  
  const handleProjectClick = (projectId: string) => {
    router.push(`/dashboard/projects/${projectId}`);
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-8 space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-6 w-60" />
        </div>
        
        <div className="mb-6 flex justify-between">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="space-y-4">
          {Array(5).fill(0).map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
      </div>
    );
  }
  
  const filteredProjects = filterProjects();
  
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">הפרויקטים שלי</h1>
        <p className="text-gray-500">
          ניהול ומעקב אחר סטטוס האבטחה של הפרויקטים שלך
        </p>
      </div>
      
      {error && (
        <Card className="bg-red-50 border-red-200 mb-6">
          <CardContent className="p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2" />
              <div>
                <h3 className="font-medium text-red-800">שגיאה בטעינת נתונים</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <input 
              type="text"
              placeholder="חיפוש פרויקטים..."
              className="pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-[250px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <Button onClick={handleNewProject} className="flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          פרויקט חדש
        </Button>
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">הכל</TabsTrigger>
          <TabsTrigger value="active">פעילים</TabsTrigger>
          <TabsTrigger value="inactive">לא פעילים</TabsTrigger>
          <TabsTrigger value="archived">בארכיון</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab}>
          {filteredProjects.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-2">לא נמצאו פרויקטים</h3>
                  <p className="text-gray-500 mb-6">
                    {searchQuery 
                      ? "לא נמצאו תוצאות התואמות את החיפוש שלך" 
                      : "צור פרויקט חדש כדי להתחיל מעקב אבטחה"
                    }
                  </p>
                  <Button onClick={handleNewProject}>
                    <Plus className="h-4 w-4 mr-2" />
                    פרויקט חדש
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredProjects.map((project) => (
                <Card 
                  key={project.id}
                  className="cursor-pointer hover:shadow-md transition"
                  onClick={() => handleProjectClick(project.id)}
                >
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                      <div className="lg:col-span-2">
                        <div className="flex items-center mb-2">
                          <span className="mr-2">
                            {getTypeIcon(project.type)}
                          </span>
                          <h3 className="font-medium text-lg">{project.name}</h3>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-2">
                          {getProjectStatusBadge(project.status)}
                          {getSecurityStatusBadge(project.securityStatus)}
                        </div>
                        
                        <div className="text-sm text-gray-500">
                          <span className="flex items-center">
                            {getTypeIcon(project.type)}
                            <span className="mx-1">{project.target}</span>
                          </span>
                        </div>
                      </div>
                      
                      <div className="lg:col-span-1">
                        <h4 className="text-sm font-medium text-gray-500 mb-1">סריקה אחרונה</h4>
                        <p className="font-medium">
                          {formatTimeAgo(project.lastScan)}
                        </p>
                        {project.lastScan && (
                          <p className="text-xs text-gray-500">
                            {formatDate(project.lastScan)}
                          </p>
                        )}
                      </div>
                      
                      <div className="lg:col-span-1">
                        <h4 className="text-sm font-medium text-gray-500 mb-1">סריקה הבאה</h4>
                        <div className="flex items-center">
                          <Timer className="h-4 w-4 text-gray-400 mr-1" />
                          <span>{formatDate(project.nextScan)}</span>
                        </div>
                      </div>
                      
                      <div className="lg:col-span-1">
                        <div className="flex flex-col h-full justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-1">סטטוס אבטחה</h4>
                            <div className="flex items-center gap-2">
                              <Shield className={`h-5 w-5 ${
                                project.securityStatus === 'critical' ? 'text-red-600' :
                                project.securityStatus === 'high' ? 'text-orange-500' :
                                project.securityStatus === 'medium' ? 'text-yellow-500' :
                                project.securityStatus === 'low' ? 'text-blue-500' :
                                'text-green-600'
                              }`} />
                              <span>
                                {getTotalIssues(project)} ממצאים
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center mt-2">
                            <Users className="h-4 w-4 text-gray-500 mr-1" />
                            <span className="text-sm text-gray-500">
                              {project.teamMembers} חברי צוות
                            </span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                // כאן אפשר לפתוח תפריט פעולות נוספות
                              }}
                              className="ml-auto text-gray-500 hover:text-gray-700"
                            >
                              <MoreHorizontal className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// פונקציה שמחזירה נתוני דוגמה
const getMockProjects = (): ProjectData[] => {
  return [
    {
      id: "p1",
      name: "אתר ראשי - חנות מקוונת",
      status: "active",
      securityStatus: "medium",
      lastScan: "2023-09-05T14:30:00Z",
      nextScan: "2023-09-12T14:30:00Z",
      target: "https://example.com",
      type: "web",
      issueCount: {
        critical: 0,
        high: 2,
        medium: 5,
        low: 8,
        info: 12
      },
      teamMembers: 4
    },
    {
      id: "p2",
      name: "אפליקציית מובייל iOS",
      status: "active",
      securityStatus: "high",
      lastScan: "2023-09-03T10:15:00Z",
      nextScan: "2023-09-10T10:15:00Z",
      target: "com.example.mobileapp",
      type: "mobile",
      issueCount: {
        critical: 1,
        high: 3,
        medium: 2,
        low: 4,
        info: 7
      },
      teamMembers: 3
    },
    {
      id: "p3",
      name: "ממשק תשלומים API",
      status: "active",
      securityStatus: "low",
      lastScan: "2023-09-07T09:20:00Z",
      nextScan: "2023-09-14T09:20:00Z",
      target: "https://api.example.com/payments",
      type: "api",
      issueCount: {
        critical: 0,
        high: 0,
        medium: 1,
        low: 3,
        info: 5
      },
      teamMembers: 2
    },
    {
      id: "p4",
      name: "פורטל ניהול פנימי",
      status: "inactive",
      securityStatus: "critical",
      lastScan: "2023-08-15T11:45:00Z",
      nextScan: null,
      target: "https://admin.example.com",
      type: "web",
      issueCount: {
        critical: 2,
        high: 4,
        medium: 6,
        low: 3,
        info: 8
      },
      teamMembers: 5
    }
  ];
}; 