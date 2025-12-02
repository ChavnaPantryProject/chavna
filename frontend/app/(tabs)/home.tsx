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
  Animated,
  Dimensions,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { API_URL, retrieveValue } from '../util';
import { checkAndSendExpirationNotification, scheduleExpirationNotifications } from '../notificationService';

type ShoppingListItem = {
  name: string,
  isChecked: boolean
}

type ExpiringItem = {
  id: string;
  name: string;
  daysLeft: number;
};

function daysUntil(expiration: string): number | null {
  if (!expiration) return null;

  // Expecting format "YYYY-MM-DD"
  const parts = expiration.split('-').map(Number);
  if (parts.length !== 3) return null;

  const [year, month, day] = parts;
  if (!year || !month || !day) return null;

  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  const today = new Date();
  const todayUTC = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const expUTC = Date.UTC(year, month - 1, day);

  return Math.round((expUTC - todayUTC) / MS_PER_DAY);
}


// Keep up to 2 weeks in the future, and 1 week in the past
const EXPIRY_WINDOW_FUTURE = 14;
const EXPIRY_WINDOW_PAST = 7;

async function getExpiringSoonItems(): Promise<ExpiringItem[]> {
  const loginToken: string = (await retrieveValue('jwt'))!;

  const response = await fetch(`${API_URL}/get-food-items`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${loginToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}), // no category -> all items
  });

  const body = await response.json();

  if (!response.ok) throw body;
  if (body.success !== 'success') throw body;

  const items = body.payload.items as Array<{
    id: string;
    name: string;
    expiration: string;
  }>;

  console.log('get-food-items items:', items.map(i => ({
    name: i.name,
    expiration: i.expiration,
  })));

  const result: ExpiringItem[] = [];

  for (const item of items) {
    const diff = daysUntil(item.expiration); // can be negative
    if (diff === null) continue;

    // keep from 7 days ago up to 14 days from now
    if (diff >= -EXPIRY_WINDOW_PAST && diff <= EXPIRY_WINDOW_FUTURE) {
      result.push({
        id: item.id,
        name: item.name,
        daysLeft: diff, // may be negative if expired
      });
    }
  }

  return result;
}



async function getShoppingList(): Promise<Array<ShoppingListItem>> {
  let loginToken: string = (await retrieveValue("jwt"))!;
  let response = await fetch(`${API_URL}/get-shopping-list`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${loginToken}`,
      "Content-Type": "application/json",
    }
  });

  let body = await response.json();

  if (!response.ok)
    throw body;


  if (body.success !== 'success')
    throw body;

  return body.payload.items;
}

async function updateShoppingList(shoppingList: Array<ShoppingListItem>) {
  let loginToken: string = (await retrieveValue("jwt"))!;
  let response = await fetch(`${API_URL}/update-shopping-list`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${loginToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: shoppingList
    })
  })

  let body = await response.json();

  if (!response.ok)
    throw body;


  if (body.success !== 'success')
    throw body;
}

export default function HomeScreen() {
  const initialItems = [].map((_, i) => ({
    id: String(i + 1),
    name: '',
    done: false,
  }));
  const [items, setItems] = useState(initialItems);
  const [updateItems, setUpdateItems] = useState(false);

  const setItemsAndUpdate = (value: React.SetStateAction<{
      id: string;
      name: string;
      done: boolean;
  }[]>) => {
    setItems(value);
    setUpdateItems(true);
  };

  useEffect(() => {
    (async () => {
      let items = await getShoppingList();
      let list = items.map((item, i) => ({
        id: String(i + 1),
        name: item.name,
        done: item.isChecked,
      }));
      setItems(list);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const soon = await getExpiringSoonItems();
        setExpiringItems(soon);
      } catch (err) {
        console.error('Failed to load expiring items', err);
      }
    })();
  }, []);

  // Check for expiring items and send notifications on mount
  useEffect(() => {
    (async () => {
      try {
        await checkAndSendExpirationNotification();
        await scheduleExpirationNotifications();
      } catch (err) {
        console.error('Failed to check expiration notifications', err);
      }
    })();
  }, []);

  // Check notifications when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active') {
        try {
          await checkAndSendExpirationNotification();
          await scheduleExpirationNotifications();
        } catch (err) {
          console.error('Failed to check expiration notifications on app state change', err);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);


  useEffect(() => {
    if (updateItems) {
      setUpdateItems(false);

      updateShoppingList(items.map((value, i) => ({
          name: value.name,
          isChecked: value.done,
      })));
    }
  }, [updateItems]);
  

    // Expiration Warning
  const [expiringOpen, setExpiringOpen] = useState(false);
  const [expiringItems, setExpiringItems] = useState<ExpiringItem[]>([]);

    // Bottom sheet open/close + derived count
  const [menuOpen, setMenuOpen] = useState(false);
  // Confirm dialog for "Clear all"
  const [confirmClearAllOpen, setConfirmClearAllOpen] = useState(false);

  // Confirm dialog for "Clear selected"
  const [confirmClearSelectedOpen, setConfirmClearSelectedOpen] = useState(false);

  const selectedCount = items.filter(i => i.done).length;

  // Open from the ellipsis
  const openListMenu = () => setMenuOpen(true);


  const toggle = (id: string) =>
    setItemsAndUpdate(prev => prev.map(it => (it.id === id ? { ...it, done: !it.done } : it)));

  const addItem = () =>
    setItemsAndUpdate(prev => [...prev, { id: String(Date.now()), name: '', done: false }]);

  // Auto scroll when adding to list
  const scrollRef = useRef<ScrollView | null>(null);

  // List resets back to top when returning to page and check notifications
  useFocusEffect(
    React.useCallback(() => {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      });
      // Check notifications when screen comes into focus
      (async () => {
        try {
          await checkAndSendExpirationNotification();
          await scheduleExpirationNotifications();
          // Also refresh expiring items list
          const soon = await getExpiringSoonItems();
          setExpiringItems(soon);
        } catch (err) {
          console.error('Failed to check notifications on focus', err);
        }
      })();
      return undefined;
    }, [])
  );

  

  const clearAll = () => {
    if (items.length === 0) return;
    setConfirmClearAllOpen(true);
  };


  const clearSelected = React.useCallback(() => {
    if (selectedCount === 0) {
      Alert.alert('No items selected', 'Tap the circles to select items to clear.');
      return;
    }
    setConfirmClearSelectedOpen(true);
  }, [selectedCount]);


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

            <Pressable
              onPress={() => setExpiringOpen(true)}
              hitSlop={10}
              style={[
                styles.alertDot,
                { position: 'absolute', top: 5, right: 16, zIndex: 10, elevation: 10 },
              ]}
            >
              <Text style={styles.alertExcl}>!</Text>
            </Pressable>
          </View>
          <View style={styles.divider} />

        </View>

          {/* Shopping List */}
          <View style={styles.sectionHeaderContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeader}>Shopping List</Text>

              {/* absolutely positioned ellipsis, not affecting centering */}
              <Pressable
                hitSlop={10}
                onPress={openListMenu}
                style={styles.ellipsisButton}
              >
                <Ionicons name="ellipsis-horizontal" size={22} color="gray" />
              </Pressable>
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
                        setItemsAndUpdate(prev =>
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

      <ExpiringPopover
        visible={expiringOpen}
        onClose={() => setExpiringOpen(false)}
        items={expiringItems}
      />

      <ConfirmDialog
        visible={confirmClearAllOpen}
        title="Clear All Items?"
        message="This will remove every item from your shopping list."
        confirmLabel="Clear all"
        onCancel={() => setConfirmClearAllOpen(false)}
        onConfirm={() => {
          setItemsAndUpdate([]);
          setConfirmClearAllOpen(false);
        }}
      />

      <ConfirmDialog
        visible={confirmClearSelectedOpen}
        title="Clear Selected Items?"
        message={`${selectedCount} selected item${selectedCount > 1 ? 's' : ''} will be removed.`}
        confirmLabel="Clear selected"
        onCancel={() => setConfirmClearSelectedOpen(false)}
        onConfirm={() => {
          setItemsAndUpdate(prev => prev.filter(i => !i.done));
          setConfirmClearSelectedOpen(false);
        }}
      />
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
  const [mounted, setMounted] = React.useState(visible);
  const opacity = React.useRef(new Animated.Value(0)).current;
  const scale = React.useRef(new Animated.Value(0.98)).current;

  React.useEffect(() => {
    if (visible) setMounted(true);
    Animated.parallel([
      Animated.timing(opacity, { toValue: visible ? 1 : 0, duration: 150, useNativeDriver: true }),
      Animated.spring(scale, {
        toValue: visible ? 1 : 0.98,
        useNativeDriver: true,
        damping: 20,
        stiffness: 180,
        mass: 0.9,
      }),
    ]).start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });
  }, [visible, opacity, scale]);

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
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      {/* Backdrop */}
      <Animated.View style={[sheetStyles.backdrop, { opacity }]} />
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

      {/* Centered card */}
      <View style={sheetStyles.centerWrap} pointerEvents="box-none">
        <Animated.View style={[sheetStyles.dialogCard, { transform: [{ scale }], opacity }]}>
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
          <View style={{ alignItems: 'center', marginTop: 8 }}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                confirmStyles.cancelPill,
                pressed && { backgroundColor: '#D8D8D8' },
                { alignSelf: 'center' }, // forces text-width pill
              ]}
            >
              <Text style={confirmStyles.cancelText}>Cancel</Text>
            </Pressable>
          </View>


        </Animated.View>
      </View>
    </Modal>
  );
}

function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [mounted, setMounted] = React.useState(visible);
  const opacity = React.useRef(new Animated.Value(0)).current;
  const scale = React.useRef(new Animated.Value(0.98)).current;

  React.useEffect(() => {
    if (visible) setMounted(true);
    Animated.parallel([
      Animated.timing(opacity, { toValue: visible ? 1 : 0, duration: 150, useNativeDriver: true }),
      Animated.spring(scale, {
        toValue: visible ? 1 : 0.98,
        useNativeDriver: true,
        damping: 20,
        stiffness: 180,
        mass: 0.9,
      }),
    ]).start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });
  }, [visible, opacity, scale]);

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onCancel}>
      {/* Backdrop */}
      <Animated.View style={[sheetStyles.backdrop, { opacity }]} />
      <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />

      {/* Centered dialog card – reuses the same style as the ellipsis popup */}
      <View style={sheetStyles.centerWrap} pointerEvents="box-none">
        <Animated.View style={[sheetStyles.dialogCard, { transform: [{ scale }], opacity }]}>
          <Text style={sheetStyles.title}>{title}</Text>
          {message ? <Text style={sheetStyles.subtitle}>{message}</Text> : null}
          <View style={sheetStyles.divider} />

          {/* Action row */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 14, marginTop: 12 }}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [
                confirmStyles.cancelPill,
                pressed && { backgroundColor: '#D8D8D8' },
              ]}
            >
              <Text style={confirmStyles.cancelText}>Cancel</Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [
                confirmStyles.clearPill,
                pressed && { backgroundColor: '#FFD6D6' },
              ]}
            >
              <Text style={confirmStyles.clearText}>{confirmLabel}</Text>
            </Pressable>
          </View>


        </Animated.View>
      </View>
    </Modal>
  );
}

function ExpiringPopover({
  visible,
  onClose,
  items,
}: {
  visible: boolean;
  onClose: () => void;
  items: { id: string; name: string; daysLeft: number }[];
}) {
  const opacity = React.useRef(new Animated.Value(0)).current;
  const slide = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: visible ? 1 : 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slide, { toValue: visible ? 1 : 0, duration: 180, useNativeDriver: true }),
    ]).start();
  }, [visible, opacity, slide]);

  if (!visible) return null;

  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] });
  const MAX_HEIGHT = Math.min(360, Dimensions.get('window').height * 0.5);

  const expired = items
    .filter(it => it.daysLeft < 0)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const soon = items
    .filter(it => it.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const Row = ({ name, daysLeft }: { name: string; daysLeft: number }) => {
    const isExpired = daysLeft < 0;
    const abs = Math.abs(daysLeft);

    let label: string;
    if (isExpired) {
      label = abs === 0 ? 'Expired' : `${abs} day${abs === 1 ? '' : 's'} ago`;
    } else if (daysLeft === 0) {
      label = 'Today';
    } else {
      label = `${daysLeft} day${daysLeft === 1 ? '' : 's'}`;
    }

    const badgeBackground = isExpired
      ? '#FCE4E4'
      : daysLeft <= 1
        ? '#FCE4E4'
        : daysLeft === 2
          ? '#FFF4D6'
          : '#E7F3E9';

    return (
      <View style={expStyles.row}>
        <Text style={expStyles.rowName} numberOfLines={1}>
          {name}
        </Text>
        <View style={[expStyles.badge, { backgroundColor: badgeBackground }]}>
          <Text style={expStyles.badgeText}>{label}</Text>
        </View>
      </View>
    );
  };

  const hasAny = expired.length > 0 || soon.length > 0;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <Animated.View style={[expStyles.backdrop, { opacity }]} />
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

      <Animated.View
        pointerEvents="box-none"
        style={[
          expStyles.anchorWrap,
          { transform: [{ translateY }] },
        ]}
      >
        <View style={expStyles.card}>


          {!hasAny ? (
            <Text style={expStyles.empty}>No items expiring or recently expired.</Text>
          ) : (
            <ScrollView
              style={{ maxHeight: MAX_HEIGHT }}
              contentContainerStyle={{ gap: 10, paddingBottom: 4 }}
              showsVerticalScrollIndicator={false}
              bounces={false}
              alwaysBounceVertical={false}
              contentInsetAdjustmentBehavior="never"
              overScrollMode="never"
            >
              {expired.length > 0 && (
                <>
                  <View style={expStyles.sectionHeaderBox}>
                    <Text style={expStyles.sectionHeader}>Expired</Text>
                  </View>

                  {expired.map(it => (
                    <Row key={`exp-${it.id}`} name={it.name} daysLeft={it.daysLeft} />
                  ))}

                  <View style={expStyles.sectionDivider} />
                </>
              )}

              {soon.length > 0 && (
                <>
                  <View style={expStyles.sectionHeaderBox}>
                    <Text style={expStyles.sectionHeader}>Expiring Soon</Text>
                  </View>

                  {soon.map(it => (
                    <Row key={`soon-${it.id}`} name={it.name} daysLeft={it.daysLeft} />
                  ))}
                </>
              )}
            </ScrollView>
          )}

          <View style={{ height: 10 }} />
          <View style={expStyles.actions}>
            <Pressable onPress={onClose} style={expStyles.secondaryBtn}>
              <Text style={expStyles.secondaryText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const sheetStyles = StyleSheet.create({
  // Dim backdrop
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },

  // Fullscreen wrapper that centers the dialog
  centerWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  // The centered dialog card
  dialogCard: {
    width: '92%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 16,
    paddingTop: 20, 
  },

  title: { textAlign: 'center', fontSize: 18, fontWeight: '700', color: '#111' },
  subtitle: { textAlign: 'center', fontSize: 15, color: '#6A6A6A', marginTop: 2, marginBottom: 8 },
  divider: { height: 1, backgroundColor: '#E6E6E6', marginVertical: 2 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  rowTitle: { fontSize: 16, color: '#1D3B25', fontWeight: '600' },
  rowSub: { fontSize: 14, color: '#6A6A6A', marginTop: 2 },

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
  position: 'relative',      
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',              
  paddingHorizontal: 16,      
  marginTop: -12,
  minHeight: 24,           
},

ellipsisButton: {
  position: 'absolute',
  right: 16,                
  top: 0,
  padding: 6,
},

});
const expStyles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  anchorWrap: {
    position: 'absolute',
    top: 56,
    right: 12,
  },
  card: {
    width: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  title: { fontSize: 15, fontWeight: '700', color: '#1B1B1B' },
  divider: { height: 1, backgroundColor: '#EFEFEF', marginVertical: 8 },
  empty: { fontSize: 13, color: '#666' },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowName: { fontSize: 14, fontWeight: '600', color: '#1D3B25', maxWidth: 180 },

  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E4E4E4',
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#333' },

  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
  },

  secondaryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#bee2cfff',
  },

  secondaryText: { fontSize: 14, fontWeight: '600', color: '#333' },
  primaryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#59A463',
  },
  primaryText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555',
    marginBottom: 4,
    marginTop: 2,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#efefefff',
    marginVertical: 6,
  },
  sectionHeaderBox: {
    width: '100%',
    paddingVertical: 6,
    paddingHorizontal: 4,
    backgroundColor: '#73bd86bb',
    borderRadius: 6,
    marginTop: 4,
    alignItems: 'center',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
});

const confirmStyles = StyleSheet.create({
  cancelPill: {
    backgroundColor: '#e7e7e7ff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 50,
  },
  clearPill: {
    backgroundColor: '#FFECEC',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 50,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  clearText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#C62828',
  },
});


