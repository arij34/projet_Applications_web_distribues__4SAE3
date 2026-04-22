import { KeycloakService } from 'keycloak-angular';

/**
 * Initializes Keycloak before Angular bootstraps.
 *
 * NOTE: `onLoad: 'login-required'` forces a redirect to Keycloak login
 * as soon as the app loads.
 */
export function initializeKeycloak(keycloak: KeycloakService) {
  return () => {
    const initPromise = keycloak.init({
      config: {
        // Use HTTPS to make social login (Google) work correctly with cookies.
        // Keycloak is started with HTTPS on https://localhost:8443
        url: 'https://localhost:8443',
        realm: 'smart-platform',
        clientId: 'angular-app'
      },
      initOptions: {
        // Do NOT force login on first load (so /front can be visited anonymously).
        // Protected routes (/admin, /client, /freelancer) still redirect to Keycloak via RoleGuard.
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: window.location.origin + '/assets/silent-check-sso.html',
        checkLoginIframe: false
      },
      // We enable the bearer interceptor globally and use an allowlist.
      enableBearerInterceptor: true,
      bearerPrefix: 'Bearer',
      bearerExcludedUrls: [
        // static assets
        '/assets',
        // backend public endpoints (no token required)
        'http://localhost:8090/api/public'
      ]
    });

    // IMPORTANT:
    // In some setups, silent SSO check can hang forever (neither resolve nor reject)
    // which blocks APP_INITIALIZER => blank page. We enforce a short timeout.
    const timeoutPromise = new Promise<boolean>((resolve) =>
      setTimeout(() => resolve(true), 2500)
    );

    return Promise.race([initPromise, timeoutPromise]).catch((err) => {
      console.error('Keycloak init failed. Continuing without SSO.', err);
      return true;
    });
  };
}
