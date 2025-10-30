import React, { useState } from 'react'
import { Text, View, StyleSheet, TextInput, Pressable, FlatList } from 'react-native'
import { Feather, Ionicons } from "@expo/vector-icons";
import ModalFoodCategory from "../pantry/modalFoodCategory";
import ModalCreateFoodCategory from "../pantry/modalAddCategory"

const InventoryScreen = () => {

  const [searchEntry, setSearchEntry] = useState('')

  // hard coded for now
  const [foodCategories, setFoodCategories] = useState<string[]> (['Protein', 'Seafood', 'Vegetables', 'Herbs & Spices', 'test'])

  //states for modal visibility
    //modal for users food categories
  const [modalCategoryVisible, setCategoryModalVisible] = useState(false)
  const openCategory = () => setCategoryModalVisible(true)
  const closeCategory = () => setCategoryModalVisible(false)

    //modal for user creating a new category
  const [modalCreateCategory, setCreateCategory] = useState(false)
  const openCreateCategory = () => setCreateCategory(true)
  const closeCreateCategory = () => setCreateCategory(false)



  //states for modal content

  //setting type to be a string or null <string | null >
  const [foodCategoryTitle, setFoodCategoryTitle] = useState<string | null >(null) 
  


  return (
    <View style={style.container}>
      {/* view for meat ball icon, the three dots */}
    <View style={style.header}>
      <Pressable onPress={() => console.log("Menu pressed")} hitSlop={8}>
        <Feather name="more-horizontal" size={24} style={style.meatballButton} />
      </Pressable>
    </View>
      {/* search bar */}
      <View style={style.searchBar}>
        <Ionicons 
          name="search" 
          size={22} 
          color="#499F44" 
          style={{ marginRight: 6}} 
        />
        <TextInput
          value={searchEntry}
          onChangeText={setSearchEntry}
          placeholder="Search"
          autoCorrect={false}
        />
      </View>

    {/* list of food categories */}
      <View style={style.catergoryContainer}>
        {/* looping through foodCategories array to create a card for each category */}
        {foodCategories.map((category) => (
          <Pressable key={category} style={style.card} onPress={()=>{
            openCategory() // open modal
            setFoodCategoryTitle(category) //telling the modal what category to populate
          }}>
            <View style={style.cardTextContainer}>
              <Text>{category}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      {/* This is a modal which will be a pop up for the food category, it is invisble until a user clicks on a category */}
      <ModalFoodCategory visible={modalCategoryVisible} onClose={closeCategory} title={foodCategoryTitle ?? undefined}/>

      {/* plus icon to add another category */}
      <Pressable onPress={() => {openCreateCategory()}}>

        <ModalCreateFoodCategory
          visible={modalCreateCategory}
          onClose={closeCreateCategory}
          title="New Group"
          onSubmit={(name) => setFoodCategories(prev => [...prev, name])}
          />
          
        <Text style={style.addButton}>+</Text>
      </Pressable>
    </View>
  )
}

const style = StyleSheet.create({
  //container of the the entire screen
  container: {
    flex: 1,
    alignItems: 'center',
    marginTop: 10,
  },
  //needed this header class to position meatball to the right
  header: {
    alignSelf: 'stretch',        
    paddingHorizontal: 16,
    paddingTop: 5,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginRight: 15,
  },
  meatballButton:{
    color: "gray",
  },
  searchBar: {
    borderWidth: 2,
    borderColor: 'rgba(73,159,68,1)',
    borderRadius: 25,
    width: 350,
    padding: 10,
    alignItems: 'center',
    marginBottom: 16,
    flexDirection: 'row'
  },

  catergoryContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'center'
  },
  //the boxes on the screen that display the user food category
  card: {
    borderWidth: 2,
    borderColor: 'rgba(73,159,68,1)',
    borderRadius: 25,
    height: 150,
    width: 150,
    padding: 10,
    margin: 10,
    alignItems: 'center',
    backgroundColor: "rgba(73,159,68,0.1)",
  },

  //portion of the card the holds the text and the underline
  cardTextContainer: {
    alignSelf: 'stretch',
    marginHorizontal: -10, // so the underline would be the whole box, the padding was affecting this
    borderBottomWidth: 2,
    borderBottomColor: 'green',
    paddingBottom: 6,
    alignItems: 'center',
  },

  addButton:{
    fontSize: 40,
    color: "rgba(138, 141, 138)"
  }

})

export default InventoryScreen