// app/index.tsx
import React, { useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { router, type Href } from 'expo-router';

export default function Splash() {
    useEffect(() => {
        const t = setTimeout(() => {
            const target: Href = '/login';
            router.replace(target);
        }, 1200);
        return () => clearTimeout(t);
    }, []);

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
