// Debug script to test Supabase connection
// Run this with: node debug-supabase.js

const { createClient } = require('@supabase/supabase-js');

// Your Supabase configuration from .env.local
const supabaseUrl = 'https://twdhuyoopojivqpozjzt.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3ZGh1eW9vcG9qaXZxcG96anp0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkxMTMwNywiZXhwIjoyMDc2NDg3MzA3fQ.NYvSfGY959moT82kAkB43O437X7iPjfdiSO--aEpH0E';

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Test 1: Check if we can connect to Supabase
    console.log('1. Testing basic connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ Connection failed:', connectionError.message);
      return;
    }
    console.log('✅ Connection successful!');
    
    // Test 2: Check if users table exists and is accessible
    console.log('2. Testing users table access...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    if (usersError) {
      console.error('❌ Users table access failed:', usersError.message);
      return;
    }
    console.log('✅ Users table accessible!');
    console.log('📊 Current users in database:', users.length);
    
    // Test 3: Try to insert a test user (will be deleted immediately)
    console.log('3. Testing user insertion...');
    const testUser = {
      clerk_id: 'test_user_debug_' + Date.now(),
      email: 'debug@test.com',
      first_name: 'Debug',
      last_name: 'User',
      image_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert(testUser)
      .select();
    
    if (insertError) {
      console.error('❌ User insertion failed:', insertError.message);
      return;
    }
    console.log('✅ User insertion successful!');
    console.log('📝 Inserted user:', insertData[0]);
    
    // Test 4: Delete the test user
    console.log('4. Testing user deletion...');
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('clerk_id', testUser.clerk_id);
    
    if (deleteError) {
      console.error('❌ User deletion failed:', deleteError.message);
      return;
    }
    console.log('✅ User deletion successful!');
    
    console.log('');
    console.log('🎉 All Supabase tests passed! Your database is properly configured.');
    console.log('💡 If webhooks are still not working, check:');
    console.log('   - Webhook URL is correct in Clerk dashboard');
    console.log('   - Webhook secret matches your .env.local');
    console.log('   - Your app is deployed and accessible');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testSupabaseConnection();
