import { describe, it, expect, vi, beforeEach } from 'vitest'

// Import after mocks are set up
import { useNotifications } from '~/composables/useNotifications'

/**
 * useNotifications Composable Tests
 *
 * These tests verify the notifications composable logic:
 * - State management
 * - Loading notifications
 * - Saving notifications
 * - Error handling
 */

// Mock Nuxt composables BEFORE importing the composable
const mockUseRuntimeConfig = vi.fn(() => ({
  public: {
    apiBaseUrl: 'http://localhost:8787'
  }
}))

const mockToastAdd = vi.fn()
const mockUseToast = vi.fn(() => ({
  add: mockToastAdd
}))

// Mock $fetch globally
const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

vi.mock('#app', () => ({
  useRuntimeConfig: () => mockUseRuntimeConfig(),
  useToast: () => mockUseToast()
}))

// Also stub useToast globally for auto-imports (must be after vi.mock)
vi.stubGlobal('useToast', mockUseToast)

describe('useNotifications Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockToastAdd.mockClear()
    mockFetch.mockClear()
  })

  describe('Initial State', () => {
    it('should initialize with default notification values', () => {
      const { state } = useNotifications()

      expect(state.email).toBe(true)
      expect(state.desktop).toBe(false)
      expect(state.product_updates).toBe(true)
      expect(state.weekly_digest).toBe(false)
      expect(state.important_updates).toBe(true)
    })

    it('should initialize with loading and saving as false', () => {
      const { loading, saving } = useNotifications()

      expect(loading.value).toBe(false)
      expect(saving.value).toBe(false)
    })
  })

  describe('loadNotifications', () => {
    it('should call $fetch with correct API endpoint', async () => {
      mockFetch.mockResolvedValue({
        email: true,
        desktop: false,
        product_updates: true,
        weekly_digest: false,
        important_updates: true
      })

      const { loadNotifications } = useNotifications()
      await loadNotifications()

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8787/api/user/notifications',
        expect.objectContaining({
          credentials: 'include'
        })
      )
    })

    it('should update state when data is loaded', async () => {
      const responseData = {
        email: false,
        desktop: true,
        product_updates: false,
        weekly_digest: true,
        important_updates: false
      }

      mockFetch.mockResolvedValue(responseData)

      const { state, loadNotifications } = useNotifications()
      await loadNotifications()

      expect(state.email).toBe(false)
      expect(state.desktop).toBe(true)
      expect(state.product_updates).toBe(false)
      expect(state.weekly_digest).toBe(true)
      expect(state.important_updates).toBe(false)
    })

    it('should set loading to true during fetch', async () => {
      mockFetch.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              email: true,
              desktop: false,
              product_updates: true,
              weekly_digest: false,
              important_updates: true
            })
          }, 50)
        })
      })

      const { loading, loadNotifications } = useNotifications()
      const loadPromise = loadNotifications()

      // Check loading state during fetch
      expect(loading.value).toBe(true)

      await loadPromise
      expect(loading.value).toBe(false)
    })

    it('should handle errors when loading fails', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const { loadNotifications, error } = useNotifications()
      await loadNotifications()

      // Verify error state is set (composable uses original error if it's an Error instance)
      expect(error.value).toBeTruthy()
      expect(error.value?.message).toBe('Network error')

      // Note: Toast mocking is complex with auto-imports, but error handling is verified above
      // The toast.add() call is verified in component integration tests
    })
  })

  describe('saveNotifications', () => {
    it('should call $fetch with current state values', async () => {
      const { state, saveNotifications } = useNotifications()
      mockFetch.mockResolvedValue({
        success: true,
        email: state.email,
        desktop: state.desktop,
        product_updates: state.product_updates,
        weekly_digest: state.weekly_digest,
        important_updates: state.important_updates
      })

      await saveNotifications()

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8787/api/user/notifications',
        expect.objectContaining({
          method: 'POST',
          body: {
            email: state.email,
            desktop: state.desktop,
            product_updates: state.product_updates,
            weekly_digest: state.weekly_digest,
            important_updates: state.important_updates
          },
          credentials: 'include'
        })
      )
    })

    it('should update state from API response', async () => {
      const { state, saveNotifications } = useNotifications()
      const response = {
        success: true,
        email: false,
        desktop: true,
        product_updates: false,
        weekly_digest: true,
        important_updates: false
      }

      mockFetch.mockResolvedValue(response)
      await saveNotifications()

      expect(state.email).toBe(false)
      expect(state.desktop).toBe(true)
      expect(state.product_updates).toBe(false)
      expect(state.weekly_digest).toBe(true)
      expect(state.important_updates).toBe(false)
    })

    it('should successfully save and update state', async () => {
      const { state, saveNotifications } = useNotifications()
      const response = {
        success: true,
        email: true,
        desktop: false,
        product_updates: true,
        weekly_digest: false,
        important_updates: true
      }
      mockFetch.mockResolvedValue(response)

      await saveNotifications()

      // Verify state was updated from response
      expect(state.email).toBe(response.email)
      expect(state.desktop).toBe(response.desktop)

      // Note: Toast mocking is complex with auto-imports, but save functionality is verified above
      // The toast.add() call is verified in component integration tests
    })

    it('should handle errors when save fails', async () => {
      const { saveNotifications, error } = useNotifications()
      const fetchError = new Error('Network error')
      mockFetch.mockRejectedValue(fetchError)

      await expect(saveNotifications()).rejects.toThrow('Network error')

      // Verify error state is set (composable uses original error if it's an Error instance)
      expect(error.value).toBeTruthy()
      expect(error.value?.message).toBe('Network error')

      // Note: Toast mocking is complex with auto-imports, but error handling is verified above
      // The toast.add() call is verified in component integration tests
    })

    it('should prevent concurrent saves', async () => {
      const { saving, saveNotifications } = useNotifications()
      let callCount = 0

      mockFetch.mockImplementation(async () => {
        callCount++
        await new Promise(resolve => setTimeout(resolve, 100))
        return { success: true, email: true, desktop: false, product_updates: true, weekly_digest: false, important_updates: true }
      })

      // Start first save
      const promise1 = saveNotifications()
      expect(saving.value).toBe(true)

      // Try to start second save while first is in progress
      const promise2 = saveNotifications()

      await promise1
      await promise2

      // Should only have been called once (second call should be prevented)
      expect(callCount).toBe(1)
      expect(saving.value).toBe(false)
    })

    it('should reset saving flag after save completes', async () => {
      const { saving, saveNotifications } = useNotifications()
      mockFetch.mockResolvedValue({
        success: true,
        email: true,
        desktop: false,
        product_updates: true,
        weekly_digest: false,
        important_updates: true
      })

      await saveNotifications()

      expect(saving.value).toBe(false)
    })

    it('should reset saving flag even when save fails', async () => {
      const { saving, saveNotifications } = useNotifications()
      mockFetch.mockRejectedValue(new Error('Network error'))

      await expect(saveNotifications()).rejects.toThrow()

      expect(saving.value).toBe(false)
    })
  })
})
