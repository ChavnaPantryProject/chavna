import React from "react";
import { Modal, StyleSheet, Pressable, Text } from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
};

export default function ModalCreateFoodCategory({ visible, onClose, title, children}: Props){
    return(
        <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose} 
        >
            {/* backdrop that also dismisses */}
            <Pressable style={style.backdrop} onPress={onClose}>

                {/* stop backdrop press from closing when tapping inside */}
                <Pressable style={style.sheet} onPress={(e) => e.stopPropagation()}>

                {title ? <Text style={style.title}>{title}</Text> : null}
                {children ?? <Text>pop up</Text>}

                </Pressable>
            </Pressable>
        </Modal>
  );
}

const style = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    marginBottom: 150
  },

  sheet: {
    width: "80%",
    maxWidth: 420,
    backgroundColor: "rgb(227,234,225)",
    padding: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(73,159,68,1)',
    height: 300,
    alignItems: 'center'
  },

  title: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
});