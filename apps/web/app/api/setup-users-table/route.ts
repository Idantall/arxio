import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase';

export async function GET() {
  try {
    // Check if users table exists
    const { data: tableExists, error: tableCheckError } = await supabaseAdmin
      .from('users')
      .select('count', { count: 'exact', head: true })
      .limit(1);
    
    // If table exists, return the count
    if (!tableCheckError) {
      const { count: userCount, error: countError } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact' });
      
      // Get 3 sample users to display
      const { data: sampleUsers, error: sampleError } = await supabaseAdmin
        .from('users')
        .select('*')
        .limit(3);

      return NextResponse.json({
        success: true,
        message: 'Users table exists',
        tableExists: true,
        userCount,
        sampleUsers: sampleUsers || []
      });
    }
    
    // If we got here, the table doesn't exist - try to create it
    const { error: createTableError } = await supabaseAdmin.rpc('create_users_table');
    
    if (createTableError) {
      // If the RPC function doesn't exist, let's try to create the table via SQL
      const createTableSQL = `
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
        
        -- Create policies
        CREATE POLICY "Users can view their own data" 
          ON public.users
          FOR SELECT 
          USING (auth.uid() = id);
          
        CREATE POLICY "Service roles can do anything" 
          ON public.users
          USING (auth.role() = 'service_role');
      `;
      
      const { error: sqlError } = await supabaseAdmin.rpc('pgql', { query: createTableSQL });
      
      if (sqlError) {
        // If we still can't create the table, return instructions for manual creation
        return NextResponse.json({
          success: false,
          message: 'Failed to create users table',
          error: sqlError.message,
          manualInstructions: {
            steps: [
              "1. Go to Supabase dashboard: https://app.supabase.com/",
              "2. Select your project",
              "3. Go to SQL Editor",
              "4. Create a new query and paste the SQL below",
              "5. Run the query"
            ],
            sql: createTableSQL
          }
        }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        message: 'Users table created successfully',
        tableExists: true,
        userCount: 0,
        sampleUsers: []
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Users table created successfully via RPC',
      tableExists: true,
      userCount: 0,
      sampleUsers: []
    });
  } catch (error) {
    console.error('Error checking/creating users table:', error);
    return NextResponse.json({
      success: false,
      message: 'Error checking/creating users table',
      error: error instanceof Error ? error.message : String(error),
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY
    }, { status: 500 });
  }
} 