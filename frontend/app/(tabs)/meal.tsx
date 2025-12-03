import React, { useEffect, useState } from 'react'
import {
  Text,
  View,
  StyleSheet,
  TextInput,
  Image,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from "expo-router";
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, retrieveValue } from '../util';

// definitions
interface Ingredient {
  templateId: string;
  name: string;
  amount: number;
  unit: string;
}

interface MealSummary {
  mealId: string;
  name: string;
}

interface Meal {
  id: string;
  name: string;
  ingredients?: Ingredient[];
  calories?: number;
  cost?: number;
  image?: any;
}

const MealScreen = () => {
  const router = useRouter(); // nav controller
  const [meals, setMeals] = useState<Meal[]>([]);
  const [filteredMeals, setFilteredMeals] = useState<Meal[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]); // fav meal IDs
  const [loading, setLoading] = useState(true);

  // fetch all meals on component mount
  useEffect(() => {
    fetchAllMeals();
    loadFavorites();
  }, []);

  // filter meals based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredMeals(meals);
    } else {
      const filtered = meals.filter(meal =>
        meal.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMeals(filtered);
    }
  }, [searchQuery, meals]);

  // load favorites from AsyncStorage
  const loadFavorites = async() => {
    try {
      const savedFavorites = await AsyncStorage.getItem('favorites');
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  // save favorites to AsyncStorage
  const saveFavorites = async (newFavorites: string[]) => {
    try {
      await AsyncStorage.setItem('favorites', JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  };

  // fetch all meals from backend using /get-meals endpoint
  const fetchAllMeals = async () => {
    try {
      setLoading(true);
      const loginToken = await retrieveValue('jwt');

      if (!loginToken) {
        Alert.alert('Error', 'Please log in to view meals');
        setLoading(false);
        return;
      }

      // GET request to /get-meals
      const response = await fetch(`${API_URL}/get-meals`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${loginToken}`,
          'Content-Type': 'application/json',
        },
      });

      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.message || 'Failed to fetch meals');
      }

      if (body.success !== 'success') {
        throw new Error(body.message || 'Failed to fetch meals');
      }

      // transform the response to meal format
      const mealSummaries: MealSummary[] = body.payload.meals;

      const transformedMeals: Meal[] = mealSummaries.map(summary => ({
        id: summary.mealId,
        name: summary.name,
      }));

      setMeals(transformedMeals);
      console.log('Fetched meals:', transformedMeals);
     
    } catch (error) {
      console.error('Error fetching meals:', error);
      Alert.alert('Error', 'Failed to load meals. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // for the delete button to prompt when clicked
  const handleDelete = (meal: any) => {
    setSelectedMeal(meal);
    setShowDeleteModal(true);
  };

  // confirm deletion
  const confirmDelete = async () => {
    if (!selectedMeal) return;
   
    try {
      const loginToken = await retrieveValue('jwt');

      if (!loginToken) {
        Alert.alert('Error', 'Please log in to delete meals');
        return;
      }

      const response = await fetch(`${API_URL}/delete-meal`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${loginToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mealId: selectedMeal.id }),
      });

      const body = await response.json();

      if (!response.ok || body.success !== 'success') {
        throw new Error(body.message || 'Failed to delete meal');
      }

      // remove from local state
      setMeals(prev => prev.filter(m => m.id !== selectedMeal.id));

      Alert.alert('Success', 'Meal deleted successfully');
    } catch (error) {
      console.error('Error deleting meal:', error);
      Alert.alert('Error', 'Failed to delete meal.')
    } finally {
      setShowDeleteModal(false);
      setSelectedMeal(null);
    }
  };

  // to allow users to favorite a meal
  const handleFavorite = (meal: Meal) => {
    const newFavorites = favorites.includes(meal.id)
      ? favorites.filter(id => id !== meal.id)
      : [...favorites, meal.id];

    setFavorites(newFavorites);
    saveFavorites(newFavorites);
  };

  // navigate to meal info page (unique for each meal)
  const goToMealInfo = (mealId: string) => {
    router.push({
      pathname: "/meals/meal_ingredient",
      params: { id: mealId }
    })
  };

  // rendering each meal card
  const renderMeal = ({ item} : { item: Meal }) => (
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
        {item.image ? (
          <Image source={item.image} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.placeholderImage]}>
            <Ionicons name="fast-food" size={40} color="#499F44" />
          </View>
        )}

        {/* Meal Information */}
        <View style={styles.info}>
          <Text style={styles.subtitle}>
            {item.calories ? `${item.calories}` : 'Cals'}
          </Text>
          {item.cost !== undefined && (
            <Text style={styles.subtitle}>
              Cost Per Serving: ${item.cost.toFixed(2)}
            </Text>
          )}
     
          {/* Action Buttons (Info + Delete) */}
          <View style={styles.buttons}>

            {/* Info Button - navigates to meal details */}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => goToMealInfo(item.id)}
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#499F44" />
          <Text style={styles.loadingText}>Loading meals...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#499F44" />
          </TouchableOpacity>
        )}
      </View>

      {/* List of Meals */}
      {filteredMeals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="restaurant-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>
            {searchQuery ? 'No meals found' : 'No meals yet'}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchQuery ? 'Try a different search' : 'Tap + to add your first meal'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredMeals}
          keyExtractor={(item) => item.id}
          renderItem={renderMeal}
          contentContainerStyle={{ paddingBottom: 80 }}
          refreshing={loading}
          onRefresh={fetchAllMeals}
        />
      )}

      {/* Add Meal Button */}
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => router.push("/meals/newmeal")}
      >
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
              onPress={confirmDelete}
            >
              <Text style={styles.modalBtnText}>Delete Meal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalBtn, styles.cancelBtn]}
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

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666'
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },

  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 15,
  },

  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#499F44",
    borderRadius: 25,
    paddingHorizontal: 12,
    marginBottom: 20,
    height: 45,
    backgroundColor: "rgba(73, 159,68,0.1",
  },

  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#333",
  },

  card: {
    backgroundColor: "rgba(73,159,68,0.1)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#499F44",
    marginBottom: 15,
    padding: 10,
    overflow: "hidden",
  },

  image: {
    width: 100,
    height: 100,
    borderRadius: 16,
    marginRight: 12,
  },

  placeholderImage: {
    backgroundColor: 'rgba(73, 159, 68, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  info: {
    flex: 1,
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
    backgroundColor: "transparent",
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

  favoriteIcon: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1,
  },

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

  cancelBtn: {
    backgroundColor: "#999",
  },

  modalBtnText: {
    color: "white",
    fontWeight: "600",
  },
});