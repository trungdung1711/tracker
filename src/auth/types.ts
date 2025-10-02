export interface KeycloakConfig {
    realm: string;
    url: string;
    clientId: string;
    scope: string;
}

export interface TokenResponse {
    access_token: string;
    refresh_token: string;
    id_token: string;
    expires_in: number;
    refresh_expires_in: number;
}
