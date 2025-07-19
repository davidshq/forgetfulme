# ForgetfulMe Chrome Extension

A cross-browser extension that helps you mark websites as "read" for research purposes. Perfect for researchers, students, and anyone who needs to track which pages they've visited and categorize them.

## Features

### Core Functionality
- **Mark pages as read** with customizable status types
- **Add tags** to organize your entries
- **Keyboard shortcuts** for quick marking (Ctrl+Shift+R)
- **Cross-browser sync** using Supabase backend
- **Real-time synchronization** across all devices
- **Unlimited storage** for hundreds of thousands of entries

### Customizable Status Types
- Default types: "Read", "Good Reference", "Low Value", "Revisit Later"
- **Fully customizable** - add your own status types
- User-defined tags for better organization

### User Interface
- **Clean popup interface** for quick marking
- **Settings page** for customization and data management
- **Recent entries view** to see your latest marks
- **Statistics** to track your usage
- **Authentication system** for secure data access

### Data Management
- **Export/Import** functionality for data backup
- **Cross-device sync** through Supabase
- **Data statistics** and usage insights
- **Secure user accounts** with email/password

## Installation

### Prerequisites

Before using the extension, you need to set up a Supabase backend:

1. **Create a Supabase account** at [supabase.com](https://supabase.com)
2. **Follow the setup guide** in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
3. **Configure your extension** with your Supabase credentials

### For Development

1. **Clone or download** this repository
2. **Set up Supabase** following the setup guide
3. **Configure your extension** with your credentials (see Configuration section below)
4. **Open Chrome** and navigate to `chrome://extensions/`
5. **Enable Developer mode** (toggle in top right)
6. **Click "Load unpacked"** and select the extension directory
7. **Pin the extension** to your toolbar for easy access

### For Users (Future Chrome Web Store Release)

1. Install from Chrome Web Store (coming soon)
2. Create an account or sign in
3. Start marking pages as read!

## Configuration

### Secure Configuration Management

The extension uses a secure configuration system that prevents sensitive credentials from being committed to version control:

#### Option 1: Extension Settings (Recommended for Users)
1. **Load the extension** in Chrome
2. **Open the options page** (click the extension icon → Settings)
3. **Go to Supabase Configuration** section
4. **Enter your Project URL and anon public key**
5. **Save the configuration**

#### Option 2: Local Development (For Developers)
1. **Copy the template file**:
   ```bash
   cp supabase-config.template.js supabase-config.local.js
   ```
2. **Edit `supabase-config.local.js`** with your credentials:
   ```javascript
   this.supabaseUrl = 'https://your-project.supabase.co'
   this.supabaseAnonKey = 'your-anon-public-key-here'
   ```
3. **Update HTML files** to include the local config:
   ```html
   <script src="supabase-config.local.js"></script>
   <!-- Comment out or remove the original supabase-config.js -->
   <!-- <script src="supabase-config.js"></script> -->
   ```

#### Option 3: Environment Variables (For Advanced Users)
Set environment variables in your development environment:
```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-public-key-here"
```

### Technical Notes

- **Local Supabase Client**: The extension includes a custom Supabase client (`supabase-client.js`) that works within Chrome's Content Security Policy restrictions
- **No External Dependencies**: All Supabase functionality is implemented using native fetch API
- **CSP Compliant**: No external CDN scripts are loaded, ensuring compatibility with Chrome extension security policies

### Security Notes

- ✅ **Credentials are stored securely** in Chrome's sync storage
- ✅ **No sensitive data is committed** to version control
- ✅ **Configuration is validated** before saving
- ✅ **Connection is tested** after configuration
- ✅ **CSP compliant** - no external scripts loaded
- ⚠️ **Never commit** `supabase-config.local.js` or `.env` files

## Usage

### First Time Setup

1. **Click the extension icon** in your browser toolbar
2. **Configure Supabase** (if not already done)
3. **Create an account** or sign in with existing credentials
4. **Start marking pages** as read!

### Basic Usage

1. **Click the extension icon** in your browser toolbar
2. **Select a status type** from the dropdown
3. **Add tags** (optional) - comma separated
4. **Click "Mark as Read"** to save the entry

### Keyboard Shortcuts

- **Ctrl+Shift+R** (Windows/Linux) or **Cmd+Shift+R** (Mac)
  - Quickly mark the current page as "read" with default settings

### Settings

1. **Click the extension icon**
2. **Click "Settings"** button
3. **Customize your status types** and manage data

## Data Structure

Each bookmark contains:
```json
{
  "id": "uuid",
  "user_id": "user-uuid",
  "url": "https://example.com",
  "title": "Page Title",
  "description": "Optional description",
  "read_status": "read",
  "tags": ["research", "important"],
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "last_accessed": "2024-01-01T00:00:00Z",
  "access_count": 1
}
```

## Browser Compatibility

### Primary Support
- ✅ Chrome (Chromium-based)
- ✅ Edge (Chromium-based)
- ✅ Other Chromium browsers

### Future Support
- 🔄 Firefox (planned)
- 🔄 Safari (planned)

## Backend Architecture

Uses **Supabase** for:
- **PostgreSQL database** with real-time capabilities
- **Built-in authentication** system
- **Row Level Security** for data protection
- **Automatic backups** and scaling
- **Cross-browser compatibility**

### Security Features
- **Row Level Security (RLS)** - Users can only access their own data
- **JWT authentication** - Secure session management
- **Encrypted data transmission** - HTTPS by default
- **User isolation** - Complete data separation between users
- **CSP compliance** - No external scripts, all functionality self-contained

## Development

### Project Structure
```
forgetfulme/
├── manifest.json          # Extension configuration
├── popup.html            # Main popup interface
├── popup.css             # Popup styling
├── popup.js              # Popup functionality
├── background.js          # Background service worker
├── options.html          # Settings page
├── options.css           # Settings styling
├── options.js            # Settings functionality
├── supabase-client.js    # Local Supabase client (CSP compliant)
├── supabase-config.js    # Supabase configuration (secure)
├── supabase-service.js   # Supabase service layer
├── auth-ui.js            # Authentication UI
├── config-ui.js          # Configuration UI
├── supabase-schema.sql   # Database schema
├── supabase-config.template.js  # Template for local config
├── .gitignore           # Git ignore rules
├── SUPABASE_SETUP.md    # Setup guide
├── icons/               # Extension icons
└── README.md           # This file
```

### Key Technologies
- **Manifest V3** - Latest Chrome extension standard
- **Supabase** - Backend-as-a-Service with PostgreSQL
- **Service Workers** - Background processing
- **Modern JavaScript** - ES6+ features
- **Row Level Security** - Database-level security
- **CSP Compliant** - Self-contained, no external dependencies

### Setting Up Development Environment

1. **Clone the repository**
2. **Set up Supabase project** following the setup guide
3. **Configure credentials** using one of the methods above
4. **Run database schema** from `supabase-schema.sql`
5. **Load extension** in Chrome for testing

### Building for Distribution

1. **Add proper icons** to the `icons/` directory
2. **Update version** in `manifest.json`
3. **Test thoroughly** across different browsers
4. **Package for Chrome Web Store**

## Contributing

1. **Fork the repository**
2. **Set up your own Supabase project** for development
3. **Configure credentials** securely (see Configuration section)
4. **Create a feature branch**
5. **Make your changes**
6. **Test thoroughly**
7. **Submit a pull request**

### Development Guidelines

- **Never commit sensitive credentials** to version control
- **Use the configuration UI** for testing
- **Follow the security best practices** outlined in the setup guide
- **Test authentication flows** thoroughly
- **Maintain CSP compliance** - no external scripts

## Roadmap

### Phase 1 (Current)
- ✅ Basic marking functionality
- ✅ Custom status types
- ✅ Keyboard shortcuts
- ✅ Settings page
- ✅ Data export/import
- ✅ Supabase integration
- ✅ User authentication
- ✅ Secure configuration management
- ✅ CSP compliant implementation

### Phase 2 (Planned)
- 🔄 Firefox support
- 🔄 Advanced search and filtering
- 🔄 Bulk operations
- 🔄 Data analytics dashboard
- 🔄 Real-time collaboration features

### Phase 3 (Future)
- 🔄 Safari support
- 🔄 Mobile companion app
- 🔄 Advanced analytics
- 🔄 API for third-party integrations

## Privacy & Security

- **Secure authentication** - Email/password with JWT tokens
- **Data isolation** - Row Level Security ensures user data separation
- **No tracking** - extension doesn't collect any analytics
- **User control** - full export/import capabilities
- **Open source** - transparent codebase
- **Encrypted transmission** - all data transmitted over HTTPS
- **Secure credential storage** - credentials stored in Chrome sync storage
- **CSP compliant** - no external scripts, self-contained functionality

## Cost Considerations

The extension uses Supabase's free tier which includes:
- 500MB database
- 50,000 monthly active users
- 2GB bandwidth
- 1GB file storage

This should be sufficient for most users. Monitor your usage in the Supabase dashboard.

## License

MIT License - see LICENSE file for details.

## Support

For issues, feature requests, or questions:
1. Check the existing issues
2. Create a new issue with detailed information
3. Include browser version and extension version
4. For Supabase-related issues, check the [setup guide](./SUPABASE_SETUP.md)
5. For configuration issues, see the Configuration section above

---

**ForgetfulMe** - Never forget what you've read! 📚 