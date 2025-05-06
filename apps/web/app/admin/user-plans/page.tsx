'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  User, Shield, UserCheck, Users, Search, RefreshCw, 
  CheckCircle, XCircle, AlertTriangle, ChevronDown
} from 'lucide-react';

export default function UserPlansPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [message, setMessage] = useState<{type: 'success' | 'error' | 'info', text: string} | null>(null);
  const [upgradeStatus, setUpgradeStatus] = useState<{
    checking: boolean;
    columnExists: boolean;
    message: string;
  }>({
    checking: false,
    columnExists: false,
    message: '',
  });

  // בדיקת הרשאות - רק מנהל יכול לגשת לדף זה
  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/admin/user-plans');
      return;
    }
    
    const user = session?.user as any;
    if (!user?.isAdmin && !user?.role?.includes('admin')) {
      setMessage({
        type: 'error',
        text: 'אין לך הרשאה לצפות בדף זה. רק מנהלי מערכת יכולים לנהל תוכניות משתמשים.'
      });
      
      // הפניה חזרה לדשבורד אחרי 3 שניות
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
    } else {
      loadUsers();
    }
  }, [status, session]);

  // טעינת רשימת המשתמשים
  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('שגיאה בטעינת רשימת המשתמשים');
      
      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'שגיאה בטעינת נתוני משתמשים');
      
      setUsers(data.users || []);
      setFilteredUsers(data.users || []);
    } catch (error) {
      console.error('שגיאה בטעינת משתמשים:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'שגיאה בטעינת רשימת המשתמשים'
      });
    } finally {
      setLoading(false);
    }
  };

  // בדיקה אם קיימת עמודת plan בטבלת המשתמשים
  const checkPlanColumn = async () => {
    setUpgradeStatus({
      ...upgradeStatus,
      checking: true,
      message: 'בודק קיום עמודת plan...'
    });
    
    try {
      const response = await fetch('/api/setup-user-plans');
      const data = await response.json();
      
      setUpgradeStatus({
        checking: false,
        columnExists: data.columnExists || data.columnAdded || false,
        message: data.message || (data.success ? 'הבדיקה הושלמה בהצלחה' : 'שגיאה בבדיקת עמודת plan')
      });
      
      if (data.success) {
        setMessage({
          type: 'success',
          text: data.message || 'עמודת plan קיימת או נוספה בהצלחה'
        });
        
        // טעינה מחדש של המשתמשים אחרי עדכון עמודת התוכנית
        loadUsers();
      } else {
        setMessage({
          type: 'error',
          text: data.message || 'שגיאה בהגדרת עמודת plan'
        });
      }
    } catch (error) {
      setUpgradeStatus({
        checking: false,
        columnExists: false,
        message: 'שגיאה בבדיקת עמודת plan'
      });
      
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'שגיאה בבדיקת עמודת plan'
      });
    }
  };

  // טיפול בשינוי תוכנית משתמש
  const handlePlanChange = async (userId: string, newPlan: string) => {
    setUpdating(userId);
    
    try {
      const response = await fetch('/api/setup-user-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          plan: newPlan
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // עדכון המשתמש ברשימה המקומית
        setUsers(users.map(user => 
          user.id === userId ? { ...user, plan: newPlan } : user
        ));
        
        setFilteredUsers(filteredUsers.map(user => 
          user.id === userId ? { ...user, plan: newPlan } : user
        ));
        
        setMessage({
          type: 'success',
          text: `תוכנית המשתמש עודכנה בהצלחה ל-${getPlanLabel(newPlan)}`
        });
      } else {
        setMessage({
          type: 'error',
          text: data.message || 'שגיאה בעדכון תוכנית המשתמש'
        });
      }
    } catch (error) {
      console.error('שגיאה בעדכון תוכנית:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'שגיאה בעדכון תוכנית המשתמש'
      });
    } finally {
      setUpdating(null);
    }
  };

  // חיפוש משתמשים
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter(user => 
        user.email?.toLowerCase().includes(query) || 
        user.name?.toLowerCase().includes(query) ||
        user.username?.toLowerCase().includes(query) ||
        user.id?.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  // המרת שם התוכנית לתווית ידידותית
  const getPlanLabel = (plan: string) => {
    switch (plan) {
      case 'free': return 'חינם';
      case 'pro': return 'מקצועי';
      case 'enterprise': return 'ארגוני';
      default: return plan || 'לא מוגדר';
    }
  };

  // יצירת מחלקת CSS לתוכנית
  const getPlanClass = (plan: string) => {
    switch (plan) {
      case 'free': return 'bg-blue-100 text-blue-800';
      case 'pro': return 'bg-emerald-100 text-emerald-800';
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // יצירת אייקון לתוכנית
  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'free': return <User className="w-4 h-4 mr-1" />;
      case 'pro': return <UserCheck className="w-4 h-4 mr-1" />;
      case 'enterprise': return <Shield className="w-4 h-4 mr-1" />;
      default: return <User className="w-4 h-4 mr-1" />;
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div className="title-area">
          <h1>ניהול תוכניות משתמשים</h1>
          <p className="subtitle">צפייה ועדכון תוכניות לכל המשתמשים במערכת</p>
        </div>
        
        <div className="actions-area">
          <button 
            className="check-btn"
            onClick={checkPlanColumn}
            disabled={upgradeStatus.checking}
          >
            {upgradeStatus.checking ? (
              <RefreshCw className="animate-spin w-4 h-4 mr-1" />
            ) : (
              <Shield className="w-4 h-4 mr-1" />
            )}
            בדוק/הוסף עמודת תוכנית
          </button>
        </div>
      </div>
      
      {message && (
        <div className={`message ${message.type === 'success' ? 'success' : message.type === 'error' ? 'error' : 'info'}`}>
          {message.type === 'success' && <CheckCircle className="w-5 h-5" />}
          {message.type === 'error' && <XCircle className="w-5 h-5" />}
          {message.type === 'info' && <AlertTriangle className="w-5 h-5" />}
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="close-btn">×</button>
        </div>
      )}
      
      <div className="plan-types">
        <div className="plan-type free">
          <div className="plan-header">
            <User className="w-5 h-5" />
            <h3>חינם</h3>
          </div>
          <ul>
            <li>עד 5 בדיקות אבטחה בחודש</li>
            <li>רק סריקות DAST בסיסיות</li>
            <li>בדיקה אחת במקביל</li>
            <li>זמן מקסימלי לסריקה: 10 דקות</li>
          </ul>
        </div>
        
        <div className="plan-type pro">
          <div className="plan-header">
            <UserCheck className="w-5 h-5" />
            <h3>מקצועי</h3>
          </div>
          <ul>
            <li>עד 50 בדיקות אבטחה בחודש</li>
            <li>סריקות SAST, DAST, ו-API</li>
            <li>עד 3 בדיקות במקביל</li>
            <li>זמן מקסימלי לסריקה: 30 דקות</li>
          </ul>
        </div>
        
        <div className="plan-type enterprise">
          <div className="plan-header">
            <Shield className="w-5 h-5" />
            <h3>ארגוני</h3>
          </div>
          <ul>
            <li>ללא הגבלת בדיקות חודשיות</li>
            <li>כל סוגי הסריקות</li>
            <li>עד 10 בדיקות במקביל</li>
            <li>זמן מקסימלי לסריקה: 2 שעות</li>
          </ul>
        </div>
      </div>
      
      <div className="search-container">
        <div className="search-input">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="חיפוש משתמשים לפי אימייל, שם או מזהה..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              className="clear-search" 
              onClick={() => setSearchQuery('')}
            >
              ×
            </button>
          )}
        </div>
        
        <div className="results-count">
          {filteredUsers.length} מתוך {users.length} משתמשים
        </div>
      </div>
      
      {loading ? (
        <div className="loading-container">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <p>טוען רשימת משתמשים...</p>
        </div>
      ) : (
        <>
          {filteredUsers.length === 0 ? (
            <div className="no-results">
              <Users className="w-12 h-12 opacity-30" />
              <h3>לא נמצאו משתמשים</h3>
              <p>{searchQuery ? 'נסה לשנות את מונחי החיפוש' : 'אין משתמשים במערכת'}</p>
            </div>
          ) : (
            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>שם</th>
                    <th>אימייל</th>
                    <th>תאריך הצטרפות</th>
                    <th>תוכנית נוכחית</th>
                    <th>פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td className="user-name">
                        <div className="avatar">{user.name?.[0] || user.email?.[0] || '?'}</div>
                        <div className="user-info">
                          <div className="display-name">{user.name || 'ללא שם'}</div>
                          {user.username && <div className="username">@{user.username}</div>}
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        {user.created_at ? new Date(user.created_at).toLocaleDateString('he-IL') : 'לא ידוע'}
                      </td>
                      <td>
                        <span className={`plan-badge ${getPlanClass(user.plan)}`}>
                          {getPlanIcon(user.plan)}
                          {getPlanLabel(user.plan || 'free')}
                        </span>
                      </td>
                      <td>
                        <div className="plan-selector">
                          <select
                            value={user.plan || 'free'}
                            onChange={(e) => handlePlanChange(user.id, e.target.value)}
                            disabled={updating === user.id}
                            className="plan-select"
                          >
                            <option value="free">חינם</option>
                            <option value="pro">מקצועי</option>
                            <option value="enterprise">ארגוני</option>
                          </select>
                          <ChevronDown className="chevron-icon" />
                          
                          {updating === user.id && (
                            <RefreshCw className="updating-icon animate-spin" />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      
      <style jsx>{`
        .admin-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }
        
        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        
        .title-area h1 {
          font-size: 1.8rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }
        
        .subtitle {
          color: #6b7280;
          font-size: 1rem;
        }
        
        .check-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.5rem 1rem;
          background-color: #4f46e5;
          color: white;
          border-radius: 0.375rem;
          font-weight: 500;
          transition: background-color 0.2s;
        }
        
        .check-btn:hover {
          background-color: #4338ca;
        }
        
        .check-btn:disabled {
          background-color: #6b7280;
          cursor: not-allowed;
        }
        
        .message {
          display: flex;
          align-items: center;
          padding: 0.75rem 1rem;
          border-radius: 0.375rem;
          margin-bottom: 1.5rem;
        }
        
        .message.success {
          background-color: #ecfdf5;
          color: #065f46;
          border: 1px solid #6ee7b7;
        }
        
        .message.error {
          background-color: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fca5a5;
        }
        
        .message.info {
          background-color: #eff6ff;
          color: #1e40af;
          border: 1px solid #93c5fd;
        }
        
        .message span {
          flex: 1;
          margin: 0 0.5rem;
        }
        
        .close-btn {
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          line-height: 1;
        }
        
        .plan-types {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }
        
        .plan-type {
          padding: 1rem;
          border-radius: 0.5rem;
          position: relative;
        }
        
        .plan-type.free {
          background-color: rgba(59, 130, 246, 0.05);
          border: 1px solid rgba(59, 130, 246, 0.2);
        }
        
        .plan-type.pro {
          background-color: rgba(16, 185, 129, 0.05);
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        
        .plan-type.enterprise {
          background-color: rgba(139, 92, 246, 0.05);
          border: 1px solid rgba(139, 92, 246, 0.2);
        }
        
        .plan-header {
          display: flex;
          align-items: center;
          margin-bottom: 0.75rem;
          font-weight: 600;
        }
        
        .plan-header h3 {
          margin-right: 0.5rem;
          font-size: 1.1rem;
        }
        
        .plan-type ul {
          list-style-type: none;
          padding: 0;
          margin: 0;
        }
        
        .plan-type li {
          padding: 0.25rem 0;
          font-size: 0.9rem;
          position: relative;
          padding-right: 1.25rem;
        }
        
        .plan-type li::before {
          content: "✓";
          position: absolute;
          right: 0;
          color: #4f46e5;
        }
        
        .search-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }
        
        .search-input {
          position: relative;
          flex: 1;
          max-width: 500px;
        }
        
        .search-icon {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          width: 1rem;
          height: 1rem;
          color: #6b7280;
        }
        
        .search-input input {
          width: 100%;
          padding: 0.5rem 2.25rem 0.5rem 2rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          outline: none;
          transition: border-color 0.15s;
        }
        
        .search-input input:focus {
          border-color: #4f46e5;
          box-shadow: 0 0 0 1px rgba(79, 70, 229, 0.1);
        }
        
        .clear-search {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          width: 1rem;
          height: 1rem;
          background: none;
          border: none;
          font-size: 1.25rem;
          line-height: 1;
          color: #6b7280;
          cursor: pointer;
        }
        
        .results-count {
          font-size: 0.875rem;
          color: #6b7280;
        }
        
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 0;
          color: #6b7280;
        }
        
        .loading-container p {
          margin-top: 1rem;
        }
        
        .no-results {
          text-align: center;
          padding: 4rem 0;
          color: #6b7280;
        }
        
        .no-results h3 {
          margin: 1rem 0 0.5rem;
          font-weight: 600;
        }
        
        .users-table-container {
          overflow-x: auto;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
        }
        
        .users-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .users-table th {
          background-color: #f9fafb;
          padding: 0.75rem 1rem;
          text-align: right;
          font-weight: 600;
          color: #374151;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .users-table td {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #e5e7eb;
          color: #1f2937;
        }
        
        .users-table tr:last-child td {
          border-bottom: none;
        }
        
        .user-name {
          display: flex;
          align-items: center;
        }
        
        .avatar {
          width: 2rem;
          height: 2rem;
          background-color: #4f46e5;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          margin-left: 0.75rem;
        }
        
        .user-info {
          display: flex;
          flex-direction: column;
        }
        
        .display-name {
          font-weight: 500;
        }
        
        .username {
          font-size: 0.75rem;
          color: #6b7280;
        }
        
        .plan-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
        }
        
        .plan-selector {
          position: relative;
          width: 140px;
        }
        
        .plan-select {
          width: 100%;
          padding: 0.375rem 0.75rem;
          padding-left: 2rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          outline: none;
          transition: border-color 0.15s;
          background-color: white;
          font-size: 0.875rem;
        }
        
        .plan-select:focus {
          border-color: #4f46e5;
          box-shadow: 0 0 0 1px rgba(79, 70, 229, 0.1);
        }
        
        .chevron-icon {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          width: 0.875rem;
          height: 0.875rem;
          color: #6b7280;
          pointer-events: none;
        }
        
        .updating-icon {
          position: absolute;
          left: -1.5rem;
          top: 50%;
          transform: translateY(-50%);
          width: 1rem;
          height: 1rem;
          color: #4f46e5;
        }
      `}</style>
    </div>
  );
} 