"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from 'next-auth/react';
import { 
  Button, 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Input,
  Label,
  Select,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  useToast
} from "@arxio/ui";
import { 
  ArrowLeft, 
  Code, 
  FileText, 
  Globe, 
  Info, 
  Link as LinkIcon,
  Shield, 
  RefreshCw,
  AlertCircle,
  GitBranch,
  Server
} from "lucide-react";

// טיפוסים
type ProjectType = "web" | "api" | "mobile" | "repo";
type ScanType = "SAST" | "DAST" | "API";
type RepositoryProvider = "github" | "gitlab" | "bitbucket" | "other";

interface FormValues {
  name: string;
  description: string;
  type: ProjectType;
  repositoryUrl: string;
  repositoryProvider: RepositoryProvider;
  branch: string;
  deploymentUrl: string;
  scanTypes: ScanType[];
}

// מידע על סוגי הסריקות
const scanTypes = {
  SAST: {
    title: "סריקה סטטית (SAST)",
    description: "ניתוח קוד המקור לזיהוי פגיעויות אבטחה פוטנציאליות",
    icon: <Code className="h-5 w-5" />
  },
  DAST: {
    title: "סריקה דינמית (DAST)",
    description: "בדיקת אבטחה דינמית של היישום הפועל",
    icon: <Globe className="h-5 w-5" />
  },
  API: {
    title: "סריקת API",
    description: "ניתוח ממשקי API לזיהוי פגיעויות ובעיות אבטחה",
    icon: <FileText className="h-5 w-5" />
  }
};

// מידע על סוגי הפרויקטים
const projectTypes = {
  web: {
    title: "אתר אינטרנט",
    description: "יישום אינטרנט נגיש דרך URL",
    icon: <Globe className="h-5 w-5" />,
    placeholder: "https://example.com"
  },
  api: {
    title: "ממשק API",
    description: "ממשק תכנות יישומים",
    icon: <Server className="h-5 w-5" />,
    placeholder: "https://api.example.com/v1"
  },
  mobile: {
    title: "אפליקציית מובייל",
    description: "יישום למכשירים ניידים",
    icon: <FileText className="h-5 w-5" />,
    placeholder: "com.example.app"
  },
  repo: {
    title: "מאגר קוד",
    description: "מאגר קוד מקור",
    icon: <Code className="h-5 w-5" />,
    placeholder: "https://github.com/user/repo"
  }
};

// ספקי מאגרי קוד נתמכים
const repositoryProviders = {
  github: {
    title: "GitHub",
    icon: <GitBranch className="h-5 w-5" />
  },
  gitlab: {
    title: "GitLab",
    icon: <GitBranch className="h-5 w-5" />
  },
  bitbucket: {
    title: "Bitbucket",
    icon: <GitBranch className="h-5 w-5" />
  },
  other: {
    title: "אחר",
    icon: <Code className="h-5 w-5" />
  }
};

export default function NewProjectPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("details");
  const [formValues, setFormValues] = useState<FormValues>({
    name: "",
    description: "",
    type: "web",
    repositoryUrl: "",
    repositoryProvider: "github",
    branch: "main",
    deploymentUrl: "",
    scanTypes: ["SAST", "DAST"]
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [supabaseUserId, setSupabaseUserId] = useState<string | null>(null);
  const [showAuthError, setShowAuthError] = useState(false);

  // כשהמשתמש משנה את סוג הפרויקט, עדכן את טיפוסי הסריקה המומלצים
  useEffect(() => {
    let recommendedScans: ScanType[] = [];
    
    switch (formValues.type) {
      case "web":
        recommendedScans = ["SAST", "DAST"];
        break;
      case "api":
        recommendedScans = ["SAST", "API"];
        break;
      case "mobile":
        recommendedScans = ["SAST"];
        break;
      case "repo":
        recommendedScans = ["SAST"];
        break;
    }
    
    setFormValues(prev => ({
      ...prev,
      scanTypes: recommendedScans
    }));
  }, [formValues.type]);

  // לקריאה בטעינת העמוד - בדיקת זהות המשתמש
  useEffect(() => {
    const loadUserInfo = async () => {
      if (session?.user?.email) {
        try {
          // קודם כל, ננסה להשתמש ישירות במזהה הסשן אם הוא קיים
          if (session.user.id) {
            console.log('משתמש ב-session.user.id:', session.user.id);
            // ישירות - אבל נבדוק שהוא בפורמט תקין של UUID
            if (isValidUUID(session.user.id)) {
              setSupabaseUserId(session.user.id);
              return;
            }
          }

          // נשלח את האימייל לקבלת המזהה
          const response = await fetch(`/api/user/get-id?email=${encodeURIComponent(session.user.email)}`);
          
          if (response.ok) {
            const data = await response.json();
            if (data.id) {
              console.log('התקבל מזהה משתמש מהשרת:', data.id);
              setSupabaseUserId(data.id);
            } else {
              console.error('לא התקבל מזהה משתמש מהשרת - מנסה לתקן');
              await tryFixUserAuth();
            }
          } else {
            console.error('שגיאה בקבלת מזהה משתמש מהשרת - מנסה לתקן');
            await tryFixUserAuth();
          }
        } catch (error) {
          console.error('שגיאה בפניה לשרת:', error);
          await tryFixUserAuth();
        }
      }
    };
    
    loadUserInfo();
  }, [session]);

  // פונקציה לניסיון תיקון הרשומות במקרה של בעיה
  const tryFixUserAuth = async () => {
    if (!session?.user?.email) return;
    
    console.log('מנסה לתקן אימות עבור אימייל:', session.user.email);
    
    try {
      const response = await fetch('/api/fix-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: session.user.email,
          oldId: session.user.id || undefined
        }),
        credentials: 'include', // חשוב לשליחת עוגיות אימות
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('תוצאת תיקון אימות:', data);
        
        if (data.userId) {
          console.log('תיקון רשומות המשתמש הצליח, המזהה החדש:', data.userId);
          setSupabaseUserId(data.userId);
          
          // רענון העמוד לאחר 2 שניות כדי לוודא שהסשן מעודכן
          setTimeout(() => {
            window.location.reload();
          }, 2000);
          
          return true;
        }
      } else {
        const errorData = await response.json();
        console.error('שגיאה בתיקון המשתמש:', errorData);
      }
    } catch (error) {
      console.error('שגיאה בפניה לשרת לתיקון המשתמש:', error);
    }
    
    return false;
  };

  // פונקציה לבדיקה אם מחרוזת היא UUID תקין - גרסה משופרת
  const isValidUUID = (id: string): boolean => {
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
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formValues.name.trim()) {
      newErrors.name = "שם הפרויקט נדרש";
    }
    
    // בדיקת תקינות ה-URL של מאגר הקוד (אם הוזן)
    if (formValues.repositoryUrl && formValues.type === "repo") {
      try {
        new URL(formValues.repositoryUrl);
      } catch (e) {
        newErrors.repositoryUrl = "יש להזין כתובת URL תקינה למאגר הקוד";
      }
    }
    
    // בדיקת תקינות ה-URL של הפריסה (אם הוזן)
    if (formValues.deploymentUrl) {
      try {
        new URL(formValues.deploymentUrl);
      } catch (e) {
        newErrors.deploymentUrl = "יש להזין כתובת URL תקינה לאתר המפורס";
      }
    }
    
    // אם זה פרויקט מסוג אתר או API, וסריקת DAST נבחרה, בדיקה שהוזן URL תקין
    if ((formValues.type === "web" || formValues.type === "api") && 
        formValues.scanTypes.includes("DAST") && 
        !formValues.deploymentUrl) {
      newErrors.deploymentUrl = "יש להזין כתובת URL לאתר או ל-API המפורס עבור סריקת DAST";
    }
    
    if (formValues.scanTypes.length === 0) {
      newErrors.scanTypes = "יש לבחור לפחות סוג סריקה אחד";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (!session?.user?.email) {
      setErrors({ general: "נדרש להתחבר כדי ליצור פרויקט חדש" });
      toast({
        title: "שגיאת אימות",
        description: "נדרש להתחבר כדי ליצור פרויקט חדש",
        variant: "destructive",
      });
      return;
    }
    
    // אם אין לנו מזהה, ננסה פעם אחרונה לתקן
    if (!supabaseUserId) {
      setErrors({ general: "לא ניתן לזהות את המשתמש במערכת, מנסה לתקן..." });
      toast({
        title: "בעיית אימות",
        description: "מנסה לתקן את בעיית האימות...",
        variant: "default",
      });
      
      const fixed = await tryFixUserAuth();
      if (!fixed) {
        setErrors({ general: "לא ניתן לזהות את המשתמש במערכת, נא לרענן את הדף ולנסות שוב" });
        toast({
          title: "שגיאת אימות",
          description: "לא ניתן לזהות את המשתמש במערכת. נסה להתנתק ולהתחבר מחדש.",
          variant: "destructive",
        });
        return;
      }
      
      // אם הצלחנו לתקן, נחכה לשינוי הסטייט
      if (!supabaseUserId) {
        toast({
          title: "מידע",
          description: "מחכה לעדכון אימות...",
          variant: "default",
        });
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    setIsLoading(true);
    
    try {
      // המרה של הנתונים למבנה הנדרש ע"י ה-API
      const projectData = {
        name: formValues.name,
        description: formValues.description,
        repository_type: formValues.type,
        type: formValues.type,
        repository_url: formValues.repositoryUrl,
        repository_provider: formValues.repositoryProvider,
        branch: formValues.branch,
        deployment_url: formValues.deploymentUrl,
        user_id: supabaseUserId || session.user.id,
        // שדה זה לא קיים בסכימה של הטבלה בסופאבייס
        // scanConfiguration: {
        //   scanTypes: formValues.scanTypes
        // }
      };
      
      console.log("שולח נתונים לשרת:", projectData);
      
      // קריאה אמיתית ל-API
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(projectData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("שגיאת תגובה משרת:", errorData);
        
        // טיפול מיוחד בשגיאת repository_type
        if (errorData.details && errorData.details.includes && errorData.details.includes('repository_type')) {
          console.log("זוהתה שגיאת repository_type, מנסה מחדש עם תיקון");
          
          // ניסיון חדש עם שדה תקין יותר
          const fixedData = {
            ...projectData,
            repository_type: formValues.type || 'web',
          };
          
          const retryResponse = await fetch("/api/projects", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(fixedData),
          });
          
          if (!retryResponse.ok) {
            const retryErrorData = await retryResponse.json();
            throw new Error(retryErrorData.error || retryErrorData.message || `שגיאה בניסיון מתוקן ליצירת פרויקט: ${retryResponse.status}`);
          }
          
          const createdProject = await retryResponse.json();
          console.log("פרויקט נוצר בהצלחה בניסיון השני:", createdProject);
          return createdProject;
        }
        
        throw new Error(errorData.error || errorData.message || `שגיאה ביצירת פרויקט: ${response.status}`);
      }
      
      const createdProject = await response.json();
      console.log("פרויקט נוצר בהצלחה:", createdProject);
      
      toast({
        title: "הפרויקט נוצר בהצלחה",
        description: `הפרויקט "${formValues.name}" נוצר בהצלחה ונוספו הגדרות סריקה`,
        variant: "default",
      });
      
      // אם רוצים להפעיל סריקה אוטומטית
      if (formValues.scanTypes.length > 0) {
        // הפעלת סריקה ראשונית לכל סוגי הסריקות שנבחרו
        console.log("מפעיל סריקות ראשוניות:", formValues.scanTypes);
        
        try {
          // בדיקה אם יש סריקת DAST בבקשה
          if (formValues.scanTypes.includes("DAST") && formValues.deploymentUrl) {
            // יצירת סריקת DAST
            const dastScanData = {
              projectId: createdProject.id,
              name: `סריקת DAST ראשונית - ${formValues.name}`,
              type: "DAST",
              target: formValues.deploymentUrl,
              userId: supabaseUserId || session.user.id,
              parameters: {
                branch: formValues.branch || 'main'
              }
            };
            
            console.log("שולח בקשה ליצירת סריקת DAST:", dastScanData);
            
            const dastResponse = await fetch("/api/scans", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(dastScanData),
            });
            
            if (!dastResponse.ok) {
              const errorData = await dastResponse.json();
              console.error("שגיאה ביצירת סריקת DAST:", errorData);
              throw new Error(errorData.error || errorData.message || "שגיאה ביצירת סריקת DAST");
            }
            
            const dastResult = await dastResponse.json();
            console.log("תוצאת יצירת סריקת DAST:", dastResult);
            
            toast({
              title: "סריקת DAST הופעלה",
              description: `סריקת DAST ראשונית הופעלה על האתר ${formValues.deploymentUrl}`,
              variant: "default",
            });
          }
          
          // בדיקה אם יש סריקת SAST בבקשה
          if (formValues.scanTypes.includes("SAST") && formValues.repositoryUrl) {
            // יצירת סריקת SAST
            const sastScanData = {
              projectId: createdProject.id,
              name: `סריקת SAST ראשונית - ${formValues.name}`,
              type: "SAST",
              target: formValues.repositoryUrl,
              userId: supabaseUserId || session.user.id,
              parameters: {
                branch: formValues.branch || 'main'
              }
            };
            
            console.log("שולח בקשה ליצירת סריקת SAST:", sastScanData);
            
            const sastResponse = await fetch("/api/scans", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(sastScanData),
            });
            
            if (!sastResponse.ok) {
              const errorData = await sastResponse.json();
              console.error("שגיאה ביצירת סריקת SAST:", errorData);
              throw new Error(errorData.error || errorData.message || "שגיאה ביצירת סריקת SAST");
            }
            
            const sastResult = await sastResponse.json();
            console.log("תוצאת יצירת סריקת SAST:", sastResult);
            
            toast({
              title: "סריקת SAST הופעלה",
              description: `סריקת SAST ראשונית הופעלה על המאגר ${formValues.repositoryUrl}`,
              variant: "default",
            });
          }
          
          // בדיקה אם יש סריקת API בבקשה
          if (formValues.scanTypes.includes("API") && (formValues.deploymentUrl || formValues.repositoryUrl)) {
            // יצירת סריקת API
            const apiScanData = {
              projectId: createdProject.id,
              name: `סריקת API ראשונית - ${formValues.name}`,
              type: "API",
              target: formValues.deploymentUrl || formValues.repositoryUrl,
              userId: supabaseUserId || session.user.id,
              parameters: {
                branch: formValues.branch || 'main'
              }
            };
            
            console.log("שולח בקשה ליצירת סריקת API:", apiScanData);
            
            const apiResponse = await fetch("/api/scans", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(apiScanData),
            });
            
            if (!apiResponse.ok) {
              const errorData = await apiResponse.json();
              console.error("שגיאה ביצירת סריקת API:", errorData);
              throw new Error(errorData.error || errorData.message || "שגיאה ביצירת סריקת API");
            }
            
            const apiResult = await apiResponse.json();
            console.log("תוצאת יצירת סריקת API:", apiResult);
            
            toast({
              title: "סריקת API הופעלה",
              description: `סריקת API ראשונית הופעלה על היעד ${formValues.deploymentUrl || formValues.repositoryUrl}`,
              variant: "default",
            });
          }
          
        } catch (scanError) {
          console.error(`שגיאה בהפעלת סריקה:`, scanError);
          toast({
            title: "שגיאה בהפעלת הסריקה",
            description: "הפרויקט נוצר אך הסריקה לא הופעלה. נסה להפעיל אותה מאוחר יותר.",
            variant: "destructive",
          });
        }
      }
      
      // מעבר לדף הפרויקט הספציפי במקום לדף הכללי
      console.log("מנווט לדף הפרויקט הספציפי:", createdProject.id);
      router.push(`/dashboard/projects/${createdProject.id}`);
    } catch (error) {
      console.error("שגיאה ביצירת הפרויקט:", error);
      
      // הצגת הודעת שגיאה למשתמש
      setErrors(prev => ({
        ...prev,
        general: error instanceof Error ? error.message : "שגיאה בלתי צפויה בעת יצירת פרויקט"
      }));
      
      toast({
        title: "שגיאה ביצירת הפרויקט",
        description: error instanceof Error ? error.message : "שגיאה בלתי צפויה",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormValues, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [field]: value
    }));
    
    // איפוס שגיאה ספציפית אם קיימת
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleScanTypeToggle = (type: ScanType) => {
    setFormValues(prev => {
      const currentTypes = [...prev.scanTypes];
      const typeIndex = currentTypes.indexOf(type);
      
      if (typeIndex === -1) {
        // אם הסוג לא קיים, מוסיפים אותו
        return {
          ...prev,
          scanTypes: [...currentTypes, type]
        };
      } else {
        // אם הסוג כבר קיים, מסירים אותו
        currentTypes.splice(typeIndex, 1);
        return {
          ...prev,
          scanTypes: currentTypes
        };
      }
    });
    
    // איפוס שגיאה אם קיימת
    if (errors.scanTypes) {
      setErrors(prev => ({
        ...prev,
        scanTypes: ''
      }));
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          className="mr-2"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          חזרה
        </Button>
        <h1 className="text-2xl font-bold">יצירת פרויקט חדש</h1>
      </div>
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">פרטי פרויקט</TabsTrigger>
          <TabsTrigger value="repository">מאגר קוד</TabsTrigger>
          <TabsTrigger value="scanning">הגדרות סריקה</TabsTrigger>
        </TabsList>
        
        <form onSubmit={handleSubmit}>
          {/* טאב פרטי פרויקט */}
          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>פרטי הפרויקט</CardTitle>
                <CardDescription>הגדר את המידע הבסיסי עבור הפרויקט החדש</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {errors.general && (
                  <div className="bg-red-50 p-3 rounded-md flex items-start mb-4">
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
                    <span className="text-red-700">{errors.general}</span>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="name">שם הפרויקט *</Label>
                  <Input
                    id="name"
                    placeholder="הזן שם לפרויקט"
                    value={formValues.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && (
                    <span className="text-red-500 text-sm">{errors.name}</span>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">תיאור הפרויקט</Label>
                  <Textarea
                    id="description"
                    placeholder="הזן תיאור קצר של הפרויקט (אופציונלי)"
                    value={formValues.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>סוג הפרויקט *</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {(Object.keys(projectTypes) as ProjectType[]).map((type) => (
                      <Card
                        key={type}
                        className={`cursor-pointer transition hover:border-primary ${
                          formValues.type === type ? "border-2 border-primary bg-primary/5" : ""
                        }`}
                        onClick={() => handleInputChange('type', type)}
                      >
                        <CardContent className="p-4 flex items-start space-x-3 space-x-reverse">
                          <div className="mt-1 text-primary">
                            {projectTypes[type].icon}
                          </div>
                          <div>
                            <CardTitle className="text-base mb-1">{projectTypes[type].title}</CardTitle>
                            <CardDescription className="text-xs">
                              {projectTypes[type].description}
                            </CardDescription>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 space-x-reverse mt-6">
                  <Button type="button" onClick={() => handleTabChange("repository")}>
                    הבא <ArrowLeft className="h-4 w-4 mr-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* טאב מאגר קוד */}
          <TabsContent value="repository" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>מאגר הקוד והפריסה</CardTitle>
                <CardDescription>הגדר את המקורות של הקוד והאתר המפורס</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="repositoryUrl">כתובת מאגר הקוד (אופציונלי)</Label>
                  <Input
                    id="repositoryUrl"
                    placeholder="הזן קישור למאגר הקוד"
                    value={formValues.repositoryUrl}
                    onChange={(e) => handleInputChange('repositoryUrl', e.target.value)}
                    className={errors.repositoryUrl ? "border-red-500" : ""}
                  />
                  {errors.repositoryUrl && (
                    <span className="text-red-500 text-sm">{errors.repositoryUrl}</span>
                  )}
                </div>
                
                {formValues.repositoryUrl && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="repositoryProvider">ספק מאגר הקוד</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {Object.keys(repositoryProviders).map((provider) => (
                          <Card
                            key={provider}
                            className={`cursor-pointer transition hover:border-primary ${
                              formValues.repositoryProvider === provider ? "border-2 border-primary bg-primary/5" : ""
                            }`}
                            onClick={() => handleInputChange('repositoryProvider', provider)}
                          >
                            <CardContent className="p-3 flex items-center justify-center">
                              <div className="flex flex-col items-center">
                                <div className="text-primary mb-1">
                                  {repositoryProviders[provider as RepositoryProvider].icon}
                                </div>
                                <span className="text-sm">
                                  {repositoryProviders[provider as RepositoryProvider].title}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="branch">ענף (Branch)</Label>
                      <Input
                        id="branch"
                        placeholder="main"
                        value={formValues.branch}
                        onChange={(e) => handleInputChange('branch', e.target.value)}
                      />
                      <span className="text-gray-500 text-xs">
                        ברירת המחדל היא 'main', אך ניתן לשנות לענף אחר
                      </span>
                    </div>
                  </>
                )}
                
                <div className="space-y-2 mt-4">
                  <Label htmlFor="deploymentUrl">כתובת האתר המפורס {formValues.type === "web" || formValues.type === "api" ? "*" : "(אופציונלי)"}</Label>
                  <Input
                    id="deploymentUrl"
                    placeholder={`לדוגמה: ${formValues.type === "api" ? "https://api.example.com" : "https://example.com"}`}
                    value={formValues.deploymentUrl}
                    onChange={(e) => handleInputChange('deploymentUrl', e.target.value)}
                    className={errors.deploymentUrl ? "border-red-500" : ""}
                  />
                  {errors.deploymentUrl && (
                    <span className="text-red-500 text-sm">{errors.deploymentUrl}</span>
                  )}
                </div>
                
                <div className="flex justify-between mt-6">
                  <Button type="button" variant="outline" onClick={() => handleTabChange("details")}>
                    חזרה
                  </Button>
                  <Button type="button" onClick={() => handleTabChange("scanning")}>
                    הבא <ArrowLeft className="h-4 w-4 mr-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* טאב הגדרות סריקה */}
          <TabsContent value="scanning" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>הגדרות סריקת אבטחה</CardTitle>
                <CardDescription>בחר אילו סוגי סריקות ברצונך להפעיל</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>סוגי סריקות זמינים</Label>
                  {errors.scanTypes && (
                    <div className="text-red-500 text-sm mb-2">{errors.scanTypes}</div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(Object.keys(scanTypes) as ScanType[]).map((type) => (
                      <Card
                        key={type}
                        className={`cursor-pointer transition hover:border-primary ${
                          formValues.scanTypes.includes(type) ? "border-2 border-primary bg-primary/5" : ""
                        }`}
                        onClick={() => handleScanTypeToggle(type)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3 space-x-reverse">
                            <div className="text-primary mt-1">
                              {scanTypes[type].icon}
                            </div>
                            <div>
                              <CardTitle className="text-base mb-1">{scanTypes[type].title}</CardTitle>
                              <CardDescription className="text-xs">
                                {scanTypes[type].description}
                              </CardDescription>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-between mt-6">
                  <Button type="button" variant="outline" onClick={() => handleTabChange("repository")}>
                    חזרה
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        יוצר פרויקט...
                      </>
                    ) : (
                      "צור פרויקט"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </form>
      </Tabs>
      
      {errors.general && (
        <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-700">
          <p>{errors.general}</p>
          {showAuthError && (
            <div className="mt-2">
              <p className="font-medium">יש צורך לתקן את בעיית האימות שלך כדי להמשיך.</p>
              <button 
                onClick={() => router.push('/auth/fix')}
                className="mt-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                תקן בעיות אימות
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 