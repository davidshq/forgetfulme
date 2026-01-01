# Future Enhancements

This file contains functionality and improvements that would be nice to have but aren't essential for the current release.

## Code Organization

- [ ] Extract interface rendering from `popup.js` into separate module (`utils/popup-ui-renderer.js`)
- [ ] Extract interface rendering from `bookmark-management.js` into separate module (`utils/bookmark-management-ui-renderer.js`)
- [ ] Extract form rendering from `auth-ui.js` into separate module (`utils/auth-form-renderer.js`)
- [ ] Consider using `importScripts()` for `background.js` to enable module extraction (service worker limitation workaround)
- [ ] Create module dependency diagram for documentation
- [ ] Add JSDoc cross-references between related modules
- [ ] Consider creating a `utils/error-handler/` directory structure for better organization:
  ```
  utils/error-handler/
  ├── index.js
  ├── categorizer.js
  ├── messages.js
  └── validator.js
  ```

## Testing

- [ ] Add integration tests to verify extracted modules work correctly together
- [ ] Add performance benchmarks for refactored modules
- [ ] Add visual regression tests for UI rendering modules
- [ ] Add comprehensive tests for token refresh failure scenarios in bookmark/user/data operations
- [ ] Add tests for partial bulk operation failures (some succeed, some fail)
- [ ] Add tests for concurrent request error handling and cleanup
- [ ] Add integration tests for coordinator operations (bookmark-management-coordinator)
- [ ] Set up test coverage reporting to identify gaps

## Documentation

- [ ] Update `docs/architecture/` with module organization patterns
- [ ] Create developer guide for module extraction patterns
- [ ] Document module dependency relationships

## Performance

- [ ] Profile module loading performance
- [ ] Consider lazy loading for less frequently used modules
- [ ] Optimize bundle size if using build tools

## Data Validation

- [ ] Consider adding validation to `updateBookmark` for updated fields (validate URL, title, readStatus if present in updates)
- [ ] Consider adding validation to `importData` with lenient error handling (warn instead of fail for invalid entries)
- [ ] Consider creating a validation schema/constants file for allowed readStatus values
- [ ] Consider adding validation for bookmark description length limits
- [ ] Consider adding validation for tag format/naming conventions
- [ ] Consider adding validation for URL schemes (e.g., reject `javascript:`, `data:` URLs for security)

## Authentication & Token Management

- [ ] Add token refresh handler to `UserOperations` and `DataOperations` for consistent auth error handling
- [ ] Add metrics/logging for token refresh attempts and failures
- [ ] Consider implementing exponential backoff for token refresh retries
- [ ] Add UI feedback when operations are queued due to offline state
- [ ] Document token refresh handler usage patterns in `docs/architecture/`
