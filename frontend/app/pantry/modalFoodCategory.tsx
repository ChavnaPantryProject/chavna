// pantry/ModalFoodCategory.tsx
import React , {useState} from "react";
import { Modal, View, Text, Pressable, StyleSheet } from "react-native";
import { Feather, Entypo } from "@expo/vector-icons";


type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
};

type FoodItem = {
  name: String;
  weight: number;
  qty: number;
  expDate: String;
}

export default function ModalFoodCategory({ visible, onClose, title, children }: Props) {

  //hard coding food in this category for now
  const arrOfFood = [
    { name: 'chicken', weight: 2, qty: 3, expDate: '2025-10-31' },
    { name: 'beef', weight: 1, qty: 2, expDate: '2025-11-02' },
    { name: 'eggs', weight: 0.5, qty: 12, expDate: '2025-10-25' },
    { name: 'milk', weight: 1, qty: 1, expDate: '2025-10-28' },
    { name: 'bacon', weight: 0.3, qty: 2, expDate: '2025-11-05' },
  ]
  //saying this state will be an array of the FoodItem type, and then we initalize a COPY of the arrOfFood array
  const [displayArr, setDisplayArr] = useState<FoodItem[] > (() => [...arrOfFood])

  //Functions for sorting
    //name ascending
    
    //name descending

    //weight ascending
  function sortAscWeight(){
    return [...arrOfFood].sort((a , b) => a.weight - b.weight)
  }
    //weight descending

    //qty ascending
    //qty descending

    //exp date ascending
    //exp date descending

  return (
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

          {/* category name header with an underline */}
          {title ? <Text style={style.title}>{title}</Text> : null}

          {/* column headers with the filter icon */}
          <View style={style.columnFilters}>

            <View style={[style.specificFilterColumn, {flex:1}]}>
              <Text style={style.filterText}>Name</Text>
              <Pressable>
                <Entypo name="triangle-down" size={15} />
              </Pressable>
            </View>

            <View style={[style.specificFilterColumn, {flex:1.1}]}>
              <Text style={style.filterText}>Weight</Text>
              <Pressable onPress={() => setDisplayArr(sortAscWeight())}>
                <Entypo name="triangle-down" size={15} />
              </Pressable>
            </View>

            <View style={[style.specificFilterColumn, {flex:1}]}>
              <Text style={style.filterText}>Qty</Text>
              <Pressable>
                <Entypo name="triangle-down" size={15} />
              </Pressable>
            </View>

            <View style={[style.specificFilterColumn, {flex:1.2}]}>
              <Text style={style.filterText}>Exp Date</Text>
              <Pressable>
                <Entypo name="triangle-down" size={15} />
              </Pressable>
            </View>

          </View>

          {/* loop through each item they have in this category */}
            <View style={{width: '100%'}}>
              {displayArr.map((foodItem, index) =>{
                return (
                  <View key={index} style={style.entryOfFood}>
                    <Text style={[style.specficFoodEntryColumn, {flex:1}]}>{foodItem.name}</Text>
                    <Text style={[style.specficFoodEntryColumn, {flex:1}]}>{foodItem.weight}</Text>
                    <Text style={[style.specficFoodEntryColumn, {flex:1}]}>{foodItem.qty}</Text>
                    <Text style={[style.specficFoodEntryColumn, {flex:2}]}>{foodItem.expDate}</Text>
                  </View>
                )
              }) }
            </View>

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
    marginTop: 80
  },

  //modal container
  sheet: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "rgb(227,234,225)",
    padding: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(73,159,68,1)',
    height: 600,
    alignItems: 'center'
  },

  title: { 
    fontSize: 18, 
    fontWeight: "700", 
    marginBottom: 8,
    borderBottomWidth: 2,
    borderColor: 'rgba(73,159,68,1)',
    width: "100%",
    textAlign: 'center',
    paddingBottom: 10,
  },

  //the filter row
  columnFilters:{
    borderBottomWidth: 1,
    borderColor: 'rgba(73,159,68,1)',
    width: "100%",
    justifyContent: "space-between",
    flexDirection: 'row',
    paddingBottom: 10,
    marginTop:0,
    marginBottom:5,
    paddingRight: 10,
    paddingLeft: 10,
  },

  //each individual filter column
  specificFilterColumn:{
    flexDirection: 'row',
    alignItems: 'center',
  },
    filterText:{
    fontSize:13,
    fontWeight:'500'
  },

  //each food entry row
  entryOfFood:{
    width: '100%',
    borderWidth: 2,
    borderColor: 'rgba(73,159,68,1)',
    borderRadius: 5,
    backgroundColor: 'white',
    marginTop: 5,
    padding: 3,
    flexDirection: 'row',
    justifyContent: 'space-between'
    },

    specficFoodEntryColumn:{
      textAlign: 'center',
    }
});