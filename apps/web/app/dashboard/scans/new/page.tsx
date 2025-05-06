"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Server, Globe, GitBranch, Database, Clock, HardDrive, Upload, Loader } from "lucide-react";
import { Button } from "@arxio/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@arxio/ui";
import { Input } from "@arxio/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@arxio/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@arxio/ui";
import { Textarea } from "@arxio/ui";
import { Label } from "@arxio/ui";
import { useToast } from "@arxio/ui";

export default function NewScanPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('repository');
  
  // מצבי טופס
  const [scanName, setScanName] = useState('');
  const [scanDescription, setScanDescription] = useState('');
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [repositoryType, setRepositoryType] = useState('github');
  const [branch, setBranch] = useState('main');
  const [targetUrl, setTargetUrl] = useState('');
  const [scanDepth, setScanDepth] = useState('standard');
  const [authentication, setAuthentication] = useState('none');
  
  // מצבי שגיאות
  const [nameError, setNameError] = useState('');
  const [targetError, setTargetError] = useState('');

  // החלפת לשונית
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // איפוס שגיאות
    setTargetError('');
  };

  // בדיקת תקינות טופס
  const validateForm = () => {
    let isValid = true;
    
    // בדיקת שם
    if (!scanName || scanName.trim().length < 3) {
      setNameError('נדרש שם עם לפחות 3 תווים');
      isValid = false;
    } else {
      setNameError('');
    }
    
    // בדיקת יעד (תלוי בסוג סריקה)
    if (activeTab === 'repository') {
      if (!repositoryUrl) {
        setTargetError('נדרשת כתובת למאגר הקוד');
        isValid = false;
      } else if (!repositoryUrl.startsWith('http')) {
        setTargetError('נדרשת כתובת URL מלאה (כולל http/https)');
        isValid = false;
      } else {
        setTargetError('');
      }
    } else if (activeTab === 'website' || activeTab === 'api') {
      if (!targetUrl) {
        setTargetError('נדרשת כתובת URL');
        isValid = false;
      } else if (!targetUrl.startsWith('http')) {
        setTargetError('נדרשת כתובת URL מלאה (כולל http/https)');
        isValid = false;
      } else {
        setTargetError('');
      }
    }
    
    return isValid;
  };

  // שליחת הטופס
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      // הכנת נתוני הסריקה בהתאם לסוג הסריקה
      const scanData: any = {
        name: scanName,
        description: scanDescription,
        type: activeTab,
        scan_depth: scanDepth,
        status: 'pending',
        created_at: new Date().toISOString(),
      };
      
      // הגדרת היעד והפרטים בהתאם לסוג הסריקה
      if (activeTab === 'repository') {
        scanData.target = repositoryUrl;
        scanData.repository_url = repositoryUrl;
        scanData.repository_type = repositoryType;
        scanData.branch = branch;
      } else if (activeTab === 'website' || activeTab === 'api') {
        scanData.target = targetUrl;
        scanData.target_url = targetUrl;
        scanData.authentication = authentication;
      }
      
      // שליחת הבקשה ליצירת סריקה
      const response = await fetch('/api/scans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scanData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'שגיאה ביצירת הסריקה');
      }
      
      // הצגת הודעת הצלחה
      toast({
        title: "סריקה חדשה נוצרה",
        description: "הסריקה נוספה למערכת ותתחיל בקרוב",
      });
      
      // מעבר לדף הסריקה החדשה
      router.push(`/dashboard/scans/${data.id}`);
    } catch (error) {
      console.error("שגיאה ביצירת סריקה:", error);
      toast({
        title: "שגיאה ביצירת הסריקה",
        description: error instanceof Error ? error.message : "אירעה שגיאה בלתי צפויה",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">יצירת סריקה חדשה</h1>
        <p className="text-gray-500">בחר את סוג הסריקה וספק את המידע הנדרש</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 mb-6">
          {/* שדות בסיסיים */}
          <Card>
            <CardHeader>
              <CardTitle>פרטי סריקה</CardTitle>
              <CardDescription>הזן את המידע הבסיסי עבור הסריקה</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">שם הסריקה</Label>
                <Input 
                  id="name"
                  value={scanName}
                  onChange={(e) => setScanName(e.target.value)}
                  placeholder="שם שיאפשר לך לזהות את הסריקה"
                  className={nameError ? "border-red-500" : ""}
                />
                {nameError && <p className="text-red-500 text-sm">{nameError}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">תיאור (אופציונלי)</Label>
                <Textarea 
                  id="description"
                  value={scanDescription}
                  onChange={(e) => setScanDescription(e.target.value)}
                  placeholder="תיאור קצר של מטרת הסריקה"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="scan_depth">עומק סריקה</Label>
                <Select 
                  value={scanDepth}
                  onValueChange={setScanDepth}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר עומק סריקה" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quick">מהירה (בסיסית)</SelectItem>
                    <SelectItem value="standard">סטנדרטית (מומלצת)</SelectItem>
                    <SelectItem value="deep">מעמיקה (איטית יותר)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-gray-500 text-sm">
                  עומק הסריקה משפיע על משך הסריקה והיקף הבדיקה
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* בחירת סוג סריקה */}
          <Card>
            <CardHeader>
              <CardTitle>סוג סריקה</CardTitle>
              <CardDescription>בחר את סוג המטרה לסריקה</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="grid grid-cols-3 md:grid-cols-6">
                  <TabsTrigger value="repository">
                    <GitBranch className="h-4 w-4 ml-2" />
                    מאגר קוד
                  </TabsTrigger>
                  <TabsTrigger value="website">
                    <Globe className="h-4 w-4 ml-2" />
                    אתר אינטרנט
                  </TabsTrigger>
                  <TabsTrigger value="api">
                    <Server className="h-4 w-4 ml-2" />
                    API
                  </TabsTrigger>
                  <TabsTrigger value="code">
                    <ShieldAlert className="h-4 w-4 ml-2" />
                    קוד
                  </TabsTrigger>
                  <TabsTrigger value="docker">
                    <Database className="h-4 w-4 ml-2" />
                    Docker
                  </TabsTrigger>
                  <TabsTrigger value="local">
                    <HardDrive className="h-4 w-4 ml-2" />
                    תיקייה מקומית
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="repository" className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="repository_url">כתובת המאגר</Label>
                    <Input 
                      id="repository_url"
                      value={repositoryUrl}
                      onChange={(e) => setRepositoryUrl(e.target.value)}
                      placeholder="https://github.com/username/repo"
                      className={targetError ? "border-red-500" : ""}
                    />
                    {targetError && <p className="text-red-500 text-sm">{targetError}</p>}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="repository_type">סוג מאגר</Label>
                      <Select 
                        value={repositoryType}
                        onValueChange={setRepositoryType}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="בחר סוג מאגר" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="github">GitHub</SelectItem>
                          <SelectItem value="gitlab">GitLab</SelectItem>
                          <SelectItem value="bitbucket">Bitbucket</SelectItem>
                          <SelectItem value="azure">Azure DevOps</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="branch">ענף (Branch)</Label>
                      <Input 
                        id="branch"
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        placeholder="main"
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="website" className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="target_url">כתובת האתר</Label>
                    <Input 
                      id="target_url"
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                      placeholder="https://example.com"
                      className={targetError ? "border-red-500" : ""}
                    />
                    {targetError && <p className="text-red-500 text-sm">{targetError}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="authentication">אימות</Label>
                    <Select 
                      value={authentication}
                      onValueChange={setAuthentication}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="בחר שיטת אימות" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">ללא אימות</SelectItem>
                        <SelectItem value="basic">Basic Auth</SelectItem>
                        <SelectItem value="oauth">OAuth</SelectItem>
                        <SelectItem value="apikey">API Key</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
                
                <TabsContent value="api" className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="api_url">נקודת קצה של ה-API</Label>
                    <Input 
                      id="api_url"
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                      placeholder="https://api.example.com/v1"
                      className={targetError ? "border-red-500" : ""}
                    />
                    {targetError && <p className="text-red-500 text-sm">{targetError}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="api_auth">אימות</Label>
                    <Select 
                      value={authentication}
                      onValueChange={setAuthentication}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="בחר שיטת אימות" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">ללא אימות</SelectItem>
                        <SelectItem value="basic">Basic Auth</SelectItem>
                        <SelectItem value="oauth">OAuth</SelectItem>
                        <SelectItem value="apikey">API Key</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
                
                <TabsContent value="code" className="mt-4 flex items-center justify-center py-8">
                  <div className="text-center">
                    <Upload className="h-10 w-10 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">העלה קובץ קוד לסריקה</h3>
                    <p className="text-gray-500 mb-4 max-w-md">
                      ניתן להעלות קבצי קוד בודדים או קבצי ZIP עם פרויקטים שלמים לסריקה.
                    </p>
                    <Button type="button">
                      בחר קובץ להעלאה
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="docker" className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="docker_image">שם התמונה (Image)</Label>
                    <Input 
                      id="docker_image"
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                      placeholder="nginx:latest"
                      className={targetError ? "border-red-500" : ""}
                    />
                    {targetError && <p className="text-red-500 text-sm">{targetError}</p>}
                    <p className="text-gray-500 text-sm">
                      שם התמונה במאגר Docker, כולל גרסה אם רלוונטי
                    </p>
                  </div>
                </TabsContent>
                
                <TabsContent value="local" className="mt-4 flex items-center justify-center py-8">
                  <div className="text-center">
                    <HardDrive className="h-10 w-10 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">בחר תיקייה מקומית לסריקה</h3>
                    <p className="text-gray-500 mb-4 max-w-md">
                      לסריקה של קוד מקומי, הכנס את הנתיב לתיקייה המכילה את הקוד שברצונך לסרוק.
                    </p>
                    <Button type="button">
                      בחר תיקייה
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" onClick={() => router.back()}>
            ביטול
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                יוצר סריקה...
              </>
            ) : (
              <>
                <Clock className="mr-2 h-4 w-4" />
                יצירת סריקה
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
} 