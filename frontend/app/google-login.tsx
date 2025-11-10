// app/index.tsx
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { storeValue } from './util';

async function saveToken(success: string, token?: string, message?: string) {
    if (success != "true") {
        // router.replace("/google-login-fail");
        window.location.replace("/google-login-fail?message=" + message);
        return;
    }

    storeValue("jwt", token!);

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
