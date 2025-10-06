import React from 'react'
import { Text, View, StyleSheet, TextInput, Image, TouchableOpacity, FlatList } from 'react-native'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'

// example meal card data used in our figma
const meals = [
  {
    id: "1",
    name: "Fettuccine Alfredo Pasta",
    calories: 1200,
    cost: 3.0,
    image: "https://share.google/images/O2IXNMSTMl4YN5ldL"
  },
  {
    id:"2",
    name: "Chicken & Rice",
    calories: 700,
    cost: 3.45,
    image: "https://share.google/images/RGB6ktIcgvAYy9Y1t"
  }
];

const MealScreen = () => {
  
  // rendering each meal card
  const renderMeal = ({item}: {item: any}) => (
  <View style={styles.card}>
    
    {/* Meal Image */}
    <Image source={{ uri: item.image }} style={styles.image} />

    {/* Meal Information */}
    <View style={styles.info}>
      <Text style={styles.title}>{item.name}</Text>
      <Text style={styles.subtitle}>{item.calories} Cals</Text>
      <Text style={styles.subtitle}>Cost Per Serving: ${item.cost.toFixed(2)}</Text>
    
      {/* Action Buttons (Eat + Delete) */}
      <View style={styles.buttons}>

        {/* Eat Button */}
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="restaurant" size={20} color="white" />
        </TouchableOpacity>

        {/* Delete Button */}
        <TouchableOpacity style={styles.actionBtn}>
          <MaterialIcons name="delete" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

  return (
    <View style={styles.container}>
      {/* Screen Title */}
      <Text style={styles.header}>Meals</Text>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="green" style={{ marginRight: 5}} />
        <TextInput placeholder="Search" style={styles.searchInput} />
      </View>

      {/* List of Meals */}
      <FlatList
        // data source
        data={meals}
        // unique key for each mealunique key
        keyExtractor={(item) => item.id}
        // render each meal card
        renderItem={renderMeal}
        // add padding so last card isnt hidden by nav bar
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      {/* Add Meal Button */}
      <TouchableOpacity style={styles.addBtn}>
        <Text style={styles.addText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

export default MealScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "white",
  },

  header: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "green",
    borderRadius: 20,
    paddingHorizontal: 10,
    marginBottom: 15,
    height: 40,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "gray",
  },

  card: {
    flexDirection: "row",   // image and info are side by side
    backgroundColor: "rgba(73,159,68,0.1)",   // light green background
    borderRadius: 12,
    marginBottom: 15,
    padding: 10,
    alignItems: "center",
  },

  image: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginRight: 10,
  },

  info: {
    flex: 1,     // text takes up remaining space
  },

  title: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 3,
  },

  subtitle: {
    fontSize: 13,
    color: "black",
    marginBottom: 2,
  },

  buttons: {
    flexDirection: "row",
    marginTop: 5,
  },

  actionBtn: {
    backgroundColor: "orange",
    padding: 8,
    borderRadius: 8,
    marginRight: 10,
  },

  addBtn: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    backgroundColor: "transparent",   // no circle background, just transparent
  },

  addText: {
    fontSize: 36,
    color: "gray",
  },
});