## Codebase review and recommendations

### Overengineering and complexity


- **ValidationService**: Deep sanitation and many validators; some validation is duplicated in controllers/components.
- **DI and registration**: `ServiceContainer` + `serviceRegistration` are good, but background re-registers services manually in `src/main/background.js`, creating duplication.
- **BackgroundService**: Large responsibility surface while purposely avoiding Supabase work in SW context; some branches are effectively no-ops.

### Bad practices / risks
- **Direct PostgREST fetches using internal client fields**: Code reads `supabaseClient.supabaseKey`; this is not a documented public field and may break on upgrades.
- **Verbose console output**: Frequent logs (including in SW) may be noisy in production.
- **Inadequate test coverage for edge cases**: Several confirmed bugs suggest testing gaps in validation logic and error handling paths.
- **Type safety gaps**: Complex service methods lack comprehensive JSDoc annotations, making debugging difficult.

### Simplification and deduplication opportunities

**Remaining opportunities**:

- **Centralize service registration**: Use `registerCoreServices(container)` in background instead of local manual registration.
- **Consolidate validation**: Keep validation in `ValidationService`. Fix consumers to rely on it (auth modal, forms) and remove per-controller re-validations.

### Medium-term improvements
- **Reduce noise in production**: Default log level to WARN in SW; INFO in UI contexts.
- **Encapsulate PostgREST access**: Prefer the official Supabase client methods where possible; if using REST, keep headers and patterns in one helper.


### Notes on tests and compatibility
- Existing tests mock some internals (e.g., supabase client). Changes to rely less on internals (like `supabaseKey`) may require updating tests.
- Centralizing storage access will simplify mocking and reduce divergent code paths between runtime and unit tests.
