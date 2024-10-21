export default defineNuxtConfig({
  modules: ['../src/module'],
  devtools: { enabled: true },

  devServer: {
    host: 'localhost',
  },

  laravelSanctum: {
    apiUrl: 'http://localhost:8000',
    authMode: 'cookie',
    userStateKey: 'sanctum.authenticated.user',
    token: {
      storageKey: 'AUTH_TOKEN',
      provider: 'cookie',
    },
    fetchClientOptions: {
      retryAttempts: false,
    },
    csrf: {
      cookieName: 'XSRF-TOKEN',
      headerName: 'X-XSRF-TOKEN',
    },
    sanctumEndpoints: {
      csrf: '/sanctum/csrf-cookie',
      login: '/login',
      // login: '/api/sanctum/token',
      logout: '/logout',
      // logout: '/api/sanctum/token/delete',
      user: '/api/user',
    },
    redirect: {
      enableIntendedRedirect: true,
      loginPath: '/auth/login',
      guestOnlyRedirect: '/profile',
      redirectToAfterLogin: '/dashboard',
      redirectToAfterLogout: '/auth/login',
    },
    middlewareNames: {
      auth: '$auth',
      guest: '$guest',
    },
    logLevel: 3,
  },

  compatibilityDate: '2024-08-26',
});
