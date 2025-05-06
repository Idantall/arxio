"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@arxio/ui";
import { Badge } from "@arxio/ui";
import { Input } from "@arxio/ui";
import { Search, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface TableProps {
  className?: string;
  children: React.ReactNode;
}

interface TableCaptionProps {
  className?: string;
  children: React.ReactNode;
}

interface TableHeaderProps {
  className?: string;
  children: React.ReactNode;
}

interface TableBodyProps {
  className?: string;
  children: React.ReactNode;
}

interface TableRowProps {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

interface TableHeadProps {
  className?: string;
  children: React.ReactNode;
}

interface TableCellProps {
  className?: string;
  children: React.ReactNode;
}

// גירסה בסיסית של קומפוננטות הטבלה למקרה שלא קיימות ב-UI
const Table = ({ className, children }: TableProps) => (
  <table className={`w-full border-collapse ${className || ''}`}>{children}</table>
);

const TableCaption = ({ className, children }: TableCaptionProps) => (
  <caption className={`mt-4 text-sm text-gray-500 ${className || ''}`}>{children}</caption>
);

const TableHeader = ({ className, children }: TableHeaderProps) => (
  <thead className={`bg-gray-50 ${className || ''}`}>{children}</thead>
);

const TableBody = ({ className, children }: TableBodyProps) => (
  <tbody className={`divide-y divide-gray-200 ${className || ''}`}>{children}</tbody>
);

const TableRow = ({ className, children, onClick }: TableRowProps) => (
  <tr
    className={`border-b border-gray-200 transition-colors ${className || ''}`}
    onClick={onClick}
  >
    {children}
  </tr>
);

const TableHead = ({ className, children }: TableHeadProps) => (
  <th
    className={`px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider ${className || ''}`}
  >
    {children}
  </th>
);

const TableCell = ({ className, children }: TableCellProps) => (
  <td className={`px-4 py-4 text-sm ${className || ''}`}>{children}</td>
);

// סוגי נתונים
type ScanStatus = 'created' | 'pending' | 'running' | 'completed' | 'error';

export interface ScanTableItem {
  id: string;
  name: string;
  type: string;
  target: string;
  status: ScanStatus;
  created_at: string;
  completed_at?: string;
  findings_count?: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
}

interface ScansTableProps {
  scans: ScanTableItem[];
  onViewScan?: (scanId: string) => void;
  showCaption?: boolean;
  emptyMessage?: string;
}

// צבעים לסטטוס הסריקה
const statusColors: Record<ScanStatus, string> = {
  created: 'bg-slate-500',
  pending: 'bg-yellow-500',
  running: 'bg-blue-500',
  completed: 'bg-green-500',
  error: 'bg-red-500'
};

// תרגום סטטוס לעברית
const statusTranslations: Record<ScanStatus, string> = {
  created: 'נוצרה',
  pending: 'ממתינה',
  running: 'בביצוע',
  completed: 'הושלמה',
  error: 'שגיאה'
};

// אייקונים לסטטוס
const statusIcons: Record<ScanStatus, any> = {
  created: Clock,
  pending: Clock,
  running: Clock,
  completed: CheckCircle,
  error: AlertCircle
};

export default function ScansTable({ 
  scans, 
  onViewScan, 
  showCaption = true,
  emptyMessage = "לא נמצאו סריקות"
}: ScansTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<ScanStatus | 'all'>('all');
  
  // פורמט תאריך בעברית
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('he-IL', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };

  // חישוב סכום הממצאים בסריקה
  const getTotalFindings = (scan: ScanTableItem) => {
    if (!scan.findings_count) return 0;
    
    return (
      scan.findings_count.critical +
      scan.findings_count.high +
      scan.findings_count.medium +
      scan.findings_count.low +
      scan.findings_count.info
    );
  };

  // סינון הסריקות לפי חיפוש וסטטוס
  const filteredScans = scans.filter(scan => {
    // סינון לפי מונח חיפוש
    const matchesSearch = searchTerm === '' || 
      scan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scan.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scan.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    // סינון לפי סטטוס
    const matchesStatus = filterStatus === 'all' || scan.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // מיון הסריקות - החדשות ביותר קודם
  const sortedScans = [...filteredScans].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  
  // טיפול בלחיצה על סריקה
  const handleViewScan = (scanId: string) => {
    if (onViewScan) {
      onViewScan(scanId);
    } else {
      router.push(`/dashboard/scans/${scanId}`);
    }
  };

  return (
    <div>
      {/* שורת חיפוש וסינון */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="חיפוש סריקות..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant={filterStatus === 'all' ? "default" : "outline"} 
            size="sm"
            onClick={() => setFilterStatus('all')}
          >
            הכל
          </Button>
          <Button 
            variant={filterStatus === 'running' ? "default" : "outline"} 
            size="sm"
            onClick={() => setFilterStatus('running')}
            className="bg-blue-500 hover:bg-blue-600"
          >
            פעילות
          </Button>
          <Button 
            variant={filterStatus === 'completed' ? "default" : "outline"} 
            size="sm"
            onClick={() => setFilterStatus('completed')}
            className="bg-green-500 hover:bg-green-600"
          >
            הושלמו
          </Button>
          <Button 
            variant={filterStatus === 'error' ? "default" : "outline"} 
            size="sm"
            onClick={() => setFilterStatus('error')}
            className="bg-red-500 hover:bg-red-600"
          >
            שגיאות
          </Button>
        </div>
      </div>

      {/* אין סריקות */}
      {sortedScans.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Search className="h-10 w-10 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">לא נמצאו סריקות</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || filterStatus !== 'all' 
              ? 'לא נמצאו תוצאות מתאימות לחיפוש' 
              : emptyMessage}
          </p>
        </div>
      )}

      {/* טבלת סריקות */}
      {sortedScans.length > 0 && (
        <Table>
          {showCaption && <TableCaption>סה"כ {sortedScans.length} סריקות</TableCaption>}
          <TableHeader>
            <TableRow>
              <TableHead>שם</TableHead>
              <TableHead>סוג</TableHead>
              <TableHead>יעד</TableHead>
              <TableHead>סטטוס</TableHead>
              <TableHead>תאריך יצירה</TableHead>
              <TableHead className="text-center">ממצאים</TableHead>
              <TableHead>פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedScans.map((scan) => {
              const StatusIcon = statusIcons[scan.status];
              
              return (
                <TableRow 
                  key={scan.id} 
                  className="cursor-pointer hover:bg-gray-50" 
                  onClick={() => handleViewScan(scan.id)}
                >
                  <TableCell className="font-medium">{scan.name}</TableCell>
                  <TableCell>{scan.type}</TableCell>
                  <TableCell className="max-w-xs truncate">{scan.target}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Badge variant="outline" className={`${statusColors[scan.status]} text-white`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusTranslations[scan.status] || scan.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(scan.created_at)}</TableCell>
                  <TableCell className="text-center">
                    {scan.status === 'completed' ? (
                      <span>{getTotalFindings(scan)}</span>
                    ) : (
                      <span>-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewScan(scan.id);
                      }}
                    >
                      צפייה
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
} 