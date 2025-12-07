import * as SecureStore from 'expo-secure-store';
import { File } from "expo-file-system";
import base64 from "react-native-base64";

export async function storeValue(key: string, value: string) {
    try {
        await SecureStore.setItemAsync(key, value);
    } catch {
        try { localStorage.setItem(key, value);
            } catch { }
    }
}

export async function retrieveValue(key: string): Promise<string | null> {
    try {
        return await SecureStore.getItemAsync(key);
    } catch {
        try {
            return localStorage.getItem(key);
        } catch { }
    }

    return null;
}

export async function deleteValue(key: string) {
    try {
        await SecureStore.deleteItemAsync(key);
    } catch {
        try {
            localStorage.removeItem(key);
        } catch { }
    }
}

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://api.chavnapantry.com').replace(
    /\/+$/,
    ''
);

export type Response<T> = {
  success: 'success' | 'fail' | 'error', // Currently errors still return 'fail'. Expect this to be changed in the future.
  status: number, // status code (200 unless otherwise specified)
  message?: string,
  payload?: T // JSON object containng response payload
}

export function loadFileBytes(uri: string): Uint8Array {
    const file = new File(uri);

    const handle = file.open();

    if (file.size == null)
      throw "No file size."

    const bytes = handle.readBytes(handle.size!);

    return bytes;
}

export type UploadInfo = {
    uploadId: string,
    chunkCount: number,
    chunkSize: number
};

export async function uploadChunks(data: Uint8Array, uploadInfo: UploadInfo) {
    let requests = [];

    for (let i = 0; i < uploadInfo.chunkCount; i++) {
        const start = i * uploadInfo.chunkSize;
        const end = Math.min(start + uploadInfo.chunkSize, data.length);

        const chunk = data.slice(start, end);
        requests.push(fetch(`${API_URL}/upload-chunk`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                uploadId: uploadInfo.uploadId,
                index: i,
                base64Data: base64.encodeFromByteArray(chunk)
            })
        }));
    }

    const responses = await Promise.all(requests);

    for (const response of responses) {
        let body: Response<UploadInfo> | null;
        try {
            body = await response.json();
        } catch (ex) {
            body = null;
        }

        if (!response.ok || body?.success !== "success")
            throw "Invalid response: " + JSON.stringify(body ? body : response);
    }
};