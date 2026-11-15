export interface GoogleDriveFile {
  id: string;
  name: string;
  size?: string;
  mimeType: string;
  modifiedTime?: string;
  parents?: string[];
}

export interface GoogleDriveFileListResponse {
  nextPageToken?: string;
  files: GoogleDriveFile[];
}

export interface GoogleUserInfo {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
}

export interface TokenClientConfig {
  client_id: string;
  scope: string;
  callback: (response: TokenResponse) => void;
  error_callback?: (error: unknown) => void;
}

export interface TokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  error?: string;
  error_description?: string;
}

// Global Google Identity Services window declaration
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: TokenClientConfig) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
          hasGrantedAllScopes: (
            tokenResponse: TokenResponse,
            firstScope: string,
            ...restScopes: string[]
          ) => boolean;
        };
      };
    };
  }
}
