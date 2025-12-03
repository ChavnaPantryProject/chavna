import React from "react";
import { Pressable, Text , StyleSheet} from "react-native";


type Props = {
    onPress: () => void;
}

const AddFoodButton = ({onPress}: Props) => {

    return(
        <Pressable onPress={onPress}>
            <Text style={style.addButton}>+</Text>
        </Pressable>
    );
}

const style = StyleSheet.create({
    addButton: {
        fontSize: 40,
        color: "rgba(138, 141, 138, 1)",
        marginTop: 6,
    },
})
export default AddFoodButton;