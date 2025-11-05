import React, { useRef, useState, useEffect } from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as MLKitOcr from "expo-mlkit-ocr";

export default function ScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [recognizedText, setRecognizedText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  const takePicture = async () => {
    if (!cameraRef.current) return;
    setLoading(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: false,
      });
      setCapturedImage(photo.uri);

      // Recognize text using expo-mlkit-ocr
      // cast to any because TypeScript types for expo-mlkit-ocr may not include scanFromUri
      const result = await (MLKitOcr as any).scanFromUri(photo.uri);

      if (result?.blocks?.length > 0) {
        const lines = result.blocks.map((block: any) => block.text);
        setRecognizedText(lines.join("\n"));
      } else {
        setRecognizedText("No text found.");
      }
    } catch (e) {
      console.error("Error scanning text:", e);
      setRecognizedText("Failed to recognize text.");
    }

    setLoading(false);
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text>Loading permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text>Camera access required.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={{ color: "white" }}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={{ fontWeight: "bold", color: "#fff", fontSize: 18 }}>
          Text Scanner
        </Text>
      </View>

      <View style={styles.scannerArea}>
        {!capturedImage ? (
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
            enableTorch={false}
          />
        ) : (
          <Image source={{ uri: capturedImage }} style={styles.camera} />
        )}

        {/* Corner styling */}
        <View style={styles.cornerTopLeft} />
        <View style={styles.cornerTopRight} />
        <View style={styles.cornerBottomLeft} />
        <View style={styles.cornerBottomRight} />
      </View>

      {recognizedText ? (
        <View style={styles.textBox}>
          <Text style={styles.textHeader}>Recognized Text:</Text>
          <Text style={styles.textBody}>{recognizedText}</Text>
        </View>
      ) : null}

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="stats-chart" size={28} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cameraButton}
          onPress={
            !capturedImage
              ? takePicture
              : () => {
                  setCapturedImage(null);
                  setRecognizedText("");
                }
          }
        >
          <View style={styles.cameraInnerCircle} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push("/")}
        >
          <Ionicons name="home-outline" size={28} color="white" />
        </TouchableOpacity>
      </View>

      {loading && (
        <ActivityIndicator size="large" color="#fff" style={styles.loading} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#DCEFD7" },
  topBar: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    height: 70,
    backgroundColor: "#499F4458",
  },
  scannerArea: { flex: 1, justifyContent: "center", alignItems: "center" },
  camera: { width: "100%", height: "100%" },
  cornerTopLeft: {
    position: "absolute",
    top: 20,
    left: 20,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: "white",
  },
  cornerTopRight: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: "white",
  },
  cornerBottomLeft: {
    position: "absolute",
    bottom: 20,
    left: 20,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: "white",
  },
  cornerBottomRight: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: "white",
  },
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
  textBox: {
    position: "absolute",
    bottom: 150,
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 16,
    borderRadius: 10,
    margin: 16,
  },
  textHeader: { fontWeight: "bold", color: "#fff", marginBottom: 6 },
  textBody: { color: "#fff" },
  loading: { position: "absolute", top: "50%", alignSelf: "center" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  button: {
    backgroundColor: "#499F44",
    padding: 10,
    borderRadius: 6,
    marginTop: 10,
  },
});
