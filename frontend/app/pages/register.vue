<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'

// Use the auth layout
definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: 'Sign Up',
  description: 'Create a new account to get started'
})

const toast = useToast()
const { signUp, error } = useAuth()

const fields: AuthFormField[] = [{
  name: 'firstName',
  type: 'text',
  label: 'First Name',
  placeholder: 'Enter your first name',
  required: true
}, {
  name: 'lastName',
  type: 'text',
  label: 'Last Name',
  placeholder: 'Enter your last name',
  required: true
}, {
  name: 'email',
  type: 'email',
  label: 'Email',
  placeholder: 'Enter your email',
  required: true
}, {
  name: 'password',
  label: 'Password',
  type: 'password',
  placeholder: 'Create a password',
  required: true
}, {
  name: 'confirmPassword',
  label: 'Confirm Password',
  type: 'password',
  placeholder: 'Confirm your password',
  required: true
}, {
  name: 'terms',
  label: 'I agree to the Terms of Service and Privacy Policy',
  type: 'checkbox',
  required: true
}]

const providers = [{
  label: 'Google',
  icon: 'i-simple-icons-google',
  onClick: () => {
    toast.add({ title: 'Google', description: 'Sign up with Google' })
  }
}, {
  label: 'GitHub',
  icon: 'i-simple-icons-github',
  onClick: () => {
    toast.add({ title: 'GitHub', description: 'Sign up with GitHub' })
  }
}]

const schema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Please confirm your password'),
  terms: z.boolean().refine(val => val === true, 'You must agree to the terms')
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords don\'t match',
  path: ['confirmPassword']
})

type Schema = z.output<typeof schema>

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  try {
    const fullName = `${payload.data.firstName} ${payload.data.lastName}`
    await signUp(payload.data.email, payload.data.password, fullName)

    toast.add({
      title: 'Account created successfully',
      description: 'Welcome! Please check your email to verify your account.',
      color: 'primary'
    })

    // Redirect to dashboard
    await navigateTo('/')
  } catch {
    toast.add({
      title: 'Registration failed',
      description: error.value || 'Please check your information and try again',
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
    title="Create your account"
    description="Get started with your free account today."
    icon="i-lucide-user-plus"
    @submit="onSubmit"
  >
    <template #description>
      Already have an account? <ULink to="/login" class="text-primary font-medium">Sign in</ULink>.
    </template>
    <template #footer>
      By creating an account, you agree to our <ULink to="/terms" class="text-primary font-medium">Terms of Service</ULink> and <ULink to="/privacy" class="text-primary font-medium">Privacy Policy</ULink>.
    </template>
  </UAuthForm>
</template>
