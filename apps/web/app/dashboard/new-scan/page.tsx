"use client";

import { useState } from "react";
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
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@arxio/ui";
import { 
  ArrowLeft, 
  Shield, 
  Zap, 
  AlertTriangle, 
  Globe,
  FileCode,
  Link as LinkIcon,
  Server,
  Network,
  LucideProps,
  Info,
  Clock,
  Check
} from "lucide-react";

// קומפוננטת מתג בסיסית שיצרנו כיוון ש-Switch לא קיימת בספריית @arxio/ui
function Switch({ 
  id, 
  checked, 
  onCheckedChange 
}: { 
  id?: string; 
  checked: boolean; 
  onCheckedChange: (checked: boolean) => void 
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
        checked ? 'bg-blue-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      >
        {checked && (
          <Check className="h-3 w-3 text-blue-600" />
        )}
      </span>
    </button>
  );
}

interface ScanTarget {
  id: string;
  name: string;
  type: "website" | "api" | "repo";
  url: string;
  lastScan?: string;
}

export default function NewScanPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("website");
  const [scanName, setScanName] = useState("");
  const [scanTarget, setScanTarget] = useState("");
  const [selectedScanType, setSelectedScanType] = useState("DAST");
  const [isLoading, setIsLoading] = useState(false);
  const [basicAuth, setBasicAuth] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [recentTargets, setRecentTargets] = useState<ScanTarget[]>([
    {
      id: "target1",
      name: "אתר הבית",
      type: "website",
      url: "https://example.com",
      lastScan: "2023-09-01T10:30:00Z"
    },
    {
      id: "target2",
      name: "ממשק API תשלומים",
      type: "api",
      url: "https://api.example.com/payments",
      lastScan: "2023-08-28T09:15:00Z"
    },
    {
      id: "target3",
      name: "מאגר קוד פרונט אנד",
      type: "repo",
      url: "https://github.com/example/frontend",
      lastScan: "2023-08-15T14:20:00Z"
    }
  ]);
  
  // תצורות מתקדמות
  const [advancedSettings, setAdvancedSettings] = useState({
    scanDepth: "standard",
    followRedirects: true,
    maxPages: "100",
    executionTimeout: "30",
    includeLoggedOutScan: false
  });
  
  const handleBack = () => {
    router.back();
  };
  
  const handleTargetSelect = (target: ScanTarget) => {
    setScanName(target.name);
    setScanTarget(target.url);
    setActiveTab(target.type);
  };
  
  const handleAdvancedSettingChange = (key: string, value: any) => {
    setAdvancedSettings((prev) => ({
      ...prev,
      [key]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!scanName || !scanTarget) {
      alert("יש למלא שם וכתובת יעד");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // בדוגמה זו, במקום לבצע קריאת API, אנחנו פשוט ננווט לדף התקדמות הסריקה
      router.push(`/dashboard/new-scan/progress?name=${encodeURIComponent(scanName)}&type=${selectedScanType}&target=${encodeURIComponent(scanTarget)}`);
    } catch (error) {
      console.error("שגיאה ביצירת סריקה:", error);
      alert("אירעה שגיאה ביצירת הסריקה");
      setIsLoading(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return "היום";
    } else if (diffDays === 1) {
      return "אתמול";
    } else {
      return `לפני ${diffDays} ימים`;
    }
  };
  
  const getTargetIcon = (type: ScanTarget["type"], props?: LucideProps) => {
    switch (type) {
      case "website":
        return <Globe {...props} />;
      case "api":
        return <Server {...props} />;
      case "repo":
        return <FileCode {...props} />;
      default:
        return null;
    }
  };
  
  return (
    <div className="container mx-auto p-6">
      <div className="mb-4">
        <button 
          onClick={handleBack}
          className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span>חזרה</span>
        </button>
      </div>
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">יצירת סריקה חדשה</h1>
        <p className="text-gray-500">
          הגדר את היעד והתצורה של הסריקה החדשה שלך
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit}>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>פרטי סריקה בסיסיים</CardTitle>
                <CardDescription>הגדר את שם הסריקה וסוג הסריקה שברצונך לבצע</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="scan-name">שם הסריקה</Label>
                  <Input 
                    id="scan-name"
                    placeholder="תן לסריקה שם תיאורי"
                    value={scanName}
                    onChange={(e) => setScanName(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>סוג סריקה</Label>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedScanType("DAST")}
                      className={`flex items-center gap-2 px-4 py-2 border rounded-md ${
                        selectedScanType === "DAST" 
                          ? "border-blue-500 bg-blue-50" 
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <Shield className="h-5 w-5" />
                      <div className="text-right">
                        <div className="font-medium">DAST</div>
                        <div className="text-xs text-gray-500">סריקת אתר או API מבחוץ</div>
                      </div>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setSelectedScanType("SAST")}
                      className={`flex items-center gap-2 px-4 py-2 border rounded-md ${
                        selectedScanType === "SAST" 
                          ? "border-blue-500 bg-blue-50" 
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <Zap className="h-5 w-5" />
                      <div className="text-right">
                        <div className="font-medium">SAST</div>
                        <div className="text-xs text-gray-500">סריקת קוד מקור</div>
                      </div>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setSelectedScanType("API")}
                      className={`flex items-center gap-2 px-4 py-2 border rounded-md ${
                        selectedScanType === "API" 
                          ? "border-blue-500 bg-blue-50" 
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <Network className="h-5 w-5" />
                      <div className="text-right">
                        <div className="font-medium">API</div>
                        <div className="text-xs text-gray-500">סריקת API בעומק</div>
                      </div>
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>הגדרת יעד הסריקה</CardTitle>
                <CardDescription>ציין את הכתובת או המיקום של היעד לסריקה</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="website" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="website">אתר אינטרנט</TabsTrigger>
                    <TabsTrigger value="api">API</TabsTrigger>
                    <TabsTrigger value="repo">מאגר קוד</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="website">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="website-url">כתובת האתר</Label>
                        <div className="flex">
                          <div className="flex items-center px-3 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md">
                            <Globe className="h-4 w-4 text-gray-500" />
                          </div>
                          <Input 
                            id="website-url"
                            placeholder="https://example.com"
                            value={scanTarget}
                            onChange={(e) => setScanTarget(e.target.value)}
                            className="rounded-r-none"
                          />
                        </div>
                        <p className="text-xs text-gray-500">יש להזין את כתובת ה-URL המלאה, כולל http:// או https://</p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="use-auth">השתמש באימות בסיסי</Label>
                          <Switch 
                            id="use-auth" 
                            checked={basicAuth}
                            onCheckedChange={setBasicAuth}
                          />
                        </div>
                        
                        {basicAuth && (
                          <div className="space-y-3 pt-2">
                            <div className="space-y-2">
                              <Label htmlFor="auth-username">שם משתמש</Label>
                              <Input 
                                id="auth-username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="auth-password">סיסמה</Label>
                              <Input 
                                id="auth-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="api">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="api-url">כתובת ה-API</Label>
                        <div className="flex">
                          <div className="flex items-center px-3 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md">
                            <Server className="h-4 w-4 text-gray-500" />
                          </div>
                          <Input 
                            id="api-url"
                            placeholder="https://api.example.com/v1"
                            value={scanTarget}
                            onChange={(e) => setScanTarget(e.target.value)}
                            className="rounded-r-none"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="api-spec">מפרט API (אופציונלי)</Label>
                        <Input 
                          id="api-spec"
                          placeholder="https://example.com/api/swagger.json"
                        />
                        <p className="text-xs text-gray-500">אם יש לך מפרט Swagger/OpenAPI, זה יעזור לסריקה להיות יותר יעילה</p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="use-auth-api">השתמש באימות</Label>
                          <Switch 
                            id="use-auth-api" 
                            checked={basicAuth}
                            onCheckedChange={setBasicAuth}
                          />
                        </div>
                        
                        {basicAuth && (
                          <div className="space-y-3 pt-2">
                            <div className="space-y-2">
                              <Label htmlFor="auth-type">סוג אימות</Label>
                              <Select defaultValue="basic">
                                <SelectTrigger>
                                  <SelectValue placeholder="בחר סוג אימות" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="basic">Basic Auth</SelectItem>
                                  <SelectItem value="bearer">Bearer Token</SelectItem>
                                  <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                                  <SelectItem value="apikey">API Key</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="auth-username-api">שם משתמש</Label>
                              <Input 
                                id="auth-username-api"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="auth-password-api">סיסמה</Label>
                              <Input 
                                id="auth-password-api"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="repo">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="repo-url">כתובת המאגר</Label>
                        <div className="flex">
                          <div className="flex items-center px-3 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md">
                            <FileCode className="h-4 w-4 text-gray-500" />
                          </div>
                          <Input 
                            id="repo-url"
                            placeholder="https://github.com/username/repo"
                            value={scanTarget}
                            onChange={(e) => setScanTarget(e.target.value)}
                            className="rounded-r-none"
                          />
                        </div>
                        <p className="text-xs text-gray-500">תומך במאגרים ציבוריים ב-GitHub, GitLab, ו-Bitbucket</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="repo-branch">ענף (אופציונלי)</Label>
                        <Input 
                          id="repo-branch"
                          placeholder="main"
                        />
                        <p className="text-xs text-gray-500">אם לא צוין, ייסרק הענף הראשי</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="scan-languages">שפות לסריקה (אופציונלי)</Label>
                        <Select defaultValue="all">
                          <SelectTrigger>
                            <SelectValue placeholder="בחר שפות לסריקה" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">כל השפות</SelectItem>
                            <SelectItem value="js">JavaScript/TypeScript</SelectItem>
                            <SelectItem value="python">Python</SelectItem>
                            <SelectItem value="php">PHP</SelectItem>
                            <SelectItem value="java">Java</SelectItem>
                            <SelectItem value="csharp">C#</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>הגדרות מתקדמות</CardTitle>
                <CardDescription>התאם את התצורה המתקדמת של הסריקה (אופציונלי)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="scan-depth">עומק סריקה</Label>
                    <Select 
                      value={advancedSettings.scanDepth}
                      onValueChange={(value) => handleAdvancedSettingChange("scanDepth", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="בחר עומק סריקה" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quick">מהיר</SelectItem>
                        <SelectItem value="standard">סטנדרטי</SelectItem>
                        <SelectItem value="deep">מעמיק</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="max-pages">מספר דפים מקסימלי</Label>
                      <Input 
                        id="max-pages"
                        type="number"
                        value={advancedSettings.maxPages}
                        onChange={(e) => handleAdvancedSettingChange("maxPages", e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="timeout">זמן מקסימלי לביצוע (דקות)</Label>
                      <Input 
                        id="timeout"
                        type="number"
                        value={advancedSettings.executionTimeout}
                        onChange={(e) => handleAdvancedSettingChange("executionTimeout", e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <Label htmlFor="follow-redirects">עקוב אחר הפניות</Label>
                      <p className="text-xs text-gray-500">הסריקה תעקוב אחר דפים מופנים</p>
                    </div>
                    <Switch 
                      id="follow-redirects" 
                      checked={advancedSettings.followRedirects}
                      onCheckedChange={(checked) => handleAdvancedSettingChange("followRedirects", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <Label htmlFor="logged-out-scan">כלול סריקה במצב לא מחובר</Label>
                      <p className="text-xs text-gray-500">בצע סריקה גם ללא אימות כדי למצוא בעיות נוספות</p>
                    </div>
                    <Switch 
                      id="logged-out-scan" 
                      checked={advancedSettings.includeLoggedOutScan}
                      onCheckedChange={(checked) => handleAdvancedSettingChange("includeLoggedOutScan", checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleBack}>ביטול</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'מתחיל סריקה...' : 'התחל סריקה'}
              </Button>
            </div>
          </form>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1">
                <Info className="h-4 w-4" />
                <span>יעדים אחרונים</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentTargets.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  אין יעדים אחרונים להצגה
                </div>
              ) : (
                <div className="space-y-3">
                  {recentTargets.map((target) => (
                    <button
                      key={target.id}
                      onClick={() => handleTargetSelect(target)}
                      className="w-full text-right p-3 rounded-md border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {getTargetIcon(target.type, { className: "h-4 w-4 text-gray-500" })}
                        <span className="font-medium">{target.name}</span>
                      </div>
                      <div className="mt-1 flex justify-between items-center">
                        <span className="text-xs text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {target.lastScan ? formatDate(target.lastScan) : "לא נסרק"}
                        </span>
                        <span className="text-xs text-blue-600">{target.url}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-1">
                <Info className="h-4 w-4" />
                <span>עצות לסריקה יעילה</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="min-w-4 mt-1">•</div>
                  <span>עבור סריקות DAST, ודא שהאתר זמין ונגיש מהאינטרנט</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="min-w-4 mt-1">•</div>
                  <span>אם האתר דורש הרשמה או כניסה, הוסף פרטי התחברות לסריקה</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="min-w-4 mt-1">•</div>
                  <span>לסריקות SAST, בחר מאגר קוד פעיל עם הענף העדכני ביותר</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="min-w-4 mt-1">•</div>
                  <span>סריקה מעמיקה תיקח זמן רב יותר אך תספק תוצאות מקיפות יותר</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="min-w-4 mt-1">•</div>
                  <span>מומלץ לבצע סריקות אבטחה לאחר כל שינוי משמעותי באפליקציה</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 