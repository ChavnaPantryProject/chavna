// app/index.tsx
import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useLocalSearchParams } from 'expo-router';

export default function Splash() {
    const { message } = useLocalSearchParams<{message?: string}>();

    useEffect(() => {
        console.log("fail");
        var result = WebBrowser.maybeCompleteAuthSession();
        console.log(result);
    });

    return (
        <View style={styles.screen}>
            <Text>{message}</Text>
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
