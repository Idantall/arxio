'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ArrowRight, Code, GitBranch, Github, ArrowLeft, ChevronDown, Shield, BarChart, Bell, Settings } from 'lucide-react';

const projectSchema = z.object({
  name: z.string().min(3, { 
    message: 'שם הפרויקט חייב להכיל לפחות 3 תווים' 
  }),
  description: z.string().min(5, { 
    message: 'תיאור הפרויקט חייב להכיל לפחות 5 תווים' 
  }),
  repositoryUrl: z.string().url({ 
    message: 'נא להזין כתובת URL תקינה של מאגר קוד' 
  }),
  branch: z.string().min(1, { 
    message: 'נא לבחור ענף' 
  }),
  scanType: z.enum(['static', 'dynamic', 'full'], {
    required_error: 'נא לבחור סוג סריקה'
  }),
});

type FormValues = z.infer<typeof projectSchema>;

export default function NewProjectPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [branchOptions, setBranchOptions] = useState(['main', 'develop', 'staging']);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      description: '',
      repositoryUrl: '',
      branch: 'main',
      scanType: 'static',
    }
  });

  const selectedBranch = watch('branch');
  const selectedScanType = watch('scanType');

  const handleBranchSelect = (branch: string) => {
    setValue('branch', branch);
    setShowBranchDropdown(false);
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setGeneralError(null);
    
    try {
      console.log('יוצר פרויקט חדש:', data);
      
      // כאן יש לשלוח את נתוני הפרויקט לשרת
      // const response = await fetch('/api/projects', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(data),
      // });
      
      // if (!response.ok) {
      //   throw new Error('שגיאה ביצירת הפרויקט');
      // }
      
      // הדמיית הצלחה - להסיר בהמשך
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // ניתוב לדף הפרויקט החדש או לדשבורד
      router.push('/dashboard');
    } catch (error) {
      console.error('שגיאה ביצירת פרויקט:', error);
      setGeneralError('אירעה שגיאה ביצירת הפרויקט. נא לנסות שוב.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="project-container">
      <nav className="sidebar">
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="app-logo"></div>
            <h1>Arxio</h1>
          </div>
        </div>
        
        <div className="sidebar-links">
          <Link href="/dashboard" className="sidebar-link">
            <BarChart size={18} />
            <span>דשבורד</span>
          </Link>
          <Link href="/dashboard/projects" className="sidebar-link active">
            <Code size={18} />
            <span>פרויקטים</span>
          </Link>
          <Link href="/dashboard/scans" className="sidebar-link">
            <Shield size={18} />
            <span>סריקות אבטחה</span>
          </Link>
          <Link href="/dashboard/reports" className="sidebar-link">
            <BarChart size={18} />
            <span>דוחות</span>
          </Link>
          <Link href="/dashboard/settings" className="sidebar-link">
            <Settings size={18} />
            <span>הגדרות</span>
          </Link>
        </div>
      </nav>

      <main className="content">
        <header className="content-header">
          <Link href="/dashboard" className="back-link">
            <ArrowLeft size={18} />
            <span>חזרה לדשבורד</span>
          </Link>
          
          <div className="header-actions">
            <button className="notification-btn">
              <Bell size={18} />
            </button>
            <button className="user-profile">
              <div className="avatar">י</div>
              <span>ישראל ישראלי</span>
            </button>
          </div>
        </header>

        <div className="page-header">
          <h2>יצירת פרויקט חדש</h2>
        </div>

        <div className="form-container">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-grid">
              <div className="form-section">
                <h3>פרטי פרויקט</h3>
                
                <div className="form-group">
                  <label htmlFor="name">שם הפרויקט</label>
                  <input
                    id="name"
                    type="text"
                    placeholder="לדוגמה: Payment Gateway API"
                    className={`form-input ${errors.name ? 'error' : ''}`}
                    {...register('name')}
                  />
                  {errors.name && <span className="error-message">{errors.name.message}</span>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="description">תיאור הפרויקט</label>
                  <textarea
                    id="description"
                    placeholder="תיאור קצר של הפרויקט ומטרתו"
                    className={`form-textarea ${errors.description ? 'error' : ''}`}
                    rows={3}
                    {...register('description')}
                  ></textarea>
                  {errors.description && <span className="error-message">{errors.description.message}</span>}
                </div>
              </div>
              
              <div className="form-section">
                <h3>מקור קוד</h3>
                
                <div className="form-group">
                  <label htmlFor="repositoryUrl">כתובת מאגר (GitHub, GitLab, Bitbucket)</label>
                  <div className="input-with-icon">
                    <Github size={18} className="input-icon" />
                    <input
                      id="repositoryUrl"
                      type="text"
                      placeholder="https://github.com/username/repository"
                      className={`form-input with-icon ${errors.repositoryUrl ? 'error' : ''}`}
                      {...register('repositoryUrl')}
                    />
                  </div>
                  {errors.repositoryUrl && <span className="error-message">{errors.repositoryUrl.message}</span>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="branch">ענף (Branch)</label>
                  <div className="dropdown-container">
                    <button 
                      type="button"
                      className="dropdown-toggle"
                      onClick={() => setShowBranchDropdown(!showBranchDropdown)}
                    >
                      <GitBranch size={18} className="dropdown-icon" />
                      <span>{selectedBranch}</span>
                      <ChevronDown size={16} className="chevron-icon" />
                    </button>
                    
                    {showBranchDropdown && (
                      <div className="dropdown-menu">
                        {branchOptions.map(branch => (
                          <button
                            key={branch}
                            type="button"
                            className={`dropdown-item ${branch === selectedBranch ? 'active' : ''}`}
                            onClick={() => handleBranchSelect(branch)}
                          >
                            {branch}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {errors.branch && <span className="error-message">{errors.branch.message}</span>}
                </div>
              </div>
              
              <div className="form-section full-width">
                <h3>הגדרות סריקה</h3>
                
                <div className="scan-options">
                  <div 
                    className={`scan-option ${selectedScanType === 'static' ? 'active' : ''}`}
                    onClick={() => setValue('scanType', 'static')}
                  >
                    <input 
                      type="radio" 
                      id="static"
                      value="static"
                      checked={selectedScanType === 'static'}
                      {...register('scanType')}
                    />
                    <div className="scan-option-content">
                      <label htmlFor="static">סריקה סטטית</label>
                      <p>ניתוח קוד מקור לפגיעויות ובעיות אבטחה ללא הרצת הקוד</p>
                    </div>
                  </div>
                  
                  <div 
                    className={`scan-option ${selectedScanType === 'dynamic' ? 'active' : ''}`}
                    onClick={() => setValue('scanType', 'dynamic')}
                  >
                    <input 
                      type="radio" 
                      id="dynamic"
                      value="dynamic"
                      checked={selectedScanType === 'dynamic'}
                      {...register('scanType')}
                    />
                    <div className="scan-option-content">
                      <label htmlFor="dynamic">סריקה דינמית</label>
                      <p>בדיקת אבטחה בזמן ריצה לזיהוי פגיעויות בעת פעולת האפליקציה</p>
                    </div>
                  </div>
                  
                  <div 
                    className={`scan-option ${selectedScanType === 'full' ? 'active' : ''}`}
                    onClick={() => setValue('scanType', 'full')}
                  >
                    <input 
                      type="radio" 
                      id="full"
                      value="full"
                      checked={selectedScanType === 'full'}
                      {...register('scanType')}
                    />
                    <div className="scan-option-content">
                      <label htmlFor="full">סריקה מלאה</label>
                      <p>שילוב של סריקה סטטית ודינמית לכיסוי מקיף של פגיעויות אפשריות</p>
                    </div>
                  </div>
                </div>
                {errors.scanType && <span className="error-message">{errors.scanType.message}</span>}
              </div>
            </div>

            {generalError && (
              <div className="error-alert">
                <p>{generalError}</p>
              </div>
            )}
            
            <div className="form-actions">
              <Link href="/dashboard" className="cancel-button">
                ביטול
              </Link>
              <button 
                type="submit" 
                className="submit-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="loading-spinner"></span>
                    <span>יוצר פרויקט...</span>
                  </>
                ) : (
                  <>
                    <span>צור פרויקט והתחל סריקה</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      <style jsx>{`
        .project-container {
          display: flex;
          min-height: 100vh;
          background-color: #131313;
          color: #e7e7e7;
          direction: rtl;
        }

        .sidebar {
          width: 250px;
          background-color: #1c1c1c;
          border-left: 1px solid #2e2e2e;
          display: flex;
          flex-direction: column;
          position: fixed;
          height: 100vh;
          z-index: 10;
        }

        .sidebar-header {
          padding: 1.5rem;
          border-bottom: 1px solid #2e2e2e;
        }

        .logo-container {
          display: flex;
          align-items: center;
        }

        .app-logo {
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, #3ecf8e, #3e8ecf);
          border-radius: 4px;
          margin-left: 0.75rem;
        }

        h1 {
          font-size: 1.2rem;
          font-weight: 600;
          margin: 0;
          color: #ffffff;
        }

        .sidebar-links {
          display: flex;
          flex-direction: column;
          padding: 1.5rem 0;
        }

        .sidebar-link {
          display: flex;
          align-items: center;
          padding: 0.75rem 1.5rem;
          color: #8f8f8f;
          text-decoration: none;
          transition: all 0.2s;
        }

        .sidebar-link:hover {
          background-color: rgba(62, 207, 142, 0.08);
          color: #3ecf8e;
        }

        .sidebar-link.active {
          background-color: rgba(62, 207, 142, 0.12);
          color: #3ecf8e;
          border-right: 2px solid #3ecf8e;
        }

        .sidebar-link svg {
          margin-left: 0.75rem;
        }

        .content {
          flex: 1;
          margin-right: 250px;
          padding: 0 2rem 2rem;
        }

        .content-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 0;
          border-bottom: 1px solid #2e2e2e;
          margin-bottom: 2rem;
        }

        .back-link {
          display: flex;
          align-items: center;
          color: #8f8f8f;
          text-decoration: none;
          transition: color 0.2s;
        }

        .back-link:hover {
          color: #3ecf8e;
        }

        .back-link svg {
          margin-left: 0.5rem;
        }

        .header-actions {
          display: flex;
          align-items: center;
        }

        .notification-btn {
          background: none;
          border: none;
          color: #8f8f8f;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 4px;
          margin-left: 1rem;
        }

        .notification-btn:hover {
          background-color: #242424;
          color: #e7e7e7;
        }

        .user-profile {
          display: flex;
          align-items: center;
          background: none;
          border: none;
          color: #e7e7e7;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 4px;
        }

        .user-profile:hover {
          background-color: #242424;
        }

        .avatar {
          width: 30px;
          height: 30px;
          background-color: #3ecf8e;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          margin-left: 0.75rem;
        }

        .page-header {
          margin-bottom: 2rem;
        }

        h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #ffffff;
          margin: 0;
        }

        .form-container {
          background-color: #1c1c1c;
          border: 1px solid #2e2e2e;
          border-radius: 8px;
          padding: 2rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem;
        }

        .form-section {
          margin-bottom: 2rem;
        }

        .form-section.full-width {
          grid-column: span 2;
        }

        h3 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 1rem 0;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #2e2e2e;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        label {
          display: block;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
          color: #e7e7e7;
        }

        .form-input, .form-textarea, .dropdown-toggle {
          width: 100%;
          padding: 0.75rem;
          background-color: #242424;
          border: 1px solid #2e2e2e;
          border-radius: 4px;
          color: #e7e7e7;
          font-size: 0.95rem;
          transition: all 0.2s;
        }

        .form-input:focus, .form-textarea:focus {
          outline: none;
          border-color: #3ecf8e;
          box-shadow: 0 0 0 1px rgba(62, 207, 142, 0.2);
        }

        .form-input.error, .form-textarea.error, .dropdown-toggle.error {
          border-color: #f43f5e;
        }

        .input-with-icon {
          position: relative;
        }

        .input-icon {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: #8f8f8f;
        }

        .form-input.with-icon {
          padding-right: 2.5rem;
        }

        .dropdown-container {
          position: relative;
        }

        .dropdown-toggle {
          display: flex;
          align-items: center;
          cursor: pointer;
          user-select: none;
        }

        .dropdown-icon {
          margin-left: 0.5rem;
          color: #8f8f8f;
        }

        .chevron-icon {
          margin-right: auto;
          transition: transform 0.2s;
        }

        .dropdown-menu {
          position: absolute;
          top: 100%;
          right: 0;
          width: 100%;
          background-color: #242424;
          border: 1px solid #2e2e2e;
          border-radius: 4px;
          margin-top: 0.25rem;
          z-index: 10;
          max-height: 200px;
          overflow-y: auto;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .dropdown-item {
          display: block;
          width: 100%;
          padding: 0.75rem;
          background: none;
          border: none;
          text-align: right;
          color: #e7e7e7;
          cursor: pointer;
          transition: all 0.2s;
        }

        .dropdown-item:hover {
          background-color: #2e2e2e;
        }

        .dropdown-item.active {
          background-color: rgba(62, 207, 142, 0.1);
          color: #3ecf8e;
        }

        .scan-options {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        .scan-option {
          position: relative;
          display: flex;
          flex-direction: column;
          padding: 1.25rem;
          background-color: #242424;
          border: 1px solid #2e2e2e;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .scan-option:hover {
          border-color: #3ecf8e;
          background-color: rgba(62, 207, 142, 0.05);
        }

        .scan-option.active {
          border-color: #3ecf8e;
          background-color: rgba(62, 207, 142, 0.08);
        }

        .scan-option input {
          position: absolute;
          top: 1rem;
          left: 1rem;
          appearance: none;
          width: 1.2rem;
          height: 1.2rem;
          border: 1px solid #3e3e3e;
          border-radius: 50%;
          outline: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .scan-option input:checked {
          background-color: #3ecf8e;
          border-color: #3ecf8e;
        }

        .scan-option input:checked::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 0.4rem;
          height: 0.4rem;
          background-color: #242424;
          border-radius: 50%;
        }

        .scan-option-content {
          flex: 1;
        }

        .scan-option label {
          display: block;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #ffffff;
        }

        .scan-option p {
          font-size: 0.8rem;
          color: #ababab;
          margin: 0;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 2rem;
          gap: 1rem;
        }

        .cancel-button {
          padding: 0.75rem 1.5rem;
          background-color: transparent;
          border: 1px solid #2e2e2e;
          border-radius: 4px;
          color: #e7e7e7;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
          text-align: center;
        }

        .cancel-button:hover {
          background-color: #242424;
        }

        .submit-button {
          display: flex;
          align-items: center;
          padding: 0.75rem 1.5rem;
          background-color: #3ecf8e;
          border: none;
          border-radius: 4px;
          color: #0e1011;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .submit-button:hover {
          background-color: #35b77d;
        }

        .submit-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .submit-button svg {
          margin-right: 0.5rem;
        }

        .loading-spinner {
          display: inline-block;
          width: 1rem;
          height: 1rem;
          border: 2px solid #0e1011;
          border-radius: 50%;
          border-top-color: transparent;
          margin-left: 0.5rem;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .error-message {
          display: block;
          color: #f43f5e;
          font-size: 0.8rem;
          margin-top: 0.25rem;
        }

        .error-alert {
          margin: 1rem 0;
          padding: 1rem;
          background-color: rgba(244, 63, 94, 0.1);
          border: 1px solid #f43f5e;
          border-radius: 4px;
          color: #f43f5e;
        }

        .error-alert p {
          margin: 0;
          font-size: 0.9rem;
        }

        @media (max-width: 1024px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
          
          .form-section.full-width {
            grid-column: 1;
          }
          
          .scan-options {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .sidebar {
            width: 60px;
          }
          
          .sidebar-header {
            padding: 1rem;
            display: flex;
            justify-content: center;
          }
          
          .logo-container h1 {
            display: none;
          }
          
          .app-logo {
            margin: 0;
          }
          
          .sidebar-link span {
            display: none;
          }
          
          .sidebar-link {
            padding: 0.75rem;
            justify-content: center;
          }
          
          .sidebar-link svg {
            margin: 0;
          }
          
          .content {
            margin-right: 60px;
            padding: 0 1rem 1rem;
          }
          
          .form-container {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
} 