import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // The service key has full admin rights

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase credentials in environment variables');
  console.log('Required variables:');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set ✓' : 'Missing ✗');
  console.log('SUPABASE_SERVICE_KEY:', supabaseServiceKey ? 'Set ✓' : 'Missing ✗');
  process.exit(1);
}

// Create Supabase admin client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkConnection() {
  console.log('Attempting to connect to Supabase...');
  
  try {
    // Test query to check connection
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Error connecting to Supabase:', error.message);
      
      // Check if the error might be related to the table not existing
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('\nIt seems the "users" table doesn\'t exist. You might need to:');
        console.log('1. Create the users table in your Supabase dashboard');
        console.log('2. Or, check if your table has a different name');
      }
      
      process.exit(1);
    }
    
    console.log('✅ Successfully connected to Supabase!');
    console.log('Data returned:', data);
    
    // List available tables
    const { data: tableData, error: tableError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tableError) {
      console.error('Error fetching tables:', tableError.message);
    } else {
      console.log('\nAvailable tables:');
      tableData.forEach((table) => {
        console.log(`- ${table.table_name}`);
      });
    }
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

checkConnection(); 