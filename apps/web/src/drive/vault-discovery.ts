import { searchFiles, downloadFileBytes, downloadFileText } from './drive-client';
import { parseWorkspaceHeader } from '../crypto/envelope';
import type { WorkspaceHeader } from '../types/crypto';
import type { GoogleDriveFile } from '../types/drive';

export interface DiscoveredVault {
  folderId: string;
  folderName: string;
  headerFile: GoogleDriveFile;
  headerBytes: Uint8Array;
  header: WorkspaceHeader;
  remoteHeadVersion: number;
  manifestFile?: GoogleDriveFile;
  manifestBytes?: Uint8Array;
  pushedFromDevice: string;
}

/**
 * Searches user's Google Drive for all workspace.header files and retrieves
 * metadata for every discovered workspace.
 */
export async function discoverAllVaults(accessToken: string): Promise<DiscoveredVault[]> {
  // 1. Search for all "workspace.header" files across accessible Drive files
  const headerQuery = "name = 'workspace.header' and trashed = false";
  const headerFiles = await searchFiles(accessToken, headerQuery);

  if (headerFiles.length === 0) {
    throw new Error(
      "No 'workspace.header' file found in your Google Drive. Make sure you have created and pushed a vault from the desktop app first."
    );
  }

  const vaults: DiscoveredVault[] = [];

  for (const headerFile of headerFiles) {
    const parentFolderId = headerFile.parents?.[0];
    if (!parentFolderId) continue;

    try {
      // 2. Download and parse workspace.header (246 bytes)
      const headerBytes = await downloadFileBytes(accessToken, headerFile.id);
      const header = parseWorkspaceHeader(headerBytes);

      // 3. List all files inside the workspace subfolder
      const folderFilesQuery = `'${parentFolderId}' in parents and trashed = false`;
      const vaultFiles = await searchFiles(accessToken, folderFilesQuery);

      // 4. Find HEAD pointer file
      const headFile = vaultFiles.find((f) => f.name === 'HEAD');
      let remoteHeadVersion = 1;
      if (headFile) {
        try {
          const headText = await downloadFileText(accessToken, headFile.id);
          const parsedVersion = parseInt(headText.trim(), 10);
          if (!isNaN(parsedVersion) && parsedVersion > 0) {
            remoteHeadVersion = parsedVersion;
          }
        } catch {
          remoteHeadVersion = 1;
        }
      }

      // 5. Locate latest manifest file (e.g. versions/000001.manifest)
      const paddedVersion = remoteHeadVersion.toString().padStart(6, '0');
      const manifestFileName = `versions/${paddedVersion}.manifest`;

      let manifestFile = vaultFiles.find((f) => f.name === manifestFileName);
      if (!manifestFile) {
        manifestFile = vaultFiles.find(
          (f) => f.name.startsWith('versions/') && f.name.endsWith('.manifest')
        );
      }

      let manifestBytes: Uint8Array | undefined;
      if (manifestFile) {
        manifestBytes = await downloadFileBytes(accessToken, manifestFile.id);
      }

      vaults.push({
        folderId: parentFolderId,
        folderName: header.name || 'SecureWorkspace',
        headerFile,
        headerBytes,
        header,
        remoteHeadVersion,
        manifestFile,
        manifestBytes,
        pushedFromDevice: 'desktop-windows-primary',
      });
    } catch (err) {
      console.warn(`Failed to inspect workspace header ${headerFile.id}:`, err);
    }
  }

  if (vaults.length === 0) {
    throw new Error("Unable to parse any valid workspace headers in your Google Drive.");
  }

  return vaults;
}

/**
 * Backward compatibility wrapper returning the first discovered vault.
 */
export async function discoverVault(accessToken: string): Promise<DiscoveredVault> {
  const all = await discoverAllVaults(accessToken);
  return all[0];
}
