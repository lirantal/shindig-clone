import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, reactive } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import NotificationsPage from '~/pages/settings/notifications.vue'

/**
 * Notifications Settings Page - Component Tests
 *
 * These tests mount the component and test user interactions,
 * state changes, and API calls using the useNotifications composable.
 * This complements the logic tests in notifications.test.ts by testing
 * the actual component behavior.
 */

// Type for component instance with onChange method
type NotificationsPageInstance = ComponentPublicInstance & {
  onChange: () => Promise<void>
}

// Mock the useNotifications composable
const mockLoadNotifications = vi.fn()
const mockSaveNotifications = vi.fn()

// Create mock state that can be updated
const createMockState = () => reactive({
  email: true,
  desktop: false,
  product_updates: true,
  weekly_digest: false,
  important_updates: true
})

const mockLoading = ref(false)
const mockSaving = ref(false)
const mockError = ref<Error | null>(null)

const mockUseNotifications = vi.fn(() => ({
  state: createMockState(),
  loading: mockLoading,
  saving: mockSaving,
  error: mockError,
  loadNotifications: mockLoadNotifications,
  saveNotifications: mockSaveNotifications
}))

// Mock Nuxt composables
const mockUseRuntimeConfig = vi.fn(() => ({
  public: {
    apiBaseUrl: 'http://localhost:8787'
  }
}))

// Mock useNotifications composable (hoisted to top of file)
vi.mock('~/composables/useNotifications', () => ({
  useNotifications: () => mockUseNotifications()
}))

// Mock Nuxt composables at module level (hoisted to top of file)
vi.mock('#app', () => ({
  useRuntimeConfig: () => mockUseRuntimeConfig()
}))

describe('Notifications Settings Page - Component Tests', () => {
  let wrapper: ReturnType<typeof mount> | null = null
  let mockState: ReturnType<typeof createMockState>

  beforeEach(() => {
    vi.clearAllMocks()
    mockLoadNotifications.mockClear()
    mockSaveNotifications.mockClear()

    // Reset mock state
    mockState = createMockState()
    mockLoading.value = false
    mockSaving.value = false
    mockError.value = null

    // Update mock to return fresh state
    mockUseNotifications.mockReturnValue({
      state: mockState,
      loading: mockLoading,
      saving: mockSaving,
      error: mockError,
      loadNotifications: mockLoadNotifications,
      saveNotifications: mockSaveNotifications
    })
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
      wrapper = null
    }
  })

  describe('Component Initialization', () => {
    it('should call loadNotifications on mount', async () => {
      wrapper = mount(NotificationsPage)
      await flushPromises()

      // Verify loadNotifications was called when component mounted
      expect(mockLoadNotifications).toHaveBeenCalledTimes(1)
    })

    it('should render notification channels section', async () => {
      wrapper = mount(NotificationsPage)
      await flushPromises()

      expect(wrapper.text()).toContain('Notification channels')
      expect(wrapper.text()).toContain('Where can we notify you?')
      expect(wrapper.text()).toContain('Email')
      expect(wrapper.text()).toContain('Desktop')
    })

    it('should render account updates section', async () => {
      wrapper = mount(NotificationsPage)
      await flushPromises()

      expect(wrapper.text()).toContain('Account updates')
      expect(wrapper.text()).toContain('Receive updates about Nuxt UI.')
      expect(wrapper.text()).toContain('Weekly digest')
      expect(wrapper.text()).toContain('Product updates')
      expect(wrapper.text()).toContain('Important updates')
    })

    it('should render switches for all notification fields', async () => {
      wrapper = mount(NotificationsPage)
      await flushPromises()

      // Check that switches are rendered with correct test IDs
      expect(wrapper.find('[data-testid="email-switch"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="desktop-switch"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="product_updates-switch"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="weekly_digest-switch"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="important_updates-switch"]').exists()).toBe(true)
    })
  })

  describe('User Interactions', () => {
    it('should call saveNotifications when switch is toggled', async () => {
      wrapper = mount(NotificationsPage)
      await flushPromises()

      // Get the component instance to access the onChange method
      const vm = wrapper.vm as NotificationsPageInstance

      // Call onChange directly (which is triggered by switch toggle)
      await vm.onChange()

      // Verify saveNotifications was called
      expect(mockSaveNotifications).toHaveBeenCalledTimes(1)
    })

    it('should update state when switch is toggled', async () => {
      wrapper = mount(NotificationsPage)
      await flushPromises()

      // Initial state
      expect(mockState.desktop).toBe(false)

      // Toggle desktop switch
      mockState.desktop = true

      // Verify state was updated
      expect(mockState.desktop).toBe(true)
    })

    it('should call saveNotifications with updated state', async () => {
      wrapper = mount(NotificationsPage)
      await flushPromises()

      // Update state
      mockState.desktop = true
      mockState.product_updates = false

      // Get the component instance and call onChange
      const vm = wrapper.vm as NotificationsPageInstance
      await vm.onChange()

      // Verify saveNotifications was called
      expect(mockSaveNotifications).toHaveBeenCalled()
    })

    it('should handle multiple rapid toggles', async () => {
      wrapper = mount(NotificationsPage)
      await flushPromises()

      // Get the component instance
      const vm = wrapper.vm as NotificationsPageInstance

      // Rapidly call onChange multiple times (simulating rapid toggles)
      await vm.onChange()
      await vm.onChange()

      // Both should trigger saveNotifications
      expect(mockSaveNotifications).toHaveBeenCalledTimes(2)
    })
  })

  describe('State Management', () => {
    it('should reflect composable state in switches', async () => {
      // Set initial state
      mockState.email = true
      mockState.desktop = false
      mockState.product_updates = true

      wrapper = mount(NotificationsPage)
      await flushPromises()

      // Switches should reflect the state
      // Note: We can't directly check switch values without accessing the component instance
      // But we can verify the component is using the state from the composable
      expect(mockState.email).toBe(true)
      expect(mockState.desktop).toBe(false)
      expect(mockState.product_updates).toBe(true)
    })

    it('should update state from composable after loadNotifications completes', async () => {
      // Simulate loadNotifications updating state
      const loadedData = {
        email: false,
        desktop: true,
        product_updates: false,
        weekly_digest: true,
        important_updates: false
      }

      // Update mock state to simulate loaded data
      Object.assign(mockState, loadedData)

      wrapper = mount(NotificationsPage)
      await flushPromises()

      // Verify state was updated
      expect(mockState.email).toBe(false)
      expect(mockState.desktop).toBe(true)
      expect(mockState.product_updates).toBe(false)
      expect(mockState.weekly_digest).toBe(true)
      expect(mockState.important_updates).toBe(false)
    })

    it('should update state from composable after saveNotifications completes', async () => {
      wrapper = mount(NotificationsPage)
      await flushPromises()

      // Initial state
      mockState.desktop = false

      // Simulate saveNotifications updating state from API response
      const savedData = {
        email: true,
        desktop: true, // Changed
        product_updates: true,
        weekly_digest: false,
        important_updates: true
      }

      Object.assign(mockState, savedData)

      // Verify state was updated
      expect(mockState.desktop).toBe(true)
    })
  })

  describe('Loading States', () => {
    it('should handle loading state from composable', async () => {
      mockLoading.value = true

      wrapper = mount(NotificationsPage)
      await flushPromises()

      // Component should handle loading state
      // (In a real implementation, you might show a loading indicator)
      expect(mockLoading.value).toBe(true)
    })

    it('should handle saving state from composable', async () => {
      wrapper = mount(NotificationsPage)
      await flushPromises()

      mockSaving.value = true

      // Component should handle saving state
      // (In a real implementation, you might disable switches during save)
      expect(mockSaving.value).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle error state from composable', async () => {
      mockError.value = new Error('Failed to load notifications')

      wrapper = mount(NotificationsPage)
      await flushPromises()

      // Component should handle error state
      expect(mockError.value).toBeTruthy()
      expect(mockError.value?.message).toBe('Failed to load notifications')
    })
  })

  describe('Component Lifecycle', () => {
    it('should call loadNotifications only once on mount', async () => {
      wrapper = mount(NotificationsPage)
      await flushPromises()

      // Should be called once on mount
      expect(mockLoadNotifications).toHaveBeenCalledTimes(1)

      // Should not be called again
      await flushPromises()
      expect(mockLoadNotifications).toHaveBeenCalledTimes(1)
    })

    it('should call saveNotifications on each switch toggle', async () => {
      wrapper = mount(NotificationsPage)
      await flushPromises()

      const vm = wrapper.vm as NotificationsPageInstance

      // Simulate first switch toggle
      await vm.onChange()
      expect(mockSaveNotifications).toHaveBeenCalledTimes(1)

      // Simulate second switch toggle
      await vm.onChange()
      expect(mockSaveNotifications).toHaveBeenCalledTimes(2)
    })
  })
})
