import React, { useMemo, useState } from 'react'
import { Text, View, StyleSheet, TextInput, Pressable, FlatList } from 'react-native'

const InventoryScreen = () => {
  const [searchEntry, setSearchEntry] = useState('')
  // hard coded for now
  const foodCategories: string[] = ['Protein', 'Seafood', 'Vegetables', 'Herbs & Spices', 'test']


  return (
    <View style={style.container}>
      {/* search bar */}
      <View style={style.searchBar}>
        <TextInput
          value={searchEntry}
          onChangeText={setSearchEntry}
          placeholder="Search"
          autoCorrect={false}
        />
      </View>

    {/* list of food categories */}
      <View style={style.catergoryContainer}>
        {foodCategories.map((category) => (
          <Pressable key={category} style={style.card}>
            <View style={style.cardTextContainer}>
              <Text>{category}</Text>
            </View>
          </Pressable>
        ))}
      </View>
      {/* plus icon to add another category */}
      <Pressable>
        <Text>+</Text>
      </Pressable>
    </View>
  )
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    marginTop: 100,
  },
  searchBar: {
    borderWidth: 2,
    borderColor: 'rgba(73,159,68,1)',
    borderRadius: 25,
    width: 350,
    padding: 10,
    alignItems: 'center',
    marginBottom: 16,
  },

  catergoryContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'center'
  },

  card: {
    borderWidth: 2,
    borderColor: 'rgba(73,159,68,1)',
    borderRadius: 25,
    height: 125,
    width: 125,
    padding: 10,
    margin: 10,
    alignItems: 'center',
  },

  cardTextContainer: {
    alignSelf: 'stretch',
    marginHorizontal: -10, // so the underline would be the whole box, the padding was affecting this
    borderBottomWidth: 2,
    borderBottomColor: 'green',
    paddingBottom: 6,
    alignItems: 'center',
  }

})

export default InventoryScreen