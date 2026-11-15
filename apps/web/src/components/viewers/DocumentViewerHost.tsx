import React, { useEffect, useState } from 'react';
import { useVaultStore } from '../../store/useVaultStore';
import { useAuthStore } from '../../store/useAuthStore';
import { downloadFileBytes, searchFiles } from '../../drive/drive-client';
import { cryptoClient } from '../../crypto/worker/crypto-client';
import { BreadcrumbNav } from '../viewer/BreadcrumbNav';
import { CsvViewer } from './CsvViewer';
import { MarkdownViewer } from './MarkdownViewer';
import { ExcelViewer } from './ExcelViewer';
import { PdfViewer } from './PdfViewer';
import { DocxViewer } from './DocxViewer';
import { ImageViewer } from './ImageViewer';
import { CodeViewer } from './CodeViewer';
import { FallbackViewer } from './FallbackViewer';
import { Loader2, AlertCircle } from 'lucide-react';

export const DocumentViewerHost: React.FC = () => {
  const selectedFile = useVaultStore((s) => s.selectedFile);
  const setSelectedFile = useVaultStore((s) => s.setSelectedFile);
  const lockVault = useVaultStore((s) => s.lockVault);
  const accessToken = useAuthStore((s) => s.accessToken);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decryptedBytes, setDecryptedBytes] = useState<Uint8Array | null>(null);
  const [decryptedText, setDecryptedText] = useState<string | null>(null);

  const fileName = selectedFile ? selectedFile.path.split('/').pop() || '' : '';
  const lowerName = fileName.toLowerCase();

  useEffect(() => {
    let isCancelled = false;

    async function loadFileContent() {
      if (!selectedFile) return;

      setLoading(true);
      setError(null);
      setDecryptedBytes(null);
      setDecryptedText(null);

      try {
        // Live Google Drive Decryption Flow
        if (!accessToken || !useVaultStore.getState().vault) {
          throw new Error('Not connected to Google Drive or vault not loaded');
        }

        const vaultFolderId = useVaultStore.getState().vault!.folderId;
        const objectName = `objects/${selectedFile.file_id_hex}`;

        // 1. Search for object file ID in Google Drive
        const matchingFiles = await searchFiles(
          accessToken,
          `'${vaultFolderId}' in parents and name = '${objectName}' and trashed = false`
        );

        if (matchingFiles.length === 0) {
          throw new Error(`Object not found in Google Drive: ${objectName}`);
        }

        // 2. Download encrypted object bytes from Drive
        const ciphertext = await downloadFileBytes(accessToken, matchingFiles[0].id);

        // 3. Decrypt via Web Worker WASM pipeline
        const { plaintext } = await cryptoClient.decryptFile(ciphertext, selectedFile.file_id_hex);

        if (isCancelled) return;

        setDecryptedBytes(plaintext);

        // Decode as text if appropriate
        if (
          lowerName.endsWith('.csv') ||
          lowerName.endsWith('.md') ||
          lowerName.endsWith('.txt') ||
          lowerName.endsWith('.json') ||
          lowerName.endsWith('.ts') ||
          lowerName.endsWith('.js') ||
          lowerName.endsWith('.py')
        ) {
          const text = new TextDecoder().decode(plaintext);
          setDecryptedText(text);
        }

        setLoading(false);
      } catch (err) {
        if (!isCancelled) {
          console.error('File decryption failed:', err);
          setError(err instanceof Error ? err.message : String(err));
          setLoading(false);
        }
      }
    }

    loadFileContent();

    return () => {
      isCancelled = true;
      // Zeroize decrypted plaintext from state on unmount
      setDecryptedBytes(null);
      setDecryptedText(null);
    };
  }, [selectedFile, accessToken, lowerName]);

  if (!selectedFile) return null;

  return (
    <div className="flex-1 flex flex-col bg-[#EDF0ED] min-h-screen">
      {/* Top Warning Banner matching mockup exactly */}
      <div className="bg-[#F6EED8] text-[#543D15] px-6 sm:px-10 py-3 text-sm font-medium border-b border-[#EDE2C5]">
        Read-only view. To change files, use the desktop app.
      </div>

      <div className="flex-1 p-6 sm:p-10 max-w-5xl w-full mx-auto space-y-8">
        {/* Main Header matching Web viewer file.png */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <BreadcrumbNav />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#14201C] tracking-tight">
              {fileName}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              className="bg-white border border-[#D5DDD7] hover:border-[#BAC5BD] text-[#14201C] text-sm font-medium px-4 py-2 rounded-lg cursor-pointer shadow-2xs"
            >
              Back
            </button>

            <button
              type="button"
              onClick={() => lockVault()}
              className="bg-white border border-[#D5DDD7] hover:border-[#BAC5BD] text-[#14201C] text-sm font-medium px-4 py-2 rounded-lg cursor-pointer shadow-2xs"
            >
              Lock now
            </button>
          </div>
        </div>

        {/* Content Area */}
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-[#0F5C4D]" />
            <p className="text-sm font-mono text-[#5A6662]">
              Decrypting {fileName} with client-side XChaCha20-Poly1305...
            </p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">Decryption Failed:</span>
              <p>{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="pt-2">
            {lowerName.endsWith('.csv') && decryptedText !== null && (
              <CsvViewer csvText={decryptedText} />
            )}

            {lowerName.endsWith('.md') && decryptedText !== null && (
              <MarkdownViewer content={decryptedText} />
            )}

            {(lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) && decryptedBytes && (
              <ExcelViewer bytes={decryptedBytes} />
            )}

            {lowerName.endsWith('.pdf') && decryptedBytes && (
              <PdfViewer bytes={decryptedBytes} fileName={fileName} />
            )}

            {lowerName.endsWith('.docx') && decryptedBytes && (
              <DocxViewer bytes={decryptedBytes} fileName={fileName} />
            )}

            {(lowerName.endsWith('.png') ||
              lowerName.endsWith('.jpg') ||
              lowerName.endsWith('.jpeg') ||
              lowerName.endsWith('.webp') ||
              lowerName.endsWith('.svg')) &&
              decryptedBytes && <ImageViewer bytes={decryptedBytes} fileName={fileName} />}

            {(lowerName.endsWith('.txt') ||
              lowerName.endsWith('.json') ||
              lowerName.endsWith('.ts') ||
              lowerName.endsWith('.js') ||
              lowerName.endsWith('.py')) &&
              decryptedText !== null && (
                <CodeViewer code={decryptedText} fileName={fileName} />
              )}

            {/* Fallback for binary / unsupported types */}
            {!lowerName.endsWith('.csv') &&
              !lowerName.endsWith('.md') &&
              !lowerName.endsWith('.xlsx') &&
              !lowerName.endsWith('.xls') &&
              !lowerName.endsWith('.pdf') &&
              !lowerName.endsWith('.docx') &&
              !lowerName.endsWith('.png') &&
              !lowerName.endsWith('.jpg') &&
              !lowerName.endsWith('.jpeg') &&
              !lowerName.endsWith('.webp') &&
              !lowerName.endsWith('.svg') &&
              !lowerName.endsWith('.txt') &&
              !lowerName.endsWith('.json') &&
              !lowerName.endsWith('.ts') &&
              !lowerName.endsWith('.js') &&
              !lowerName.endsWith('.py') &&
              decryptedBytes && (
                <FallbackViewer
                  bytes={decryptedBytes}
                  fileName={fileName}
                  sha256={selectedFile.sha256}
                />
              )}
          </div>
        )}
      </div>
    </div>
  );
};
