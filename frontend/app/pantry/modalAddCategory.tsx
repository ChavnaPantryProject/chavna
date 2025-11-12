import React,{useState} from "react";
import { Modal, StyleSheet, Pressable, Text , TextInput, View} from "react-native";
import { Modal, StyleSheet, Pressable, Text , TextInput, View, Alert, ActivityIndicator} from "react-native";
import { API_URL, retrieveValue } from "../util";

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
  onSubmit: (name: string) => void
};

export default function ModalCreateFoodCategory({ visible, onClose, title, children, onSubmit}: Props){

  const [newCategoryName, setNewCateogoryName] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert("Error", "Please enter a category name")
      return
    }

    try {
      setLoading(true)
      const token = await retrieveValue("jwt")
      if (!token) {
        Alert.alert("Error", "No authentication token found")
        setLoading(false)
        return
      }

      // Create a food item template with the category name
      // Using default values for required fields
      const response = await fetch(`${API_URL}/create-category`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCategoryName
        }),
      })

      const data = await response.json()
      
      if (response.ok && data.success === 'success') {
        onSubmit(newCategoryName.trim())
        setNewCateogoryName("")
        onClose()
      } else {
        Alert.alert("Error", data.message || "Failed to create category")
      }
    } catch (error) {
      console.error("Error creating category:", error)
      Alert.alert("Error", "Failed to create category. Please try again.")
    } finally {
      setLoading(false)
    }
  }
  
    return(
        <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
        >
            {/* backdrop that also dismisses */}
            <Pressable style={style.backdrop} onPress={() => {
              setNewCateogoryName("")
              onClose()
            }}>

                {/* stop backdrop press from closing when tapping inside */}
                <Pressable style={style.sheet} onPress={(e) => e.stopPropagation()}>

                {title ? <Text style={style.title}>{title}</Text> : null}

                {/* input field for new category name */}
                <View style={style.addCategoryInputContainer}>
                  <TextInput
                  placeholder={"New Group"}
                  style={style.addCategoryInput}
                  value={newCategoryName}
                  onChangeText={setNewCateogoryName}
                  autoFocus
                  />
                </View>

                {/* buttons for confirming or canceling the new category */}
                <Pressable 
                style={style.buttonsForAddCategory}
                onPress={()=>{
                  onSubmit(newCategoryName)
                  onClose()
                  setNewCateogoryName("")
                }}
                style={[style.buttonsForAddCategory, loading && style.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={style.textInButton}>Add</Text>
                  )}
                </Pressable>

                <Pressable 
                style={style.buttonsForAddCategory}
                onPress={() => {
                  onClose()
                  setNewCateogoryName("")
                }}
                style={[style.buttonsForAddCategory, loading && style.buttonDisabled]}
                onPress={() => {
                  setNewCateogoryName("")
                  onClose()
                }}
                disabled={loading}
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
    marginBottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)", // dim the page
  },

  sheet: {
    width: "90%",
    maxWidth: 420,
    backgroundColor: "rgba(255, 255, 255, 1)",
    padding: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(73,159,68,1)',
    height: 300,
    alignItems: 'center',
    marginBottom: 150,
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
  },
  buttonDisabled: {
    opacity: 0.5
  }
});