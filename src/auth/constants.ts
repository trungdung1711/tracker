import { KeycloakConfig } from './types';

export const REALM = 'salem';
export const CLIENT_ID = 'tracker';
export const URL = 'http://localhost:8080/realms/salem/protocol/openid-connect';
export const SCOPE = 'openid profile email';

export const KEYCLOAK_CONFIG: KeycloakConfig = {
    realm: REALM,
    url: URL,
    clientId: CLIENT_ID,
    scope: SCOPE,
};
