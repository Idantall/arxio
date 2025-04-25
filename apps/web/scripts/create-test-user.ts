import { createClient } from '@supabase/supabase-js';
import { hashSync } from 'bcryptjs';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Test user credentials (customize as needed)
const TEST_USER = {
  email: 'test@example.com',
  password: 'Password123!',
  username: 'testuser'
};

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase credentials in environment variables');
  console.log('Required variables:');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set ✓' : 'Missing ✗');
  console.log('SUPABASE_SERVICE_KEY:', supabaseServiceKey ? 'Set ✓' : 'Missing ✗');
  process.exit(1);
}

// Create Supabase admin client with full access
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUser() {
  console.log('Creating test user...');
  
  try {
    // Hash the password before storing
    const hashedPassword = hashSync(TEST_USER.password, 10);
    
    // First check if the user already exists
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', TEST_USER.email)
      .single();
    
    if (checkError && !checkError.message.includes('No rows found')) {
      console.error('Error checking existing user:', checkError);
      process.exit(1);
    }
    
    if (existingUser) {
      console.log(`User with email ${TEST_USER.email} already exists with ID: ${existingUser.id}`);
      console.log('Login credentials:');
      console.log(`- Email: ${TEST_USER.email}`);
      console.log(`- Password: ${TEST_USER.password}`);
      return;
    }
    
    // Create user in the users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        email: TEST_USER.email,
        username: TEST_USER.username,
        password: hashedPassword,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (userError) {
      console.error('Error creating user in the users table:', userError);
      
      // If the users table doesn't exist, provide guidance
      if (userError.message.includes('relation') && userError.message.includes('does not exist')) {
        console.log('\nIt seems the "users" table doesn\'t exist. You might need to:');
        console.log('1. Create the users table in your Supabase dashboard with the following columns:');
        console.log('   - id (uuid, primary key)');
        console.log('   - email (text, unique)');
        console.log('   - username (text)');
        console.log('   - password (text)');
        console.log('   - created_at (timestamp with time zone)');
        console.log('   - updated_at (timestamp with time zone)');
        console.log('2. Or, modify this script to match your existing table structure');
      }
      
      process.exit(1);
    }
    
    console.log('✅ Test user created successfully!');
    console.log('User details:');
    console.log(`- ID: ${userData.id}`);
    console.log(`- Email: ${TEST_USER.email}`);
    console.log(`- Username: ${TEST_USER.username}`);
    console.log(`- Password: ${TEST_USER.password} (unhashed version for your login)`);
    
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

createTestUser(); 