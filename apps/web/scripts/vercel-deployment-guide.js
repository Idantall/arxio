/**
 * הנחיות לפריסת הפרויקט בVercel
 * ==========================
 * 
 * כדי שההתחברות והרישום יעבדו בסביבת הייצור, יש להגדיר את משתני הסביבה הבאים
 * בפאנל הניהול של Vercel.
 */

console.log('\n=====================================================================');
console.log('מדריך לפריסת Arxio בסביבת ייצור');
console.log('=====================================================================\n');

console.log('כדי שמערכת ההתחברות והרישום תעבוד בסביבת הייצור בVercel, עליך לבצע את הצעדים הבאים:');

console.log('\n1. הוסף את משתני הסביבה הבאים בפאנל הניהול של Vercel:');
console.log('   (Settings > Environment Variables)\n');

const environmentVariables = {
  // NextAuth
  'NEXTAUTH_URL': 'https://arxio-web.vercel.app',
  'NEXTAUTH_SECRET': 'super_secret_random_long_string_for_github_auth',
  
  // GitHub Provider
  'GITHUB_CLIENT_ID': 'Iv23lilRpILDJ1O5enls',
  'GITHUB_CLIENT_SECRET': '3823653945db788d4cf53ad06caecaf59068d044',
  'GITHUB_APP_ID': '1225175',
  
  // Supabase
  'NEXT_PUBLIC_SUPABASE_URL': 'https://sahiuqlyojjjvijzbfqt.supabase.co',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhaGl1cWx5b2pqanZpanpiZnF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNzM5NDEsImV4cCI6MjA2MDg0OTk0MX0.4i0Av6P-Ol8R-Zs9xIJtlhrEnsH_CsubbgcWNLfGTZM',
  'SUPABASE_SERVICE_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhaGl1cWx5b2pqanZpanpiZnF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTI3Mzk0MSwiZXhwIjoyMDYwODQ5OTQxfQ.mnXnBpFFOytuio-rgjyx_vbthCnPmhaLaFwyH2oXLko',
};

// הצגת משתני הסביבה בפורמט מוכן להעתקה
Object.entries(environmentVariables).forEach(([key, value]) => {
  console.log(`   ${key}=${value}`);
});

console.log('\n2. אחרי הוספת משתני הסביבה, יש להפעיל מחדש את הפריסה:');
console.log('   (a) לך ללשונית "Deployments"');
console.log('   (b) לחץ על הפריסה האחרונה');
console.log('   (c) לחץ על "Redeploy"');

console.log('\n3. וידוא שמשתמש קיים בסופאבייס:');
console.log('   הרץ את הסקריפט test-login.js כדי לוודא שיש משתמש קיים בסופאבייס');
console.log('   אם אין משתמש, הרץ את הסקריפט create-user.js ליצירת משתמש חדש');

console.log('\n4. בדיקת התחברות:');
console.log('   (a) נווט לכתובת https://arxio-web.vercel.app/auth/login');
console.log('   (b) נסה להתחבר עם המשתמש שיצרת');
console.log('   (c) אם מופיעה שגיאה, בדוק את הקונסול של הדפדפן ובלוגים של Vercel');

console.log('\n5. פתרון בעיות נפוצות:');
console.log('   (a) וודא ש-NEXTAUTH_URL מוגדר נכון - עם https ובדיוק אותו דומיין של האפליקציה');
console.log('   (b) אם יש שגיאת CORS, וודא שהדומיין מוגדר בהגדרות הCORS של סופאבייס');
console.log('   (c) וודא שהמפתחות של סופאבייס נכונים');
console.log('   (d) וודא שיש לך משתמש פעיל בסופאבייס');

console.log('\n6. משתמש קיים לדוגמה:');
console.log('   Email: idantal92@gmail.com');
console.log('   Password: Idta1234');

console.log('\n7. אם עדיין נתקלת בבעיות:');
console.log('   (a) בדוק את הלוגים בפאנל הניהול של Vercel');
console.log('   (b) נסה לעדכן את קוד ההתחברות בdebug mode ולהוסיף עוד console.log');
console.log('   (c) וודא ש-NextAuth ו-Supabase מוגדרים נכון');

console.log('\n=====================================================================');
console.log('בהצלחה!');
console.log('=====================================================================\n'); 