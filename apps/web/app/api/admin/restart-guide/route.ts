import { NextResponse } from 'next/server';

export async function GET() {
  return new NextResponse(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Restart Guide</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
      color: #333;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background-color: #fff;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    h1 { color: #3182ce; margin-top: 0; }
    h2 { margin-top: 30px; color: #2c5282; }
    code {
      font-family: SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
      background-color: #f6f8fa;
      padding: 2px 5px;
      border-radius: 3px;
      font-size: 14px;
    }
    pre {
      background-color: #f6f8fa;
      padding: 15px;
      border-radius: 6px;
      overflow: auto;
      font-size: 14px;
      line-height: 1.45;
    }
    .instructions {
      background-color: #ebf8ff;
      border-left: 4px solid #3182ce;
      padding: 15px;
      margin: 20px 0;
      border-radius: 0 4px 4px 0;
    }
    .warning {
      background-color: #fffaf0;
      border-left: 4px solid #ed8936;
      padding: 15px;
      margin: 20px 0;
      border-radius: 0 4px 4px 0;
    }
    .success {
      background-color: #f0fff4;
      border-left: 4px solid #38a169;
      padding: 15px;
      margin: 20px 0;
      border-radius: 0 4px 4px 0;
    }
    ol, ul {
      padding-left: 20px;
    }
    li {
      margin-bottom: 10px;
    }
    .button {
      display: inline-block;
      background-color: #3182ce;
      color: white;
      padding: 10px 15px;
      border-radius: 4px;
      text-decoration: none;
      margin-top: 10px;
      font-weight: 500;
    }
    .button:hover {
      background-color: #2c5282;
    }
    .section {
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid #e2e8f0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Server Restart Guide</h1>
    
    <div class="instructions">
      <p>Follow these steps to properly restart your development server to apply all changes.</p>
    </div>
    
    <div class="section">
      <h2>1. Set up the users table in Supabase</h2>
      <p>First, make sure your Supabase database has the required users table:</p>
      <ol>
        <li>Visit <a href="/api/get-supabase-sql" target="_blank">the SQL setup page</a></li>
        <li>Follow the instructions there to create the necessary table in Supabase</li>
      </ol>
    </div>
    
    <div class="section">
      <h2>2. Prepare to restart the server</h2>
      <p>In Windows PowerShell, stop the current server by pressing <code>Ctrl+C</code> in the terminal where it's running.</p>
      
      <div class="warning">
        <strong>Note:</strong> If you're running in a Docker environment, you might need to stop all containers first.
      </div>
    </div>
    
    <div class="section">
      <h2>3. Update your .env.local file</h2>
      <p>Make sure your <code>apps/web/.env.local</code> file contains all necessary environment variables:</p>
      <pre>
NEXT_PUBLIC_SUPABASE_URL=https://sahiuqlyojjjvijzbfqt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXTAUTH_SECRET=this-is-a-very-long-secret-that-should-be-replaced-in-production1234567890
NEXTAUTH_URL=http://localhost:3006
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret</pre>
    </div>
    
    <div class="section">
      <h2>4. Restart the development server</h2>
      <p>Use these commands to restart the development server correctly:</p>
      <pre>
# Navigate to the web app directory
cd D:\\Arxio\\arxio\\apps\\web

# Start the development server
pnpm dev</pre>
    </div>
    
    <div class="section">
      <h2>5. Test the authentication</h2>
      <p>Once the server is running, you can test the authentication with these users:</p>
      <ul>
        <li><strong>Test User:</strong> email: <code>test@example.com</code>, password: <code>Password123!</code></li>
        <li><strong>Admin User:</strong> email: <code>admin@example.com</code>, password: <code>Password123!</code></li>
        <li><strong>Admin User 2:</strong> email: <code>admin2@example.com</code>, password: <code>Password123!</code></li>
      </ul>
      
      <p>You can visit <a href="/auth/login" target="_blank">the login page</a> to try logging in with these credentials.</p>
    </div>
    
    <div class="success">
      <h3>Troubleshooting tools:</h3>
      <ul>
        <li><a href="/api/sync-auth-users" target="_blank">Sync Auth Users</a> - Synchronizes all Supabase Auth users to the users table</li>
        <li><a href="/api/create-test-user" target="_blank">Create Test User</a> - Creates a test user if it doesn't exist</li>
        <li><a href="/api/reset-browser" target="_blank">Reset Browser Cache</a> - Helps fix "browser is not defined" errors</li>
      </ul>
    </div>
    
    <a href="/auth/login" class="button">Go to Login Page</a>
  </div>
</body>
</html>
  `, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
} 