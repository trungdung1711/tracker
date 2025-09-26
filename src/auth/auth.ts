import { generateCodeVerifier, generateCodeChallenge } from "./pkce";
import { TokenResponse } from "./types";
import { KEYCLOAK_CONFIG } from "./constants";

let accessToken: string | null = null;
let refreshToken: string | null = null;
let codeVerifier: string | null = null;

export async function login(): Promise<void> {
  codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  const authUrl = `${KEYCLOAK_CONFIG.url}/auth?` +
    `client_id=${KEYCLOAK_CONFIG.clientId}` +
    `&redirect_uri=${encodeURIComponent(chrome.identity.getRedirectURL())}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(KEYCLOAK_CONFIG.scope)}` +
    `&code_challenge=${codeChallenge}` +
    `&code_challenge_method=S256`;

  return new Promise((resolve, reject) => {
    // open the popup of KeyCLoak
    chrome.identity.launchWebAuthFlow(
      { url: authUrl, interactive: true },
      // KeyCloak manages the authentication
      // successfully authenticate -> KeyCloak redirect
      async (redirectUrl) => {
        // error checkings
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
          return;
        }

        if (!redirectUrl) {
          reject(new Error("No redirect URL returned"));
          return;
        }


        // param named code on the redirect URL
        const params = new URLSearchParams(new URL(redirectUrl).search);
        const code = params.get("code");
        if (!code || !codeVerifier) {
          reject(new Error("No code or verifier found"));
          return;
        }

        try {
          await exchangeCodeForTokens(code);
          resolve();
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

// code exchange
async function exchangeCodeForTokens(code: string): Promise<void> {
	// get a redirect URL, not really need it
	const redirectUri = chrome.identity.getRedirectURL();
	// prepare the exchangeCode URL
	const body = new URLSearchParams();
	
	body.append("grant_type", "authorization_code");
	body.append("code", code);
	body.append("redirect_uri", redirectUri);
	body.append("client_id", KEYCLOAK_CONFIG.clientId);
	body.append("code_verifier", codeVerifier!);

	const response = await fetch(`${KEYCLOAK_CONFIG.url}/token`, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body
	});

	const data: TokenResponse = await response.json();
	accessToken = data.access_token;
	refreshToken = data.refresh_token;

	await chrome.storage.local.set({ refreshToken });
}


export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  if (!accessToken) await refreshTokens();

  options.headers = {
    ...(options.headers || {}),
    "Authorization": `Bearer ${accessToken}`
  };

  return fetch(url, options);
}


export async function refreshTokens(): Promise<void> {
	if (!refreshToken) {
		const stored = await chrome.storage.local.get("refreshToken");
		refreshToken = stored.refreshToken;
		if (!refreshToken) throw new Error("No refresh token found");
	}

	// preprare the URL to refresh the token
	const body = new URLSearchParams();
	body.append("grant_type", "refresh_token");
	body.append("refresh_token", refreshToken);
	body.append("client_id", KEYCLOAK_CONFIG.clientId);

	const response = await fetch(`${KEYCLOAK_CONFIG.url}/token`, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body
	});

	// new tokenResponse when refreshed
	const data: TokenResponse = await response.json();
	accessToken = data.access_token;
	refreshToken = data.refresh_token;

	await chrome.storage.local.set({ refreshToken });
}
