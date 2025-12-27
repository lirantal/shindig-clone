<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const config = useRuntimeConfig()
const fileRef = ref<HTMLInputElement>()
const selectedFile = ref<File | null>(null)
const { uploadFile, uploading, uploadProgress, error: uploadError, clearError } = useAvatarUpload()

const profileSchema = z.object({
  name: z.string().min(2, 'Too short'),
  avatar: z.string().optional(),
  bio: z.string().optional()
})

type ProfileSchema = z.output<typeof profileSchema>

const profile = reactive<Partial<ProfileSchema>>({
  name: '',
  avatar: undefined,
  bio: undefined
})
const toast = useToast()

// Type for backend profile response
type ProfileResponse = {
  id: string
  name: string
  email: string
  image: string | null
  emailVerified: boolean
  createdAt: string
  updatedAt: string
}

// Helper function to construct avatar URL from image key
async function getAvatarUrl(imageKey: string | null | undefined): Promise<string | undefined> {
  if (!imageKey) {
    return undefined
  }

  // If CDN URL is configured, construct the URL directly
  if (config.public.r2CdnUrl) {
    return `${config.public.r2CdnUrl}/gallery/${imageKey}`
  }

  // Otherwise, fetch signed URL from backend
  try {
    type ImageResponse = {
      hasImage: boolean
      downloadUrl?: string
    }
    const response = await $fetch<ImageResponse>(
      `${config.public.apiBaseUrl}/api/user/profile/image`,
      {
        credentials: 'include'
      }
    )
    return response.hasImage ? response.downloadUrl : undefined
  } catch (err) {
    console.error('Failed to get avatar URL:', err)
    return undefined
  }
}

// Load profile data on mount
const { error: loadError } = await useFetch<ProfileResponse>(
  `${config.public.apiBaseUrl}/api/user/profile`,
  {
    credentials: 'include',
    lazy: true,
    onResponse: async ({ response }) => {
      if (response._data) {
        const userData = response._data
        // Map backend response to frontend form state
        profile.name = userData.name || ''

        // Construct avatar URL
        profile.avatar = await getAvatarUrl(userData.image)

        // Bio is not in backend schema, so leave undefined
        profile.bio = undefined
      }
    }
  }
)

// Show error toast if loading fails
if (loadError.value) {
  toast.add({
    title: 'Error',
    description: 'Failed to load profile data. Please refresh the page.',
    icon: 'i-lucide-alert-circle',
    color: 'error'
  })
}

async function onSubmit(event: FormSubmitEvent<ProfileSchema>) {
  try {
    // If a new avatar file was selected, upload it first
    if (selectedFile.value) {
      toast.add({
        title: 'Uploading avatar...',
        description: 'Please wait while we upload your avatar.',
        icon: 'i-lucide-upload',
        color: 'primary'
      })

      await uploadFile(selectedFile.value)

      // Update local profile with CDN URL for preview
      if (config.public.r2CdnUrl) {
        // The backend manages the stable key, so we can construct a preview URL
        // For now, just keep the local preview until we get the actual URL from backend
        profile.avatar = URL.createObjectURL(selectedFile.value)
      }

      // Clear selected file after successful upload
      selectedFile.value = null
    }

    // Submit profile data (name only - avatar is handled separately by backend)
    const profileData = {
      name: event.data.name,
      bio: event.data.bio
    }

    // Make API call to update user profile
    type UpdateProfileResponse = {
      success: boolean
      user: {
        id: string
        name: string
        email: string
        image: string | null
        emailVerified: boolean
        createdAt: string
        updatedAt: string
      }
    }
    const response = await $fetch<UpdateProfileResponse>(
      `${config.public.apiBaseUrl}/api/user/profile`,
      {
        method: 'POST',
        body: profileData,
        credentials: 'include'
      }
    )

    // Update local state with response
    if (response.user) {
      profile.name = response.user.name
      // Update avatar URL if image exists
      profile.avatar = await getAvatarUrl(response.user.image)
    }

    toast.add({
      title: 'Success',
      description: 'Your settings have been updated.',
      icon: 'i-lucide-check',
      color: 'success'
    })
  } catch (err: unknown) {
    toast.add({
      title: 'Error',
      description: err instanceof Error ? err.message : 'Failed to update settings.',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  }
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement

  if (!input.files?.length) {
    return
  }

  // Store the selected file for later upload
  selectedFile.value = input.files[0]!

  // Create local preview
  profile.avatar = URL.createObjectURL(input.files[0]!)

  // Clear any previous upload errors
  clearError()
}

function onFileClick() {
  fileRef.value?.click()
}
</script>

<template>
  <UForm
    id="settings"
    :schema="profileSchema"
    :state="profile"
    @submit="onSubmit"
  >
    <UPageCard
      title="Profile"
      description="These informations will be displayed publicly."
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <UButton
        form="settings"
        label="Save changes"
        color="neutral"
        type="submit"
        class="w-fit lg:ms-auto"
      />
    </UPageCard>

    <UPageCard variant="subtle">
      <UFormField
        name="name"
        label="Name"
        description="Will appear on receipts, invoices, and other communication."
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput
          v-model="profile.name"
          autocomplete="off"
        />
      </UFormField>
      <USeparator />
      <USeparator />
      <UFormField
        name="avatar"
        label="Avatar"
        description="JPG, GIF or PNG. 1MB Max."
        class="flex max-sm:flex-col justify-between sm:items-center gap-4"
      >
        <div class="flex flex-col gap-3 w-full">
          <div class="flex flex-wrap items-center gap-3">
            <UAvatar
              :src="profile.avatar"
              :alt="profile.name"
              size="lg"
            />
            <UButton
              label="Choose"
              color="neutral"
              :disabled="uploading"
              @click="onFileClick"
            />
            <input
              ref="fileRef"
              type="file"
              class="hidden"
              accept=".jpg, .jpeg, .png, .gif"
              @change="onFileChange"
            >
            <span v-if="uploading" class="text-sm text-muted">
              Uploading... {{ uploadProgress }}%
            </span>
          </div>
          <div v-if="uploadError" class="text-sm text-red-500">
            {{ uploadError.message }}
          </div>
        </div>
      </UFormField>
      <USeparator />
      <UFormField
        name="bio"
        label="Bio"
        description="Brief description for your profile. URLs are hyperlinked."
        class="flex max-sm:flex-col justify-between items-start gap-4"
        :ui="{ container: 'w-full' }"
      >
        <UTextarea
          v-model="profile.bio"
          :rows="5"
          autoresize
          class="w-full"
        />
      </UFormField>
    </UPageCard>
  </UForm>
</template>
