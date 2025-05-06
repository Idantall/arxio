'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle2, AlertCircle, Clock, Play } from 'lucide-react';

// טיפוסי נתונים לסריקות
interface Scan {
  id: string;
  type: 'sast' | 'dast' | 'api';
  status: 'pending' | 'running' | 'completed' | 'failed';
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

// פרופס לקומפוננטה
interface ScanInterfaceProps {
  projectId: string;
}

export default function ScanInterface({ projectId }: ScanInterfaceProps) {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedScanType, setSelectedScanType] = useState<'sast' | 'dast' | 'api'>('dast');
  const [targetUrl, setTargetUrl] = useState('');
  const [creatingNew, setCreatingNew] = useState(false);
  
  // פונקציה לטעינת סריקות
  const loadScans = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/scans`);
      if (response.ok) {
        const data = await response.json();
        setScans(data);
      } else {
        console.error('שגיאה בטעינת סריקות:', response.statusText);
        toast({
          title: 'שגיאה בטעינת סריקות',
          description: 'לא ניתן היה לטעון את הסריקות, נסה שוב מאוחר יותר',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('שגיאה בטעינת סריקות:', error);
      toast({
        title: 'שגיאה בטעינת סריקות',
        description: 'התרחשה שגיאה בתקשורת עם השרת',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // פונקציה לרענון הסריקות
  const refreshScans = () => {
    setRefreshing(true);
    loadScans();
  };
  
  // פונקציה ליצירת סריקה חדשה
  const createNewScan = async () => {
    setCreatingNew(true);
    
    try {
      const response = await fetch(`/api/projects/${projectId}/scans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scanType: selectedScanType,
          target: targetUrl,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'סריקה חדשה נוצרה',
          description: `סריקת ${selectedScanType.toUpperCase()} נוצרה בהצלחה`,
          variant: 'default',
        });
        
        // רענון רשימת הסריקות
        refreshScans();
      } else {
        const error = await response.json();
        console.error('שגיאה ביצירת סריקה:', error);
        toast({
          title: 'שגיאה ביצירת סריקה',
          description: error.message || 'לא ניתן היה ליצור סריקה חדשה',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('שגיאה ביצירת סריקה:', error);
      toast({
        title: 'שגיאה ביצירת סריקה',
        description: 'התרחשה שגיאה בתקשורת עם השרת',
        variant: 'destructive',
      });
    } finally {
      setCreatingNew(false);
    }
  };
  
  // טעינת הסריקות בעת טעינת הקומפוננטה
  useEffect(() => {
    loadScans();
    
    // הגדרת טיימר לרענון כל 15 שניות
    const refreshTimer = setInterval(() => {
      // רענון רק אם יש סריקות בסטטוס pending או running
      if (scans.some(scan => scan.status === 'pending' || scan.status === 'running')) {
        refreshScans();
      }
    }, 15000);
    
    return () => clearInterval(refreshTimer);
  }, [projectId]);
  
  // פונקציה להצגת סטטוס סריקה
  const renderScanStatus = (status: string) => {
    switch (status) {
      case 'pending':
        return <div className="flex items-center"><Clock className="mr-2 text-yellow-500" size={16} /> ממתין</div>;
      case 'running':
        return <div className="flex items-center"><Loader2 className="mr-2 animate-spin text-blue-500" size={16} /> מבצע סריקה</div>;
      case 'completed':
        return <div className="flex items-center"><CheckCircle2 className="mr-2 text-green-500" size={16} /> הושלם</div>;
      case 'failed':
        return <div className="flex items-center"><AlertCircle className="mr-2 text-red-500" size={16} /> נכשל</div>;
      default:
        return status;
    }
  };
  
  // פונקציה להצגת סיכום ממצאים
  const renderFindingsSummary = (findings: Scan['findingsCount']) => {
    const total = findings.critical + findings.high + findings.medium + findings.low + findings.info;
    
    if (total === 0) {
      return 'אין ממצאים';
    }
    
    return (
      <div className="flex gap-2">
        {findings.critical > 0 && <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">{findings.critical} קריטי</span>}
        {findings.high > 0 && <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">{findings.high} גבוה</span>}
        {findings.medium > 0 && <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">{findings.medium} בינוני</span>}
        {findings.low + findings.info > 0 && <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">{findings.low + findings.info} נמוך/מידע</span>}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="scans" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="scans" className="flex-1">סריקות קיימות</TabsTrigger>
          <TabsTrigger value="new-scan" className="flex-1">סריקה חדשה</TabsTrigger>
        </TabsList>
        
        <TabsContent value="scans" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">סריקות אבטחה</h2>
            <Button 
              variant="outline" 
              onClick={refreshScans} 
              disabled={refreshing || loading}
            >
              {refreshing ? 
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> מרענן...</> : 
                'רענן רשימה'
              }
            </Button>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="mr-2">טוען סריקות...</span>
            </div>
          ) : scans.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-muted-foreground">אין סריקות קיימות לפרויקט זה</p>
                <Button className="mt-4" onClick={() => {
                  const newScanTab = document.querySelector('[data-value="new-scan"]');
                  if (newScanTab instanceof HTMLElement) {
                    newScanTab.click();
                  }
                }}>
                  יצירת סריקה חדשה
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {scans.map((scan) => (
                <Card key={scan.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle>סריקת {scan.type.toUpperCase()}</CardTitle>
                      {renderScanStatus(scan.status)}
                    </div>
                    <CardDescription>
                      נוצר: {new Date(scan.startedAt).toLocaleString('he-IL')}
                      {scan.completedAt && ` | הושלם: ${new Date(scan.completedAt).toLocaleString('he-IL')}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium mb-1">ממצאים:</p>
                        {renderFindingsSummary(scan.findingsCount)}
                      </div>
                      <Button 
                        onClick={() => window.location.href = `/dashboard/projects/${projectId}/scans/${scan.id}`}
                        variant="outline"
                      >
                        פרטי סריקה
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="new-scan" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>יצירת סריקה חדשה</CardTitle>
              <CardDescription>
                בחר את סוג הסריקה והגדר את היעד לסריקה
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="scan-type">סוג סריקה</Label>
                <RadioGroup 
                  defaultValue="dast" 
                  value={selectedScanType} 
                  onValueChange={(value) => setSelectedScanType(value as 'sast' | 'dast' | 'api')}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dast" id="dast" />
                    <Label htmlFor="dast" className="mr-2 font-normal">DAST - סריקת אתר חי (Dynamic Application Security Testing)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="api" id="api" />
                    <Label htmlFor="api" className="mr-2 font-normal">API - סריקת ממשקי API</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sast" id="sast" />
                    <Label htmlFor="sast" className="mr-2 font-normal">SAST - סריקת קוד מקור (Static Application Security Testing)</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="target-url">כתובת יעד</Label>
                <Input
                  id="target-url"
                  placeholder={
                    selectedScanType === 'dast' ? 'https://example.com' :
                    selectedScanType === 'api' ? 'https://api.example.com/v1' :
                    'https://github.com/username/repo'
                  }
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  {selectedScanType === 'dast' && 'הזן את כתובת האתר שברצונך לסרוק'}
                  {selectedScanType === 'api' && 'הזן את כתובת הבסיס של ה-API שברצונך לסרוק'}
                  {selectedScanType === 'sast' && 'הזן את כתובת מאגר הקוד שברצונך לסרוק או השאר ריק לשימוש במאגר המוגדר בפרויקט'}
                </p>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  disabled={creatingNew || (selectedScanType !== 'sast' && !targetUrl)} 
                  onClick={createNewScan}
                >
                  {creatingNew ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> יוצר סריקה...</>
                  ) : (
                    <><Play className="h-4 w-4 mr-2" /> התחל סריקה</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 