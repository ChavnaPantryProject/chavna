// app/index.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';

export default function Splash() {
    const [uri, setUri] = useState<string | undefined>(undefined);
    const { imageUri } = useLocalSearchParams<{imageUri: string}>();
    const cornerRef = useRef(null);
    const [cornerSize, setCornerSize] = useState(0);
    const [edgeSize, setEdgeSize] = useState(0);

    useEffect(() => {
        if (cornerRef.current) {
            const computedStyle = window.getComputedStyle(cornerRef.current);
            const [cornerStyle, setCornerStye] = useState({
                top: 0,
                left: 0
            })

            setCornerSize(Number(computedStyle.width));
        }
    }, []);

    useEffect(() => {
        if (imageUri != undefined)
            setUri(imageUri);
        else
            router.back();

    }, [imageUri]);

    return (
        <View style={styles.container}>
            <Image style={styles.picture} source={{uri: uri}}/>
            <View style={styles.box}></View>
            <View style={styles.corner} ref={cornerRef}></View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        height: "100%"
    },
    picture: {
        ...StyleSheet.absoluteFillObject
    },
    box: {
        position: "absolute",
        top: "10%",
        left: "10%",
        width: "80%",
        height: "80%",
        outlineColor: "#00000088",
        outlineWidth: 100,
        borderColor: "white",
        borderWidth: 2
    },
    corner: {
        position: "absolute",
        width: 50,
        backgroundColor: "white"
    }
});
