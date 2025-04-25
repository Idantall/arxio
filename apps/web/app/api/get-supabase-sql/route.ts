import { NextResponse } from 'next/server';

export async function GET() {
  const createUsersTableSQL = `
-- Create users table that references auth.users
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies for row access
CREATE POLICY "Users can view their own data" 
  ON public.users 
  FOR SELECT 
  USING (auth.uid() = id);
  
CREATE POLICY "Service roles can do anything" 
  ON public.users 
  USING (auth.role() = 'service_role');

-- Create a trigger to automatically insert a record in public.users when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)), 
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.created_at,
    NEW.created_at
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sync existing users
INSERT INTO public.users (id, email, username, created_at, updated_at)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'username', split_part(email, '@', 1)),
  created_at,
  created_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users);
  `;

  return new NextResponse(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Supabase SQL Setup</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    h1 { color: #3ECF8E; }
    pre {
      background-color: #f6f8fa;
      border-radius: 6px;
      padding: 16px;
      overflow: auto;
      font-size: 14px;
      line-height: 1.45;
    }
    code {
      font-family: SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
    }
    .instructions {
      background-color: #f0f7ff;
      border-left: 4px solid #3182ce;
      padding: 16px;
      margin-bottom: 16px;
      border-radius: 0 6px 6px 0;
    }
    .copy-btn {
      background-color: #3ECF8E;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      margin-bottom: 16px;
      font-weight: 500;
    }
    .copy-btn:hover {
      background-color: #2EBF7E;
    }
  </style>
</head>
<body>
  <h1>Supabase SQL Setup</h1>
  
  <div class="instructions">
    <h2>Instructions:</h2>
    <ol>
      <li>Go to your <a href="https://app.supabase.com" target="_blank">Supabase Dashboard</a></li>
      <li>Select your project</li>
      <li>Go to SQL Editor</li>
      <li>Create a "New Query"</li>
      <li>Copy the SQL below and paste it into the query editor</li>
      <li>Run the query</li>
    </ol>
  </div>
  
  <button class="copy-btn" onclick="copyToClipboard()">Copy SQL to Clipboard</button>
  
  <pre><code id="sql-code">${createUsersTableSQL}</code></pre>
  
  <script>
    function copyToClipboard() {
      const sqlCode = document.getElementById('sql-code');
      const range = document.createRange();
      range.selectNode(sqlCode);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
      document.execCommand('copy');
      window.getSelection().removeAllRanges();
      
      const btn = document.querySelector('.copy-btn');
      const originalText = btn.textContent;
      btn.textContent = 'Copied!';
      
      setTimeout(() => {
        btn.textContent = originalText;
      }, 2000);
    }
  </script>
</body>
</html>
  `, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
} 