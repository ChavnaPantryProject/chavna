import React from 'react'
import { 
  Text, 
  View, 
  StyleSheet, 
  TextInput, 
  Image, 
  TouchableOpacity, 
  FlatList,
  Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from "expo-router";
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
  const router = useRouter(); // nav controller
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [selectedMeal, setSelectedMeal] = React.useState<any>(null);
  const [favorites, setFavorites] = React.useState<string[]>([]); // fav meal IDs

  // for the delete button to prompt when clicked
  const handleDelete = (meal: any) => {
    setSelectedMeal(meal);
    setShowDeleteModal(true);
  };

  // to allow users to favorite a meal
  const handleFavorite = (meal: any) => {
    setFavorites((prev) => 
      prev.includes(meal.id)
        ? prev.filter((id) => id !== meal.id)
        : [...prev, meal.id]
    );
  };

  // rendering each meal card
  const renderMeal = ({item}: {item: any}) => (
  <View style={styles.card}>

    {/* Favorite Icon - top right corner */}
    <View style={styles.favoriteIcon}>
      <TouchableOpacity onPress={() => handleFavorite(item)}>
        <Ionicons 
          name={favorites.includes(item.id) ? "star" : "star-outline"}
          size={22} 
          color={favorites.includes(item.id) ? "#F89D5D" : "#5b5959ff"} 
        />
      </TouchableOpacity>
    </View>

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
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={() => router.push("/meals/editmeal")}
          >
            <Ionicons name="restaurant" size={20} color="white" />
          </TouchableOpacity>

          {/* Delete Button */}
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => handleDelete(item)}
          >
            <MaterialIcons name="delete" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </View>

);

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons 
          name="search" 
          size={22} 
          color="#499F44" 
          style={{ marginRight: 6}} 
        />
        <TextInput 
          placeholder="Search" 
          placeholderTextColor="#555" 
          style={styles.searchInput} 
        />
      </View>

      {/* List of Meals */}
      <FlatList
        // data source
        data={data}
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

      {/* Delete Meal Confirmation */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Delete Meal</Text>
            <View style={styles.modalDivider} />
            <Text style={styles.modalText}>
              Are you sure you want to delete {selectedMeal?.name}?
            </Text>

            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => {
                setShowDeleteModal(false);
              }}
            >
              <Text style={styles.modalBtnText}>Delete Meal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => setShowDeleteModal(false)}
            >
              <Text style={styles.modalBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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

  // for favorite meals
  favoriteIcon: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalBox: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#499F44",
    paddingVertical: 20,
    alignItems: "center",
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 7,
    color: "#000",
  },

  modalDivider: {
    height: 1,
    width: "70%",
    backgroundColor: "#499F44",
    marginVertical: 6,
  },

  modalText: {
    fontSize: 15,
    textAlign: "center",
    marginVertical: 15,
    marginHorizontal: 30,
    color: "#000",
  },

  modalBtn: {
    backgroundColor: "#F89D5D",
    paddingVertical: 10,
    borderRadius: 12,
    marginVertical: 6,
    width: "60%",
    alignItems: "center",
  },

  modalBtnText: {
    color: "white",
    fontWeight: "600",
  },
});