import React, { useRef, useState } from "react";
import { Text, View, StyleSheet, TouchableOpacity, Button, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import Tesseract from "tesseract.js";

export default function ScannerScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);

  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button title="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  }

  const handleScan = async () => {
    if (!cameraRef.current) return;

    setIsProcessing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.7,  // You can adjust this if needed
      });

      const base64Image = `data:image/jpg;base64,${photo.base64}`;

      const result = await Tesseract.recognize(base64Image, "eng", {
        logger: (m) => console.log(m),
      });

      const extractedText = result.data.text || "";

      router.push({
        pathname: "/scannerConfirmation",
        params: { text: extractedText },
      });

    } catch (err) {
      console.error("Tesseract error:", err);
    }

    setIsProcessing(false);
  };

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}></View>

      {/* Live Camera */}
      <View style={styles.scannerArea}>
        <CameraView style={styles.camera} facing={facing} ref={cameraRef} />

        {/* Scanner UI Corners */}
        <View style={styles.cornerTopLeft} />
        <View style={styles.cornerTopRight} />
        <View style={styles.cornerBottomLeft} />
        <View style={styles.cornerBottomRight} />
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomBar}>
        {/* Flip Camera */}
        <TouchableOpacity style={styles.iconButton} onPress={toggleCameraFacing}>
          <Ionicons name="camera-reverse" size={28} color="white" />
        </TouchableOpacity>

        {/* Scan Button */}
        <TouchableOpacity style={styles.cameraButton} onPress={handleScan}>
          {isProcessing ? (
            <ActivityIndicator size="large" color="black" />
          ) : (
            <View style={styles.cameraInnerCircle} />
          )}
        </TouchableOpacity>

        {/* Go Home */}
        <TouchableOpacity style={styles.iconButton} onPress={() => router.push("/")}>
          <Ionicons name="home-outline" size={28} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#DCEFD7" },
  topBar: { 
    height: 70, 
    backgroundColor: "#499F4458" },
  scannerArea: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center" },
  camera: { ...StyleSheet.absoluteFillObject },

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
    paddingVertical: 20, 
    backgroundColor: "#499F4458" },
  iconButton: { 
    padding: 10 },

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
    alignItems: "center" },
  message: { 
    textAlign: "center", 
    marginBottom: 10 },
});
