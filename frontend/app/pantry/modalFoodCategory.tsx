// pantry/ModalFoodCategory.tsx
import React , {useState, useEffect} from "react";
import { Modal, View, Text, Pressable, StyleSheet } from "react-native";
import { Feather, Entypo } from "@expo/vector-icons";
import PopupForm from "../PopupForm";
import { Modal, View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { Feather, Entypo } from "@expo/vector-icons";
import { API_URL, retrieveValue } from "../util";

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
};

type BackendFoodItem = {
  id: string;
  name: string;
  amount: number;
  unit: string;
  expiration: string;
  lastUsed: string | null;
  unitPrice: number;
  addDate: string;
  category: string;
}

type FoodItem = {
  name: string;
  weight: number;
  qty: number;
  expDate: string;
}

export default function ModalFoodCategory({ visible, onClose, title, children }: Props) {

  //hard coding food in this category for now
  // state (lazy init so it runs once, unless updated)
  const [foodArray, setFoodArray] = useState<FoodItem[]>(() => [
    { name: "chicken", weight: 2,   qty: 3,  expDate: "2025-10-31" },
    { name: "beef",    weight: 1,   qty: 2,  expDate: "2025-11-02" },
    { name: "eggs",    weight: 0.5, qty: 12, expDate: "2025-10-25" },
    { name: "milks",    weight: 1,   qty: 1,  expDate: "2025-10-28" },
    { name: "bacons",   weight: 0.3, qty: 2,  expDate: "2025-11-05" },
  ]);
  //functions for adding/updating food into this array
    //reset updated food list
  useEffect(() => {
    setDisplayArr([...foodArray]);
  }, [foodArray]);
    //add food to array
  const addFood = (food : FoodItem) =>{
    setFoodArray(prev => [...prev, food])
  }

    //remove food from the array
  const removeFood = (name: string) => {
    setFoodArray(prev => prev.filter(f => f.name !== name))
  }

    
  type NewFoodEntry = {
    category: string;
    name: string;
    weight: number;
    qty: number;
    expDate: string; 
  };

  const [foodEntry, setFoodEntry] = useState<NewFoodEntry>({
    category: "",
    name: "",
    weight: 0,
    qty: 0,
    expDate: "",
  });
  const [arrOfFood, setArrOfFood] = useState<FoodItem[]>([])
  const [loading, setLoading] = useState(false)
  //saying this state will be an array of the FoodItem type, and then we initalize a COPY of the arrOfFood array
  const [displayArr, setDisplayArr] = useState<FoodItem[]>([])

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
    setDisplayArr([...foodArray])
    setAddFoodItemModalVisible(false)
  }

  //saying this state will be an array of the FoodItem type, and then we initalize a COPY of the foodArray array
  const [displayArr, setDisplayArr] = useState<FoodItem[] > (() => [...foodArray])

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

  //state for opening add food item modal
  const [addFoodItemModalVisble, setAddFoodItemModalVisible] = useState<boolean>(false)
    setDisplayArr([...arrOfFood])
  }

  // Fetch food items from backend when modal opens and title changes
  useEffect(() => {
    if (visible && title) {
      fetchFoodItems()
    } else if (!visible) {
      // Reset state when modal closes
      resetState()
    }
  }, [visible, title])

  const fetchFoodItems = async () => {
    if (!title) return
    
    try {
      setLoading(true)
      const token = await retrieveValue("jwt")
      if (!token) {
        console.error("No authentication token found")
        setLoading(false)
        return
      }

      const response = await fetch(`${API_URL}/get-food-items`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ category: title }),
      })

      const data = await response.json()
      
      if (response.ok && data.success === 'success') {
        const backendItems: BackendFoodItem[] = data.payload?.items || []
        // Map backend items to frontend format
        const mappedItems: FoodItem[] = backendItems.map(item => ({
          name: item.name,
          weight: 0,
          qty: item.amount,
          expDate: item.expiration ? new Date(item.expiration).toISOString().split('T')[0] : '',
        }))
        setArrOfFood(mappedItems)
        setDisplayArr([...mappedItems])
      } else {
        console.error("Failed to fetch food items:", data.message || data)
        setArrOfFood([])
        setDisplayArr([])
      }
    } catch (error) {
      console.error("Error fetching food items:", error)
      setArrOfFood([])
      setDisplayArr([])
    } finally {
      setLoading(false)
    }
  }

  //----------------------- Functions for sorting -----------------------
    //name ascending
  function sortAscName(){
    resetAllArrows()
    setActiveFilter('name')
    return [...foodArray].sort((a , b) => a.name.localeCompare(b.name))
    return [...arrOfFood].sort((a , b) => a.name.localeCompare(b.name))
  }
    //name descending
  function sortDescName(){
    resetAllArrows()
    setActiveFilter('name')
    setNameArrow(false) //make arrow point up
    return[...foodArray].sort((a , b) => b.name.localeCompare(a.name))
    return[...arrOfFood].sort((a , b) => b.name.localeCompare(a.name))
  }
    //weight ascending
  function sortAscWeight(){
    resetAllArrows()
    setActiveFilter('weight')
    return [...foodArray].sort((a , b) => a.weight - b.weight)
  }
    //weight descending
  function sortDescWeight(){
    resetAllArrows()
    setActiveFilter('weight')
    setWeightArrow(false) //make arrow point up
    return [...foodArray].sort((a , b)=> b.weight - a.weight)
  }
    //qty ascending
  function sortAscQty(){
    resetAllArrows()
    setActiveFilter('qty')
    return [...foodArray].sort((a , b) => a.qty - b.qty)
  }
    //qty descending
  function sortDescQty(){
    resetAllArrows()
    setActiveFilter('qty')
    setQtyArrow(false) //make arrow point up
    return [...foodArray].sort((a , b) => b.qty - a.qty) 
  }
    //exp date ascending
  function sortAscExpDate(){
    resetAllArrows()
    setActiveFilter('expDate')
    return [...foodArray].sort((a , b) => new Date(a.expDate as string).getTime() - new Date(b.expDate as string).getTime())
  }
    //exp date descending
  function sortDescExpDate(){
    resetAllArrows()
    setActiveFilter('expDate')
    setExpDateArrow(false) //make arrow point up
    return [...foodArray].sort((a , b) => new Date(b.expDate as string).getTime() - new Date(a.expDate as string).getTime())
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

            {/* add button to open the input popup for adding food items */}
            <Pressable onPress={() => setAddFoodItemModalVisible(true)}>
              <Text style={style.addButton}>+</Text>
            </Pressable>

            <PopupForm
              visible={addFoodItemModalVisble}
              onClose={() => setAddFoodItemModalVisible(false)}
              onSave={(data) => {
                const newItem: FoodItem = {
                  name: data.textValue.trim(),
                  weight: data.number1.trim() === "" ? 0 : Number(data.number1),
                  qty:    data.number2.trim() === "" ? 0 : Number(data.number2),
                  expDate: typeof data.date === "string"
                    ? data.date
                    : new Date(data.date).toISOString().slice(0, 10),
                };

                // ignore empty names (optional)
                if (!newItem.name) return;

                addFood(newItem)
                setFoodEntry({              //reset the form state
                  category: "",
                  name: "",
                  weight: 0,
                  qty: 0,
                  expDate: "",
                });
                setAddFoodItemModalVisible(false); // close the add modal
              }}
              dropdownOptions={[
                  { label: "Protein", value: "Protein" },
                  { label: "Vegetables", value: "Vegetables" },
                  { label: "Seafood", value: "Seafood" },
                  { label: "Carbs", value: "Carbs" },
                  { label: "Fruits", value: "Fruits" }
                ]}
              />
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
    },
    addButton:{
    fontSize: 40,
    color: "rgba(138, 141, 138)"
  },
});
