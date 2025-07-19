# ForgetfulMe Chrome Extension

A cross-browser extension that helps you mark websites as "read" for research purposes. Perfect for researchers, students, and anyone who needs to track which pages they've visited and categorize them.

## Features

### Core Functionality
- **Mark pages as read** with customizable status types
- **Add tags** to organize your entries
- **Keyboard shortcuts** for quick marking (Ctrl+Shift+R)
- **Cross-browser sync** using Chrome Sync Storage API
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

### Data Management
- **Export/Import** functionality for data backup
- **Cross-device sync** through Chrome Sync
- **Data statistics** and usage insights

## Installation

### For Development

1. **Clone or download** this repository
2. **Open Chrome** and navigate to `chrome://extensions/`
3. **Enable Developer mode** (toggle in top right)
4. **Click "Load unpacked"** and select the extension directory
5. **Pin the extension** to your toolbar for easy access

### For Users (Future Chrome Web Store Release)

1. Install from Chrome Web Store (coming soon)
2. Pin the extension to your toolbar
3. Start marking pages as read!

## Usage

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

Each entry contains:
```json
{
  "url": "https://example.com",
  "title": "Page Title",
  "status": "read",
  "tags": ["research", "important"],
  "timestamp": 1640995200000,
  "id": "unique-id"
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

## Storage

Uses **Chrome Sync Storage API** for:
- **Automatic cross-device sync**
- **Unlimited storage capacity**
- **Built-in encryption**
- **No external dependencies**

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
├── icons/                # Extension icons
└── README.md            # This file
```

### Key Technologies
- **Manifest V3** - Latest Chrome extension standard
- **Chrome Sync Storage API** - Cross-device data sync
- **Service Workers** - Background processing
- **Modern JavaScript** - ES6+ features

### Building for Distribution

1. **Add proper icons** to the `icons/` directory
2. **Update version** in `manifest.json`
3. **Test thoroughly** across different browsers
4. **Package for Chrome Web Store**

## Contributing

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Test thoroughly**
5. **Submit a pull request**

## Roadmap

### Phase 1 (Current)
- ✅ Basic marking functionality
- ✅ Custom status types
- ✅ Keyboard shortcuts
- ✅ Settings page
- ✅ Data export/import

### Phase 2 (Planned)
- 🔄 Firefox support
- 🔄 Advanced search and filtering
- 🔄 Bulk operations
- 🔄 Data analytics dashboard

### Phase 3 (Future)
- 🔄 Safari support
- 🔄 Mobile companion app
- 🔄 Cloud backup options
- 🔄 API for third-party integrations

## Privacy

- **No external servers** - all data stored locally and synced via Chrome
- **No tracking** - extension doesn't collect any analytics
- **User control** - full export/import capabilities
- **Open source** - transparent codebase

## License

MIT License - see LICENSE file for details.

## Support

For issues, feature requests, or questions:
1. Check the existing issues
2. Create a new issue with detailed information
3. Include browser version and extension version

---

**ForgetfulMe** - Never forget what you've read! 📚 