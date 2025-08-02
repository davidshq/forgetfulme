# ForgetfulMe Extension - Functional Requirements Document

## Executive Summary

ForgetfulMe is a Chrome browser extension designed to help researchers and information workers track websites they have visited, reviewed, or need to revisit. Users can mark websites with customizable status indicators, add tags for organization, and sync their data across devices.

## Target Users

### Primary User Persona: Academic Researcher
- **Role**: Graduate student, professor, or professional researcher
- **Pain Point**: Forgetting which online sources they've already reviewed during literature reviews or research projects
- **Goal**: Efficiently track research progress and avoid re-reading materials
- **Technical Skill**: Moderate to high computer literacy

### Secondary User Persona: Content Curator
- **Role**: Journalist, blogger, or content creator
- **Pain Point**: Managing large numbers of articles and sources across multiple research sessions
- **Goal**: Organize and categorize sources for future reference
- **Technical Skill**: Moderate computer literacy

### Tertiary User Persona: General Knowledge Worker
- **Role**: Consultant, analyst, or professional who reads extensively online
- **Pain Point**: Losing track of valuable articles and references
- **Goal**: Build a personal knowledge base of reviewed materials
- **Technical Skill**: Basic to moderate computer literacy

## Core Functional Requirements

### 1. Website Marking System

#### 1.1 Quick Page Marking
- **Function**: Users can mark the current webpage with a read status
- **Trigger**: Browser extension popup, keyboard shortcut, or right-click context menu
- **Data Captured**: 
  - URL of current page
  - Page title (automatically extracted)
  - Timestamp of marking
  - User-selected status
- **Default Behavior**: One-click marking with default "read" status
- **Validation**: Must handle various URL formats, including parameters and fragments

#### 1.2 Status Type System
- **Default Status Types**:
  - "Read" - Page has been fully reviewed
  - "Good Reference" - Page contains valuable information for future use
  - "Low Value" - Page reviewed but not useful
  - "Revisit Later" - Page needs to be reviewed again
- **Custom Status Types**: Users can create, edit, and delete their own status categories
- **Status Properties**: Each status should have a name, optional color, and description
- **Validation**: Status names must be unique per user, limited to reasonable length

#### 1.3 Tagging System
- **Function**: Users can add multiple tags to categorize bookmarks
- **Tag Creation**: Tags can be created on-the-fly or selected from existing tags
- **Tag Management**: Users can view, edit, and delete tags
- **Tag Suggestions**: System should suggest existing tags as user types
- **Validation**: Tags should be case-insensitive, no special characters that break functionality

### 2. User Interface Requirements

#### 2.1 Popup Interface (Primary)
- **Purpose**: Quick access for marking pages and viewing recent activity
- **Layout**: Compact design suitable for browser extension popup (350-400px width)
- **Key Elements**:
  - Current page information display
  - Status selection buttons or dropdown
  - Tag input field with autocomplete
  - "Mark as [Status]" primary action button
  - Recent bookmarks list (last 5-10 items)
  - Link to full bookmark management interface
- **Authentication State**: Show login form if user not authenticated
- **Error Handling**: Clear error messages for network issues or invalid data

#### 2.2 Settings/Options Page
- **Purpose**: Configure extension preferences and manage account
- **Sections**:
  - **Account Management**: Login, logout, account information
  - **Database Configuration**: Setup connection to data storage backend
  - **Custom Status Types**: Create, edit, delete custom status categories
  - **Data Management**: Export/import bookmarks, usage statistics
  - **Preferences**: Default behaviors, keyboard shortcuts
- **Validation**: All configuration changes must be validated before saving
- **Help**: Clear instructions for setup and configuration

#### 2.3 Bookmark Management Interface
- **Purpose**: Full-featured interface for viewing and organizing saved bookmarks
- **Layout**: Full-page web interface with sidebar and main content area
- **Key Features**:
  - **Search and Filter**: Text search across titles, URLs, tags, and descriptions
  - **Status Filtering**: Filter by one or more status types
  - **Tag Filtering**: Filter by tags with multi-select capability
  - **Date Range Filtering**: Filter by creation or modification date
  - **Sorting Options**: Sort by date, title, URL, status, or access count
  - **List/Grid View**: Toggle between compact list and detailed card views
  - **Bulk Operations**: Select multiple items for batch actions
- **Item Actions**: Edit, delete, change status, add/remove tags
- **Pagination**: Handle large numbers of bookmarks efficiently

### 3. Data Storage and Synchronization

#### 3.1 Data Model
- **Bookmark Entity**:
  - Unique identifier
  - URL (required)
  - Title (auto-extracted, user-editable)
  - Description (optional, user-provided)
  - Status (required, from available status types)
  - Tags (array of strings)
  - Creation timestamp
  - Last modified timestamp
  - Last accessed timestamp
  - Access count (incremented when bookmark is viewed/edited)
- **User Profile Entity**:
  - User identifier
  - Email address
  - Account creation date
  - Preferences (JSON object for settings)
- **Status Type Entity**:
  - Unique identifier per user
  - Name (required)
  - Color (optional, for UI display)
  - Creation date

#### 3.2 Data Persistence
- **Local Storage**: Essential data cached locally for offline access
- **Cloud Storage**: All data synchronized to cloud backend for cross-device access
- **Offline Capability**: Basic functionality available when offline, sync when online
- **Data Integrity**: Conflict resolution for simultaneous edits across devices

#### 3.3 Cross-Device Synchronization
- **Real-time Sync**: Changes propagated to other devices within reasonable time
- **Conflict Resolution**: Handle simultaneous edits with user notification if needed
- **Sync Status**: Users can see sync status and force manual sync if needed
- **Bandwidth Efficiency**: Only sync changed data, not entire dataset

### 4. User Authentication and Security

#### 4.1 Account System
- **Registration**: Email and password-based account creation
- **Login**: Secure authentication with session management
- **Password Reset**: Email-based password recovery system
- **Account Deletion**: Users can delete their accounts and all associated data

#### 4.2 Data Security
- **Data Isolation**: Each user can only access their own bookmarks and settings
- **Secure Transmission**: All data transmitted over encrypted connections
- **Local Security**: Sensitive data encrypted in local storage
- **Privacy**: No tracking or analytics collection, minimal data retention

### 5. Keyboard Shortcuts and Accessibility

#### 5.1 Keyboard Shortcuts
- **Primary Shortcut**: Ctrl+Shift+R (Cmd+Shift+R on Mac) to mark current page as read
- **Customizable Shortcuts**: Users can modify keyboard shortcuts in settings
- **Popup Access**: Shortcut to open extension popup
- **Context Menu**: Right-click option to mark page or access extension

#### 5.2 Accessibility Requirements
- **Screen Reader Support**: Full compatibility with screen reading software
- **Keyboard Navigation**: All functionality accessible via keyboard
- **High Contrast**: Support for high contrast display modes
- **Focus Management**: Clear focus indicators and logical tab order
- **ARIA Labels**: Proper semantic markup for assistive technologies

### 6. Data Management Features

#### 6.1 Import/Export Functionality
- **Export Formats**: JSON, CSV for bookmark data
- **Import Sources**: Support importing from browser bookmarks, CSV files
- **Backup Creation**: Users can create full data backups
- **Selective Export**: Export filtered subsets of bookmarks

#### 6.2 Statistics and Analytics
- **Usage Statistics**: 
  - Total bookmarks by status type
  - Bookmarks created over time (daily/weekly/monthly views)
  - Most frequently used tags
  - Most accessed bookmarks
- **Personal Insights**: Help users understand their reading patterns
- **No External Analytics**: All statistics remain private to the user

### 7. Performance Requirements

#### 7.1 Response Time
- **Popup Load**: Extension popup should load within 500ms
- **Page Marking**: Marking a page should complete within 2 seconds
- **Search Results**: Search results should appear within 3 seconds
- **Sync Operations**: Background sync should not impact browser performance

#### 7.2 Scalability
- **Bookmark Limit**: Support for at least 100,000 bookmarks per user
- **Tag Limit**: Support for at least 5,000 unique tags per user
- **Concurrent Users**: Backend should handle multiple simultaneous users
- **Search Performance**: Search should remain fast with large datasets

### 8. Browser Compatibility

#### 8.1 Primary Support
- **Chrome**: Full feature support on latest Chrome versions
- **Chromium-based Browsers**: Edge, Brave, Opera compatibility
- **Manifest V3**: Built using latest Chrome extension standards

#### 8.2 Progressive Enhancement
- **Graceful Degradation**: Core functionality works even if advanced features fail
- **Backward Compatibility**: Support recent versions of supported browsers
- **Mobile Considerations**: Basic functionality on mobile Chrome browsers

### 9. Error Handling and User Feedback

#### 9.1 Error States
- **Network Errors**: Clear messaging when backend is unavailable
- **Authentication Errors**: Helpful guidance for login/account issues
- **Data Validation Errors**: Specific error messages for invalid input
- **Sync Conflicts**: User-friendly conflict resolution interface

#### 9.2 User Feedback
- **Success Confirmations**: Clear confirmation when actions complete successfully
- **Loading States**: Visual indicators during data operations
- **Progress Tracking**: Progress bars for long-running operations like imports
- **Help Documentation**: Comprehensive help system and FAQs

### 10. Configuration and Setup

#### 10.1 Initial Setup
- **Onboarding Flow**: Guide new users through account creation and initial configuration
- **Backend Connection**: Simple setup for connecting to data storage backend
- **Data Migration**: Help users import existing bookmarks or research notes
- **Default Configuration**: Sensible defaults that work for most users

#### 10.2 Advanced Configuration
- **Custom Status Types**: Interface for creating and managing custom status categories
- **Keyboard Shortcuts**: Customization of keyboard shortcuts
- **Display Preferences**: UI customization options
- **Data Retention**: Settings for data cleanup and archiving

## Success Criteria

### User Experience Success Metrics
- **Ease of Use**: New users can mark their first page within 2 minutes of installation
- **Efficiency**: Regular users can mark a page in under 10 seconds
- **Reliability**: 99% uptime for core marking functionality
- **Data Integrity**: Zero data loss events in normal operation

### Technical Success Metrics
- **Performance**: Popup loads in under 500ms on average
- **Scalability**: Supports users with 10,000+ bookmarks without performance degradation
- **Compatibility**: Works on all major Chromium-based browsers
- **Security**: No security vulnerabilities in third-party security audits

### Business Success Metrics
- **User Retention**: 70% of users still active after 30 days
- **Feature Adoption**: 80% of users try custom status types within first week
- **User Satisfaction**: Average rating of 4.5+ stars in Chrome Web Store
- **Data Growth**: Users average 50+ bookmarks within first month

## Future Enhancement Considerations

### Potential Advanced Features
- **Full-text Search**: Search within page content, not just titles and URLs
- **Automatic Categorization**: AI-powered suggestion of tags and status types
- **Collaboration**: Shared bookmark collections for research teams
- **Integration**: Connect with note-taking apps, reference managers, or research tools
- **Advanced Analytics**: Detailed insights into reading patterns and productivity
- **Mobile Apps**: Companion apps for iOS and Android
- **Browser Extensions**: Support for Firefox and Safari

### Scalability Considerations
- **Multi-tenancy**: Support for institutional or team accounts
- **API Access**: Public API for third-party integrations
- **Advanced Search**: Elasticsearch or similar for complex queries
- **Content Analysis**: Extract and index key information from bookmarked pages
- **Recommendation Engine**: Suggest related content based on user's reading history

---

*This functional requirements document serves as the specification for developing a new ForgetfulMe extension from the ground up. It focuses on what the extension should do and how users should interact with it, rather than specific technical implementation details.*