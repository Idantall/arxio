import Link from 'next/link';

export default function LoginOptionsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">בחר סגנון התחברות</h1>
        
        <div className="space-y-4">
          <Link 
            href="/auth/login"
            className="flex items-center justify-center w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            דף התחברות רגיל
          </Link>
          
          <Link 
            href="/custom-login"
            className="flex items-center justify-center w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
          >
            דף התחברות מותאם אישית
          </Link>
        </div>
        
        <div className="mt-8 text-gray-400 text-sm text-center">
          <p>שני דפי ההתחברות משתמשים באותו מנגנון אימות, אך בעיצוב שונה</p>
        </div>
      </div>
    </div>
  );
} 