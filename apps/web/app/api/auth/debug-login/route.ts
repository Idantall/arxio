import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { compare } from 'bcryptjs';

// For debugging purposes only - this file should be removed in production
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;
    
    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    console.log(`Attempting to debug login for: ${email}`);
    
    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sahiuqlyojjjvijzbfqt.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhaGl1cWx5b2pqanZpanpiZnF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNzM5NDEsImV4cCI6MjA2MDg0OTk0MX0.4i0Av6P-Ol8R-Zs9xIJtlhrEnsH_CsubbgcWNLfGTZM';
    
    console.log('Using Supabase URL:', supabaseUrl);
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Step 1: Try direct Supabase auth login
    try {
      console.log('Attempting direct Supabase auth login...');
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (authError) {
        console.log('Direct Supabase auth login failed:', authError.message);
      } else {
        console.log('Direct Supabase auth login successful!');
        console.log('User ID from Supabase auth:', authData.user?.id);
      }
    } catch (directAuthError) {
      console.error('Error in direct auth attempt:', directAuthError);
    }
    
    // Step 2: Check if user exists in users table
    try {
      console.log('Checking users table...');
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .limit(1);
      
      if (userError) {
        console.error('Error querying users table:', userError.message);
      } else if (!users || users.length === 0) {
        console.log('No user found in users table with this email');
      } else {
        console.log('User found in users table:', users[0].id);
        
        // Check if password field exists and has a value
        const userPassword = users[0].password;
        if (!userPassword) {
          console.log('User has no password in users table');
        } else {
          console.log('Password field exists for user');
          
          // Try to verify password (this is the part that might cause the Illegal arguments error)
          try {
            console.log('Attempting to verify password...');
            // Log the types of arguments being passed to compare
            console.log('Password type:', typeof password);
            console.log('Stored password type:', typeof userPassword);
            
            if (userPassword === null || userPassword === undefined) {
              console.error('CRITICAL ERROR: Stored password is null or undefined');
            } else {
              const isMatch = await compare(password, userPassword);
              console.log('Password verification result:', isMatch);
            }
          } catch (verifyError) {
            console.error('Error during password verification:', verifyError);
          }
        }
      }
    } catch (userCheckError) {
      console.error('Error checking user in database:', userCheckError);
    }
    
    return NextResponse.json({ 
      message: 'Debug login process completed. Check server logs for details.' 
    });
    
  } catch (error) {
    console.error('Debug login endpoint error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 