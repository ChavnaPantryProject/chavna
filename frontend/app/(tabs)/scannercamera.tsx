import React, { useRef, useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Camera, useCameraDevice } from "react-native-vision-camera";
import TextRecognition from "@react-native-ml-kit/text-recognition";

export default function ScannerScreen() {
  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice("back");

  const [permission, setPermission] = useState(false);
  const [ocrText, setOcrText] = useState("");

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setPermission(status === "granted");  // <-- FIXED HERE
    })();
  }, []);

  if (!device) return <Text>Loading camera...</Text>;
  if (!permission) return <Text>No camera permission</Text>;

  async function takeAndScan() {
    try {
      const photo = await cameraRef.current?.takePhoto({
        flash: "off",
      });

      if (!photo?.path) return;

      const result = await TextRecognition.recognize(photo.path);
      setOcrText(result?.text || "");
    } catch (e) {
      const message = e instanceof Error ? e.message : JSON.stringify(e); // <-- FIXED HERE
      console.error("OCR error:", message);
      setOcrText("OCR failed: " + message);
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
