# Supabase Setup Guide for ForgetfulMe Extension

This guide will help you set up a Supabase backend for the ForgetfulMe browser extension.

## Prerequisites

- A Supabase account (free at [supabase.com](https://supabase.com))
- Basic understanding of database concepts

## Step 1: Create a Supabase Project

1. **Sign up/Login** to [supabase.com](https://supabase.com)
2. **Create a new project**:
   - Click "New Project"
   - Choose your organization
   - Enter a project name (e.g., "forgetfulme")
   - Enter a database password (save this securely)
   - Choose a region close to your users
   - Click "Create new project"

3. **Wait for setup** (usually 1-2 minutes)

## Step 2: Get Your Project Credentials

1. **Go to Settings** → **API** in your Supabase dashboard
2. **Copy the following values**:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **Anon public key**: The `anon` key (starts with `eyJ...`)

⚠️ **Important**: Never share your service role key publicly. Only use the anon key in the extension.

## Step 3: Configure Email Verification (Important for Browser Extensions)

Browser extensions have limitations with email verification links. Configure your Supabase project to handle this properly:

### Option A: Disable Email Confirmation (Recommended for Extensions)

1. **Go to Authentication** → **Settings** in your Supabase dashboard
2. **Under "User Registration"**, set:
   - **Enable email confirmations**: `OFF`
   - **Enable phone confirmations**: `OFF`
3. **Save changes**

This allows users to sign up and use the extension immediately without email verification.

### Option B: Configure Custom Email Templates

If you want to keep email verification:

1. **Go to Authentication** → **Email Templates** in your Supabase dashboard
2. **Edit the "Confirm signup" template**:
   - Replace the redirect URL with a web page that can handle the verification
   - Or use a custom domain for your Supabase project

## Step 4: Set Up Database Schema

1. **Go to SQL Editor** in your Supabase dashboard
2. **Create a new query** and paste the schema from `supabase-schema.sql`
3. **Run the query** to create all tables, indexes, and policies

The schema includes:
- `bookmarks` table for storing user bookmarks
- `user_profiles` table for user preferences
- `tags` table for organizing bookmarks
- Row Level Security (RLS) policies for data protection
- Indexes for optimal performance

## Step 5: Configure Row Level Security (RLS)

The schema automatically sets up RLS policies, but verify they're enabled:

1. **Go to Authentication** → **Policies** in your Supabase dashboard
2. **Ensure RLS is enabled** for all tables
3. **Verify policies exist** for:
   - Users can only access their own bookmarks
   - Users can only insert their own data
   - Users can only update/delete their own data

## Step 6: Configure Your Extension

### Method 1: Extension Settings (Recommended)

1. **Load the extension** in Chrome
2. **Open the options page** (click extension icon → Settings)
3. **Go to Supabase Configuration** section
4. **Enter your credentials**:
   - Project URL: `https://your-project-id.supabase.co`
   - Anon Key: Your anon public key
5. **Save the configuration**

### Method 2: Local Development

1. **Copy the template file**:
   ```bash
   cp supabase-config.template.js supabase-config.local.js
   ```
2. **Edit `supabase-config.local.js`** with your credentials
3. **Update HTML files** to include the local config

## Step 7: Test Your Setup

1. **Open the extension popup**
2. **Create an account** or sign in
3. **Try marking a page as read**
4. **Check the Supabase dashboard** to see the data

## Troubleshooting

### Common Issues

**"Invalid response" error with email verification**
- **Solution**: Disable email confirmation in Supabase Auth settings
- **Alternative**: Configure custom email templates with proper redirect URLs

**"Row Level Security" errors**
- **Solution**: Ensure RLS policies are properly set up in the database schema

**"Network error" or "Connection failed"**
- **Solution**: Check your Project URL and anon key are correct
- **Alternative**: Verify your Supabase project is active and not paused

**"User not authenticated" errors**
- **Solution**: Sign in through the extension's authentication interface
- **Alternative**: Check if the user account was created successfully

### Email Verification Issues

Browser extensions cannot handle email verification links properly because:
- Chrome blocks `chrome-extension://` URLs in email links
- Extension popups cannot open external verification pages
- Email clients often block extension URLs for security

**Recommended solutions**:
1. **Disable email confirmation** (easiest)
2. **Use custom email templates** with web redirects
3. **Implement manual verification** through the extension UI

## Security Best Practices

1. **Never commit credentials** to version control
2. **Use the anon key only** (never the service role key)
3. **Enable RLS** on all tables
4. **Regularly review** your Supabase project settings
5. **Monitor usage** in the Supabase dashboard

## Cost Considerations

Supabase's free tier includes:
- 500MB database
- 50,000 monthly active users
- 2GB bandwidth
- 1GB file storage

This should be sufficient for most users. Monitor your usage in the Supabase dashboard.

## Next Steps

Once your Supabase backend is configured:

1. **Test the extension** thoroughly
2. **Monitor the dashboard** for any issues
3. **Set up backups** if needed
4. **Consider upgrading** if you exceed free tier limits

## Support

If you encounter issues:

1. **Check the Supabase documentation** at [supabase.com/docs](https://supabase.com/docs)
2. **Review the extension logs** in Chrome DevTools
3. **Check the Supabase dashboard** for errors
4. **Contact support** if needed

---

Your Supabase backend is now ready to power the ForgetfulMe extension! 🎉 