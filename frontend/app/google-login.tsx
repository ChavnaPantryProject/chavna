// app/index.tsx
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';

async function saveToken(success: string, token?: string, message?: string) {
    if (success != "true") {
        // router.replace("/google-login-fail");
        window.location.replace("/google-login-fail?message=" + message);
        return;
    }

    try {
        await SecureStore.setItemAsync('jwt', token!);
    } catch {
        try { localStorage.setItem('jwt', token!);
            } catch { }
    }

    WebBrowser.maybeCompleteAuthSession();
}

export default function Splash() {
    const { success, token, message } = useLocalSearchParams<{success: string, token?: string, message?: string}>();

    useEffect(() => {
        saveToken(success, token, message);
    });

    return (
        <View style={styles.screen}>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: '300%',
        height: undefined,
        aspectRatio: 1.8,
        marginBottom: 80

    },
});
