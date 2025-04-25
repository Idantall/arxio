"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateUserPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        // ניקוי הטופס לאחר הצלחה
        setFormData({
          email: '',
          password: '',
          username: ''
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'שגיאה בשליחת הבקשה',
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div dir="rtl" className="container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-bold mb-6">יצירת משתמש חדש</h1>
      <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6">
        <p className="text-yellow-700">
          <strong>שים לב:</strong> עמוד זה מיועד למטרות פיתוח בלבד. 
          אין להשתמש בו בסביבת ייצור.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            אימייל
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            סיסמה
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            minLength={8}
          />
          <p className="text-xs text-gray-500 mt-1">
            הסיסמה חייבת להכיל לפחות 8 תווים
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            שם משתמש
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
        >
          {isLoading ? 'מעבד...' : 'צור משתמש'}
        </button>
      </form>

      {result && (
        <div className={`mt-6 p-4 rounded-md ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          <h2 className="font-bold text-lg mb-2">
            {result.success ? 'המשתמש נוצר בהצלחה' : 'שגיאה'}
          </h2>
          <pre className="whitespace-pre-wrap text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
          
          {result.success && (
            <div className="mt-4 p-3 bg-gray-100 rounded-md">
              <p className="font-medium">פרטי כניסה:</p>
              <p>אימייל: {result.email}</p>
              <p>סיסמה: ********* (הסיסמה שהזנת)</p>
              <button
                onClick={() => router.push('/auth/login')}
                className="mt-2 bg-blue-600 text-white py-1 px-3 rounded-md hover:bg-blue-700 text-sm"
              >
                עבור לדף הכניסה
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 