// home.tsx
// Home Screen

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Image,
  type ImageSourcePropType,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

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

  // Auto scroll when adding to list
  const scrollRef = useRef<ScrollView | null>(null);

  // List resets back to top when returning to page
  useFocusEffect(
    React.useCallback(() => {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      });
      return undefined;
    }, [])
  );

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [items.length]);

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.content}>
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

          {/* Commented out ellipsis for now */}
          {/* <View style={{ alignItems: 'flex-end', paddingRight: 22, marginTop: 0 }}>
            <Ionicons name="ellipsis-horizontal" size={28} color="gray" />
          </View> */}
        </View>

        {/* Shopping List */}
        <View style={styles.listArea}>
          <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionHeader}>Shopping List</Text>
            <View style={styles.sectionUnderline} />
          </View>

          {/* Scroll only the rows */}
          <View style={{ flex: 1 }}>
            <ScrollOnlyRows scrollRef={scrollRef}>
              <View style={{ paddingHorizontal: 16, paddingTop: 0 }}>
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
                  <Ionicons name="add" size={35} color="#7A8B7E" />
                </Pressable>
              </View>
            </ScrollOnlyRows>
          </View>
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
      </View>
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

// (2) Updated prop type to accept nullable ref
function ScrollOnlyRows({
  children,
  scrollRef,
}: {
  children: React.ReactNode;
  scrollRef: React.RefObject<ScrollView | null>;
}) {
  return (
    <ScrollView
      ref={scrollRef}
      style={{ flex: 1 }}
      contentContainerStyle={styles.listAreaContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      bounces={false}
      alwaysBounceVertical={false}
      overScrollMode="never"
      contentInsetAdjustmentBehavior="never"
    >
      {children}
    </ScrollView>
  );
}

const LINE_GREEN = '#499F44';

// Edit Styles Section
const styles = StyleSheet.create({
  // Screen Background
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1 },

  // Contains spent this week and alert dot
  topBar: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },

  // Top Section
  // For centering the top portion, not including the red dot
  spentPillWrap: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    marginTop: 30,
    marginLeft: -21, // Used marginLeft to fix centering
  },
  // "Spent This Week"
  spentLabel: { fontSize: 18, color: 'black', fontWeight: '400' },
  // Pill
  spentPill: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#ADD0B3',
    borderRadius: 999,
    minWidth: 150,
  },

  // Text Inside Pill
  spentValue: { textAlign: 'center', fontWeight: '800', color: '#FFFFFF', fontSize: 20 },
  // Red Alert Dot
  alertDot: {
    width: 40,
    height: 40,
    borderRadius: 19,
    backgroundColor: '#F65E5D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Exclamation inside alert
  alertExcl: { color: 'white', fontWeight: '800', fontSize: 24 },

  // Divider between spent and shopping list
  divider: { height: 2, backgroundColor: LINE_GREEN, marginTop: 20, marginBottom: 15 },

  // Shopping List Section
  listArea: {
    flex: 1,
    paddingTop: 12,
  },
  listAreaContent: {
    paddingBottom: 16,
  },

  // "Shopping List"
  sectionHeader: {
    fontSize: 18,
    fontWeight: '400',
    color: 'black',
    textAlign: 'center',
    marginTop: -12,
  },
  // Underline
  sectionUnderline: {
    height: 2,
    backgroundColor: LINE_GREEN,
    width: 160,
    marginTop: 6,
    marginBottom: 20,
    borderRadius: 2,
  },
  // Centering for "Shopping List" and the underline
  sectionHeaderContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Shopping List Rows
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  // Circle outline for check boxes
  checkbox: {
    width: 30,
    height: 30,
    borderRadius: 14,
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
    paddingVertical: 9,
    paddingHorizontal: 7,
    color: '#1D3B25',
    fontWeight: '600',
    fontSize: 20,
  },
  // Add button (Plus Sign)
  addBtn: {
    marginBottom: 12,
    alignSelf: 'center',
  },

  // Favorite Meals Section
  favWrap: {
    backgroundColor: '#B7D7BF',
    paddingTop: 12,
    paddingBottom: 24,
    paddingHorizontal: 16,
    borderColor: '#499F44',
    borderWidth: 2,
  },
  // "Favorite Meals"
  favTitle: {
    textAlign: 'center',
    marginBottom: 10,
    color: 'black',
    fontWeight: '400',
    fontSize: 18,
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
    backgroundColor: '#FFFFFF',
  },
  // Image adjustments in container
  favImage: { width: '100%', height: '100%' },
});
