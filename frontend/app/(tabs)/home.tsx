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
  Platform,
  Alert,
  Modal,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Menu, Provider } from 'react-native-paper';

// Adjust the initial list length by changing the { length: 5 }
const initialItems = Array.from({ length: 5 }).map((_, i) => ({
  id: String(i + 1),
  name: '',
  done: false,
}));

export default function HomeScreen() {
  const [items, setItems] = useState(initialItems);
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

    // Bottom sheet open/close + derived count
  const [menuOpen, setMenuOpen] = useState(false);
  const selectedCount = items.filter(i => i.done).length;

  // Open from the ellipsis
  const openListMenu = () => setMenuOpen(true);


  const toggle = (id: string) =>
    setItems(prev => prev.map(it => (it.id === id ? { ...it, done: !it.done } : it)));

  const addItem = () =>
    setItems(prev => [...prev, { id: String(Date.now()), name: '', done: false }]);

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

  

    const clearAll = () => {
    if (items.length === 0) return;
    Alert.alert(
      'Clear all items?',
      'This will remove every item from your shopping list.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: () => setItems([]) },
      ],
      { cancelable: true }
    );
  };

  const clearSelected = React.useCallback(() => {
  const selected = items.filter(i => i.done).length;
  if (selected === 0) {
    Alert.alert('No items selected', 'Tap the circles to select items to clear.');
    return;
  }
  Alert.alert(
    'Clear selected items?',
    `This will remove ${selected} selected item${selected > 1 ? 's' : ''}.`,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear Selected', style: 'destructive', onPress: () =>
          setItems(prev => prev.filter(i => !i.done))
      },
    ],
    { cancelable: true }
  );
}, [items]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [items.length]);

  return (
    <Provider>
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

            <Pressable
              onPress={() => setNotifOpen(true)}
              style={[
                styles.alertDot,
                { position: 'absolute', top: 5, right: 16, zIndex: 10, elevation: 10 },
              ]}
            >
              <Text style={styles.alertExcl}>!</Text>
            </Pressable>

          </View>

          <View style={styles.divider} />

          {/* Commented out ellipsis for now */}
          {/* <View style={{ alignItems: 'flex-end', paddingRight: 22, marginTop: 0 }}>
            <Ionicons name="ellipsis-horizontal" size={28} color="gray" />
          </View> */}
        </View>

          {/* Shopping List */}
          <View style={styles.sectionHeaderContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeader}>Shopping List</Text>

              {/* absolutely positioned ellipsis, not affecting centering */}
          <Menu
            visible={menuVisible}
            onDismiss={closeMenu}
            anchor={
              <Pressable
                onPress={openMenu}
                style={styles.ellipsisButton}
                hitSlop={10}
              >
                <Ionicons name="ellipsis-horizontal" size={22} color="gray" />
              </Pressable>
            }
          >
            <Menu.Item
              onPress={() => {
                closeMenu();
                clearSelected();
              }}
              title={`Clear selected${items.filter(i => i.done).length ? ` (${items.filter(i => i.done).length})` : ''}`}
              disabled={items.filter(i => i.done).length === 0}
            />
            <Menu.Item
              onPress={() => {
                closeMenu();
                clearAll();
              }}
              title="Clear all"
              titleStyle={{ color: '#C62828' }}
            />
          </Menu>

            </View>

            <View style={styles.sectionUnderline} />
          </View>

          {/* Scroll only the rows */}
          <View style={{ flex: 1 }}>
            <ScrollOnlyRows scrollRef={scrollRef}>
              <View style={{ paddingHorizontal: 16, paddingTop: 0 }}>
                {items.map((item, idx) => (
                  <View
                    key={item.id}
                    style={[styles.listRow, idx === 0 && styles.listRowFirst]}
                  >
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
                      placeholderTextColor="#969494ff"
                    />
                  </View>
                ))}


                <Pressable onPress={addItem} 
                  style={({ pressed }) => [
                  styles.addBtn,
                  pressed && {
                    backgroundColor: '#CBE8CC', // On press glow
                    shadowColor: '#499F44',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.5,
                    shadowRadius: 10,
                    transform: [{ scale: 0.95 }],
                    ...(Platform.OS === 'android' ? { elevation: 8 } : {}),
                        },
                      ]}
                    >
                  <Ionicons name="add" size={35} color="#2E7D32" />
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
          <OptionsSheet
          visible={menuOpen}
          onClose={() => setMenuOpen(false)}
          onClearSelected={() => { setMenuOpen(false); clearSelected(); }}
          onClearAll={() => { setMenuOpen(false); clearAll(); }}
          selectedCount={selectedCount}
/>

<NotificationsModal visible={notifOpen} onClose={() => setNotifOpen(false)} />

    </SafeAreaView>
    </Provider>
  );
}



function FavMeal({ source }: { source: ImageSourcePropType }) {
  return (
    <View style={styles.favItem}>
      <Image source={source} style={styles.favImage} />
    </View>
  );
}

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
function OptionsSheet({
  visible,
  onClose,
  onClearSelected,
  onClearAll,
  selectedCount,
}: {
  visible: boolean;
  onClose: () => void;
  onClearSelected: () => void;
  onClearAll: () => void;
  selectedCount: number;
}) {
  const slide = React.useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = React.useState(visible); // controls unmount after animation

  
  React.useEffect(() => {
    if (visible) {
      setMounted(true);
    } else {
      const t = setTimeout(() => setMounted(false), 220); // match animation duration
      return () => clearTimeout(t);
    }
  }, [visible]);

  
  React.useEffect(() => {
    Animated.timing(slide, {
      toValue: visible ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [visible, slide]);

  const translateY = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [260, 0],
  });

  
  if (!mounted) return null;

  const Row = ({
    title,
    subtitle,
    destructive,
    disabled,
    onPress,
  }: {
    title: string;
    subtitle?: string;
    destructive?: boolean;
    disabled?: boolean;
    onPress?: () => void;
  }) => (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        sheetStyles.row,
        pressed && !disabled && { backgroundColor: '#F3F5F4' },
        disabled && { opacity: 0.4 },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={[
            sheetStyles.rowTitle,
            destructive && { color: '#C62828', fontWeight: '700' },
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={sheetStyles.rowSub} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );

  return (
    <Modal
      visible={true} // mounted controls visibility/unmount
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        style={sheetStyles.backdrop}
        onPress={onClose}
        pointerEvents={visible ? 'auto' : 'none'}
      />
      <Animated.View
        style={[
          sheetStyles.sheet,
          {
            transform: [{ translateY }],
            pointerEvents: visible ? 'auto' : 'none',
          },
        ]}
      >
        <View style={sheetStyles.grabber} />

        <Text style={sheetStyles.title}>Shopping List</Text>
        <Text style={sheetStyles.subtitle}>Choose an action</Text>
        <View style={sheetStyles.divider} />

        <Row
          title="Clear selected"
          subtitle={selectedCount ? `${selectedCount} selected` : 'No items selected'}
          onPress={onClearSelected}
          disabled={selectedCount === 0}
        />

        <Row
          title="Clear all"
          subtitle="Remove every item in the list"
          destructive
          onPress={onClearAll}
        />

        <View style={{ height: 8 }} />
        <Pressable onPress={onClose} style={sheetStyles.cancelBtn}>
          <Text style={sheetStyles.cancelText}>Cancel</Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

function NotificationsModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const slide = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(slide, {
      toValue: visible ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  const translateY = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={notifStyles.backdrop} onPress={onClose} />
      <Animated.View style={[notifStyles.modal, { transform: [{ translateY }] }]}>
        <Text style={notifStyles.title}>Notifications</Text>
        <View style={notifStyles.divider} />
        <View style={notifStyles.content}>
          <Text style={notifStyles.text}>• New grocery deals added this week.</Text>
          <Text style={notifStyles.text}>• You spent $60 this week — keep tracking your budget.</Text>
          <Text style={notifStyles.text}>• Try adding your favorite meals to plan next week’s shopping list.</Text>
        </View>

        <Pressable onPress={onClose} style={notifStyles.button}>
          <Text style={notifStyles.buttonText}>Close</Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const notifStyles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  modal: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    elevation: 10,
  },
  title: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  divider: { height: 1, backgroundColor: '#E0E0E0', marginBottom: 10 },
  content: { paddingHorizontal: 10 },
  text: { fontSize: 15, color: '#333', marginVertical: 4 },
  button: {
    marginTop: 14,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#499F44',
  },
  buttonText: { color: 'white', fontWeight: '700', fontSize: 16 },
});


const sheetStyles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    paddingTop: 10, paddingBottom: 20, paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18, borderTopRightRadius: 18,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: -4 },
    elevation: 20,
  },
  grabber: {
    alignSelf: 'center',
    width: 44, height: 4, borderRadius: 999,
    backgroundColor: '#E0E0E0', marginBottom: 8,
  },
  title: { textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#111' },
  subtitle: { textAlign: 'center', fontSize: 12, color: '#6A6A6A', marginTop: 2, marginBottom: 8 },
  divider: { height: 1, backgroundColor: '#E6E6E6', marginVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 10, borderRadius: 10 },
  rowTitle: { fontSize: 15, color: '#1D3B25', fontWeight: '600' },
  rowSub: { fontSize: 12, color: '#6A6A6A', marginTop: 2 },
  cancelBtn: { alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 12 },
  cancelText: { fontSize: 15, color: '#333', fontWeight: '600' },
});

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
    width: 32,
    height: 32,
    borderRadius: 19,
    backgroundColor: '#F65E5D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Exclamation inside alert
  alertExcl: { color: 'white', fontWeight: '600', fontSize: 22

   },

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
    marginTop: 10,
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

  // First Row
  listRowFirst: { marginTop: 0 },

  // Add button (Plus Sign)
  addBtn: {
    marginBottom: 12,
    marginTop: 10,
    alignSelf: 'center',
    width: 45,
    height: 45,
    borderRadius: 30,
    borderWidth: 2  ,
    borderColor: '#499F44',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E6F4EA'
  },

  // Favorite Meals Section
  favWrap: {
    backgroundColor: '#B7D7BF',
    paddingTop: 10,
    paddingBottom: 25,
    paddingHorizontal: 12,
    borderColor: '#499F44',
    borderWidth: 2,
    marginTop: 'auto',    
  },
  // "Favorite Meals"
  favTitle: {
    textAlign: 'center',
    marginBottom: 6,
    color: 'black',
    fontWeight: '400',
    fontSize: 16,
  },
  // Horizontal row layout
  favRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    marginBottom: 0,
  },
  // Circular containers
  favItem: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderColor: '#499F44',
    borderWidth: 2,
  },
  // Image adjustments in container
  favImage: { width: '100%', height: '100%' },

sectionHeaderRow: {
  position: 'relative',       // allows absolute-positioned ellipsis
  alignItems: 'center',
  justifyContent: 'center',   // keeps "Shopping List" perfectly centered
  width: '100%',              // span full width so 'right' aligns to screen edge
  paddingHorizontal: 16,      // matches list content padding
  marginTop: -12,
  minHeight: 24,              // ensures room for the icon
},

ellipsisButton: {
  position: 'absolute',
  right: 16,                  // aligns with the right edge of your input rows
  top: 0,
  padding: 6,
},

});
