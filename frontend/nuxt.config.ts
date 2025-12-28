// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@vueuse/nuxt',
    '@nuxtjs/i18n',
    '@nuxt/test-utils/module'
  ],

  ssr: false,

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:8787',
      r2CdnUrl: process.env.NUXT_PUBLIC_R2_CDN_URL || ''
    }
  },

  routeRules: {
    '/api/**': {
      cors: true
    }
  },

  devServer: {
    port: 3005
  },

  compatibilityDate: '2024-07-11',

  nitro: {
    /*
    // the following nitro.devProxy config isn't needed when using Caddy to manage
    // the reverse proxy and domain handling
    devProxy: {
      '/api': {
        target: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:8787',
        changeOrigin: true,
        prependPath: true
      }
    }
    */
  },

  vite: {
    server: {
      allowedHosts: ['myapp.com', 'localhost']
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  i18n: {
    locales: [
      { code: 'en', name: 'English', file: 'en.json' }
    ],
    langDir: 'locales/',
    strategy: 'no_prefix',
    defaultLocale: 'en',
    bundle: {
      optimizeTranslationDirective: false
    }
  }
})
