import { supabaseAdmin } from './supabase';

/**
 * Synchronizes the authenticated user with the users table
 * This can be called after successful authentication to ensure user data is in sync
 */
export async function syncAuthUser(userId: string, userData: {
  email: string;
  username?: string;
  avatarUrl?: string;
}) {
  try {
    // Check if the user exists in the users table
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();
    
    // If the user doesn't exist or there was an error, try to create them
    if (error || !data) {
      // First check if the users table exists
      const { error: tableCheckError } = await supabaseAdmin
        .from('users')
        .select('id')
        .limit(1);
      
      // If the users table doesn't exist, create it
      if (tableCheckError && tableCheckError.message.includes('relation "users" does not exist')) {
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
          
          -- Create policies for row access
          CREATE POLICY "Users can view their own data" 
            ON public.users 
            FOR SELECT 
            USING (auth.uid() = id);
            
          CREATE POLICY "Service roles can do anything" 
            ON public.users 
            USING (auth.role() = 'service_role');
        `;
        
        await supabaseAdmin.rpc('pgql', { query: createTableSQL });
      }
      
      // Insert the user into the users table
      const { error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: userId,
          email: userData.email,
          username: userData.username || userData.email.split('@')[0],
          avatar_url: userData.avatarUrl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('Error inserting user into users table:', insertError);
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error syncing user with users table:', error);
    return { success: false, error };
  }
} 