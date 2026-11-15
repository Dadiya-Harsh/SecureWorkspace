import type { GoogleDriveFile, GoogleDriveFileListResponse } from '../types/drive';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';

/**
 * Searches files in Google Drive using a Drive search query.
 */
export async function searchFiles(
  accessToken: string,
  query: string
): Promise<GoogleDriveFile[]> {
  const params = new URLSearchParams({
    q: query,
    fields: 'files(id, name, size, mimeType, modifiedTime, parents)',
    pageSize: '100',
  });

  const res = await fetch(`${DRIVE_API_BASE}/files?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Google Drive query failed with HTTP ${res.status}`
    );
  }

  const data = (await res.json()) as GoogleDriveFileListResponse;
  return data.files || [];
}

/**
 * Downloads a raw file from Google Drive as a binary Uint8Array buffer.
 */
export async function downloadFileBytes(
  accessToken: string,
  fileId: string
): Promise<Uint8Array> {
  const res = await fetch(`${DRIVE_API_BASE}/files/${fileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error(
      `Failed to download file (${fileId}) from Drive: HTTP ${res.status} ${res.statusText}`
    );
  }

  const arrayBuffer = await res.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Downloads a text file (like HEAD) from Google Drive.
 */
export async function downloadFileText(
  accessToken: string,
  fileId: string
): Promise<string> {
  const bytes = await downloadFileBytes(accessToken, fileId);
  return new TextDecoder('utf-8').decode(bytes).trim();
}
