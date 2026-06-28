/**
 * @fileoverview Registers shared vi.mock() modules for page-level unit tests
 * @module register-page-mocks
 * @description Import this file before the module under test in popup, options,
 * and bookmark-management unit tests. Mock paths are relative to this file.
 */

vi.mock('../../utils/ui-components.js', async () =>
  (await import('./vi-module-mocks.js')).mockUIComponentsModule(),
);

vi.mock('../../utils/auth-state-manager.js', async () =>
  (await import('./vi-module-mocks.js')).mockAuthStateManagerModule(),
);

vi.mock('../../utils/error-handler.js', async () =>
  (await import('./vi-module-mocks.js')).mockErrorHandlerModule(),
);

vi.mock('../../utils/ui-messages.js', async () =>
  (await import('./vi-module-mocks.js')).mockUIMessagesModule(),
);

vi.mock('../../utils/config-manager.js', async () =>
  (await import('./vi-module-mocks.js')).mockConfigManagerModule(),
);

vi.mock('../../utils/bookmark-transformer.js', async () =>
  (await import('./vi-module-mocks.js')).mockBookmarkTransformerModule(),
);

vi.mock('../../supabase-config.js', async () =>
  (await import('./vi-module-mocks.js')).mockSupabaseConfigModule(),
);

vi.mock('../../supabase-service.js', async () =>
  (await import('./vi-module-mocks.js')).mockSupabaseServiceModule(),
);

vi.mock('../../auth-ui.js', async () =>
  (await import('./vi-module-mocks.js')).mockAuthUIModule(),
);
