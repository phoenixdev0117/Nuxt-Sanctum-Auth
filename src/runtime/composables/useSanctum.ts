import { computed } from 'vue';
import type { FetchOptions } from 'ofetch';
import { getAuthUser } from '../helpers/get-auth-user';
import { extractNestedValue } from '../helpers/utilities';
import { useSanctumFetch } from './useSanctumFetch';
import { useSanctumOptions } from './useSanctumOptions';
import { useCurrentUser } from './useCurrentUser';
import { useTokenStorage } from './useTokenStorage';
import { navigateTo, useNuxtApp, useRoute } from '#app';

export const useSanctum = <T>() => {
  const nuxtApp = useNuxtApp();
  const options = useSanctumOptions();
  const user = useCurrentUser<T>();

  const isLoggedIn = computed(() => {
    return user.value !== null;
  });

  async function refreshUser() {
    try {
      user.value = await getAuthUser(useNuxtApp().$sanctumFetch);
    } catch (error) {
      user.value = null;
      console.debug(error);
    }
  }

  async function login<LoginApiResponse>(
    credentials: Record<string, any>,
    clientOptions: FetchOptions = {},
    callback?: (responseData: LoginApiResponse, user: T | null) => any,
  ) {
    const { redirect, authMode, sanctumEndpoints } = options;
    const currentRoute = useRoute();

    if (isLoggedIn.value) {
      // Already logged in, check for redirect
      if (
        !redirect.redirectToAfterLogin ||
        redirect.redirectToAfterLogin === currentRoute.path
      ) {
        return;
      }

      return await navigateTo(redirect.redirectToAfterLogin);
    }

    // Define `fetchResponse` as LoginApiResponse
    const fetchResponse = await useSanctumFetch<LoginApiResponse>(
      sanctumEndpoints.login,
      {
        method: 'post',
        body: credentials,
        ...(clientOptions as object),
      },
    );

    // Handle token or cookie auth
    if (authMode === 'token') {
      const { token } = options;
      const tokenValue = extractNestedValue<string>(
        fetchResponse,
        token.responseKey,
      );

      await useTokenStorage(nuxtApp).set(tokenValue);
    }

    await refreshUser();

    if (callback) {
      return callback(fetchResponse, user.value);
    }

    // Handle intended redirect
    if (redirect.enableIntendedRedirect) {
      const requestedRoute = currentRoute.query.redirect;
      if (requestedRoute && requestedRoute !== currentRoute.path) {
        return await navigateTo(requestedRoute as string);
      }
    }

    // No intended redirect, check for default redirect
    if (
      !redirect.redirectToAfterLogin ||
      currentRoute.path === redirect.redirectToAfterLogin
    ) {
      return;
    }

    return await navigateTo(redirect.redirectToAfterLogin);
  }

  async function logout(callback?: () => any): Promise<void> {
    if (!isLoggedIn.value) {
      return;
    }

    await useSanctumFetch(options.sanctumEndpoints.logout, { method: 'post' });

    user.value = null;

    if (options.authMode === 'token') {
      await useTokenStorage(nuxtApp).set(undefined);
    }

    if (callback) {
      return callback();
    }

    const currentPath = useRoute().path;
    if (
      !options.redirect.redirectToAfterLogout ||
      currentPath === options.redirect.redirectToAfterLogout
    ) {
      return;
    }

    await navigateTo(options.redirect.redirectToAfterLogout as string);
  }

  return {
    options,
    user,
    isLoggedIn,
    refreshUser,
    login,
    logout,
  };
};
