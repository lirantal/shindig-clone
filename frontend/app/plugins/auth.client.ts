import { createAuthClient } from 'better-auth/vue'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  const authClient = createAuthClient({
    baseURL: config.public.apiBaseUrl + '/api/auth'
  })

  return {
    provide: {
      authClient
    }
  }
})
