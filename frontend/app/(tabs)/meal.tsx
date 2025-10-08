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
    image: require('../../assets/images/FETTUCCINE_ALFREDO_HOMEPAGE.jpg')
  },
  {
    id:"2",
    name: "Chicken & Rice",
    calories: 700,
    cost: 3.45,
    image: require('../../assets/images/CHICKEN_AND_RICE_HOMEPAGE.jpg')
  }
];

const MealScreen = () => {
  
  // rendering each meal card
  const renderMeal = ({item}: {item: any}) => (
  <View style={styles.card}>

    {/* Title */}
    <Text style={styles.title}>{item.name}</Text>

    {/* Divider */}
    <View style={styles.divider} />

    {/* Row with image and info */}
    <View style={styles.contentRow}>
      {/* Meal Image */}
      <Image source={item.image} style={styles.image} />

      {/* Meal Information */}
      <View style={styles.info}>
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
  </View>

);

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={22} color="#499F44" style={{ marginRight: 6}} />
        <TextInput placeholder="Search" placeholderTextColor="#555" style={styles.searchInput} />
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
    backgroundColor: "#fff",
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#499F44",
    borderRadius: 25,
    paddingHorizontal: 12,
    marginBottom: 20,
    height: 45, // slightly bigger search bar
    backgroundColor: "rgba(73, 159,68,0.1",
  },

  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#333",  // darker color for text
  },

  card: {
    backgroundColor: "rgba(73,159,68,0.1)",   // light green background
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#499F44",
    marginBottom: 15,
    padding: 10,
    overflow: "hidden",  // ensures rounded corners for image
  },

  image: {
    width: 100,
    height: 100,
    borderRadius: 16,
    marginRight: 12,
  },

  info: {
    flex: 1,     // text takes up remaining space
  },

  title: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    marginVertical: 8,
    color: "#000",
  },

  subtitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#000",
    marginBottom: 6,
  },

  buttons: {
    flexDirection: "row",
    marginTop: 6,
    width: "100%",
  },

  actionBtn: {
    flex: 1,
    backgroundColor: "#F89D5D",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  addBtn: {
    position: "absolute",
    bottom: 25,
    alignSelf: "center",
    backgroundColor: "transparent",   // no circle background, just transparent
  },

  addText: {
    fontSize: 38,
    color: "#999",
  },

  divider: {
    height: 1,
    backgroundColor: "#499F44",
    opacity: 0.7,
    marginHorizontal: 10,
    marginBottom: 8,
  },

  contentRow: {
    flexDirection: "row",
    alignItems: "center",
  },
});