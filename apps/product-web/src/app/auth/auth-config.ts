import { AuthConfig } from 'angular-oauth2-oidc';

export const authConfig: AuthConfig = {
  issuer: 'https://accounts.google.com',

  redirectUri: window.location.origin,

  clientId:
    '651997387272-28348ornee2vd85ff5clnvsu4038r036.apps.googleusercontent.com',

  scope: 'openid profile email',

  strictDiscoveryDocumentValidation: false,
};
