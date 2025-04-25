import { NextResponse } from 'next/server';
import { supabaseAdmin, signUp, signIn } from '../../../lib/supabase';

export async function GET() {
  try {
    // Generate a unique test email
    const timestamp = new Date().getTime();
    const testEmail = `test.user.${timestamp}@example.com`;
    const testPassword = 'Password123!';
    const testUsername = `TestUser${timestamp}`;
    
    const results = {
      userTableCheck: null,
      registration: null,
      login: null,
      userRecord: null
    };
    
    // 1. Check if users table exists and create it if it doesn't
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('count', { count: 'exact', head: true });
      
      if (error && error.message.includes('relation "users" does not exist')) {
        // Create the users table
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
        
        const { error: createError } = await supabaseAdmin.rpc('pgql', { query: createTableSQL });
        
        if (createError) {
          results.userTableCheck = {
            success: false,
            message: 'Failed to create users table',
            error: createError.message
          };
        } else {
          results.userTableCheck = {
            success: true,
            message: 'Users table created successfully'
          };
        }
      } else if (error) {
        results.userTableCheck = {
          success: false,
          message: 'Error checking users table',
          error: error.message
        };
      } else {
        results.userTableCheck = {
          success: true,
          message: 'Users table exists',
          count: data.count
        };
      }
    } catch (e) {
      results.userTableCheck = {
        success: false,
        message: 'Unexpected error checking users table',
        error: e instanceof Error ? e.message : String(e)
      };
    }
    
    // 2. Test user registration
    try {
      const registrationResult = await signUp(testEmail, testPassword, {
        username: testUsername
      });
      
      results.registration = {
        success: true,
        message: 'User registered successfully',
        userId: registrationResult?.user?.id,
        email: registrationResult?.user?.email
      };
    } catch (e) {
      results.registration = {
        success: false,
        message: 'Registration failed',
        error: e instanceof Error ? e.message : String(e)
      };
      
      // If registration failed, return early
      return NextResponse.json({
        success: false,
        message: 'Auth flow testing failed at registration step',
        results
      });
    }
    
    // 3. Test user login
    try {
      const loginResult = await signIn(testEmail, testPassword);
      
      results.login = {
        success: true,
        message: 'User logged in successfully',
        userId: loginResult?.user?.id,
        email: loginResult?.user?.email,
        hasSession: !!loginResult?.session
      };
    } catch (e) {
      results.login = {
        success: false,
        message: 'Login failed',
        error: e instanceof Error ? e.message : String(e)
      };
    }
    
    // 4. Check if user was added to the users table
    try {
      // Wait a brief moment for the database to update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', testEmail)
        .single();
      
      if (error) {
        // If user isn't in the table, try to add them manually
        if (error.message.includes('No rows found') && results.registration.userId) {
          const { error: insertError } = await supabaseAdmin
            .from('users')
            .insert({
              id: results.registration.userId,
              email: testEmail,
              username: testUsername,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          
          if (insertError) {
            results.userRecord = {
              success: false,
              message: 'Failed to manually insert user into users table',
              error: insertError.message
            };
          } else {
            results.userRecord = {
              success: true,
              message: 'User manually inserted into users table',
              userId: results.registration.userId,
              email: testEmail
            };
          }
        } else {
          results.userRecord = {
            success: false,
            message: 'Error checking for user in users table',
            error: error.message
          };
        }
      } else {
        results.userRecord = {
          success: true,
          message: 'User found in users table',
          user: data
        };
      }
    } catch (e) {
      results.userRecord = {
        success: false,
        message: 'Unexpected error checking user record',
        error: e instanceof Error ? e.message : String(e)
      };
    }
    
    // Determine overall success
    const overallSuccess = 
      results.userTableCheck?.success && 
      results.registration?.success &&
      results.login?.success;
    
    return NextResponse.json({
      success: overallSuccess,
      message: overallSuccess 
        ? 'Authentication flow test completed successfully' 
        : 'Authentication flow test had issues',
      testUser: {
        email: testEmail,
        password: testPassword,
        username: testUsername
      },
      results
    });
  } catch (error) {
    console.error('Error testing auth flow:', error);
    return NextResponse.json({
      success: false,
      message: 'Error testing auth flow',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 