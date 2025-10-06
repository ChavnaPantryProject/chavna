// index.tsx
// Home Screen

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Image,
  ScrollView,
  type ImageSourcePropType
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Adjust the initial list length by changing the { length: 5 }
const initialItems = Array.from({ length: 5 }).map((_, i) => ({
  id: String(i + 1),
  name: 'Item Name',
  done: false,
}));

export default function HomeScreen() {
  const [items, setItems] = useState(initialItems);

  const toggle = (id: string) =>
    setItems(prev => prev.map(it => (it.id === id ? { ...it, done: !it.done } : it)));

  const addItem = () =>
    setItems(prev => [...prev, { id: String(Date.now()), name: 'Item Name', done: false }]);

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Spent section */}
        <View style={{ position: 'relative' }}>
          <View style={[styles.topBar, { position: 'relative' }]}>
            <View style={{ width: 24 }} />
            <View style={styles.spentPillWrap}>
              <Text style={styles.spentLabel}>Spent This Week</Text>
              <View style={styles.spentPill}>
                <Text style={styles.spentValue}>$60.00</Text>
              </View>
            </View>

            <View
              style={[
                styles.alertDot,
                { position: 'absolute', top: 5, right: 16, zIndex: 10, elevation: 10 },
              ]}
            >
              <Text style={styles.alertExcl}>!</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={{ alignItems: 'flex-end', paddingRight: 10, marginTop: 4 }}>
            <Ionicons name="ellipsis-horizontal" size={22} color="gray" />
          </View>
        </View>

        {/* Shopping List Header */}
        <View style={styles.sectionHeaderContainer}>
          <Text style={styles.sectionHeader}>Shopping List</Text>
          <View style={styles.sectionUnderline} />
        </View>

        {/* List Rows */}
        <View style={{ paddingHorizontal: 16, paddingTop: 6 }}>
          {items.map(item => (
            <View key={item.id} style={styles.listRow}>
              <Pressable
                onPress={() => toggle(item.id)}
                style={[
                  styles.checkbox,
                  item.done && { backgroundColor: '#E6F4EA', borderColor: '#59A463' },
                ]}
              >
                {item.done ? <Ionicons name="checkmark" size={16} color="#59A463" /> : null}
              </Pressable>

              <TextInput
                style={[
                  styles.itemInput,
                  item.done && { textDecorationLine: 'line-through', opacity: 0.6 },
                ]}
                value={item.name}
                onChangeText={t =>
                  setItems(prev =>
                    prev.map(it => (it.id === item.id ? { ...it, name: t } : it)),
                  )
                }
                placeholder="Item Name"
                placeholderTextColor="#4F8B59"
              />
            </View>
          ))}

          <Pressable onPress={addItem} style={styles.addBtn}>
            <Ionicons name="add" size={26} color="#7A8B7E" />
          </Pressable>
        </View>

        {/* Favorite Meals Section */}
        <View style={styles.favWrap}>
          <Text style={styles.favTitle}>Favorite Meals</Text>
          <View style={styles.favRow}>
            <FavMeal source={require('../../assets/images/FETTUCCINE_ALFREDO_HOMEPAGE.jpg')} />
            <FavMeal source={require('../../assets/images/CHICKEN_AND_RICE_HOMEPAGE.jpg')} />
            <FavMeal source={require('../../assets/images/BURGER_HOMEPAGE.jpg')} />
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FavMeal({ source }: { source: ImageSourcePropType }) {
  return (
    <View style={styles.favItem}>
      <Image source={source} style={styles.favImage} />
    </View>
  );
}


const LINE_GREEN = '#499F44';

// Edit Styles Section
const styles = StyleSheet.create({

  // Screen Background
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingBottom: 16 },

  // Contains spent this week and alert dot
  topBar: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },

  // Top Section

  // For Centering the top portion, not including the red dot
  spentPillWrap: { flex: 1, alignItems: 'center', gap: 6, marginTop: 40, marginLeft: -21 }, /* Used marginLeft to fix centering */
  // "Spent This Week"  
  spentLabel: { fontSize: 15, color: 'black', fontWeight: '400' },
  // Pill
  spentPill: {
    paddingHorizontal: 16,
    paddingVertical: 3,
    backgroundColor: '#ADD0B3',
    borderRadius: 999,
    minWidth: 150,
  },

  // Text Inside Pill
  spentValue: { textAlign: 'center', fontWeight: '800', color: '#FFFFFF' },
  // Red Alert Dot
  alertDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F65E5D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Exclamation inside alert
  alertExcl: { color: 'white', fontWeight: '800' },

  // Divider between spent and shopping list
  divider: { height: 2, backgroundColor: LINE_GREEN, marginTop: 8 },

  // Shopping List Section

  // "Shopping List"
  sectionHeader: {
    fontSize: 15,
    fontWeight: '400',
    color: 'black',
    textAlign: 'center',
  },
  // Underline
  sectionUnderline: {
    height: 2,
    backgroundColor: LINE_GREEN,
    width: 160,
    marginTop: 6,
    borderRadius: 2,
  },
  // Centering for "Shopping List" and the underline
  sectionHeaderContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 14,
  },
  // Shopping List Rows
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  // Circle outline for check boxes
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#499F44',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  // Text input box
  itemInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#499F44',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    color: '#1D3B25',
    fontWeight: '600',
  },
  // Add button (Plus Sign)
  addBtn: {
    marginTop: 6,
    marginBottom: 20,
    alignSelf: 'center',
  },
  
  // Favorite Meals Section

  // Green background
  favWrap: {
    backgroundColor: '#B7D7BF',
    paddingTop: 12,
    paddingBottom: 24,
    paddingHorizontal: 16,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  // "Favorite Meals"
  favTitle: {
    textAlign: 'center',
    marginBottom: 10,
    color: 'black',
    fontWeight: '400',
    fontSize: 15,
  },
  // Horizontal row layout
  favRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  // Circular containers
  favItem: {
    width: 86,
    height: 86,
    borderRadius: 43,
    overflow: 'hidden',
    backgroundColor: 'FFFFFF',
  },
  // Image adjustments in container (Can't really adjust because the images will end up too small to fit in the circle)
  favImage: { width: '100%', height: '100%' }
});