
import React, { useRef, useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Camera, useCameraDevice } from "react-native-vision-camera";
import TextRecognition from "@react-native-ml-kit/text-recognition";
import * as FileSystem from "expo-file-system/legacy";

export default function ScannerScreen() {
  const router = useRouter();
  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice("back");

  const [permission, setPermission] = useState(false);
  const [ocrText, setOcrText] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const status = await Camera.requestCameraPermission();
        setPermission(status === "granted");
      } catch (err) {
        console.error("Permission error:", err);
        setPermission(false);
      }
    })();
  }, []);

  if (!device) return <Text>Loading camera...</Text>;
  if (!permission) return <Text>No camera permission</Text>;

  async function takeAndScan() {
    try {
      setOcrText("Processing...");

      if (!cameraRef.current) {
        setOcrText("Camera not ready");
        return;
      }

      const photo = await cameraRef.current.takePhoto({ flash: "off" });

      if (!photo?.path) {
        setOcrText("Photo capture failed (no path)");
        return;
      }

      const photoUri = `file://${photo.path}`;
      const newPath = FileSystem.cacheDirectory + "receipt.jpg";

      await FileSystem.copyAsync({ from: photoUri, to: newPath });

      const result = await TextRecognition.recognize(newPath);
      setOcrText(result?.text || "No text detected");
    } catch (e) {
      console.error("OCR error:", e);
      const msg = e instanceof Error ? e.message : JSON.stringify(e);
      setOcrText("OCR failed: " + msg);
    }
  }

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}></View>

      {/* Camera Area */}
      <View style={styles.scannerArea}>
        <Camera
          ref={cameraRef}
          style={styles.camera}
          device={device}
          isActive={true}
          photo={true}
        />
        {/* Scanner corners */}
        <View style={styles.cornerTopLeft} />
        <View style={styles.cornerTopRight} />
        <View style={styles.cornerBottomLeft} />
        <View style={styles.cornerBottomRight} />
      </View>

      {/* OCR Result */}
      <View style={styles.resultBox}>
        <Text style={{ color: "white" }}>{ocrText}</Text>
      </View>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomBar}>
        {/* Left Button */}
        <TouchableOpacity style={styles.iconButton} onPress={() => router.push("/barcodescanner")}>
          <Ionicons name="stats-chart" size={28} color="white" />
        </TouchableOpacity>

        {/* Middle Button (Scan) */}
        <TouchableOpacity style={styles.cameraButton} onPress={takeAndScan}>
          <View style={styles.cameraInnerCircle} />
        </TouchableOpacity>

        {/* Right Button (Home) */}
        <TouchableOpacity style={styles.iconButton} onPress={() => router.push("/home")}>
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
    height: 70,
    backgroundColor: "#2F4F2F", // Dark green
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
    backgroundColor: "#2F4F2F", // Dark green
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraInnerCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#2F4F2F",
  },
  resultBox: {
    position: "absolute",
    top: 80,
    left: 10,
    right: 10,
    minHeight: 80,
    backgroundColor: "#000000aa",
    padding: 12,
    borderRadius: 10,
  },
});
