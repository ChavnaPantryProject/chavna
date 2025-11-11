import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import TextRecognition, { TextBlock } from "@react-native-ml-kit/text-recognition";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function ScannerScreen() {
  const router = useRouter();
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [scannedText, setScannedText] = useState<string>("");

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to use the camera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
          <Text style={styles.permissionText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleScan = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        const result = await TextRecognition.recognize(photo.uri);

        // Normalize result to an array of TextBlock regardless of returned shape
        let blocks: TextBlock[] = [];
        if (Array.isArray(result)) {
          blocks = result as unknown as TextBlock[];
        } else if ((result as any)?.blocks) {
          blocks = (result as any).blocks as TextBlock[];
        } else if ((result as any)?.textBlocks) {
          blocks = (result as any).textBlocks as TextBlock[];
        }

        const textParts = blocks.map((block: TextBlock) => block.text);
        const text = textParts.length ? textParts.join("\n") : (typeof (result as any)?.text === "string" ? (result as any).text : "");
        setScannedText(text);
        router.push({
          pathname: "/scannerConfirmation",
          params: { scannedText: text },
        });
      } catch (error) {
        Alert.alert("Scan Error", "Failed to scan receipt.");
      }
    }
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef} />
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.iconButton} onPress={toggleCameraFacing}>
          <Ionicons name="camera-reverse-outline" size={28} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.cameraButton} onPress={handleScan}>
          <View style={styles.cameraInnerCircle} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.push("/")}>
          <Ionicons name="home-outline" size={28} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#DCEFD7" },
  camera: { flex: 1 },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: "#499F4458",
  },
  iconButton: { padding: 10 },
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
  message: { textAlign: "center", paddingBottom: 10 },
  permissionButton: {
    backgroundColor: "#499F44",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  permissionText: { color: "white", fontWeight: "bold" },
});