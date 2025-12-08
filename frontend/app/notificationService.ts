import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, retrieveValue } from './util';

// Configure notification handler
/*
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
*/
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    console.log("🔔 Notification received in handler:", notification.request.identifier);

    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,

      // Do NOT attempt background scheduling here (OPTION A)
      // No shouldShowBanner or shouldShowList (iOS only)
    };
  }
});


export type ExpiringItem = {
  id: string;
  name: string;
  expiration: string;
  daysLeft: number;
};

// Calculate days until expiration
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

// Fetch food items from the API
async function getFoodItems(): Promise<ExpiringItem[]> {
  try {
    const loginToken: string | null = await retrieveValue('jwt');
    if (!loginToken) {
      console.log('No login token found, skipping notification check');
      return [];
    }

    const response = await fetch(`${API_URL}/get-food-items`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${loginToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}), // no category -> all items
    });

    const body = await response.json();

    if (!response.ok || body.success !== 'success') {
      console.error('Failed to fetch food items for notifications:', body);
      return [];
    }

    const items = body.payload.items as Array<{
      id: string;
      name: string;
      expiration: string;
    }>;

    const result: ExpiringItem[] = [];

    for (const item of items) {
      const diff = daysUntil(item.expiration);
      if (diff === null) continue;

      // Fetch items within 7 days range (for potential notification scheduling)
      // We'll filter for items expiring in 0-7 days when scheduling notifications
      if (diff >= -7 && diff <= 7) {
        result.push({
          id: item.id,
          name: item.name,
          expiration: item.expiration,
          daysLeft: diff,
        });
      }
    }

    return result;
  } catch (error) {
    console.error('Error fetching food items for notifications:', error);
    return [];
  }
}
/*
// Request notification permissions
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}
*/

// Request notification permissions
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem("notificationPermissionStatus");

    if (stored === "denied") {
      // User already said NO — never ask again
      return false;
    }
    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    if (existingStatus === "granted") {
      await AsyncStorage.setItem("notificationPermissionStatus", "granted");
      return true;
    }
    const { status } = await Notifications.requestPermissionsAsync();

    // Save user's choice
    await AsyncStorage.setItem("notificationPermissionStatus", status);

    return status === "granted";
  } catch (error) {
    console.error("Error requesting notification permissions:", error);
    return false;
  }
}


// Check if expiration notifications are enabled
async function isExpirationNotificationsEnabled(): Promise<boolean> {
  try {
    const saved = await AsyncStorage.getItem('expirationNotifications');
    return saved !== null ? JSON.parse(saved) : true; // Default to true
  } catch (error) {
    console.error('Error checking expiration notification setting:', error);
    return true;
  }
}

// Check if push notifications are enabled
async function isPushNotificationsEnabled(): Promise<boolean> {
  try {
    const saved = await AsyncStorage.getItem('pushNotifications');
    return saved !== null ? JSON.parse(saved) : true; // Default to true
  } catch (error) {
    console.error('Error checking push notification setting:', error);
    return true;
  }
}

// Cancel all existing expiration notifications
async function cancelAllExpirationNotifications(): Promise<void> {
  try {
    const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
    const expirationNotificationIds = allNotifications
      .filter(notification => notification.identifier.startsWith('expiration-'))
      .map(notification => notification.identifier);

    // Cancel notifications one by one
    for (const identifier of expirationNotificationIds) {
      try {
        await Notifications.cancelScheduledNotificationAsync(identifier);
      } catch (err) {
        console.error(`Error canceling notification ${identifier}:`, err);
      }
    }
  } catch (error) {
    console.error('Error canceling expiration notifications:', error);
  }
}

// Format notification message
function formatNotificationMessage(items: ExpiringItem[]): string {
  if (items.length === 0) return '';

  const expired = items.filter(item => item.daysLeft < 0);
  const expiringSoon = items.filter(item => item.daysLeft >= 0 && item.daysLeft <= 7);

  if (expired.length > 0 && expiringSoon.length > 0) {
    return `You have ${expired.length} expired item${expired.length > 1 ? 's' : ''} and ${expiringSoon.length} item${expiringSoon.length > 1 ? 's' : ''} expiring soon!`;
  } else if (expired.length > 0) {
    const itemNames = expired.slice(0, 3).map(item => item.name).join(', ');
    const more = expired.length > 3 ? ` and ${expired.length - 3} more` : '';
    return `${itemNames}${more} ${expired.length === 1 ? 'has' : 'have'} expired!`;
  } else {
    const itemNames = expiringSoon.slice(0, 3).map(item => item.name).join(', ');
    const more = expiringSoon.length > 3 ? ` and ${expiringSoon.length - 3} more` : '';
    if (expiringSoon.length === 1) {
      const item = expiringSoon[0];
      const timeLeft = item.daysLeft === 0 ? 'today' : item.daysLeft === 1 ? 'tomorrow' : `in ${item.daysLeft} days`;
      return `${item.name} expires ${timeLeft}!`;
    }
    return `${itemNames}${more} ${expiringSoon.length === 1 ? 'expires' : 'expire'} soon!`;
  }
}

// Schedule notifications for expiring items
export async function scheduleExpirationNotifications(): Promise<void> {
  try {
    // Check if notifications are enabled
    const pushEnabled = await isPushNotificationsEnabled();
    const expirationEnabled = await isExpirationNotificationsEnabled();

    if (!pushEnabled || !expirationEnabled) {
      console.log('Notifications are disabled, skipping scheduling');
      await cancelAllExpirationNotifications();
      return;
    }
/*
    // Request permissions if needed
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('Notification permissions not granted');
      //new line
      await cancelAllExpirationNotifications();
      return;
    }
*/
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
    // Do NOT spam logs
      await cancelAllExpirationNotifications();
      return;
    }

    // Cancel existing notifications
    await cancelAllExpirationNotifications();

    // Fetch food items
    const items = await getFoodItems();
    
    // Filter items expiring within 7 days
    const itemsToNotify = items.filter(item => item.daysLeft >= 0 && item.daysLeft <= 7);

    if (itemsToNotify.length === 0) {
      console.log('No items expiring within 7 days');
      return;
    }

    // Group items by expiration day
    const itemsByDay = new Map<number, ExpiringItem[]>();
    for (const item of itemsToNotify) {
      if (!itemsByDay.has(item.daysLeft)) {
        itemsByDay.set(item.daysLeft, []);
      }
      itemsByDay.get(item.daysLeft)!.push(item);
    }

    // Schedule notifications for each day
    const now = new Date();
    for (const [daysLeft, dayItems] of itemsByDay.entries()) {
      // Schedule notification for 9 AM on the expiration day
      const notificationDate = new Date();
      notificationDate.setDate(now.getDate() + daysLeft);
      notificationDate.setHours(9, 0, 0, 0);

      // If the notification time has passed today, schedule for tomorrow
      if (daysLeft === 0 && notificationDate.getTime() <= now.getTime()) {
        notificationDate.setDate(notificationDate.getDate() + 1);
      }

      const message = formatNotificationMessage(dayItems);
      if (!message) continue;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🍽️ Food Expiring Soon',
          body: message,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: notificationDate,
        identifier: `expiration-${daysLeft}-${Date.now()}`,
      });
    }

    console.log(`Scheduled ${itemsByDay.size} expiration notification(s)`);
  } catch (error) {
    console.error('Error scheduling expiration notifications:', error);
  }
}

// Check and send immediate notification if needed
export async function checkAndSendExpirationNotification(): Promise<void> {
  try {
    // Check if notifications are enabled
    const pushEnabled = await isPushNotificationsEnabled();
    const expirationEnabled = await isExpirationNotificationsEnabled();

    if (!pushEnabled || !expirationEnabled) {
      return;
    }

    // Request permissions if needed
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return;
    }

    // Fetch food items
    const items = await getFoodItems();
    
    // Filter items expiring within 7 days
    const itemsToNotify = items.filter(item => item.daysLeft >= 0 && item.daysLeft <= 7);

    if (itemsToNotify.length === 0) {
      return;
    }

    // Check if we've already sent a notification today
    const lastNotificationDate = await AsyncStorage.getItem('lastExpirationNotificationDate');
    const today = new Date().toDateString();
    
    if (lastNotificationDate === today) {
      return; // Already sent notification today
    }

    const message = formatNotificationMessage(itemsToNotify);
    if (!message) return;

    // Send immediate notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🍽️ Food Expiring Soon',
        body: message,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Send immediately
      identifier: `expiration-immediate-${Date.now()}`,
    });

    // Save today's date
    await AsyncStorage.setItem('lastExpirationNotificationDate', today);
    
    console.log('Sent immediate expiration notification');
  } catch (error) {
    console.error('Error checking and sending expiration notification:', error);
  }
}
