# Config Manager Module

The Config Manager module provides a modular approach to managing configuration data for the ForgetfulMe extension. It separates concerns into specialized modules for better maintainability and testability.

## Structure

```
config-manager/
├── index.js              # Main coordinator module
├── modules/
│   ├── storage-manager.js      # Chrome storage operations
│   ├── validation-manager.js   # Configuration validation
│   ├── migration-manager.js    # Version migration logic
│   ├── event-manager.js        # Event listener management
│   ├── auth-manager.js         # Authentication session management
│   └── preferences-manager.js  # User preferences management
└── README.md            # This file
```

## Modules

### Index Module (`index.js`)
The main coordinator that initializes and coordinates all other modules. Provides the public API for configuration management.

**Key Features:**
- Initializes all sub-modules
- Provides unified interface for configuration operations
- Handles initialization state management
- Coordinates between modules

### Storage Manager (`modules/storage-manager.js`)
Handles all Chrome storage operations for configuration data.

**Key Features:**
- Loads configuration from Chrome sync storage
- Saves configuration to storage
- Handles storage availability checks
- Manages configuration export/import
- Resets configuration to defaults

### Validation Manager (`modules/validation-manager.js`)
Manages all configuration validation logic.

**Key Features:**
- Validates Supabase configuration
- Validates user preferences
- Validates status types
- Provides validation utilities for other modules

### Migration Manager (`modules/migration-manager.js`)
Handles configuration version migration between different versions.

**Key Features:**
- Tracks configuration version
- Performs version-specific migrations
- Handles breaking changes in configuration format

### Event Manager (`modules/event-manager.js`)
Manages event listener registration and notification.

**Key Features:**
- Registers event listeners
- Notifies listeners of configuration changes
- Manages listener lifecycle
- Provides event utilities

### Auth Manager (`modules/auth-manager.js`)
Handles authentication session management.

**Key Features:**
- Sets authentication session
- Clears authentication session
- Notifies other contexts of auth changes
- Manages auth state persistence

### Preferences Manager (`modules/preferences-manager.js`)
Manages user preferences and custom status types.

**Key Features:**
- Sets user preferences
- Manages custom status types
- Adds/removes status types
- Validates preference data

## Usage

```javascript
import ConfigManager from './utils/config-manager/index.js';

// Initialize the config manager
const configManager = new ConfigManager();
await configManager.initialize();

// Get Supabase configuration
const supabaseConfig = await configManager.getSupabaseConfig();

// Set custom status types
await configManager.setCustomStatusTypes(['read', 'important', 'review']);

// Add event listener
configManager.addListener('preferencesChanged', (preferences) => {
  console.log('Preferences updated:', preferences);
});
```

## Benefits of Modularization

1. **Separation of Concerns**: Each module has a specific responsibility
2. **Testability**: Individual modules can be tested in isolation
3. **Maintainability**: Changes to one area don't affect others
4. **Reusability**: Modules can be reused in different contexts
5. **Error Isolation**: Errors in one module don't break others

## Error Handling

All modules use the centralized ErrorHandler for consistent error management. Each module includes appropriate error context for debugging.

## Event System

The event system allows components to listen for configuration changes:

- `initialized`: Fired when configuration is fully loaded
- `supabaseConfigChanged`: Fired when Supabase config changes
- `preferencesChanged`: Fired when user preferences change
- `statusTypesChanged`: Fired when status types change
- `authSessionChanged`: Fired when auth session changes
- `configReset`: Fired when configuration is reset

## Migration Support

The migration system supports versioned configuration changes:

- Tracks current configuration version
- Performs automatic migrations between versions
- Handles breaking changes gracefully
- Maintains backward compatibility

## Testing

Each module can be tested independently:

```javascript
// Test storage manager
import StorageManager from './modules/storage-manager.js';
const storageManager = new StorageManager(mockConfigManager);

// Test validation manager
import ValidationManager from './modules/validation-manager.js';
const validationManager = new ValidationManager(mockConfigManager);
```

## Future Enhancements

- Add configuration schema validation
- Implement configuration backup/restore
- Add configuration conflict resolution
- Support for multiple configuration profiles
- Real-time configuration synchronization 