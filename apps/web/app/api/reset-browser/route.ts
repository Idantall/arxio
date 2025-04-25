import { NextResponse } from 'next/server';

// נקודת קצה זו מחזירה HTML פשוט עם סקריפט שמנקה את מטמון הדפדפן
export async function GET() {
  return new NextResponse(`
    <!DOCTYPE html>
    <html lang="he" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>איפוס מטמון דפדפן</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f0f4f8;
        }
        .container {
          max-width: 600px;
          margin: 50px auto;
          padding: 20px;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        h1 { color: #2563eb; }
        button {
          background-color: #2563eb;
          color: white;
          border: none;
          padding: 10px 15px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          margin-top: 15px;
        }
        button:hover {
          background-color: #1d4ed8;
        }
        .result {
          margin-top: 20px;
          padding: 10px;
          border-radius: 4px;
          display: none;
        }
        .success {
          background-color: #d1fae5;
          border: 1px solid #10b981;
        }
        .error {
          background-color: #fee2e2;
          border: 1px solid #ef4444;
        }
        ul {
          margin-top: 30px;
        }
        li {
          margin-bottom: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>איפוס מטמון דפדפן</h1>
        <p>דף זה יעזור לפתור בעיות של "browser is not defined" ובעיות אחרות הקשורות למטמון הדפדפן.</p>
        
        <button id="clearCache">נקה מטמון של דף זה</button>
        <button id="clearStorage">נקה מטמון ו-localStorage</button>
        
        <div id="result" class="result"></div>
        
        <h2>צעדים נוספים לפתרון בעיות:</h2>
        <ul>
          <li>השבת תוספי דפדפן: פתח chrome://extensions/ וכבה את כל התוספים</li>
          <li>נסה חלון גלישה פרטית: Ctrl+Shift+N</li>
          <li>נקה את כל המטמון של הדפדפן: Ctrl+Shift+Delete</li>
          <li><a href="/auth/login" target="_blank">פתח את דף ההתחברות בחלון חדש</a></li>
        </ul>
        
        <h2>משתמשי בדיקה זמינים:</h2>
        <ul>
          <li><strong>אימייל:</strong> test@example.com<br><strong>סיסמה:</strong> Password123!</li>
          <li><strong>אימייל:</strong> admin@example.com<br><strong>סיסמה:</strong> Password123!</li>
          <li><strong>אימייל:</strong> admin2@example.com<br><strong>סיסמה:</strong> Password123!</li>
        </ul>
      </div>
      
      <script>
        // סקריפט לניקוי מטמון ואחסון מקומי
        document.getElementById('clearCache').addEventListener('click', function() {
          try {
            // ניקוי אחסון של דפדפן
            if ('caches' in window) {
              caches.keys().then(function(names) {
                for (let name of names) {
                  caches.delete(name);
                }
              });
            }
            
            // רענון הדף
            document.getElementById('result').innerHTML = 'המטמון נוקה בהצלחה! הדף יטען מחדש בעוד 2 שניות.';
            document.getElementById('result').classList.add('success');
            document.getElementById('result').style.display = 'block';
            
            setTimeout(() => {
              window.location.href = '/auth/login?t=' + new Date().getTime();
            }, 2000);
          } catch (e) {
            document.getElementById('result').innerHTML = 'שגיאה בניקוי המטמון: ' + e.message;
            document.getElementById('result').classList.add('error');
            document.getElementById('result').style.display = 'block';
          }
        });
        
        document.getElementById('clearStorage').addEventListener('click', function() {
          try {
            // ניקוי localStorage ו-sessionStorage
            localStorage.clear();
            sessionStorage.clear();
            
            // ניקוי cookies
            document.cookie.split(";").forEach(function(c) {
              document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/");
            });
            
            // ניקוי מטמון
            if ('caches' in window) {
              caches.keys().then(function(names) {
                for (let name of names) {
                  caches.delete(name);
                }
              });
            }
            
            document.getElementById('result').innerHTML = 'כל הנתונים נוקו בהצלחה! הדף יטען מחדש בעוד 2 שניות.';
            document.getElementById('result').classList.add('success');
            document.getElementById('result').style.display = 'block';
            
            setTimeout(() => {
              window.location.href = '/auth/login?clear=true&t=' + new Date().getTime();
            }, 2000);
          } catch (e) {
            document.getElementById('result').innerHTML = 'שגיאה בניקוי הנתונים: ' + e.message;
            document.getElementById('result').classList.add('error');
            document.getElementById('result').style.display = 'block';
          }
        });
      </script>
    </body>
    </html>
  `, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
} 