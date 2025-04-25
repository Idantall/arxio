import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase';

export async function GET() {
  try {
    // 1. Get all users from the auth.users table
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch auth users',
        error: authError.message
      }, { status: 500 });
    }
    
    if (!authUsers || !authUsers.users || authUsers.users.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No auth users found',
        users: []
      });
    }
    
    // 2. Get all users from our public.users table
    const { data: existingUsers, error: existingError } = await supabaseAdmin
      .from('users')
      .select('id');
    
    // If there's an error and it's not a "relation does not exist" error, return the error
    if (existingError && !existingError.message.includes('relation "users" does not exist')) {
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch existing users',
        error: existingError.message
      }, { status: 500 });
    }
    
    // If the users table doesn't exist, create it
    if (existingError && existingError.message.includes('relation "users" does not exist')) {
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
      
      const { error: createError } = await supabaseAdmin.rpc('pgql', { query: createTableSQL });
      
      if (createError) {
        return NextResponse.json({
          success: false,
          message: 'Failed to create users table',
          error: createError.message,
          sql: createTableSQL
        }, { status: 500 });
      }
    }
    
    // 3. Create a map of existing user IDs for quick lookup
    const existingUserIds = new Set((existingUsers || []).map(u => u.id));
    
    // 4. Find users that need to be inserted into our public.users table
    const usersToInsert = authUsers.users
      .filter(user => !existingUserIds.has(user.id))
      .map(user => ({
        id: user.id,
        email: user.email || '',
        username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
        avatar_url: user.user_metadata?.avatar_url || null,
        created_at: new Date(user.created_at).toISOString(),
        updated_at: new Date().toISOString()
      }));
    
    if (usersToInsert.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All auth users are already in the users table',
        insertedUsers: 0,
        totalAuthUsers: authUsers.users.length,
        totalExistingUsers: existingUserIds.size
      });
    }
    
    // 5. Insert the missing users
    const { error: insertError } = await supabaseAdmin
      .from('users')
      .insert(usersToInsert);
    
    if (insertError) {
      return NextResponse.json({
        success: false,
        message: 'Failed to insert users',
        error: insertError.message
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: `Successfully synced ${usersToInsert.length} users`,
      insertedUsers: usersToInsert.length,
      totalAuthUsers: authUsers.users.length,
      totalExistingUsers: existingUserIds.size,
      usersToInsert: usersToInsert.slice(0, 3) // Just show the first 3 for brevity
    });
  } catch (error) {
    console.error('Error syncing auth users:', error);
    return NextResponse.json({
      success: false,
      message: 'Error syncing auth users',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 