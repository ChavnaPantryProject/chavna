import React, { useRef, useState } from "react";
import {Text, View, StyleSheet, TouchableOpacity, Button,} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { API_URL, Response } from "../util";

export default function ScannerScreen() {
  const router = useRouter();
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const ref = useRef<CameraView>(null);
  const [image, setImage] = useState<string>("");

  const takePicture = async () => {
    const photo = await ref.current?.takePictureAsync({
      pictureRef: false,
      base64: true
    });
    console.log("take picture");
    if (photo?.base64) {
      console.log("process photo");
      setImage(photo.base64);

      const response = await fetch(`${API_URL}/scan-receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64Image: photo.base64
        })
      });


      if (response === null)
        return;

      const body: Response = await response.json();

      if (body === null)
        return;

      if (body.success === "success") {
        const lines = body.payload as Array<string>;
        for (const s of lines) {
          console.log(s);
        }
      }
    }


    // router.push("/scannerConfirmation")
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
      <View style={styles.scannerArea}>
        <CameraView style={styles.camera} ref={ref} facing={facing} />
        {/* Scanner corners */}
        <View style={styles.cornerTopLeft} />
        <View style={styles.cornerTopRight} />
        <View style={styles.cornerBottomLeft} />
        <View style={styles.cornerBottomRight} />
      </View>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomBar}>
        {/* Left Button */}
        <TouchableOpacity style={styles.iconButton} onPress={toggleCameraFacing}>
          <Ionicons name="camera-reverse" size={28} color="white" />
        </TouchableOpacity>

        {/* Middle Button */}
        <TouchableOpacity
          style={styles.cameraButton}
          onPress={() => takePicture()}
        >
          <View style={styles.cameraInnerCircle} />
        </TouchableOpacity>

        {/* Right Button */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push("/")}
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
    justifyContent: "space-around",
    alignItems: "center",
    height: 70,
    paddingVertical: 20,
    backgroundColor: "#499F4458",
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
    padding: 10,
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