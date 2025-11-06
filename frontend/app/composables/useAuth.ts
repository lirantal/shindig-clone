import type { User, Session } from 'better-auth/types'

export const useAuth = () => {
  const { $authClient } = useNuxtApp()
  
  // Reactive state
  const session = ref<Session | null>(null)
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Get current session
  const getSession = async () => {
    try {
      isLoading.value = true
      error.value = null
      
      const result = await $authClient.getSession()
      session.value = result.data?.session || null
      user.value = result.data?.user || null
      
      return result.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to get session'
      console.error('Auth error:', err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      isLoading.value = true
      error.value = null
      
      const result = await $authClient.signIn.email({
        email,
        password
      })
      
      if (result.data) {
        session.value = result.data.session
        user.value = result.data.user
        return result.data
      }
      
      throw new Error('Sign in failed')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Sign in failed'
      console.error('Sign in error:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Sign up with email, password, and name
  const signUp = async (email: string, password: string, name: string) => {
    try {
      isLoading.value = true
      error.value = null
      
      const result = await $authClient.signUp.email({
        email,
        password,
        name
      })
      
      if (result.data) {
        session.value = result.data.session
        user.value = result.data.user
        return result.data
      }
      
      throw new Error('Sign up failed')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Sign up failed'
      console.error('Sign up error:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Sign out
  const signOut = async () => {
    try {
      isLoading.value = true
      error.value = null
      
      await $authClient.signOut()
      
      session.value = null
      user.value = null
      
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Sign out failed'
      console.error('Sign out error:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Check if user is authenticated
  const isAuthenticated = computed(() => !!session.value && !!user.value)

  // Initialize session on composable creation
  onMounted(() => {
    getSession()
  })

  return {
    // State
    session: readonly(session),
    user: readonly(user),
    isLoading: readonly(isLoading),
    error: readonly(error),
    isAuthenticated,
    
    // Methods
    getSession,
    signIn,
    signUp,
    signOut
  }
}
