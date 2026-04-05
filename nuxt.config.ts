export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  postcss: {
    plugins: {
      '@tailwindcss/postcss': {}
    }
  },
  nitro: {
    routeRules: {
      '/api/popote/**': {
        cors: true,
        headers: {
          'Access-Control-Allow-Origin': 'https://popote.cyriongames.fr',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
        }
      }
    }
  }
})
