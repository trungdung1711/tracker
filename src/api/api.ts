import { getAccessToken, getRefreshToken, saveToken } from '../auth/auth';
import { KEYCLOAK_CONFIG } from '../auth/constants';
import { TokenResponse } from '../auth/types';
import { Session } from '../main/types';
import { BASE_URL } from './constants';
import { SessionResponse } from './types';

let accessToken: string | null = null;

export async function refreshTokens(): Promise<void> {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
        // No refresh found
        return;
    }

    // preprare the URL to refresh the token
    const body = new URLSearchParams();
    body.append('grant_type', 'refresh_token');
    body.append('refresh_token', refreshToken);
    body.append('client_id', KEYCLOAK_CONFIG.clientId);

    const response = await fetch(`${KEYCLOAK_CONFIG.url}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
    });

    // new tokenResponse when refreshed
    const data: TokenResponse = await response.json();
    await saveToken('accessToken', data.access_token);
    await saveToken('refreshToken', data.refresh_token);
}

// export async function apiFetch(
//     url: string,
//     options: RequestInit = {}
// ): Promise<Response> {
//     if (!accessToken) {
//         accessToken = await getAccessToken();
//         if (!accessToken) {
//             await refreshTokens();
//         }
//     }

//     options.headers = {
//         ...(options.headers || {}),
//         Authorization: `Bearer ${accessToken}`,
//     };

//     return fetch(url, options);
// }

export async function uploadSession(
    session: Session
): Promise<SessionResponse> {
    accessToken = await getAccessToken();

    const payload = session;
    const data = JSON.stringify(payload);
    console.log(data);
    const options: RequestInit = {
        body: data,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
        },
    };

    // const response = await apiFetch(BASE_URL + '/sessions/', option);
    const response = await fetch(BASE_URL + '/sessions/', options);

    const body: SessionResponse = await response.json();

    return body;
}
