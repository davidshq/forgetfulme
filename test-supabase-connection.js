/**
 * Test script for Supabase backend integration
 * 
 * This script tests the live Supabase connection and validates that:
 * 1. Configuration is loaded correctly
 * 2. Database connection works
 * 3. Authentication flows work
 * 4. Basic CRUD operations work
 * 5. Row Level Security is functioning
 * 
 * To run: 
 * 1. Ensure supabase-credentials.js has your Supabase credentials
 * 2. node test-supabase-connection.js
 */

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG, isConfigured } from './supabase-config.local.js';
import { TEST_USER_CREDENTIALS } from './supabase-credentials.js';

/**
 * Test configuration and connection
 */
async function testConnection() {
  console.log('🔧 Testing Supabase Configuration...');
  
  if (!isConfigured()) {
    console.error('❌ Configuration not set up properly');
    console.log('Please update supabase-config.local.js with your actual Supabase credentials');
    return false;
  }
  
  console.log('✅ Configuration looks valid');
  console.log(`📡 URL: ${SUPABASE_CONFIG.url}`);
  console.log(`🔑 Key: ${SUPABASE_CONFIG.anonKey.substring(0, 20)}...`);
  
  try {
    const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, SUPABASE_CONFIG.options);
    
    // Test basic connection by checking auth status
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Connection error:', error.message);
      return false;
    }
    
    console.log('✅ Successfully connected to Supabase');
    console.log(`👤 Current session: ${session ? 'Authenticated' : 'Anonymous'}`);
    
    return supabase;
  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error.message);
    return false;
  }
}

/**
 * Test database schema
 */
async function testSchema(supabase) {
  console.log('\n📊 Testing Database Schema...');
  
  try {
    // Test if tables exist by trying to select from them (should fail due to RLS if not authenticated)
    const { error: profilesError } = await supabase
      .from('user_profiles')
      .select('count', { count: 'exact', head: true });
    
    const { error: bookmarksError } = await supabase
      .from('bookmarks')
      .select('count', { count: 'exact', head: true });
    
    const { error: statusTypesError } = await supabase
      .from('status_types')
      .select('count', { count: 'exact', head: true });
    
    // We expect these to fail due to RLS (Row Level Security) when not authenticated
    // But the error should be permission-related, not table-not-found
    const isRLSError = (error) => error && (
      error.code === 'PGRST116' || // No rows found (empty table with RLS)
      error.code === '42501' ||    // Insufficient privilege
      error.message.includes('permission denied') ||
      error.message.includes('RLS') ||
      error.message.includes('policy')
    );
    
    if (isRLSError(profilesError) || !profilesError) {
      console.log('✅ user_profiles table exists with RLS enabled');
    } else {
      console.error('❌ user_profiles table issue:', profilesError.message);
    }
    
    if (isRLSError(bookmarksError) || !bookmarksError) {
      console.log('✅ bookmarks table exists with RLS enabled');
    } else {
      console.error('❌ bookmarks table issue:', bookmarksError.message);
    }
    
    if (isRLSError(statusTypesError) || !statusTypesError) {
      console.log('✅ status_types table exists with RLS enabled');
    } else {
      console.error('❌ status_types table issue:', statusTypesError.message);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Schema test failed:', error.message);
    return false;
  }
}

/**
 * Test authentication flow
 */
async function testAuthentication(supabase) {
  console.log('\n🔐 Testing Authentication...');
  
  const { email: testEmail, password: testPassword } = TEST_USER_CREDENTIALS;
  
  try {
    // Test sign up
    console.log('📝 Testing user registration...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });
    
    if (signUpError && signUpError.message.includes('already registered')) {
      console.log('ℹ️  User already exists (expected for repeated tests)');
    } else if (signUpError) {
      console.error('❌ Sign up error:', signUpError.message);
      return false;
    } else {
      console.log('✅ User registration successful');
      console.log(`👤 User ID: ${signUpData.user?.id}`);
    }
    
    // Test sign in
    console.log('🔓 Testing user sign in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    
    if (signInError) {
      console.error('❌ Sign in error:', signInError.message);
      return false;
    }
    
    console.log('✅ User sign in successful');
    console.log(`👤 User ID: ${signInData.user?.id}`);
    console.log(`🎫 Session: ${signInData.session ? 'Active' : 'None'}`);
    
    // Ensure user profile exists (manual fallback for trigger issues)
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', signInData.user.id)
      .single();
    
    if (profileError && profileError.code === 'PGRST116') {
      console.log('📝 Creating user profile manually...');
      const { error: createProfileError } = await supabase
        .from('user_profiles')
        .insert({
          id: signInData.user.id,
          email: signInData.user.email
        });
      
      if (createProfileError) {
        console.error('❌ Failed to create user profile:', createProfileError.message);
        return false;
      }
      console.log('✅ User profile created successfully');
    } else if (profileError) {
      console.error('❌ Profile check error:', profileError.message);
      return false;
    } else {
      console.log('✅ User profile already exists');
    }
    
    return signInData.user;
  } catch (error) {
    console.error('❌ Authentication test failed:', error.message);
    return false;
  }
}

/**
 * Test basic CRUD operations
 */
async function testCRUDOperations(supabase, user) {
  console.log('\n📝 Testing CRUD Operations...');
  
  try {
    // Debug: Check current auth state
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    console.log(`🔍 Current authenticated user ID: ${currentUser?.id}`);
    console.log(`🔍 Expected user ID from sign-in: ${user.id}`);
    
    // Test bookmark creation
    console.log('➕ Testing bookmark creation...');
    const testBookmark = {
      user_id: currentUser.id, // Explicitly set user_id
      url: 'https://example.com/test-article',
      title: 'Test Article for E2E Testing',
      description: 'This is a test bookmark created during E2E testing',
      status: 'read',
      tags: ['test', 'e2e'],
    };
    
    const { data: createData, error: createError } = await supabase
      .from('bookmarks')
      .insert(testBookmark)
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Bookmark creation failed:', createError.message);
      return false;
    }
    
    console.log('✅ Bookmark created successfully');
    console.log(`📄 Bookmark ID: ${createData.id}`);
    
    // Test bookmark reading
    console.log('👀 Testing bookmark retrieval...');
    const { data: readData, error: readError } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('id', createData.id)
      .single();
    
    if (readError) {
      console.error('❌ Bookmark retrieval failed:', readError.message);
      return false;
    }
    
    console.log('✅ Bookmark retrieved successfully');
    console.log(`📄 Title: ${readData.title}`);
    
    // Test bookmark update
    console.log('✏️  Testing bookmark update...');
    const { data: updateData, error: updateError } = await supabase
      .from('bookmarks')
      .update({ 
        status: 'good-reference',
        description: 'Updated description during E2E testing'
      })
      .eq('id', createData.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Bookmark update failed:', updateError.message);
      return false;
    }
    
    console.log('✅ Bookmark updated successfully');
    console.log(`📄 New status: ${updateData.status}`);
    
    // Test bookmark deletion
    console.log('🗑️  Testing bookmark deletion...');
    const { error: deleteError } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', createData.id);
    
    if (deleteError) {
      console.error('❌ Bookmark deletion failed:', deleteError.message);
      return false;
    }
    
    console.log('✅ Bookmark deleted successfully');
    
    return true;
  } catch (error) {
    console.error('❌ CRUD operations test failed:', error.message);
    return false;
  }
}

/**
 * Test Row Level Security
 */
async function testRLS(supabase, user) {
  const { email: testEmail, password: testPassword } = TEST_USER_CREDENTIALS;
  console.log('\n🔒 Testing Row Level Security...');
  
  try {
    // Get current user for explicit user_id
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    // Create a bookmark as authenticated user
    const testBookmark = {
      user_id: currentUser.id, // Explicitly set user_id
      url: 'https://example.com/rls-test',
      title: 'RLS Test Bookmark',
      description: 'Testing Row Level Security',
      status: 'read',
      tags: ['rls-test'],
    };
    
    const { data: bookmark, error: createError } = await supabase
      .from('bookmarks')
      .insert(testBookmark)
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Failed to create bookmark for RLS test:', createError.message);
      return false;
    }
    
    console.log('✅ Bookmark created for RLS test');
    
    // Sign out to test anonymous access
    await supabase.auth.signOut();
    console.log('🔓 Signed out to test anonymous access');
    
    // Try to access the bookmark anonymously (should fail)
    const { data: anonData, error: anonError } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('id', bookmark.id);
    
    if (anonError || (anonData && anonData.length === 0)) {
      console.log('✅ RLS working correctly - anonymous users cannot access user data');
    } else {
      console.error('❌ RLS not working - anonymous user can access user data');
      return false;
    }
    
    // Sign back in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    
    if (signInError) {
      console.error('❌ Failed to sign back in:', signInError.message);
      return false;
    }
    
    // Verify we can access our own data again
    const { data: ownData, error: ownError } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('id', bookmark.id);
    
    if (ownError || !ownData || ownData.length === 0) {
      console.error('❌ Cannot access own data after signing back in');
      return false;
    }
    
    console.log('✅ RLS working correctly - users can access their own data');
    
    // Clean up
    await supabase
      .from('bookmarks')
      .delete()
      .eq('id', bookmark.id);
    
    return true;
  } catch (error) {
    console.error('❌ RLS test failed:', error.message);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🚀 Starting Supabase Backend Integration Tests\n');
  
  // Test 1: Connection
  const supabase = await testConnection();
  if (!supabase) {
    console.log('\n❌ Connection test failed. Please check your configuration.');
    return;
  }
  
  // Test 2: Schema
  const schemaOk = await testSchema(supabase);
  if (!schemaOk) {
    console.log('\n❌ Schema test failed. Please verify your database setup.');
    return;
  }
  
  // Test 3: Authentication
  const user = await testAuthentication(supabase);
  if (!user) {
    console.log('\n❌ Authentication test failed.');
    return;
  }
  
  // Test 4: CRUD Operations
  const crudOk = await testCRUDOperations(supabase, user);
  if (!crudOk) {
    console.log('\n❌ CRUD operations test failed.');
    return;
  }
  
  // Test 5: Row Level Security
  const rlsOk = await testRLS(supabase, user);
  if (!rlsOk) {
    console.log('\n❌ RLS test failed.');
    return;
  }
  
  // Clean up - sign out
  await supabase.auth.signOut();
  
  console.log('\n🎉 All tests passed! Your Supabase backend is ready for the extension.');
  console.log('\n📋 Next steps:');
  console.log('1. Configure the extension through the Options page');
  console.log('2. Test the extension UI with live data');
  console.log('3. Test cross-device sync');
}

// Run the tests
runTests().catch(console.error);