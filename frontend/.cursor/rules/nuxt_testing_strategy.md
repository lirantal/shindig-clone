# Nuxt Testing Strategy

This document outlines the testing strategy, best practices, and conventions for writing tests in this Nuxt application. It is based on official Nuxt testing guidelines and practical experience from implementing tests in this codebase.

## Table of Contents

1. [Test Organization](#test-organization)
2. [Test Environment Setup](#test-environment-setup)
3. [Writing Tests](#writing-tests)
4. [Mocking Strategies](#mocking-strategies)
5. [Test Structure and Conventions](#test-structure-and-conventions)
6. [Common Patterns](#common-patterns)
7. [Troubleshooting](#troubleshooting)

## Test Organization

### Directory Structure

Follow Nuxt's recommended test organization with separate directories for different test types:

```
test/
├── unit/                    # Unit tests (Node environment)
│   ├── setup.ts            # Unit test setup and mocks
│   └── [feature]/          # Pure logic tests (no Nuxt runtime)
│
└── nuxt/                    # Nuxt runtime tests (Nuxt environment)
    ├── setup.ts            # Nuxt runtime test setup
    ├── composables/        # Composable tests (require Nuxt runtime)
    ├── pages/              # Page component tests
    └── integration/        # End-to-end flow tests
```

### Test Type Guidelines

**Unit Tests (`test/unit/`)** - Node environment:
- Pure business logic functions
- Utility functions
- Functions that don't require Nuxt runtime
- Fast execution, no Nuxt context needed

**Nuxt Runtime Tests (`test/nuxt/`)** - Nuxt environment:
- Vue components and pages
- Composables that use Nuxt APIs (`useRuntimeConfig`, `useFetch`, etc.)
- Features requiring Nuxt runtime context
- Integration tests

### Decision Tree

```
Does the code use Nuxt composables/APIs?
├─ NO → test/unit/ (Node environment)
└─ YES → test/nuxt/ (Nuxt runtime environment)
```

## Test Environment Setup

### Vitest Configuration

The `vitest.config.ts` uses separate test projects for optimal performance:

```typescript
import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'

export default defineConfig({
  test: {
    globals: true,
    projects: [
      // Unit tests - Node environment (fast)
      {
        test: {
          name: 'unit',
          include: ['test/unit/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
          environment: 'node',
          setupFiles: ['./test/unit/setup.ts']
        }
      },
      // Nuxt runtime tests - Nuxt environment
      await defineVitestProject({
        test: {
          name: 'nuxt',
          include: ['test/nuxt/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
          environment: 'nuxt',
          setupFiles: ['./test/nuxt/setup.ts']
        }
      })
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.config.*',
        '**/types/**',
        '**/*.d.ts'
      ]
    }
  }
})
```

### Nuxt Configuration

Add `@nuxt/test-utils/module` to `nuxt.config.ts` for DevTools integration:

```typescript
export default defineNuxtConfig({
  modules: [
    // ... other modules
    '@nuxt/test-utils/module'
  ]
})
```

### Setup Files

**Unit Test Setup (`test/unit/setup.ts`)**:
```typescript
import { vi } from 'vitest'

// Mock global fetch for unit tests (Node environment)
global.fetch = global.fetch || vi.fn()

// Mock console methods to reduce noise
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn()
}
```

**Nuxt Runtime Test Setup (`test/nuxt/setup.ts`)**:
```typescript
import { vi } from 'vitest'

// Mock window.URL.createObjectURL for file upload tests (browser environment)
if (typeof window !== 'undefined') {
  window.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/test-url')
  window.URL.revokeObjectURL = vi.fn()
}

// Mock global fetch for Nuxt runtime tests
global.fetch = global.fetch || vi.fn()

// Mock console methods to reduce noise
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn()
}
```

## Writing Tests

### Import Paths

**Unit Tests** (Node environment):
- Use relative paths: `import { something } from '../../../app/utils/something'`
- Nuxt path aliases (`~`, `@`) are NOT available in Node environment

**Nuxt Runtime Tests** (Nuxt environment):
- Use Nuxt path aliases: `import { useComposable } from '~/composables/useComposable'`
- Path aliases are automatically resolved by Nuxt

### Test File Naming

- Use `.test.ts` or `.spec.ts` extension
- Match the source file structure: `test/nuxt/composables/useAvatarUpload.test.ts` for `app/composables/useAvatarUpload.ts`

### Basic Test Structure

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useComposable } from '~/composables/useComposable'

// Set up mocks at module level
const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

describe('Feature Name', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()
    mockFetch.mockClear()
  })

  describe('Specific Behavior', () => {
    it('should do something when condition is met', () => {
      // Arrange: Set up test data
      const input = 'test data'
      
      // Act: Execute the functionality
      const result = useComposable().doSomething(input)
      
      // Assert: Verify the result
      expect(result).toBe('expected output')
    })
  })
})
```

## Mocking Strategies

### Global Mocks

**Best Practice**: Create properly typed mock variables at the top of the test file:

```typescript
// ✅ GOOD: Clear, readable, properly typed
const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

const mockGlobalFetch = vi.fn()
global.fetch = mockGlobalFetch as typeof global.fetch

// ❌ BAD: Cryptic, hard to read
;(global.fetch as any).mockResolvedValue({ ... })
```

### Mocking Nuxt Composables

**For Nuxt Runtime Tests**:

```typescript
// Mock $fetch globally
const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

// Mock useRuntimeConfig is handled automatically by Nuxt test utils
// But you can override if needed:
vi.mock('#app', () => ({
  useRuntimeConfig: () => ({
    public: {
      apiBaseUrl: 'http://localhost:8787',
      r2CdnUrl: 'https://cdn.example.com'
    }
  })
}))
```

### Mocking API Responses

```typescript
// Mock successful response
mockFetch.mockResolvedValue({
  id: '123',
  name: 'John Doe',
  email: 'john@example.com'
})

// Mock error response
mockFetch.mockRejectedValue(new Error('API Error'))

// Mock multiple sequential calls
mockFetch
  .mockResolvedValueOnce(response1)
  .mockResolvedValueOnce(response2)
```

### Mocking Fetch Responses

```typescript
// Create properly typed mock
const mockGlobalFetch = vi.fn()
global.fetch = mockGlobalFetch as typeof global.fetch

// Mock successful fetch
mockGlobalFetch.mockResolvedValue({
  ok: true,
  status: 200,
  statusText: 'OK'
} as Response)

// Mock failed fetch
mockGlobalFetch.mockResolvedValue({
  ok: false,
  status: 500,
  statusText: 'Internal Server Error'
} as Response)

// Mock fetch with custom implementation
mockGlobalFetch.mockImplementation(() => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ ok: true, status: 200 } as Response)
    }, 100)
  })
})
```

### Mocking File Objects

```typescript
// Create test files
const testFile = new File(['test content'], 'avatar.jpg', { 
  type: 'image/jpeg' 
})

// Use actual file size in tests
const mockResponse = {
  fileSize: testFile.size, // ✅ Use actual size
  // ... other properties
}
```

## Test Structure and Conventions

### Describe Blocks

Organize tests hierarchically:

```typescript
describe('Component/Feature Name', () => {
  describe('Feature Group 1', () => {
    it('should test specific behavior 1', () => { ... })
    it('should test specific behavior 2', () => { ... })
  })

  describe('Feature Group 2', () => {
    it('should test specific behavior 3', () => { ... })
  })
})
```

### Test Naming

Use descriptive, behavior-focused names:

```typescript
// ✅ GOOD: Clear what is being tested
it('should load user profile data on mount', () => { ... })
it('should handle profile loading errors gracefully', () => { ... })
it('should update local state after successful save', () => { ... })

// ❌ BAD: Vague, unclear
it('works', () => { ... })
it('test profile', () => { ... })
```

### Arrange-Act-Assert Pattern

Structure tests clearly:

```typescript
it('should do something', () => {
  // Arrange: Set up test data and mocks
  const mockData = { id: '123', name: 'Test' }
  mockFetch.mockResolvedValue(mockData)
  
  // Act: Execute the functionality
  const result = await someFunction()
  
  // Assert: Verify the result
  expect(result).toEqual(mockData)
  expect(mockFetch).toHaveBeenCalledWith(expectedUrl)
})
```

### Cleanup

Always reset mocks in `beforeEach`:

```typescript
beforeEach(() => {
  vi.clearAllMocks()        // Clear all mocks
  mockFetch.mockClear()     // Clear specific mock
  mockGlobalFetch.mockClear()
})
```

## Common Patterns

### Testing Composables

```typescript
describe('useComposable', () => {
  it('should return expected values', () => {
    const { value, method } = useComposable()
    
    expect(value.value).toBeDefined()
    expect(typeof method).toBe('function')
  })

  it('should handle async operations', async () => {
    mockFetch.mockResolvedValue({ data: 'test' })
    
    const { loadData } = useComposable()
    await loadData()
    
    expect(mockFetch).toHaveBeenCalled()
  })
})
```

### Testing Error Handling

```typescript
it('should handle errors gracefully', async () => {
  mockFetch.mockRejectedValue(new Error('Network error'))
  
  const { loadData, error } = useComposable()
  
  await expect(loadData()).rejects.toThrow()
  expect(error.value).toBeTruthy()
  expect(error.value?.message).toContain('Network error')
})
```

### Testing State Management

```typescript
it('should track loading state', async () => {
  mockFetch.mockImplementation(() => 
    new Promise(resolve => setTimeout(() => resolve({}), 100))
  )
  
  const { loadData, loading } = useComposable()
  const promise = loadData()
  
  expect(loading.value).toBe(true)
  
  await promise
  
  expect(loading.value).toBe(false)
})
```

### Testing File Uploads

```typescript
it('should upload file successfully', async () => {
  const testFile = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' })
  const mockResponse = {
    presignedUrl: 'https://example.com/upload',
    key: 'file-key-123',
    filename: 'file-key-123',
    contentType: 'image/jpeg',
    fileSize: testFile.size,
    expiresIn: 86400,
    uploadedBy: 'user-123',
    uploadedAt: '2024-01-01T00:00:00Z',
    originalFilename: 'avatar.jpg'
  }
  
  mockFetch.mockResolvedValue(mockResponse)
  mockGlobalFetch.mockResolvedValue({
    ok: true,
    status: 200
  } as Response)
  
  const { uploadFile } = useAvatarUpload()
  const result = await uploadFile(testFile)
  
  expect(result.filename).toBe('file-key-123')
  expect(mockGlobalFetch).toHaveBeenCalled()
})
```

## Assertions

### Common Assertions

```typescript
// Equality
expect(value).toBe(expected)           // Strict equality
expect(value).toEqual(expected)        // Deep equality
expect(value).toStrictEqual(expected) // Strict deep equality

// Truthiness
expect(value).toBeTruthy()
expect(value).toBeFalsy()
expect(value).toBeNull()
expect(value).toBeUndefined()
expect(value).toBeDefined()

// Types
expect(value).toBeInstanceOf(Class)
expect(typeof value).toBe('string')

// Arrays/Objects
expect(array).toHaveLength(2)
expect(array).toContain(item)
expect(object).toHaveProperty('key')
expect(object).toMatchObject({ key: 'value' })

// Functions
expect(mockFn).toHaveBeenCalled()
expect(mockFn).toHaveBeenCalledWith(arg1, arg2)
expect(mockFn).toHaveBeenCalledTimes(2)
expect(mockFn).toHaveReturnedWith(value)

// Async
await expect(asyncFn()).resolves.toBe(value)
await expect(asyncFn()).rejects.toThrow('Error message')
```

### Using `expect.objectContaining`

For partial object matching:

```typescript
expect(mockFetch).toHaveBeenCalledWith(
  'http://localhost:8787/api/endpoint',
  expect.objectContaining({
    method: 'POST',
    credentials: 'include',
    body: expect.objectContaining({
      name: 'John Doe'
    })
  })
)
```

## Troubleshooting

### Common Issues

**Issue**: `useRuntimeConfig is not defined`
- **Cause**: Test is in `test/unit/` but composable requires Nuxt runtime
- **Solution**: Move test to `test/nuxt/`

**Issue**: `Cannot find module '~/composables/...'`
- **Cause**: Using Nuxt alias in unit test (Node environment)
- **Solution**: Use relative path or move to `test/nuxt/`

**Issue**: Mocks not working
- **Cause**: Mocks not properly set up or cleared
- **Solution**: 
  - Use `vi.stubGlobal` for global mocks
  - Clear mocks in `beforeEach`
  - Ensure mocks are set before the code runs

**Issue**: Tests timing out
- **Cause**: Unresolved promises or missing await
- **Solution**: 
  - Check all async operations have `await`
  - Verify mocks return resolved promises
  - Add timeout if needed: `it('test', async () => { ... }, { timeout: 5000 })`

**Issue**: Type errors with mocks
- **Cause**: Improper type casting
- **Solution**: Use proper type assertions:
  ```typescript
  // ✅ GOOD
  global.fetch = mockGlobalFetch as typeof global.fetch
  mockGlobalFetch.mockResolvedValue({ ok: true } as Response)
  
  // ❌ BAD
  ;(global.fetch as any).mockResolvedValue({ ... })
  ```

### Debugging Tests

1. **Run specific test file**:
   ```bash
   pnpm test test/nuxt/composables/useAvatarUpload.test.ts
   ```

2. **Run tests in watch mode**:
   ```bash
   pnpm test --watch
   ```

3. **Run with UI**:
   ```bash
   pnpm test:ui
   ```

4. **Check test coverage**:
   ```bash
   pnpm test:coverage
   ```

## Best Practices Summary

1. **Organize by test type**: Unit tests in `test/unit/`, Nuxt tests in `test/nuxt/`
2. **Use proper environment**: Node for pure logic, Nuxt for runtime-dependent code
3. **Create readable mocks**: Use named variables instead of cryptic type casts
4. **Clear mocks properly**: Always reset in `beforeEach`
5. **Use descriptive names**: Test names should read like documentation
6. **Follow AAA pattern**: Arrange, Act, Assert
7. **Test behavior, not implementation**: Focus on what users see
8. **Handle errors**: Test both success and failure paths
9. **Keep tests isolated**: Each test should be independent
10. **Use proper types**: Type mocks correctly for better IDE support

## References

- [Official Nuxt Testing Documentation](https://nuxt.com/docs/getting-started/testing)
- [@nuxt/test-utils Module](https://nuxt.com/modules/test-utils)
- [Vitest Documentation](https://vitest.dev/)

