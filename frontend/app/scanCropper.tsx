// app/index.tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, ViewStyle, LayoutChangeEvent, ImageLoadEvent, Pressable, Text, PixelRatio, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { API_URL, loadFileBytes, retrieveValue, UploadInfo, Response, uploadChunks } from './util';
import { ConfirmationItem } from './scannerConfirmation';
import { FlipType, SaveFormat, useImageManipulator } from 'expo-image-manipulator';

const priceRegex = new RegExp("\\$?([0-9]+\\.[0-9]{2})");

export default function Splash() {
    const [uri, setUri] = useState<string>("");
    const { imageUri, width, height } = useLocalSearchParams<{imageUri: string, width: string, height: string }>();
    const [cornerStyle, setCornerStyle] = useState<ViewStyle>({});
    const [cornerWidth, setCornerWidth] = useState(0);
    const [verticalEdgeStyle, setVerticalEdgeStyle] = useState<ViewStyle>({});
    const [horizontalEdgeStyle, setHorizontalEdgeStyle] = useState<ViewStyle>({});
    const [edgeWidth, setEdgeWidth] = useState(0);
    const [imageBounds, setImageBounds] = useState<{x1: number, y1: number, x2: number, y2: number}>({x1: 0, y1: 0, x2: 0, y2: 0});
    const [originalImageSize, setOriginalImageSize] = useState<{width: number, height: number}>({width: 0, height: 0});
    const boxRect = useSharedValue<{x1: number, y1: number, x2: number, y2: number} | null>(null);
    const [processing, setProcessing] = useState(false);
    const context = useImageManipulator(uri!);

    const getPictureBytes = async (): Promise<Uint8Array> => {
        const size = await Image.getSize(uri);
        console.log(size);

        const rect = boxRect.value!;
        const boundsW = imageBounds.x2 - imageBounds.x1;
        const boundsH = imageBounds.y2 - imageBounds.y1;

        const xRelative = (rect.x1 - imageBounds.x1) / boundsW;
        const yRelative = (rect.y1 - imageBounds.y1) / boundsH;
        const wRelative = (rect.x2 - rect.x1) / boundsW;
        const hRelative = (rect.y2 - rect.y1) / boundsH;

        console.log(originalImageSize.width, originalImageSize.height);
        console.log(xRelative, yRelative, wRelative, hRelative);
        console.log(xRelative * originalImageSize.width, yRelative * originalImageSize.height, wRelative * originalImageSize.width, hRelative * originalImageSize.height);

        context.crop({
            originX: xRelative * originalImageSize.width,
            originY: yRelative * originalImageSize.height,
            width: wRelative * originalImageSize.width,
            height: hRelative * originalImageSize.height
        })

        const cropped = await context.renderAsync();
        const result = await cropped.saveAsync({
            format: SaveFormat.JPEG
        })

        return loadFileBytes(result.uri);
    }

    const startUpload = async (fileSize: number): Promise<UploadInfo> => {
        const jwt = await retrieveValue('jwt');

        if (jwt == null)
            throw "No jwt.";

        const response = await fetch(`${API_URL}/initialize-receipt-upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${jwt}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fileSize: fileSize
            })
        });

        let body: Response<UploadInfo> | null;
        try {
            body = await response.json();
        } catch (ex) {
            body = null;
        }

        if (!response.ok || body?.success !== "success")
            throw "Invalid response: " + JSON.stringify(body ? body : response);

        return body.payload!;
    }

    type Word = {
        originalPolygon: { x: number, y: number }[] // Point 
        text: string
    }

    type Line = {
        words: Word[]
    };

    const processPhoto = async (uploadId: string): Promise<Line[]> => {
        const response = await fetch(`${API_URL}/scan-receipt`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                uploadId: uploadId
            })
        });

        let body: Response<Line[]> | null;
        try {
            body = await response.json();
        } catch (ex) {
            body = null;
        }

        if (!response.ok || body?.success !== "success")
            throw "Invalid response: " + JSON.stringify(body ? body : response);

        return body.payload!;
    };

    const handleConfirm = async () => {
        console.log("scan");
        let bytes;
        try {
            bytes = await getPictureBytes();
        } catch (ex) {
            console.error("Error taking picture: ", ex);
            return;
        }
        setProcessing(true);

        if (bytes.length <= 0)
            return;

        let uploadInfo;
        try {
            uploadInfo = await startUpload(bytes.length);
        } catch (ex) {
            console.error("Error initializing upload: ", ex);
            return;
        }

        await uploadChunks(bytes, uploadInfo);

        const lines = await processPhoto(uploadInfo.uploadId);

        let scans: ConfirmationItem[] = [];
        let counts: Map<number, number> = new Map();
        for (const line of lines) {
            let priceIndex = -1;
            let priceValue: number | null = null;
            for (let i = 0; i < line.words.length; i++) {
                // check for @
                if (scans.length > 0 && line.words[i].text == "@") {
                    if (i > 0 && i + 1 < line.words.length) {
                        const prev = Number(line.words[i - 1].text);
                        const next = Number(line.words[i + 1].text.replace('$', ''));

                        if (!Number.isNaN(prev) && !Number.isNaN(next)) {
                            counts.set(scans.length - 1, prev);
                            break;
                        }
                    }
                } else {
                    // check if word is a price
                    const r = priceRegex.exec(line.words[i].text);
                    if (r != null) {
                        let p = Number(r[1])
                        if (!Number.isNaN(p)) {
                            priceIndex = i;
                            priceValue = p;
                            break;
                        }
                    }
                }
            }

            let key = "";
            for (let i = 0; i < priceIndex; i++) {
                key += line.words[i].text + " ";
            }

            if (key !== "") {
                scans.push({
                    displayName: null,
                    scanName: key,
                    qty: 1,
                    price: priceValue,
                    template: null
                });
            }
        }

        for (let i = 0; i < scans.length; i++) {
            const count = counts.get(i);

            if (count !== undefined) {
                let scan = scans[i];
                scan.qty = count;
            }
        }

        router.navigate({
            pathname: "/scannerConfirmation",
            params: {
                scanItems: JSON.stringify(scans)
            }
        })
    };

    const handleCancel = () => {
        router.back();
    };

    const topLeftStyle = useAnimatedStyle(() => ({
            left: boxRect.value?.x1! - cornerWidth / 2,
            top: boxRect.value?.y1! - cornerWidth / 2
    }));
    
    const topRightStyle = useAnimatedStyle(() => ({
            left: boxRect.value?.x2! - cornerWidth / 2,
            top: boxRect.value?.y1! - cornerWidth / 2
    }));
    
    const bottomLeftStyle = useAnimatedStyle(() => ({
            left: boxRect.value?.x1! - cornerWidth / 2,
            top: boxRect.value?.y2! - cornerWidth / 2
    }));
    
    const bottomRightStyle = useAnimatedStyle(() => ({
        left: boxRect.value?.x2! - cornerWidth / 2,
        top: boxRect.value?.y2! - cornerWidth / 2
    }));

    const topStyle = useAnimatedStyle(() => ({
        left: boxRect.value?.x1,
        top: boxRect.value?.y1! - edgeWidth / 2,
        width: boxRect.value?.x2! - boxRect.value?.x1!
    }));

    const bottomStyle = useAnimatedStyle(() => ({
        left: boxRect.value?.x1,
        top: boxRect.value?.y2! - edgeWidth / 2,
        width: boxRect.value?.x2! - boxRect.value?.x1!
    }));

    const leftStyle = useAnimatedStyle(() => ({
        left: boxRect.value?.x1! - edgeWidth / 2,
        top: boxRect.value?.y1,
        height: boxRect.value?.y2! - boxRect.value?.y1!
    }));

    const rightStyle = useAnimatedStyle(() => ({
        left: boxRect.value?.x2! - edgeWidth / 2,
        top: boxRect.value?.y1,
        height: boxRect.value?.y2! - boxRect.value?.y1!
    }));

    const boxStyle = useAnimatedStyle(() => ({
        top: boxRect.value?.y1,
        left: boxRect.value?.x1,
        width: boxRect.value?.x2! - boxRect.value?.x1!,
        height: boxRect.value?.y2! - boxRect.value?.y1!
    }));

    const topLeftPan = Gesture.Pan()
        .onUpdate((e) => {
            if (boxRect.value == null)
                return;

            boxRect.value = {
                ...boxRect.value,
                x1: Math.max(e.absoluteX, imageBounds.x1),
                y1: Math.max(e.absoluteY, imageBounds.y1)
            }
        })

    const topRightPan = Gesture.Pan()
        .onUpdate((e) => {
            if (boxRect.value == null)
                return;

            boxRect.value = {
                ...boxRect.value,
                x2: Math.min(e.absoluteX, imageBounds.x2),
                y1: Math.max(e.absoluteY, imageBounds.y1)
            }
        });

    const bottomLeftPan = Gesture.Pan()
        .onUpdate((e) => {
            if (boxRect.value == null)
                return;

            boxRect.value = {
                ...boxRect.value,
                x1: Math.max(e.absoluteX, imageBounds.x1),
                y2: Math.min(e.absoluteY, imageBounds.y2)
            }
        });

    const bottomRightPan = Gesture.Pan()
        .onUpdate((e) => {
            if (boxRect.value == null)
                return;

            boxRect.value = {
                ...boxRect.value,
                x2: Math.min(e.absoluteX, imageBounds.x2),
                y2: Math.min(e.absoluteY, imageBounds.y2)
            }
        });

    const topPan = Gesture.Pan()
        .onUpdate((e) => {
            if (boxRect.value == null)
                return;


            boxRect.value = {
                ...boxRect.value,
                y1: Math.max(e.absoluteY, imageBounds.y1)
            }
        });

    const bottomPan = Gesture.Pan()
        .onUpdate((e) => {
            if (boxRect.value == null)
                return;


            boxRect.value = {
                ...boxRect.value,
                y2: Math.min(e.absoluteY, imageBounds.y2)
            }
        });

    const leftPan = Gesture.Pan()
        .onUpdate((e) => {
            if (boxRect.value == null)
                return;


            boxRect.value = {
                ...boxRect.value,
                x1: e.absoluteX
            }
        });


    const rightPan = Gesture.Pan()
        .onUpdate((e) => {
            if (boxRect.value == null)
                return;


            boxRect.value = {
                ...boxRect.value,
                x2: e.absoluteX
            }
        });
    
    const handleCornerLayout = (event: LayoutChangeEvent) => {
        const { width } = event.nativeEvent.layout;
        setCornerWidth(width); 

        setCornerStyle({
            position: 'absolute',
            ...styles.corner,
            ...{
                width: width,
                height: width
            }
        });
    };

    const handleEdgeLayout = (event: LayoutChangeEvent) => {
        const { width } = event.nativeEvent.layout;
        setEdgeWidth(width);

        setHorizontalEdgeStyle({
            position: 'absolute',
            ...styles.edge,
            ...{
                width: width,
                height: width
            }
        });
        setVerticalEdgeStyle({
            position: 'absolute',
            ...styles.edge,
            ...{
                width: width,
                height: width
            }
        });
    }

    useEffect(() => {
    }, []);

    useEffect(() => {
        if (imageUri != undefined && width != undefined && height!= undefined) {
            setUri(imageUri);
            setOriginalImageSize({width: Number(width), height: Number(height)});
        } else
            router.back();

    }, [imageUri]);

    const handleImageLoad = (event: ImageLoadEvent) => {
        event.currentTarget.measure((x, y, width, height) => {
            const ratio = event.nativeEvent.source.width / event.nativeEvent.source.height;

            const fitWidth = Math.min(width, height * ratio);
            const fitHeight = Math.min(height, width / ratio);

            const xOffset = (width - fitWidth) / 2;
            const yOffset = (height - fitHeight) / 2;

            const bounds = {
                x1: x + xOffset,
                y1: y + yOffset,
                x2: x + fitWidth + xOffset,
                y2: y + fitHeight + yOffset
            };

            boxRect.value = {
                x1: bounds.x1 + fitWidth * 0.05,
                y1: bounds.y1 + fitHeight * 0.05,
                x2: bounds.x2 - fitWidth * 0.05,
                y2: bounds.y2 - fitHeight * 0.05
            };
            setImageBounds(bounds);
        })
    };

    return (
        <View style={styles.container}>
            <View style={styles.pictureContainer}>
                <Image style={styles.picture} source={{uri: uri!}} onLoad={handleImageLoad}/>

                <Animated.View style={[styles.box, boxStyle]}></Animated.View>

                {/* Clickboxes */}
                {/* Top */}
                <GestureDetector gesture={topPan}>
                    <Animated.View style={[horizontalEdgeStyle, topStyle]}></Animated.View>
                </GestureDetector>
                {/* Bottom */}
                <GestureDetector gesture={bottomPan}>
                    <Animated.View style={[horizontalEdgeStyle, bottomStyle]}></Animated.View>
                </GestureDetector>
                {/* Left */}
                <GestureDetector gesture={leftPan}>
                    <Animated.View style={[verticalEdgeStyle, leftStyle]}></Animated.View>
                </GestureDetector>
                {/* Right */}
                <GestureDetector gesture={rightPan}>
                    <Animated.View style={[verticalEdgeStyle, rightStyle]}></Animated.View>
                </GestureDetector>

                {/* Top-Left */}
                <GestureDetector gesture={topLeftPan}>
                    <Animated.View style={[cornerStyle, topLeftStyle]}></Animated.View>
                </GestureDetector>
                {/* Top-Right */}
                <GestureDetector gesture={topRightPan}>
                    <Animated.View style={[cornerStyle, topRightStyle]}></Animated.View>
                </GestureDetector>
                {/* Bottom-Left */}
                <GestureDetector gesture={bottomLeftPan}>
                    <Animated.View style={[cornerStyle, bottomLeftStyle]}></Animated.View>
                </GestureDetector>
                {/* Bottom-Right */}
                <GestureDetector gesture={bottomRightPan}>
                    <Animated.View style={[cornerStyle, bottomRightStyle]}></Animated.View>
                </GestureDetector>

                {/* Layout Reference Elements */}
                <View style={[styles.corner, {zIndex: -1}]} onLayout={handleCornerLayout}></View>
                {/* <View style={[styles.box, {zIndex: -1}]} onLayout={handleBoxLayout}></View> */}
                <View style={[styles.edge, {zIndex: -1}]} onLayout={handleEdgeLayout}></View>
            </View>

            <View style={styles.bottomBar}>
                <Pressable style={styles.cancelButton} onPress={handleCancel}>
                    <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>

                <Pressable style={styles.confirmButton} onPress={handleConfirm}>
                    <Text style={styles.confirmText}>Confirm</Text>
                </Pressable>
            </View>

            {processing &&
                <View style={styles.processing}>
                <ActivityIndicator size="large" color="#499F44" />
                <Text style={styles.processingText}>Scanning...</Text>
                </View>
            }
        </View>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000ff",
  },

  pictureContainer: {
    position: "relative",
    width: "100%",
    flex: 1,
    overflow: "hidden",
    backgroundColor: "#bfcfbaff",
  },

  picture: {
    position: "relative",
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },

  box: {
    position: "absolute",
    outlineColor: "#9ed48f9d",
    outlineWidth: 100000,
    borderColor: "#FFFFFF",
    borderWidth: 2,
    borderRadius: 8,
  },

  corner: {
    width: 75,
  },

  edge: {
    width: 50,
  },

  bottomBar: {
    width: "100%",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: "#F3F5F2",
    borderTopWidth: 1,
    borderTopColor: "#E0E4DD",
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
  },

  button: {
    width: 140,
    height: 44,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#499F44",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },


confirmButton: {
    width: 140,
    height: 44,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#499F44",
    backgroundColor: "#DCEFD7",
    justifyContent: "center",
    alignItems: "center",
},

cancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#595959",
},

  buttonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#499F44",
  },

  confirmButtonText: {
    color: "#FFFFFF",
  },

  confirmText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#499F44",
},

  processing: {
    position: "absolute",
    justifyContent: "center",
    gap: 25,
    alignItems: "center",
    width: "100%",
    height: "100%",
    backgroundColor: "#00000088",
    zIndex: 100,
  },

  processingText: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
  },

  cancelButton: {
    width: 140,
    height: 44,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#CFCFCF",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
},
});
