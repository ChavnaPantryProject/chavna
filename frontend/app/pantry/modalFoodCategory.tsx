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
  name: string;
  weight: number;
  qty: number;
  expDate: string;
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

  //function to reset all arrrows to defualt
  function resetAllArrows(){
    setNameArrow(true)
    setWeightArrow(true)
    setQtyArrow(true)
    setExpDateArrow(true)
  }
  //function to clear all states for when modal closes
  function resetState(){
    resetAllArrows()
    setActiveFilter('')
    setDisplayArr([...arrOfFood])
  }
  //saying this state will be an array of the FoodItem type, and then we initalize a COPY of the arrOfFood array
  const [displayArr, setDisplayArr] = useState<FoodItem[] > (() => [...arrOfFood])

  // States for sorting direction arrow 
  //            ALL ARROWS WITH TRUE ARE THE DEFAULT, TRUE POINTS ARROW DOWN, FALSE POINTS ARROW UP
  const [nameArrow, setNameArrow] = useState<boolean>(true)
  const [weightArrow, setWeightArrow] = useState<boolean>(true)
  const [qtyArrow, setQtyArrow] = useState<boolean>(true)
  const [expDateArrow, setExpDateArrow] = useState<boolean>(true)

  //color scheme for active an dnon active filters
  const ACTIVEFILTERCOLOR = 'rgba(73,159,68,1)' //green
  const NONACTIVEFILTERCOLOR = 'gray'

  //state for the active filter
  const [activeFilter, setActiveFilter] = useState<string>('')

  //----------------------- Functions for sorting -----------------------
    //name ascending
  function sortAscName(){
    resetAllArrows()
    setActiveFilter('name')
    return [...arrOfFood].sort((a , b) => a.name.localeCompare(b.name))
  }
    //name descending
  function sortDescName(){
    resetAllArrows()
    setActiveFilter('name')
    setNameArrow(false) //make arrow point up
    return[...arrOfFood].sort((a , b) => b.name.localeCompare(a.name))
  }
    //weight ascending
  function sortAscWeight(){
    resetAllArrows()
    setActiveFilter('weight')
    return [...arrOfFood].sort((a , b) => a.weight - b.weight)
  }
    //weight descending
  function sortDescWeight(){
    resetAllArrows()
    setActiveFilter('weight')
    setWeightArrow(false) //make arrow point up
    return [...arrOfFood].sort((a , b)=> b.weight - a.weight)
  }
    //qty ascending
  function sortAscQty(){
    resetAllArrows()
    setActiveFilter('qty')
    return [...arrOfFood].sort((a , b) => a.qty - b.qty)
  }
    //qty descending
  function sortDescQty(){
    resetAllArrows()
    setActiveFilter('qty')
    setQtyArrow(false) //make arrow point up
    return [...arrOfFood].sort((a , b) => b.qty - a.qty) 
  }
    //exp date ascending
  function sortAscExpDate(){
    resetAllArrows()
    setActiveFilter('expDate')
    return [...arrOfFood].sort((a , b) => new Date(a.expDate as string).getTime() - new Date(b.expDate as string).getTime())
  }
    //exp date descending
  function sortDescExpDate(){
    resetAllArrows()
    setActiveFilter('expDate')
    setExpDateArrow(false) //make arrow point up
    return [...arrOfFood].sort((a , b) => new Date(b.expDate as string).getTime() - new Date(a.expDate as string).getTime())
  }
  // --------------------------End of sorting functions ----------------------------------------


  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose} 
    >
      {/* backdrop that also dismisses */}
      <Pressable style={style.backdrop} onPress={() => {
        resetState()
        onClose()
      }}>

        {/* stop backdrop press from closing when tapping inside */}
        <Pressable style={style.sheet} onPress={(e) => e.stopPropagation()}>

          {/* category name header with an underline */}
          {title ? <Text style={style.title}>{title}</Text> : null}

          {/* column headers with the filter icon */}
          <View style={style.columnFilters}>

            <View style={{flex:1}}>
              <Pressable style={style.specificFilterColumn} onPress={() => setDisplayArr(nameArrow ? sortDescName() : sortAscName())}>
                <Text style={style.filterText}>Name</Text>
                <Entypo name={nameArrow ? "triangle-down" : "triangle-up"} size={15} color={activeFilter == "name" ? ACTIVEFILTERCOLOR : NONACTIVEFILTERCOLOR}/>
              </Pressable>
            </View>

            <View style={{flex:1.1}}>
              <Pressable style={style.specificFilterColumn} onPress={() => setDisplayArr(weightArrow ? sortDescWeight() : sortAscWeight())}>
                <Text style={style.filterText}>Weight</Text>
                <Entypo name={weightArrow ? "triangle-down" : "triangle-up"} size={15} color={activeFilter == "weight" ? ACTIVEFILTERCOLOR : NONACTIVEFILTERCOLOR} />
              </Pressable>

            </View>

            <View style={{flex:1}}>
              <Pressable style={style.specificFilterColumn} onPress={() => setDisplayArr(qtyArrow ? sortDescQty() : sortAscQty())}>
                <Text style={style.filterText}>Qty</Text>
                <Entypo name={qtyArrow ? "triangle-down" : "triangle-up"} size={15} color={activeFilter == "qty" ? ACTIVEFILTERCOLOR : NONACTIVEFILTERCOLOR} />
              </Pressable>

            </View>

            <View style={ {flex:1.2}}>
              <Pressable style={style.specificFilterColumn} onPress={() => setDisplayArr( expDateArrow ? sortDescExpDate() : sortAscExpDate())}>
                <Text style={style.filterText}>Exp Date</Text>
                <Entypo name={ expDateArrow ? "triangle-down" : "triangle-up"} size={15} color={activeFilter == "expDate" ? ACTIVEFILTERCOLOR : NONACTIVEFILTERCOLOR} />
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
    fontSize:17,
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
      fontSize: 17,
    }
});
