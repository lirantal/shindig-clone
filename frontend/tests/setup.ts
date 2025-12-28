import { vi } from 'vitest'

// Mock global fetch if needed
global.fetch = global.fetch || vi.fn()

// Mock window.URL.createObjectURL for file upload tests
if (typeof window !== 'undefined') {
  window.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/test-url')
  window.URL.revokeObjectURL = vi.fn()
}

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn()
}

