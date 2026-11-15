import type { GoogleUserInfo, TokenResponse } from '../types/drive';

export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '1020297712681-fk4sh0g5mouh1va5e3cmpm64rd65pr04.apps.googleusercontent.com';

export const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

/**
 * Fetches user profile (email and name) directly from Google UserInfo endpoint.
 */
export async function fetchUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch user info: ${res.statusText}`);
  }

  return (await res.json()) as GoogleUserInfo;
}

/**
 * Requests OAuth access token using Google Identity Services (GIS) token client popup.
 */
export function requestGoogleDriveAccess(): Promise<{
  accessToken: string;
  user: GoogleUserInfo;
}> {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(
        new Error(
          'Google Identity Services client is not loaded. Please check your internet connection or ad-blocker.'
        )
      );
      return;
    }

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: DRIVE_SCOPES,
        callback: async (tokenResponse: TokenResponse) => {
          if (tokenResponse.error) {
            reject(
              new Error(
                tokenResponse.error_description ||
                  `Google Sign-In error: ${tokenResponse.error}`
              )
            );
            return;
          }

          if (!tokenResponse.access_token) {
            reject(new Error('No access token received from Google.'));
            return;
          }

          try {
            const user = await fetchUserInfo(tokenResponse.access_token);
            resolve({
              accessToken: tokenResponse.access_token,
              user,
            });
          } catch (err) {
            // Even if userinfo fails, token is valid; return fallback email
            resolve({
              accessToken: tokenResponse.access_token,
              user: { sub: 'unknown', email: 'connected-user' },
            });
          }
        },
        error_callback: (err: unknown) => {
          reject(new Error(err instanceof Error ? err.message : 'Google OAuth popup was closed or blocked.'));
        },
      });

      client.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });
}
