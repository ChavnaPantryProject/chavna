// app/index.tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { router, type Href } from 'expo-router';
import { retrieveValue, storeValue, API_URL, Response } from './util';
import { jwtDecode } from 'jwt-decode';
import * as NavigationBar from 'expo-navigation-bar';

const TIMEOUT_DURATION = 10000;

async function checkLogin(): Promise<boolean> {
    const jwt: string | null = await retrieveValue('jwt');

    if (jwt == null) {
        console.log("jwt null");
        return false;
    }

    const decodedJwt = jwtDecode(jwt);
    const duration = decodedJwt.exp! - decodedJwt.iat!;
    const now = Math.floor(Date.now() / 1000);
    const jwtAge = now - decodedJwt.iat!;

    if (jwtAge > duration / 2) {
        if (jwtAge > duration) {
            console.log("jwt expired");
            return false;
        }

        // Get a new token if the current jwt age is more than half of its lifetime.
        let response = await fetch(`${API_URL}/refresh-token`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${jwt}`
            },
        });

        if (response == null || !response.ok) {
            console.log("bad response on refresh", response);
            return false;
        }

        let body: Response<any> = await response.json();

        if (body == null) {
            console.log("no body on refresh");
            return false;
        }

        if (body.success === 'success') {
            await storeValue('jwt', body.payload!.jwt);
        }

        return true;
    } else {
        // Verify current token if it is still fresh
        let response = await fetch(`${API_URL}/validate-login`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${jwt}`
            },
        });

        if (response == null || !response.ok) {
            console.log("bad response on verify", response);
            return false;
        }

        let body: Response<any> = await response.json();

        if (body == null) {
            console.log("no body on verify");
            return false;
        }

        if (body.success !== "success")
            console.log("unsuccessful verification: ", body);

        return body.success === 'success';
    }
}

export default function Splash() {
    const [login, setLogin] = useState<boolean | null>(null);
    NavigationBar.setVisibilityAsync("hidden");

    useEffect(() => {
        (async () => {
            setLogin(await checkLogin());
        })();

        let t = setTimeout(() => {
            router.replace('/login');
        }, TIMEOUT_DURATION);

        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        if (login === null)
            return;

        if (login === true)
            router.replace('/(tabs)/home');
        else
            router.replace('/login');
    }, [login]);

    return (
        <View style={styles.screen}>
            <Image
                source={require('../assets/images/CHAVNA_LOGO.png')}
                style={styles.logo}
                resizeMode="contain"
            />
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
