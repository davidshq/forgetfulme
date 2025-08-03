# CSS Architecture Documentation

This document provides a comprehensive overview of the CSS architecture for the ForgetfulMe Chrome extension, organized by file and purpose.

## CSS File Organization

The extension uses a modular CSS architecture with the following structure:

```
src/ui/styles/
├── shared.css          # Common utilities and components
├── popup.css           # Popup-specific styles
├── options.css         # Options page styles
└── bookmark-manager.css # Bookmark manager styles
```

## Framework Integration

**Base Framework**: Pico.css v2 (bundled in `src/lib/pico.min.css`)
- Provides semantic HTML-first styling with automatic light/dark mode support
- CSS custom properties for consistent theming
- Built-in responsive design and accessibility features

---

## `shared.css` - Core Utilities & Shared Components

### 1. Utility Classes
```css
.hidden          # Display: none with !important
.small           # Font size: 0.875rem
```

### 2. Loading States
- **`.loading-spinner`**: Animated circular spinner with Pico color variables
- **`.loading-state`**: Container for loading content with centered text
- **Animation**: `spin` keyframe for continuous rotation

### 3. Message System
- **`.message-area`**: Fixed positioning system with CSS custom properties for layout control
- **Message types**: `.success`, `.error`, `.warning`, `.info` with themed colors
- **Animation**: `slideIn` keyframe for smooth message appearance
- **Dark mode**: Automatic color adjustments for better visibility

### 4. Empty States
- **`.empty-state`**: Centered content for "no data" scenarios
- **Customization**: CSS custom properties for padding, font sizes, and margins
- **Responsive**: Automatic text scaling

### 5. Status Indicators
- **`.status-indicator`**: Flexible badge system with dots
- **`.status-dot`**: Small circular indicators
- **Layout**: Inline-flex for proper alignment

### 6. Tag System
- **`.tag`**: Individual tag styling with hover effects
- **`.tag-list`**: Flexible container for multiple tags
- **Integration**: Uses Pico color variables for consistency

### 7. Form Enhancements
- **`.form-grid`**: CSS Grid layout for responsive forms
- **`.form-actions`**: Button container with flex layout
- **Responsive**: Single column on mobile devices

### 8. Modal Improvements
- **Modal actions**: Consistent button spacing and alignment
- **`.close-button`**: Accessible close button with hover states
- **CSS Variables**: Customizable via CSS custom properties

### 9. Responsive Utilities
- **Mobile breakpoint**: 768px and below
- **Adjustments**: Stack layouts, full-width elements, reduced spacing

### 10. Accessibility Features
- **Focus states**: Enhanced focus visibility with outline
- **Reduced motion**: Respects user's motion preferences
- **High contrast**: Improved visibility for accessibility needs
- **Print styles**: Optimized for printing (hides interactive elements)

---

## `popup.css` - Popup-Specific Styles

### 1. Container Sizing
- **Fixed dimensions**: 380px width, 400-600px height range
- **Scroll behavior**: Vertical scrolling when content overflows

### 2. Header Section
- **`.popup-header`**: Centered branding with bottom border
- **Typography**: Primary color for branding, muted for descriptions

### 3. User Information
- **`.user-info`**: Flex layout for user email and actions
- **Text overflow**: Ellipsis for long email addresses

### 4. Authentication Interface
- **`.auth-tabs`**: Tab button system using Pico's secondary class
- **`.auth-form`**: Clean form layout with proper fieldset structure
- **Tab behavior**: JavaScript toggles `.secondary` class for active/inactive states

### 5. Configuration State
- **`.config-required`**: Prominent display when setup is needed
- **Call-to-action**: Clear messaging and button for configuration

### 6. Current Page Display
- **`.current-page`**: Card-style container for page information
- **`.page-info`**: Title and URL display with word-break handling
- **`.bookmark-status`**: Status indicators with color coding

### 7. Bookmark Form
- **Semantic structure**: Proper fieldset and legend elements
- **Form controls**: Consistent spacing and sizing
- **Help text**: Small, muted text for guidance

### 8. Recent Bookmarks
- **`.recent-list`**: Scrollable list with hover effects
- **Item structure**: Title, URL, metadata with consistent spacing
- **Loading state**: Special styling for loading indicators

### 9. Message Positioning
- **Popup-specific overrides**: Full-width messages within popup bounds

### 10. Accessibility & Theme Support
- **Dark mode**: Card background adjustments
- **High contrast**: Enhanced border visibility
- **Reduced motion**: Disabled animations when requested

---

## `options.css` - Options Page Styles

### 1. Layout Structure
- **Container**: Max-width 1000px with centered layout
- **Responsive padding**: Scales with Pico spacing variables

### 2. Header Design
- **Large title**: 2rem font size with primary color
- **Bottom border**: Prominent separation from content

### 3. Navigation System
- **`.options-nav`**: Horizontal tab navigation with scrolling
- **`.nav-button`**: Custom tab buttons with active state styling
- **Active state**: Primary color with bottom border indicator

### 4. Section Management
- **`.options-section`**: Fade-in animation for content switching
- **Typography**: Consistent heading hierarchy

### 5. Database Configuration
- **Form layout**: Proper fieldset structure with help text
- **`.connection-status`**: Success/error feedback with themed colors
- **Animation**: Slide-down effect for status messages

### 6. Status Types Management
- **`.status-type-item`**: Card layout for status type entries
- **`.status-type-preview`**: Visual preview of status appearance
- **Actions**: Edit/delete buttons with proper spacing

### 7. Preferences Interface
- **Form structure**: Standard fieldset layout
- **Help text**: Guidance for each setting

### 8. Import/Export System
- **`.import-export-grid`**: Two-column layout for import/export sections
- **Card design**: Bordered containers with background
- **Results display**: Formatted feedback for import operations

### 9. Storage Usage Display
- **`.storage-usage`**: Visual representation of storage consumption
- **Progress bars**: Custom styled progress indicators
- **Responsive text**: Right-aligned on desktop, left-aligned on mobile

### 10. Loading Overlay
- **Full-screen overlay**: Modal-style loading indicator
- **Z-index management**: Higher than other content

### 11. Message System
- **Options-specific positioning**: Top-right with larger max-width

### 12. Responsive Design
- **768px breakpoint**: Stacked layouts for mobile
- **Grid adjustments**: Single-column layouts on small screens

---

## `bookmark-manager.css` - Data Table & Management Interface

### 1. Grid.js Integration
- **`.gridjs-wrapper`**: Container styling with Pico spacing
- **Table styling**: Consistent with Pico table design
- **Sticky headers**: Fixed header during scrolling
- **Hover effects**: Row highlighting for better UX

### 2. Search & Pagination
- **`.gridjs-search-input`**: Styled to match Pico form elements
- **`.gridjs-pagination`**: Flex layout with proper spacing
- **Button styling**: Secondary button appearance with hover states

### 3. Theme Override
- **CSS custom properties**: Override Grid.js defaults with Pico colors
- **Consistency**: Matches extension's overall design system

### 4. Content Styling
- **`.bookmark-checkbox`**: Styled checkboxes for selection
- **`.small-button`**: Compact buttons for table actions
- **`.action-buttons`**: Button group with consistent spacing

### 5. Status & Tag Badges
- **`.status-badge`**: Colored indicators for bookmark status
- **Status types**: Different colors for read, reading, to-read, reference
- **`.tag-badge`**: Subtle styling for content tags

### 6. Bookmark Content
- **`.bookmark-title`**: Primary color links with hover effects
- **`.bookmark-url`**: Muted color with text overflow handling

### 7. Layout System
- **`.container-fluid`**: Full-width container with max-width constraint
- **`.manager-header`**: Flex layout with stats and actions
- **Header stats**: Bookmark counts with proper typography

### 8. Filters Section
- **`.filters-section`**: Card-style container for search filters
- **`.filters-grid`**: Three-column grid layout
- **Filter actions**: Button group for filter operations

### 9. Toolbar Interface
- **`.toolbar`**: Multi-section layout for bulk operations
- **Selection management**: Checkbox controls and selected count display
- **Bulk actions**: Dropdown and button combinations

### 10. Modal System
- **Edit modal**: Form-based editing with validation styles
- **Delete modal**: Confirmation interface
- **Form validation**: Error state styling with proper feedback

### 11. Authentication Required
- **`.auth-required`**: Full-screen authentication prompt
- **Centered layout**: Card-style authentication form
- **Call-to-action**: Clear instructions and buttons

### 12. Responsive Design
- **1200px breakpoint**: Grid adjustments for tablets
- **768px breakpoint**: Mobile-first stacking
- **Flexible layouts**: Column direction changes for small screens

### 13. Print Optimization
- **Print styles**: Hidden interactive elements
- **Content preservation**: Readable bookmark information
- **URL display**: Shows full URLs in printed version

### 14. Accessibility & Performance
- **Reduced motion**: Disabled animations when requested
- **High contrast**: Enhanced visibility
- **Dark mode**: Proper color adjustments
- **Focus management**: Clear focus indicators

---

## CSS Custom Properties Usage

The extension leverages CSS custom properties for:

1. **Theme consistency**: Pico variables for colors, spacing, borders
2. **Component customization**: Override default values per context
3. **Responsive behavior**: Different values at different breakpoints
4. **Message positioning**: Contextual positioning in different layouts

## Browser Support

- **Modern browsers**: Chrome, Firefox, Safari, Edge
- **Feature detection**: Graceful degradation for unsupported features
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Optimized for extension context with minimal CSS

## Development Guidelines

1. **Use Pico variables**: Leverage framework's CSS custom properties
2. **Semantic HTML**: Style semantic elements rather than adding classes
3. **Component isolation**: Each page's specific styles in separate files
4. **Mobile-first**: Design for mobile, enhance for desktop
5. **Accessibility**: Always include focus states and reduced motion support