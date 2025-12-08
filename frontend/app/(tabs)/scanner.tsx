import React, { useEffect, useRef, useState } from "react";
import {Text, View, StyleSheet, TouchableOpacity, Button, ActivityIndicator,} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { API_URL, loadFileBytes, Response, retrieveValue, uploadChunks, UploadInfo, useAutofocus } from "../util";
import { ConfirmationItem } from "../scannerConfirmation";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

const priceRegex = new RegExp("\\$?([0-9]+\\.[0-9]{2})");

export default function ScannerScreen() {
  const router = useRouter();
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const { isRefreshing, onTap } = useAutofocus();
  const ref = useRef<CameraView>(null);
  const [processing, setProcessing] = useState(false);

  const tap = Gesture.Tap().onBegin(onTap);

  const getPictureBytes = async (): Promise<Uint8Array> => {
    const photo = await ref.current?.takePictureAsync({
      quality: 1,
      
    });

    if (photo?.uri === undefined)
      throw "No photo uri.";

    router.push({
      pathname: "/scanCropper",
      params: {
        imageUri: photo.uri
      }
    });

    return loadFileBytes(photo.uri);
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
      throw "Invalid response: " + JSON.stringify(body? body : response);
    
    return body.payload!;
  }

  type Word = {
    originalPolygon: {x: number, y: number}[] // Point 
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
      throw "Invalid response: " + JSON.stringify(body? body : response);
    
    return body.payload!;
  };

  const takePicture = async () => {
    let bytes;
    try {
      bytes = await getPictureBytes();
    } catch (ex) {
      console.error("Error taking picture: ", ex);
      return;
    }
    bytes = new Uint8Array();
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

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button title="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}></View>


      {/* Scanner Area with Live Camera */}
      <GestureDetector gesture={tap}>
      <View style={styles.scannerArea}>
        <CameraView style={styles.camera} ref={ref} facing={facing} autofocus="on"/>
        {/* Scanner corners */}
        <View style={styles.cornerTopLeft} />
        <View style={styles.cornerTopRight} />
        <View style={styles.cornerBottomLeft} />
        <View style={styles.cornerBottomRight} />
      </View>
      </GestureDetector>

      {processing &&
        <View style={styles.processing}>
          <ActivityIndicator size="large" color="#499F44" />
          <Text style={styles.processingText}>Scanning...</Text>
        </View>
      }

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomBar}>
        {/* Left Button */}
        <TouchableOpacity style={styles.iconButton} onPress={toggleCameraFacing}>
          <Ionicons name="camera-reverse" size={28} color="white" />
        </TouchableOpacity>

        {/* Middle Button */}
        <TouchableOpacity
          style={styles.cameraButton}
          onPress={async () => {
            await takePicture();
            setProcessing(false);
          }}
        >
          <View style={styles.cameraInnerCircle} />
        </TouchableOpacity>

        {/* Right Button */}
        <TouchableOpacity
          style={[styles.iconButton, {opacity: 0}]}
          // onPress={() => router.push("/")}
        >
          <Ionicons name="home-outline" size={28} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#DCEFD7",
    justifyContent: "space-between",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    height: 70,
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: "#499F4458",
  },

  addTemplateButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#499F44",
  },

  addTemplateText: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },


  scannerArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  cornerTopLeft: {
    position: "absolute",
    top: 20,
    left: 20,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: "black",
  },
  cornerTopRight: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: "black",
  },
  cornerBottomLeft: {
    position: "absolute",
    bottom: 20,
    left: 20,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: "black",
  },
  cornerBottomRight: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: "black",
  },
  processing: {
    position: "absolute",
    justifyContent: "center",
    gap: 25,
    alignItems: "center",
    width: "100%",
    height: "100%",
    backgroundColor: "#00000088",
    zIndex: 100
  },
  processingText: {
    color: "white",
    fontSize: 24,
  },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: "#499F4458",
  },
  iconButton: {
    padding: 10
  },
  cameraButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraInnerCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#499F44",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  message: {
    textAlign: "center",
    marginBottom: 10,
  },
});