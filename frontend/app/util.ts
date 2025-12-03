import { Router, UnknownInputParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

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