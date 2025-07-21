# Theme Management for ForgetfulMe Extension

## Overview

The ForgetfulMe extension now supports manual theme selection with automatic system preference detection. Users can choose between light theme, dark theme, or automatic mode that follows their system preferences.

## Features

### Automatic System Preference Detection
- **Default Behavior**: The extension automatically detects and applies the user's system theme preference
- **Real-time Updates**: Theme changes when the user changes their system theme setting
- **Fallback**: Uses light theme if system preference cannot be determined

### Manual Theme Override
- **Light Theme**: Forces the extension to use light theme regardless of system preference
- **Dark Theme**: Forces the extension to use dark theme regardless of system preference
- **Auto Mode**: Returns to automatic system preference detection

### Cross-Page Consistency
- **Unified Experience**: Theme setting applies across all extension pages (popup, options, bookmark management)
- **Persistent Storage**: Theme preference is saved and restored across browser sessions
- **Instant Application**: Theme changes are applied immediately without page refresh

## Implementation

### Theme Manager (`utils/theme-manager.js`)

The `ThemeManager` class handles all theme-related functionality:

```javascript
import ThemeManager from './utils/theme-manager.js';

const themeManager = new ThemeManager();
await themeManager.initialize();

// Set manual theme
await themeManager.setTheme('dark');  // Force dark theme
await themeManager.setTheme('light'); // Force light theme
await themeManager.setTheme(null);    // Use system preference

// Get current theme
const currentTheme = themeManager.getCurrentTheme(); // 'light' or 'dark'

// Check if using system preference
const isAuto = themeManager.isUsingSystemPreference(); // true/false
```

### CSS Implementation

The theme system uses CSS custom properties and data attributes:

```css
/* System preference-based dark mode */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    --color-background: #2d2d2d;
    --color-text-primary: #e9ecef;
    /* ... other dark theme variables */
  }
}

/* Manual theme overrides */
[data-theme="dark"] {
  --color-background: #2d2d2d;
  --color-text-primary: #e9ecef;
  /* ... other dark theme variables */
}

[data-theme="light"] {
  --color-background: #ffffff;
  --color-text-primary: #1a1a1a;
  /* ... other light theme variables */
}
```

### Storage

Theme preferences are stored in Chrome's sync storage:

```javascript
// Save theme preference
await chrome.storage.sync.set({ theme: 'dark' });

// Load theme preference
const result = await chrome.storage.sync.get(['theme']);
const theme = result.theme || null; // null = auto, 'light', or 'dark'
```

## User Interface

### Settings Page Integration

The theme selector is available in the options/settings page:

1. **Location**: Settings page → "Theme Settings" section
2. **Options**:
   - "Use System Preference" (default)
   - "Light Theme"
   - "Dark Theme"
3. **Behavior**: Changes are applied immediately and saved automatically

### Theme Selector

```html
<label for="theme-select">Theme:</label>
<select id="theme-select">
  <option value="">Use System Preference</option>
  <option value="light">Light Theme</option>
  <option value="dark">Dark Theme</option>
</select>
```

## Technical Details

### Event System

The theme manager provides an event system for theme changes:

```javascript
// Listen for theme changes
themeManager.addListener('themeChanged', (theme) => {
  console.log('Theme changed to:', theme);
});

// Remove listener
themeManager.removeListener('themeChanged', callback);
```

### System Preference Detection

The theme manager uses the `prefers-color-scheme` media query:

```javascript
const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

darkModeQuery.addEventListener('change', () => {
  // Only apply if no manual theme is set
  if (manualTheme === null) {
    applyTheme();
  }
});
```

### Document Application

Themes are applied by setting data attributes on the document element:

```javascript
// Apply dark theme
document.documentElement.setAttribute('data-theme', 'dark');
document.documentElement.classList.add('theme-dark');

// Apply light theme
document.documentElement.setAttribute('data-theme', 'light');
document.documentElement.classList.add('theme-light');

// Reset to auto
document.documentElement.removeAttribute('data-theme');
document.documentElement.classList.remove('theme-light', 'theme-dark');
```

## Testing

### Unit Tests

The theme manager includes comprehensive unit tests (`tests/unit/theme-manager.test.js`):

- Constructor initialization
- Theme setting and retrieval
- System preference detection
- Event listener management
- Document theme application

### Test Coverage

```bash
npm test -- theme-manager.test.js
```

## Browser Compatibility

### Supported Features

- ✅ Chrome/Chromium (primary target)
- ✅ Firefox (with WebExtensions API)
- ✅ Safari (with Safari App Extensions)
- ✅ Edge (Chromium-based)

### Required APIs

- `chrome.storage.sync` - Theme preference storage
- `window.matchMedia` - System preference detection
- `document.documentElement` - Theme application

## Future Enhancements

### Potential Improvements

1. **Custom Themes**: Allow users to create custom color schemes
2. **Theme Transitions**: Smooth transitions between theme changes
3. **Per-Page Themes**: Different themes for different extension pages
4. **Theme Presets**: Pre-defined theme collections
5. **Accessibility Themes**: High contrast and reduced motion themes

### Implementation Notes

- All theme changes are non-destructive and reversible
- System preference detection works even when manual theme is set
- Theme preferences are synced across devices via Chrome sync storage
- No performance impact on extension functionality
- Graceful fallback to light theme if system preference detection fails

## Troubleshooting

### Common Issues

1. **Theme not applying**: Check if CSS variables are properly defined
2. **Storage errors**: Verify Chrome storage permissions
3. **System preference not detected**: Check browser media query support
4. **Theme not syncing**: Ensure Chrome sync is enabled

### Debug Information

```javascript
// Get debug information
console.log('Manual theme:', themeManager.getManualTheme());
console.log('Current theme:', themeManager.getCurrentTheme());
console.log('System preference:', themeManager.getSystemPreferenceTheme());
console.log('Using system preference:', themeManager.isUsingSystemPreference());
``` 