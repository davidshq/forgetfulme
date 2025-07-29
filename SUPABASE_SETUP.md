# Supabase Setup for ForgetfulMe Extension

## Quick Setup

### 1. Copy the credentials template
```bash
cp supabase-credentials.template.js supabase-credentials.js
```

### 2. Get your Supabase credentials
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings → API
4. Copy your **Project URL** and **anon/public key**

### 3. Update supabase-credentials.js
Replace the placeholder values with your actual credentials:

```javascript
export const SUPABASE_CREDENTIALS = {
  url: 'https://your-actual-project-id.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
};
```

### 4. Load the extension
The extension will now use your credentials automatically.

## Configuration Priority

The extension checks for configuration in this order:

1. **Options page configuration** (highest priority)
   - Configure through the extension's Options page
   - Stored in Chrome sync storage
   - Takes precedence over everything else

2. **Local credentials file** (development fallback)
   - Uses `supabase-credentials.js` (not in source control)
   - Good for development when you don't want to configure via UI every time

3. **Configuration required screen**
   - Shows when no configuration is found
   - Prompts you to use the Options page

## Security Notes

- ✅ `supabase-credentials.js` is in `.gitignore` and will never be committed
- ✅ Only use the **anon/public key**, never the service role key
- ✅ The anon key is safe for client-side use with Row Level Security
- ✅ Options page configuration is stored securely in Chrome sync storage

## For Testing

The Node.js test script (`test-supabase-connection.js`) uses the `.env` file:

```bash
cp .env.example .env
# Edit .env with your credentials
node test-supabase-connection.js
```

## Troubleshooting

**Extension shows "Configuration required":**
- Make sure you copied the template file correctly
- Check that your credentials in `supabase-credentials.js` are valid
- Try configuring via the Options page instead

**"supabaseUrl is required" error:**
- Your credentials file might not be loading
- Check the browser console for import errors
- Verify the file is named exactly `supabase-credentials.js`