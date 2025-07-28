# Supabase Setup Guide for ForgetfulMe Extension

This guide will help you set up a Supabase backend for the ForgetfulMe browser extension with enhanced security and configuration options.

## Prerequisites

- A Supabase account (free at [supabase.com](https://supabase.com))
- Basic understanding of database concepts
- Node.js 18+ (for development and testing)

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
- Enhanced error handling and validation

## Step 5: Configure Row Level Security (RLS)

The schema automatically sets up RLS policies, but verify they're enabled:

1. **Go to Authentication** → **Policies** in your Supabase dashboard
2. **Ensure RLS is enabled** for all tables
3. **Verify policies exist** for:
   - Users can only access their own bookmarks
   - Users can only insert their own data
   - Users can only update/delete their own data
   - Proper validation and error handling

## Step 6: Configure Your Extension

### Method 1: Extension Settings (Recommended for Users)

1. **Load the extension** in Chrome
2. **Open the options page** (click extension icon → Settings)
3. **Go to Supabase Configuration** section
4. **Enter your credentials**:
   - Project URL: `https://your-project-id.supabase.co`
   - Anon Key: Your anon public key
5. **Save the configuration**
6. **Test the connection** using the built-in test feature

### Method 2: Local Development

1. **Copy the template file**:
   ```bash
   cp supabase-config.template.js supabase-config.local.js
   ```
2. **Edit `supabase-config.local.js`** with your credentials:
   ```javascript
   this.supabaseUrl = 'https://your-project-id.supabase.co'
   this.supabaseAnonKey = 'your-anon-public-key-here'
   ```
3. **Update HTML files** to include the local config:
   ```html
   <script src="supabase-config.local.js"></script>
   <!-- Comment out or remove the original supabase-config.js -->
   <!-- <script src="supabase-config.js"></script> -->
   ```

### Method 3: Environment Variables (For Advanced Users)

Set environment variables in your development environment:
```bash
export SUPABASE_URL="https://your-project-id.supabase.co"
export SUPABASE_ANON_KEY="your-anon-public-key-here"
```

## Step 7: Test Your Setup

### Manual Testing

1. **Open the extension popup**
2. **Create an account** or sign in
3. **Try marking a page as read**
4. **Check the Supabase dashboard** to see the data

### Automated Testing

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Run unit tests**:
   ```bash
   npm test
   ```
3. **Run integration tests**:
   ```bash
   npm run test:playwright
   ```
4. **Check code quality**:
   ```bash
   npm run check
   ```

## Enhanced Security Features

### Row Level Security (RLS)
- **User isolation**: Each user can only access their own data
- **Automatic filtering**: Queries are automatically filtered by user ID
- **Policy enforcement**: Database-level security prevents unauthorized access

### Authentication Security
- **JWT tokens**: Secure session management
- **Token refresh**: Automatic token renewal
- **Session validation**: Proper session state management

### Data Protection
- **Encrypted transmission**: All data transmitted over HTTPS
- **Secure storage**: Credentials stored in Chrome sync storage
- **Input validation**: Comprehensive input sanitization
- **Error handling**: Secure error messages without data leakage

### CSP Compliance
- **Self-contained**: No external scripts loaded
- **Inline policies**: All functionality contained within extension
- **Secure defaults**: Content Security Policy compliant by design

## Troubleshooting

### Common Issues

**"Invalid response" error with email verification**
- **Solution**: Disable email confirmation in Supabase Auth settings
- **Alternative**: Configure custom email templates with proper redirect URLs

**"Row Level Security" errors**
- **Solution**: Ensure RLS policies are properly set up in the database schema
- **Check**: Verify policies exist for all tables and operations

**"Network error" or "Connection failed"**
- **Solution**: Check your Project URL and anon key are correct
- **Alternative**: Verify your Supabase project is active and not paused
- **Debug**: Use the built-in connection test in the extension settings

**"User not authenticated" errors**
- **Solution**: Sign in through the extension's authentication interface
- **Alternative**: Check if the user account was created successfully
- **Debug**: Check browser console for detailed error messages

**"Configuration validation failed"**
- **Solution**: Ensure URL format is correct (https://project-id.supabase.co)
- **Alternative**: Verify anon key format (starts with eyJ...)
- **Debug**: Use the configuration test feature

### Email Verification Issues

Browser extensions cannot handle email verification links properly because:
- Chrome blocks `chrome-extension://` URLs in email links
- Extension popups cannot open external verification pages
- Email clients often block extension URLs for security

**Recommended solutions**:
1. **Disable email confirmation** (easiest and most secure)
2. **Use custom email templates** with web redirects
3. **Implement manual verification** through the extension UI

### Testing Issues

**Unit test failures**
- **Solution**: Ensure all dependencies are installed (`npm install`)
- **Debug**: Run tests with verbose output (`npm test -- --reporter=verbose`)

**Integration test failures**
- **Solution**: Install Playwright browsers (`npm run install-browsers`)
- **Debug**: Run tests in headed mode (`npm run test:playwright:headed`)

## Security Best Practices

### Credential Management
1. **Never commit credentials** to version control
2. **Use the anon key only** (never the service role key)
3. **Store credentials securely** in Chrome sync storage
4. **Validate configuration** before saving

### Database Security
1. **Enable RLS** on all tables
2. **Review policies regularly** for proper access control
3. **Monitor database access** in Supabase dashboard
4. **Use prepared statements** (handled automatically by Supabase)

### Extension Security
1. **Follow CSP guidelines** - no external scripts
2. **Validate all inputs** before processing
3. **Handle errors securely** - no sensitive data in error messages
4. **Regular security audits** of the codebase

### Development Security
1. **Use separate Supabase projects** for development and production
2. **Never share service role keys** in code or documentation
3. **Test security features** thoroughly
4. **Keep dependencies updated** regularly

## Cost Considerations

Supabase's free tier includes:
- 500MB database
- 50,000 monthly active users
- 2GB bandwidth
- 1GB file storage

This should be sufficient for most users. Monitor your usage in the Supabase dashboard.

### Monitoring Usage
1. **Check Supabase dashboard** regularly for usage metrics
2. **Monitor database size** and query performance
3. **Track bandwidth usage** for API calls
4. **Set up alerts** for approaching limits

## Development Workflow

### Local Development
1. **Set up development environment** with Node.js 18+
2. **Install dependencies**: `npm install`
3. **Configure Supabase** using local development method
4. **Run tests**: `npm test && npm run test:playwright`
5. **Check code quality**: `npm run check`

### Testing Strategy
1. **Unit tests**: Test individual utility modules
2. **Integration tests**: Test end-to-end workflows
3. **Manual testing**: Test in actual browser environment
4. **Security testing**: Verify all security features work correctly

### Deployment Preparation
1. **Run all tests** successfully
2. **Check code quality** passes
3. **Verify security features** work correctly
4. **Test in multiple browsers**
5. **Update version** in manifest.json

## Next Steps

Once your Supabase backend is configured:

1. **Test the extension** thoroughly using the testing suite
2. **Monitor the dashboard** for any issues
3. **Set up backups** if needed
4. **Consider upgrading** if you exceed free tier limits
5. **Contribute improvements** to the project

## Support

If you encounter issues:

1. **Check the Supabase documentation** at [supabase.com/docs](https://supabase.com/docs)
2. **Review the extension logs** in Chrome DevTools
3. **Check the Supabase dashboard** for errors
4. **Run the test suite** to identify issues
5. **Check the testing documentation** in `tests/README.md`
6. **Contact support** if needed

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Chrome Extension Development](https://developer.chrome.com/docs/extensions/)
- [Testing Documentation](./tests/README.md)
- [Architecture Documentation](./docs/architecture/)
- [Code Quality Setup](./docs/CODE_QUALITY_SETUP.md)

---

Your Supabase backend is now ready to power the ForgetfulMe extension! 🎉 