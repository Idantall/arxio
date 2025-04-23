const fs = require('fs');
const path = require('path');

const envContent = `# NextAuth
NEXTAUTH_URL=http://localhost:3004
NEXTAUTH_SECRET=super_secret_random_long_string_for_github_auth

# GitHub Provider
GITHUB_CLIENT_ID=Iv23lilRpILDJ1O5enls
GITHUB_CLIENT_SECRET=3823653945db788d4cf53ad06caecaf59068d044
GITHUB_APP_ID=1225175

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://sahiuqlyojjjvijzbfqt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhaGl1cWx5b2pqanZpanpiZnF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNzM5NDEsImV4cCI6MjA2MDg0OTk0MX0.4i0Av6P-Ol8R-Zs9xIJtlhrEnsH_CsubbgcWNLfGTZM
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhaGl1cWx5b2pqanZpanpiZnF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTI3Mzk0MSwiZXhwIjoyMDYwODQ5OTQxfQ.mnXnBpFFOytuio-rgjyx_vbthCnPmhaLaFwyH2oXLko`;

const envPath = path.join(process.cwd(), '.env.local');

try {
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('קובץ .env.local עודכן בהצלחה!');
} catch (error) {
  console.error('שגיאה בעדכון קובץ .env.local:', error.message);
} 