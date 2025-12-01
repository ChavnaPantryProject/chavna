
import React, { useRef, useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Camera, useCameraDevice } from "react-native-vision-camera";
import TextRecognition from "@react-native-ml-kit/text-recognition";
import * as FileSystem from "expo-file-system/legacy";

export default function ScannerScreen() {
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

      //Copy to Expo-accessible directory
      await FileSystem.copyAsync({ from: photoUri, to: newPath });

      //Run ML Kit OCR
      const result = await TextRecognition.recognize(newPath);
      setOcrText(result?.text || "No text detected");
    } catch (e) {
      console.error("OCR error:", e);
      const msg = e instanceof Error ? e.message : JSON.stringify(e);
      setOcrText("OCR failed: " + msg);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <Camera
        ref={cameraRef}
        style={{ flex: 1 }}
        device={device}
        isActive={true}
        photo={true}
      />

      <TouchableOpacity style={styles.button} onPress={takeAndScan}>
        <Text style={styles.buttonText}>Scan Text</Text>
      </TouchableOpacity>

      <View style={styles.resultBox}>
        <Text style={{ color: "white" }}>{ocrText}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    bottom: 150,
    alignSelf: "center",
    backgroundColor: "black",
    padding: 16,
    borderRadius: 12,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
  },
  resultBox: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    minHeight: 80,
    backgroundColor: "#000000aa",
    padding: 12,
    borderRadius: 10,
  },
});
