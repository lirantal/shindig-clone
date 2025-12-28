<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'

// Use the auth layout
definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: 'Login',
  description: 'Login to your account to continue'
})

const toast = useToast()
const { signIn, error } = useAuth()

const fields: AuthFormField[] = [{
  name: 'email',
  type: 'email',
  label: 'Email',
  placeholder: 'Enter your email',
  required: true
}, {
  name: 'password',
  label: 'Password',
  type: 'password',
  placeholder: 'Enter your password',
  required: true
}, {
  name: 'remember',
  label: 'Remember me',
  type: 'checkbox'
}]

const providers = [{
  label: 'Google',
  icon: 'i-simple-icons-google',
  onClick: () => {
    toast.add({ title: 'Google', description: 'Login with Google' })
  }
}, {
  label: 'GitHub',
  icon: 'i-simple-icons-github',
  onClick: () => {
    toast.add({ title: 'GitHub', description: 'Login with GitHub' })
  }
}]

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Must be at least 8 characters')
})

type Schema = z.output<typeof schema>

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  try {
    await signIn(payload.data.email, payload.data.password)

    toast.add({
      title: 'Login successful',
      description: 'Welcome back!',
      color: 'primary'
    })

    // Redirect to dashboard
    await navigateTo('/')
  } catch {
    toast.add({
      title: 'Login failed',
      description: error.value || 'Please check your credentials and try again',
      color: 'error'
    })
  }
}
</script>

<template>
  <UAuthForm
    :schema="schema"
    :fields="fields"
    :providers="providers"
    title="Welcome back!"
    description="Enter your credentials to access your account."
    icon="i-lucide-lock"
    @submit="onSubmit"
  >
    <template #description>
      Don't have an account? <ULink to="/register" class="text-primary font-medium">Sign up</ULink>.
    </template>
    <template #password-hint>
      <ULink to="/forgot-password" class="text-primary font-medium" tabindex="-1">Forgot password?</ULink>
    </template>
    <template #footer>
      By signing in, you agree to our <ULink to="/terms" class="text-primary font-medium">Terms of Service</ULink>.
    </template>
  </UAuthForm>
</template>
