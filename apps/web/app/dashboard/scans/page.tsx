"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  AlertCircle, CheckCircle, Clock, Shield, Database, 
  Plus, RefreshCw, Filter, Search, Calendar
} from "lucide-react";
import { Button } from "@arxio/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@arxio/ui";
import { Input } from "@arxio/ui";
import { Badge } from "@arxio/ui";
import { createClient } from '@supabase/supabase-js';

// יצירת לקוח סופאבייס
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function ScansPage() {
  const router = useRouter();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [missingTables, setMissingTables] = useState([]);
  
  useEffect(() => {
    const fetchScans = async () => {
      try {
        setLoading(true);
        
        // קבלת סריקות מה-API
        const response = await fetch('/api/scans');
        const data = await response.json();
        
        if (response.ok) {
          setScans(data);
        } else {
          setError(data.error || 'שגיאה בטעינת נתוני סריקות');
          
          // בדיקה אם חסרות טבלאות
          if (data.missingTables) {
            setMissingTables(data.missingTables);
          }
        }
      } catch (error) {
        console.error('שגיאה בקבלת נתוני סריקות:', error);
        setError('שגיאת תקשורת בטעינת נתוני סריקות');
        
        // ניסיון ישיר מול סופאבייס במקרה של שגיאה
        try {
          const { data: scanData, error: scanError } = await supabase
            .from('scans')
            .select('*')
            .order('created_at', { ascending: false });
            
          if (scanError) {
            if (scanError.message.includes('does not exist')) {
              setMissingTables(['scans']);
            }
            throw scanError;
          }
          
          setScans(scanData || []);
        } catch (dbError) {
          console.error('שגיאה בגישה ישירה למסד הנתונים:', dbError);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchScans();
  }, []);
  
  // פילטור סריקות לפי חיפוש
  const filteredScans = scans.filter(scan => {
    const searchLower = searchQuery.toLowerCase();
    return (
      !searchQuery ||
      (scan.target && scan.target.toLowerCase().includes(searchLower)) ||
      (scan.type && scan.type.toLowerCase().includes(searchLower)) ||
      (scan.status && scan.status.toLowerCase().includes(searchLower))
    );
  });

  const handleCreateScan = () => {
    router.push('/dashboard/scans/new');
  };
  
  const handleRefresh = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/scans');
      const data = await response.json();
      
      if (response.ok) {
        setScans(data);
        setError(null);
      } else {
        setError(data.error || 'שגיאה בטעינת נתוני סריקות');
      }
    } catch (error) {
      setError('שגיאה בריענון נתוני סריקות');
    } finally {
      setLoading(false);
    }
  };
  
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'לא זמין';
    return new Date(timestamp).toLocaleString('he-IL');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'running': return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'pending': return <Clock className="h-5 w-5 text-amber-500" />;
      case 'error': 
      case 'failed': return <AlertCircle className="h-5 w-5 text-red-500" />;
      default: return <Clock className="h-5 w-5 text-gray-500" />;
    }
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
  
  // רינדור טבלאות חסרות
  if (missingTables.length > 0) {
    return (
      <div className="container mx-auto p-6">
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <CardTitle className="text-red-700">טבלאות חסרות במסד הנתונים</CardTitle>
            </div>
            <CardDescription className="text-red-600">
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
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">סריקות אבטחה</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            <span>רענן</span>
          </Button>
          <Button size="sm" onClick={handleCreateScan}>
            <Plus className="h-4 w-4 mr-2" />
            <span>סריקה חדשה</span>
          </Button>
        </div>
      </div>
      
      {/* שגיאה */}
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <CardTitle className="text-red-700">שגיאה בטעינת נתוני סריקות</CardTitle>
            </div>
            <CardDescription className="text-red-600">{error}</CardDescription>
          </CardHeader>
        </Card>
      )}
      
      {/* סרגל חיפוש */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="חפש לפי סוג סריקה, יעד או סטטוס..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-3 pr-10"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 ml-2" />
                <span>סנן</span>
              </Button>
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 ml-2" />
                <span>טווח תאריכים</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* רשימת סריקות */}
      {loading ? (
        <Card>
          <CardContent className="p-6 flex justify-center">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 mx-auto animate-spin text-primary" />
              <p className="mt-4">טוען סריקות...</p>
            </div>
          </CardContent>
        </Card>
      ) : filteredScans.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium">אין סריקות</h3>
              <p className="text-gray-500 mt-2">
                {searchQuery ? 'לא נמצאו סריקות התואמות את החיפוש.' : 'לא נמצאו סריקות. צור סריקה חדשה כדי להתחיל.'}
              </p>
              {!searchQuery && (
                <Button className="mt-4" onClick={handleCreateScan}>
                  <Plus className="h-4 w-4 mr-2" />
                  <span>סריקה חדשה</span>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredScans.map((scan) => (
            <Card 
              key={scan.id} 
              className="cursor-pointer hover:border-primary transition-colors" 
              onClick={() => router.push(`/dashboard/scans/${scan.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(scan.status)}
                      <h3 className="font-semibold">{scan.type || 'סריקת אבטחה'}</h3>
                      <Badge variant={
                        scan.status === 'completed' ? 'success' : 
                        scan.status === 'running' ? 'info' : 
                        (scan.status === 'error' || scan.status === 'failed') ? 'destructive' : 
                        'secondary'
                      }>
                        {getStatusText(scan.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{scan.target || 'לא צוין יעד'}</p>
                  </div>
                  
                  <div className="flex flex-wrap md:flex-nowrap gap-4 text-sm mt-2 md:mt-0">
                    <div>
                      <p className="text-gray-500">התחלה</p>
                      <p>{formatTimestamp(scan.start_time || scan.created_at)}</p>
                    </div>
                    {scan.completed_at && (
                      <div>
                        <p className="text-gray-500">סיום</p>
                        <p>{formatTimestamp(scan.completed_at)}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-500">ממצאים</p>
                      <p>{scan.findings_count || 0}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 