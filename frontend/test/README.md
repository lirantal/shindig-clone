# Testing Documentation

This directory contains comprehensive tests for the user settings functionality, focusing on profile management (name and avatar image).

## Testing Strategy

Our testing approach follows Nuxt's official testing best practices with a multi-layered strategy:

1. **Unit Tests** (`test/unit/`): Test individual composables and utilities in isolation using Node environment (faster execution)
2. **Nuxt Runtime Tests** (`test/nuxt/`): Test pages, components, and features that require Nuxt runtime environment
3. **Integration Tests**: Test complete user interaction flows

## Test Organization (Following Nuxt Best Practices)

```
test/
├── unit/                              # Unit tests (Node environment)
│   ├── setup.ts                      # Unit test setup and mocks
│   └── composables/
│       └── useAvatarUpload.test.ts   # Avatar upload composable tests
└── nuxt/                              # Nuxt runtime tests (Nuxt environment)
    ├── setup.ts                      # Nuxt runtime test setup
    ├── pages/
    │   └── settings/
    │       └── index.test.ts        # Settings page component tests
    └── integration/
        └── settings-profile.test.ts  # End-to-end profile update flow
```

### Test Environment Separation

- **Unit Tests** (`test/unit/`): Run in Node environment for speed. Use for:
  - Composable logic that doesn't require Nuxt runtime
  - Utility functions
  - Pure business logic

- **Nuxt Runtime Tests** (`test/nuxt/`): Run in Nuxt environment. Use for:
  - Page components
  - Components that use Nuxt composables
  - Features requiring Nuxt runtime context
  - Integration tests

## Running Tests

```bash
# Run all tests (both unit and nuxt runtime)
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run tests with UI
pnpm test:ui

# Run tests once (CI mode)
pnpm test:run

# Run tests with coverage
pnpm test:coverage

# Run only unit tests
pnpm test --project unit

# Run only Nuxt runtime tests
pnpm test --project nuxt
```

## Test Coverage

### Unit Tests (`test/unit/composables/useAvatarUpload.test.ts`)

Tests cover:
- ✅ File validation (type and size)
- ✅ Pre-signed URL retrieval
- ✅ R2 upload flow
- ✅ Upload state management
- ✅ Error handling
- ✅ Multiple file upload support

### Nuxt Runtime Tests

#### Settings Page (`test/nuxt/pages/settings/index.test.ts`)

Tests cover:
- ✅ Profile data loading on mount
- ✅ Backend-to-frontend data mapping
- ✅ Avatar URL construction (CDN and fallback)
- ✅ Form submission and validation
- ✅ Error handling and user feedback
- ✅ Avatar upload integration

#### Integration Tests (`test/nuxt/integration/settings-profile.test.ts`)

Tests cover:
- ✅ Complete profile update cycle
- ✅ Avatar upload + profile update flow
- ✅ Error handling across the full flow
- ✅ Avatar URL construction strategies

## Nuxt Testing Best Practices

### 1. Proper Test Organization
- **Unit tests** in `test/unit/` with Node environment (fast, isolated)
- **Nuxt runtime tests** in `test/nuxt/` with Nuxt environment (full context)

### 2. Environment Configuration
- Unit tests use `environment: 'node'` for speed
- Nuxt runtime tests use `environment: 'nuxt'` for full Nuxt context
- Separate setup files for each environment

### 3. Using @nuxt/test-utils
- Leverages `@nuxt/test-utils` for Nuxt-specific testing utilities
- Module added to `nuxt.config.ts` for DevTools integration
- Proper configuration with `defineVitestProject` for Nuxt runtime tests

### 4. Isolation
- Each test is independent and can run in any order
- Tests use mocks to isolate functionality
- No shared state between tests

### 5. Clarity
- Test names clearly describe what is being tested
- Tests follow the Arrange-Act-Assert pattern
- Comments explain complex test scenarios

## Mocking Strategy

### Nuxt Composables
- `useRuntimeConfig`: Mocked with test configuration
- `useToast`: Mocked to verify user notifications
- `useFetch`: Mocked to control API responses
- `$fetch`: Mocked for direct API calls

### External Dependencies
- `global.fetch`: Mocked for R2 uploads
- `URL.createObjectURL`: Mocked for file previews (Nuxt runtime only)
- File objects: Created with proper types for testing

## Writing New Tests

When adding new tests:

1. **Choose the right test type and location**:
   - Pure logic/composables → `test/unit/` (Node environment)
   - Pages/components requiring Nuxt → `test/nuxt/` (Nuxt environment)

2. **Mock external dependencies**: Keep tests fast and reliable

3. **Test behavior, not implementation**: Focus on what users see

4. **Use descriptive names**: Test names should read like documentation

5. **Follow the existing structure**: Place tests in appropriate directories

### Example Test Structure

```typescript
describe('Feature Name', () => {
  beforeEach(() => {
    // Reset mocks and state
  })

  describe('Specific Behavior', () => {
    it('should do something when condition is met', () => {
      // Arrange: Set up test data
      // Act: Execute the functionality
      // Assert: Verify the result
    })
  })
})
```

## Configuration

### Vitest Configuration

The `vitest.config.ts` uses separate test projects:
- **Unit project**: Node environment, fast execution
- **Nuxt project**: Nuxt runtime environment, full context

### Nuxt Configuration

The `@nuxt/test-utils/module` is added to `nuxt.config.ts` for:
- DevTools integration
- Running unit tests in development
- Enhanced testing experience

## Continuous Integration

Tests run automatically in CI:
- All tests must pass before merging
- Coverage reports are generated
- Linting is enforced on test files

## Troubleshooting

### Tests failing with "Cannot find module"
- Ensure all dependencies are installed: `pnpm install`
- Check that mocks are properly configured
- Verify test is in the correct directory (unit vs nuxt)

### Tests timing out
- Check for unresolved promises
- Verify mocks are returning values correctly
- Ensure correct environment (Node vs Nuxt)

### Type errors in tests
- Ensure TypeScript types are properly imported
- Check that mock return types match expected types

## Future Enhancements

- [ ] Add E2E tests with Playwright
- [ ] Add visual regression tests
- [ ] Increase coverage for edge cases
- [ ] Add performance tests for file uploads
- [ ] Add accessibility tests

## References

- [Official Nuxt Testing Documentation](https://nuxt.com/docs/getting-started/testing)
- [@nuxt/test-utils Module](https://nuxt.com/modules/test-utils)
