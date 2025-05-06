"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Input,
  Label,
  Select,
  Textarea,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@arxio/ui";
import { 
  ArrowLeft, 
  Code, 
  FileText, 
  Globe, 
  Link as LinkIcon,
  Save,
  Trash2,
  AlertCircle,
  Loader2
} from "lucide-react";

// טיפוסים
type ProjectType = "web" | "api" | "mobile" | "repo";
type ProjectStatus = "active" | "inactive" | "archived";

interface FormValues {
  name: string;
  description: string;
  repositoryType: ProjectType;
  repositoryUrl: string;
  branch: string;
  localPath: string;
  status: ProjectStatus;
}

interface ProjectData {
  id: string;
  name: string;
  description: string;
  repository_type: string;
  repository_url: string | null;
  branch: string;
  local_path: string | null;
  status: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// מידע על סוגי הפרויקטים
const projectTypes = {
  web: {
    title: "אתר אינטרנט",
    description: "יישום אינטרנט נגיש דרך URL",
    icon: <LinkIcon className="h-5 w-5" />,
    placeholder: "https://example.com"
  },
  api: {
    title: "ממשק API",
    description: "ממשק תכנות יישומים",
    icon: <Code className="h-5 w-5" />,
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
    icon: <Globe className="h-5 w-5" />,
    placeholder: "https://github.com/user/repo"
  }
};

export default function EditProjectPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("details");
  const [formValues, setFormValues] = useState<FormValues>({
    name: "",
    description: "",
    repositoryType: "web",
    repositoryUrl: "",
    branch: "main",
    localPath: "",
    status: "active"
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  
  useEffect(() => {
    const fetchProject = async () => {
      setIsLoading(true);
      setApiError(null);
      
      try {
        const response = await fetch(`/api/projects/${params.id}`);
        
        if (!response.ok) {
          throw new Error(`שגיאה בטעינת פרויקט: ${response.status} ${response.statusText}`);
        }
        
        const data: ProjectData = await response.json();
        
        setFormValues({
          name: data.name,
          description: data.description || "",
          repositoryType: data.repository_type as ProjectType,
          repositoryUrl: data.repository_url || "",
          branch: data.branch || "main",
          localPath: data.local_path || "",
          status: data.status as ProjectStatus
        });
      } catch (error) {
        console.error("שגיאה בטעינת הפרויקט:", error);
        setApiError(error instanceof Error ? error.message : "שגיאה בלתי ידועה");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProject();
  }, [params.id]);
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formValues.name.trim()) {
      newErrors.name = "שם הפרויקט נדרש";
    }
    
    if (formValues.repositoryType === "web" || formValues.repositoryType === "api") {
      if (formValues.repositoryUrl) {
        try {
          new URL(formValues.repositoryUrl);
        } catch (e) {
          newErrors.repositoryUrl = "יש להזין כתובת URL תקינה";
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSaving(true);
    setApiError(null);
    
    try {
      const response = await fetch(`/api/projects/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formValues),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `שגיאה בעדכון פרויקט: ${response.status}`);
      }
      
      // מעבר לדף הפרויקט לאחר שמירה מוצלחת
      router.push(`/dashboard/projects/${params.id}`);
    } catch (error) {
      console.error("שגיאה בעדכון הפרויקט:", error);
      setApiError(error instanceof Error ? error.message : "שגיאה בלתי ידועה בעדכון הפרויקט");
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }
    
    setIsDeleting(true);
    setApiError(null);
    
    try {
      const response = await fetch(`/api/projects/${params.id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `שגיאה במחיקת פרויקט: ${response.status}`);
      }
      
      // מעבר לרשימת הפרויקטים לאחר מחיקה מוצלחת
      router.push("/dashboard/projects");
    } catch (error) {
      console.error("שגיאה במחיקת הפרויקט:", error);
      setApiError(error instanceof Error ? error.message : "שגיאה בלתי ידועה במחיקת הפרויקט");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  const handleBackToProject = () => {
    router.push(`/dashboard/projects/${params.id}`);
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <span className="ml-2">טוען פרויקט...</span>
        </div>
      </div>
    );
  }
  
  if (apiError && !formValues.name) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 mb-4">
          <CardHeader>
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <CardTitle>שגיאה בטעינת הפרויקט</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p>{apiError}</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/dashboard/projects")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              חזרה לרשימת הפרויקטים
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <button 
          onClick={handleBackToProject}
          className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          חזרה לפרויקט
        </button>
        
        <h1 className="text-2xl font-bold mb-2">עריכת פרויקט: {formValues.name}</h1>
        <p className="text-gray-500">עדכון הגדרות ופרטי הפרויקט</p>
      </div>
      
      {apiError && (
        <Card className="border-red-200 mb-6">
          <CardContent className="p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2" />
              <div>
                <h3 className="font-medium text-red-800">שגיאה</h3>
                <p className="text-red-700 text-sm">{apiError}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList>
            <TabsTrigger value="details">פרטי פרויקט</TabsTrigger>
            <TabsTrigger value="repository">מאגר קוד</TabsTrigger>
            <TabsTrigger value="advanced">הגדרות מתקדמות</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>פרטים בסיסיים</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">שם הפרויקט</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formValues.name}
                    onChange={handleChange}
                    className={errors.name ? "border-red-500" : ""}
                    placeholder="הזן שם פרויקט"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm">{errors.name}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">תיאור</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formValues.description}
                    onChange={handleChange}
                    placeholder="תיאור קצר של הפרויקט"
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">סטטוס</Label>
                  <Select
                    id="status"
                    name="status"
                    value={formValues.status}
                    onChange={handleChange}
                  >
                    <option value="active">פעיל</option>
                    <option value="inactive">לא פעיל</option>
                    <option value="archived">בארכיון</option>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="repository" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>פרטי מאגר קוד</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="repositoryType">סוג פרויקט</Label>
                  <Select
                    id="repositoryType"
                    name="repositoryType"
                    value={formValues.repositoryType}
                    onChange={handleChange}
                  >
                    <option value="web">אתר אינטרנט</option>
                    <option value="api">ממשק API</option>
                    <option value="mobile">אפליקציית מובייל</option>
                    <option value="repo">מאגר קוד</option>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="repositoryUrl">כתובת URL של המאגר</Label>
                  <Input
                    id="repositoryUrl"
                    name="repositoryUrl"
                    value={formValues.repositoryUrl}
                    onChange={handleChange}
                    className={errors.repositoryUrl ? "border-red-500" : ""}
                    placeholder={projectTypes[formValues.repositoryType].placeholder}
                  />
                  {errors.repositoryUrl && (
                    <p className="text-red-500 text-sm">{errors.repositoryUrl}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="branch">ענף (Branch)</Label>
                  <Input
                    id="branch"
                    name="branch"
                    value={formValues.branch}
                    onChange={handleChange}
                    placeholder="main"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="localPath">נתיב מקומי (אופציונלי)</Label>
                  <Input
                    id="localPath"
                    name="localPath"
                    value={formValues.localPath}
                    onChange={handleChange}
                    placeholder="/path/to/local/repo"
                  />
                  <p className="text-sm text-gray-500">
                    השתמש בשדה זה רק אם הפרויקט נמצא בקובץ מקומי במקום במאגר מרוחק
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">סכנה - מחיקת פרויקט</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-gray-600">
                  מחיקת פרויקט היא פעולה שלא ניתן לבטל. כל הנתונים הקשורים לפרויקט, כולל סריקות וממצאים, יימחקו לצמיתות.
                </p>
                
                {!showDeleteConfirm ? (
                  <Button 
                    type="button" 
                    variant="destructive" 
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    מחק פרויקט
                  </Button>
                ) : (
                  <div>
                    <p className="mb-4 font-medium text-red-600">
                      האם אתה בטוח שברצונך למחוק את הפרויקט?
                    </p>
                    <div className="flex space-x-3 rtl:space-x-reverse">
                      <Button 
                        type="button" 
                        variant="destructive" 
                        onClick={handleDelete}
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            מוחק...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            כן, למחוק
                          </>
                        )}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={isDeleting}
                      >
                        ביטול
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6 flex justify-end">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleBackToProject}
            disabled={isSaving}
            className="mr-3"
          >
            ביטול
          </Button>
          <Button 
            type="submit"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                שומר...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                שמור שינויים
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
} 