import React, { useEffect, useRef, useState } from "react";
import {Text, View, StyleSheet, TouchableOpacity, Button, ActivityIndicator,} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { API_URL, loadFileBytes, Response, retrieveValue, uploadChunks, UploadInfo, useAutofocus } from "../util";
import { ConfirmationItem } from "../scannerConfirmation";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

export default function ScannerScreen() {
  const router = useRouter();
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const { isRefreshing, onTap } = useAutofocus();
  const ref = useRef<CameraView>(null);
  const [processing, setProcessing] = useState(false);

  const tap = Gesture.Tap().onBegin(onTap);

  const takePicture = async () => {
    const photo = await ref.current?.takePictureAsync({
      quality: 1,
    });

    if (photo?.uri === undefined)
      throw "No photo uri.";

    router.push({
      pathname: "/scanCropper",
      params: {
        imageUri: photo.uri,
        width: photo.width,
        height: photo.height
      }
    });
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