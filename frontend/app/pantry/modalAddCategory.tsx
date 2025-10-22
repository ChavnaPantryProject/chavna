import React from "react";
import { Modal, StyleSheet, Pressable, Text , TextInput, View} from "react-native";

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

                {/* input field for new category name */}
                <View style={style.addCategoryInputContainer}>
                  <TextInput
                  placeholder={"New Group"}
                  style={style.addCategoryInput}
                  autoFocus
                  />
                </View>

                {/* buttons for confirming or canceling the new category */}
                <Pressable 
                style={style.buttonsForAddCategory}
                onPress={onClose}
                >
                  <Text style={style.textInButton}>Add</Text>
                </Pressable>

                <Pressable 
                style={style.buttonsForAddCategory}
                onPress={onClose}
                >
                  <Text style={style.textInButton}>Cancel</Text>
                </Pressable>

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
    marginBottom: 150,
    backgroundColor: "rgba(0,0,0,0.35)", // dim the page
  },

  sheet: {
    width: "80%",
    maxWidth: 420,
    backgroundColor: "rgba(255, 255, 255, 1)",
    padding: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(73,159,68,1)',
    height: 300,
    alignItems: 'center'
  },

  title: { 
    padding: 10,
    textAlign: 'center',
    width: "80%",
    fontSize: 18, 
    fontWeight: "700", 
    marginBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#499F44', 
  },

  addCategoryInputContainer:{
    marginTop: 15,
    width: "100%",
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#499F44', 
    marginBottom: 10,
  },
  addCategoryInput:{
    padding: 15
  },
  buttonsForAddCategory:{
    borderWidth: 2,
    borderColor: '#A74500',
    width: "60%",
    marginTop: 15,
    backgroundColor: '#F89D5D',
    borderRadius: 10,
  },
  textInButton:{
    textAlign: 'center',
    color: 'white',
    padding: 8,
    fontWeight: 'bold',
    fontSize: 16
  }
});