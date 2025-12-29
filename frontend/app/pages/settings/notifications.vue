<script setup lang="ts">
const config = useRuntimeConfig()
const toast = useToast()

const state = reactive<{ [key: string]: boolean }>({
  email: true,
  desktop: false,
  product_updates: true,
  weekly_digest: false,
  important_updates: true
})

const loading = ref(false)
const saving = ref(false)

const sections = [{
  title: 'Notification channels',
  description: 'Where can we notify you?',
  fields: [{
    name: 'email',
    label: 'Email',
    description: 'Receive a daily email digest.'
  }, {
    name: 'desktop',
    label: 'Desktop',
    description: 'Receive desktop notifications.'
  }]
}, {
  title: 'Account updates',
  description: 'Receive updates about Nuxt UI.',
  fields: [{
    name: 'weekly_digest',
    label: 'Weekly digest',
    description: 'Receive a weekly digest of news.'
  }, {
    name: 'product_updates',
    label: 'Product updates',
    description: 'Receive a monthly email with all new features and updates.'
  }, {
    name: 'important_updates',
    label: 'Important updates',
    description: 'Receive emails about important updates like security fixes, maintenance, etc.'
  }]
}]

// Type for backend notifications response
type NotificationsResponse = {
  email: boolean
  desktop: boolean
  product_updates: boolean
  weekly_digest: boolean
  important_updates: boolean
}

// Load notification settings on mount
const { error: loadError } = await useFetch<NotificationsResponse>(
  `${config.public.apiBaseUrl}/api/user/notifications`,
  {
    credentials: 'include',
    lazy: true,
    onResponse: ({ response }) => {
      if (response._data) {
        const data = response._data
        // Update state with loaded data
        state.email = data.email
        state.desktop = data.desktop
        state.product_updates = data.product_updates
        state.weekly_digest = data.weekly_digest
        state.important_updates = data.important_updates
      }
    }
  }
)

// Show error toast if loading fails
if (loadError.value) {
  toast.add({
    title: 'Error',
    description: 'Failed to load notification settings. Please refresh the page.',
    icon: 'i-lucide-alert-circle',
    color: 'error'
  })
}

async function onChange() {
  if (saving.value) {
    return // Prevent concurrent saves
  }

  saving.value = true

  try {
    type UpdateNotificationsResponse = {
      success: boolean
      email: boolean
      desktop: boolean
      product_updates: boolean
      weekly_digest: boolean
      important_updates: boolean
    }

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
    toast.add({
      title: 'Error',
      description: err instanceof Error ? err.message : 'Failed to update notification settings.',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div v-for="(section, index) in sections" :key="index">
    <UPageCard
      :title="section.title"
      :description="section.description"
      variant="naked"
      class="mb-4"
    />

    <UPageCard variant="subtle" :ui="{ container: 'divide-y divide-default' }">
      <UFormField
        v-for="field in section.fields"
        :key="field.name"
        :name="field.name"
        :label="field.label"
        :description="field.description"
        class="flex items-center justify-between not-last:pb-4 gap-2"
      >
        <USwitch
          v-model="state[field.name]"
          @update:model-value="onChange"
        />
      </UFormField>
    </UPageCard>
  </div>
</template>
