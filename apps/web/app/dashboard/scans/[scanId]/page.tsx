"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  AlertCircle, CheckCircle, Clock, Download, ExternalLink, 
  Eye, FileText, Server, Shield, Zap, Database
} from "lucide-react";
import { Button } from "@arxio/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@arxio/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@arxio/ui";
import { Badge } from "@arxio/ui";
import { createClient } from '@supabase/supabase-js';

// יצירת לקוח סופאבייס
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function ScanDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [scan, setScan] = useState(null);
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [missingTables, setMissingTables] = useState([]);
  
  const scanId = params.id;
  
  useEffect(() => {
    const fetchScanData = async () => {
      try {
        // קבלת מידע הסריקה מה-API
        const response = await fetch(`/api/scans?id=${scanId}`);
        const data = await response.json();
        
        if (response.ok) {
          // במקרה של הצלחה, שמירת נתוני הסריקה והממצאים
          setScan(data);
          setFindings(data.findings || []);
        } else {
          // במקרה של שגיאה מהשרת
          setError(data.error || 'שגיאה בטעינת נתוני הסריקה');
          
          // בדיקה אם חסרות טבלאות
          if (data.missingTables) {
            setMissingTables(data.missingTables);
          }
        }
      } catch (error) {
        console.error('שגיאה בקבלת נתוני סריקה:', error);
        setError('שגיאת תקשורת בטעינת נתוני הסריקה');
        
        // ניסיון ישיר מול סופאבייס במקרה של שגיאה
        try {
          const { data: scanData, error: scanError } = await supabase
            .from('scans')
            .select('*')
            .eq('id', scanId)
            .single();
            
          if (scanError) {
            if (scanError.message.includes('does not exist')) {
              setMissingTables(['scans']);
            }
            throw scanError;
          }
          
          setScan(scanData);
          
          const { data: findingsData, error: findingsError } = await supabase
            .from('findings')
            .select('*')
            .eq('scan_id', scanId);
            
          if (findingsError) {
            if (findingsError.message.includes('does not exist')) {
              setMissingTables(prevTables => [...prevTables, 'findings']);
            }
            console.error('שגיאה בקבלת ממצאים:', findingsError);
          } else {
            setFindings(findingsData || []);
          }
        } catch (dbError) {
          console.error('שגיאה בגישה ישירה למסד הנתונים:', dbError);
        }
      } finally {
        setLoading(false);
      }
    };

    if (scanId) {
      fetchScanData();
    }
  }, [scanId]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <Clock className="h-12 w-12 mx-auto animate-pulse text-primary" />
            <h3 className="mt-4 text-lg font-medium">טוען פרטי סריקה...</h3>
          </div>
        </div>
      </div>
    );
  }
  
  // במקרה של שגיאה או חוסר טבלאות
  if (error || missingTables.length > 0) {
    return (
      <div className="container mx-auto p-6">
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <CardTitle className="text-red-700">שגיאה בטעינת נתוני הסריקה</CardTitle>
            </div>
            <CardDescription className="text-red-600">
              {error}
              {missingTables.length > 0 && (
                <div className="mt-2">
                  <p>חסרות הטבלאות הבאות במסד הנתונים:</p>
                  <ul className="list-disc list-inside mt-2">
                    {missingTables.map(table => (
                      <li key={table}>{table}</li>
                    ))}
                  </ul>
                  <p className="mt-2">יש ליצור את הטבלאות החסרות במסד הנתונים לפני המשך השימוש במערכת.</p>
                  <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard/admin/setup-database')}>
                    <Database className="h-4 w-4 mr-2" />
                    עבור להגדרת מסד נתונים
                  </Button>
                </div>
              )}
            </CardDescription>
          </CardHeader>
        </Card>
        
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => router.push('/dashboard/scans')}>
            חזרה לרשימת הסריקות
          </Button>
        </div>
      </div>
    );
  }
  
  // אם אין נתוני סריקה
  if (!scan) {
    return (
      <div className="container mx-auto p-6">
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-amber-700">סריקה לא נמצאה</CardTitle>
            </div>
            <CardDescription className="text-amber-600">
              לא נמצאו פרטים לסריקה המבוקשת.
            </CardDescription>
          </CardHeader>
        </Card>
        
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => router.push('/dashboard/scans')}>
            חזרה לרשימת הסריקות
          </Button>
        </div>
      </div>
    );
  }

  const getSeverityColor = (severity) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-600 hover:bg-red-700';
      case 'high': return 'bg-red-500 hover:bg-red-600';
      case 'medium': return 'bg-amber-500 hover:bg-amber-600';
      case 'low': return 'bg-blue-500 hover:bg-blue-600';
      case 'info': return 'bg-gray-500 hover:bg-gray-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getStatusIcon = () => {
    const status = scan.status || 'pending';
    switch (status) {
      case 'completed': return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'running': return <Zap className="h-8 w-8 text-blue-500 animate-pulse" />;
      case 'pending': return <Clock className="h-8 w-8 text-amber-500" />;
      case 'error': 
      case 'failed': return <AlertCircle className="h-8 w-8 text-red-500" />;
      default: return <Clock className="h-8 w-8 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'לא זמין';
    return new Date(timestamp).toLocaleString('he-IL');
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'הושלם';
      case 'running': return 'פעיל';
      case 'pending': return 'ממתין';
      case 'error': 
      case 'failed': return 'נכשל';
      default: return status;
    }
  };
  
  // חישוב הממצאים לפי חומרה
  const findingsBySeverity = findings.reduce((acc, finding) => {
    const severity = finding.severity?.toLowerCase() || 'unknown';
    acc[severity] = (acc[severity] || 0) + 1;
    return acc;
  }, {});
  
  // פונקציה להצגת שגיאת סריקה
  const renderScanError = () => {
    if (!scan.error_message) return null;
    
    return (
      <Card className="mb-6 border-red-200 bg-red-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <CardTitle className="text-red-700">שגיאה בסריקה</CardTitle>
          </div>
          <CardDescription className="text-red-600">
            {scan.error_message}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <h1 className="text-2xl font-bold">{scan.type} סריקה: {scan.target}</h1>
          </div>
          <div className="mt-2 text-gray-600 flex flex-wrap gap-6">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" /> התחלה: {formatTimestamp(scan.start_time || scan.created_at)}
            </span>
            {scan.completed_at && (
              <span className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4" /> סיום: {formatTimestamp(scan.completed_at)}
              </span>
            )}
            <Badge variant={scan.status === 'completed' ? 'success' : scan.status === 'running' ? 'info' : (scan.status === 'error' || scan.status === 'failed') ? 'destructive' : 'secondary'}>
              {getStatusText(scan.status)}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" /> הורד דו"ח
          </Button>
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" /> תצוגת PDF
          </Button>
          <Button variant="default" size="sm" onClick={() => router.push('/dashboard/scans/new')}>
            סריקה חדשה
          </Button>
        </div>
      </div>
      
      {scan.error_message && renderScanError()}

      <Tabs defaultValue="findings" className="w-full">
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="findings">ממצאים ({findings.length})</TabsTrigger>
          <TabsTrigger value="parameters">פרמטרי סריקה</TabsTrigger>
          <TabsTrigger value="details">פרטי סריקה</TabsTrigger>
          <TabsTrigger value="raw">מידע גולמי</TabsTrigger>
        </TabsList>

        <TabsContent value="findings" className="space-y-4">
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle>תקציר ממצאים</CardTitle>
              <CardDescription>סיכום הממצאים לפי חומרה</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
                {['critical', 'high', 'medium', 'low', 'info'].map(severity => (
                  <div key={severity} className="bg-gray-100 rounded-lg p-4">
                    <div className={`inline-block w-8 h-8 rounded-full flex items-center justify-center ${getSeverityColor(severity)}`}>
                      <span className="text-white font-bold">{findingsBySeverity[severity] || 0}</span>
                    </div>
                    <div className="mt-2 font-medium">{severity === 'critical' ? 'קריטי' : severity === 'high' ? 'גבוה' : severity === 'medium' ? 'בינוני' : severity === 'low' ? 'נמוך' : 'מידע'}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {findings.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Shield className="h-12 w-12 mx-auto text-primary mb-4" />
                <h3 className="text-lg font-medium">לא נמצאו ממצאים</h3>
                <p className="text-muted-foreground mt-2">
                  {scan.status === 'completed' 
                    ? 'הסריקה הושלמה ללא איתור בעיות אבטחה.' 
                    : scan.status === 'running' 
                      ? 'הסריקה עדיין פעילה, ממצאים יוצגו לאחר השלמתה.' 
                      : scan.status === 'error' || scan.status === 'failed' 
                        ? 'הסריקה נכשלה, לא ניתן להציג ממצאים.' 
                        : 'הסריקה טרם החלה, ממצאים יוצגו לאחר השלמתה.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            findings.map(finding => (
              <Card key={finding.id} className="overflow-hidden">
                <div className={`h-2 ${getSeverityColor(finding.severity)}`} />
                <CardHeader className="pb-2">
                  <div className="flex justify-between">
                    <CardTitle className="text-lg font-medium">{finding.title}</CardTitle>
                    <Badge className={getSeverityColor(finding.severity)}>{finding.severity}</Badge>
                  </div>
                  <CardDescription>מזהה חוק: {finding.rule_id || 'לא זמין'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>{finding.description || 'אין תיאור זמין'}</p>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-2" /> פרטים נוספים
                    </Button>
                    <Button size="sm" variant="outline">
                      <ExternalLink className="h-4 w-4 mr-2" /> חיפוש OWASP
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="parameters">
          <Card>
            <CardHeader>
              <CardTitle>פרמטרי הסריקה</CardTitle>
              <CardDescription>הגדרות שנקבעו לסריקה זו</CardDescription>
            </CardHeader>
            <CardContent>
              {scan.parameters && Object.keys(scan.parameters).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(scan.parameters).map(([key, value]) => (
                    <div key={key} className="flex flex-col">
                      <span className="text-sm text-gray-500">{key}</span>
                      <span className="font-medium">
                        {typeof value === 'boolean' 
                          ? value ? 'כן' : 'לא' 
                          : Array.isArray(value) 
                            ? value.join(', ') 
                            : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  לא נמצאו פרמטרים מיוחדים לסריקה זו
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>פרטי הסריקה</CardTitle>
              <CardDescription>מידע על תהליך הסריקה</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">מזהה סריקה</h4>
                    <p>{scan.id}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">סטטוס</h4>
                    <Badge variant={scan.status === 'completed' ? 'success' : scan.status === 'running' ? 'info' : (scan.status === 'error' || scan.status === 'failed') ? 'destructive' : 'secondary'}>
                      {getStatusText(scan.status)}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">סוג סריקה</h4>
                    <p>{scan.type}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">יעד</h4>
                    <p className="truncate">{scan.target}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">מועד יצירה</h4>
                    <p>{formatTimestamp(scan.created_at)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">מועד התחלה</h4>
                    <p>{formatTimestamp(scan.start_time)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">מועד סיום</h4>
                    <p>{formatTimestamp(scan.completed_at)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">מספר ממצאים</h4>
                    <p>{scan.findings_count || findings.length || 0}</p>
                  </div>
                </div>
                
                {scan.error_message && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <h4 className="text-sm font-medium text-red-800 mb-1">פרטי שגיאה</h4>
                    <p className="text-red-700">{scan.error_message}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="raw">
          <Card>
            <CardHeader>
              <CardTitle>מידע גולמי</CardTitle>
              <CardDescription>תוצאות סריקה לא מעובדות</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-96 text-sm">
                {JSON.stringify({ scan, findings }, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 