/*
import PopupErrors from "./PopupErrors";

const [popupVisible, setPopupVisible] = useState(false);
const [popupMessage, setPopupMessage] = useState("");

Empty email case
if (!email.trim()) {
      setPopupMessage("Please enter your email or username.");
      setPopupVisible(true);
      return;
    }

view
<PopupErrors
        visible={popupVisible}
        type="error"
        message={popupMessage}
        onClose={() => setPopupVisible(false)}
      />

*/


import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";

type PopupType = "error";

type UniversalPopupProps = {
  visible: boolean;
  type: PopupType;
  title?: string;
  message: string;
  onClose: () => void;
};

export default function UniversalPopup({
  visible,
  type = "error",
  title,
  message,
  onClose,
}: UniversalPopupProps) {
  const errorType = {
    error: {
      title: title || "Error",
      borderColor: "#3CB371",
      buttonColor: "#F79448",
    },
  };

  const current = errorType[type];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { borderColor: current.borderColor }]}>
          <Text style={styles.title}>{current.title}</Text>
          <View style={[styles.separator, { backgroundColor: current.borderColor }]} />
          <Text style={styles.message}>{message}</Text>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: current.buttonColor }]}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>Ok</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: 260,
    paddingVertical: 20,
    alignItems: "center",
    borderWidth: 1,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2E4E3F",
    marginBottom: 5,
  },
  separator: {
    width: "80%",
    height: 1,
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  button: {
    borderRadius: 15,
    width: 120,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});