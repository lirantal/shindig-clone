export type NotificationsState = {
  email: boolean
  desktop: boolean
  product_updates: boolean
  weekly_digest: boolean
  important_updates: boolean
} & { [key: string]: boolean }

export type NotificationsResponse = NotificationsState

export type UpdateNotificationsResponse = {
  success: boolean
} & NotificationsState

export const useNotifications = () => {
  const config = useRuntimeConfig()
  const toast = useToast()

  const state = reactive<NotificationsState>({
    email: true,
    desktop: false,
    product_updates: true,
    weekly_digest: false,
    important_updates: true
  })

  const loading = ref(false)
  const saving = ref(false)
  const error = ref<Error | null>(null)

  // Load notification settings
  const loadNotifications = async () => {
    loading.value = true
    error.value = null

    try {
      const data = await $fetch<NotificationsResponse>(
        `${config.public.apiBaseUrl}/api/user/notifications`,
        {
          credentials: 'include'
        }
      )

      // Update state with loaded data
      state.email = data.email
      state.desktop = data.desktop
      state.product_updates = data.product_updates
      state.weekly_digest = data.weekly_digest
      state.important_updates = data.important_updates
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to load notification settings')
      toast.add({
        title: 'Error',
        description: 'Failed to load notification settings. Please refresh the page.',
        icon: 'i-lucide-alert-circle',
        color: 'error'
      })
    } finally {
      loading.value = false
    }
  }

  // Save notification settings
  const saveNotifications = async () => {
    if (saving.value) {
      return // Prevent concurrent saves
    }

    saving.value = true
    error.value = null

    try {
      const response = await $fetch<UpdateNotificationsResponse>(
        `${config.public.apiBaseUrl}/api/user/notifications`,
        {
          method: 'POST',
          body: {
            email: state.email,
            desktop: state.desktop,
            product_updates: state.product_updates,
            weekly_digest: state.weekly_digest,
            important_updates: state.important_updates
          },
          credentials: 'include'
        }
      )

      // Update state with response (in case backend normalizes values)
      if (response) {
        state.email = response.email
        state.desktop = response.desktop
        state.product_updates = response.product_updates
        state.weekly_digest = response.weekly_digest
        state.important_updates = response.important_updates
      }

      toast.add({
        title: 'Success',
        description: 'Notification settings have been updated.',
        icon: 'i-lucide-check',
        color: 'success'
      })
    } catch (err: unknown) {
      error.value = err instanceof Error ? err : new Error('Failed to update notification settings')
      toast.add({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update notification settings.',
        icon: 'i-lucide-alert-circle',
        color: 'error'
      })
      throw err
    } finally {
      saving.value = false
    }
  }

  return {
    state,
    loading: readonly(loading),
    saving: readonly(saving),
    error: readonly(error),
    loadNotifications,
    saveNotifications
  }
}
