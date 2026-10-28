import type { DocumentPickerAsset } from 'expo-document-picker';
import { fetch as expoFetch } from 'expo/fetch';
import { File } from 'expo-file-system';

const MAX_PDF_SIZE_BYTES = 5 * 1024 * 1024;

export type IngestResult = {
  resume_id: string;
  filename: string;
  page_count: number;
  character_count: number;
  chunk_count: number;
  stored_chunk_count: number;
};

type ErrorResponse = {
  detail?: unknown;
};

function getApiUrl() {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');

  if (!apiUrl) {
    throw new Error('EXPO_PUBLIC_API_URL set nahi hai. Mobile ki .env file check karo.');
  }

  return apiUrl;
}

export function validateResume(asset: DocumentPickerAsset) {
  const isPdf = asset.mimeType === 'application/pdf' || asset.name.toLowerCase().endsWith('.pdf');

  if (!isPdf) {
    throw new Error('Sirf PDF resume upload kar sakte ho.');
  }

  if (asset.size && asset.size > MAX_PDF_SIZE_BYTES) {
    throw new Error('PDF 5 MB ya usse chhoti honi chahiye.');
  }
}

export async function uploadResume(asset: DocumentPickerAsset): Promise<IngestResult> {
  validateResume(asset);

  const body = new FormData();

  if (asset.file) {
    body.append('file', asset.file, asset.name);
  } else {
    const file = new File(asset.uri);
    body.append('file', file, asset.name);
  }

  const response = await expoFetch(`${getApiUrl()}/ingest`, {
    method: 'POST',
    body,
  });

  if (!response.ok) {
    let message = `Upload fail hua (${response.status})`;

    try {
      const errorBody = (await response.json()) as ErrorResponse;
      if (typeof errorBody.detail === 'string') {
        message = errorBody.detail;
      }
    } catch {
      // Backend ne JSON error nahi bheja, isliye status wala message dikhega.
    }

    throw new Error(message);
  }

  return (await response.json()) as IngestResult;
}
