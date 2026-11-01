import { api } from '../lib/api';

let vapidPublicKey = null;

/**
 * Request notification permission and subscribe
 */
export async function initializePushNotifications() {
  // Check if service workers and Push API are supported
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications are not supported in this browser');
    return false;
  }
  
  // Check if already granted
  if (Notification.permission === 'granted') {
    return await subscribeToPush();
  }
  
  // Request permission
  if (Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      return await subscribeToPush();
    }
  }
  
  return false;
}

/**
 * Subscribe to push notifications
 */
async function subscribeToPush() {
  try {
    // Get VAPID public key from server
    if (!vapidPublicKey) {
      const response = await api.get('/push/vapid-public-key');
      vapidPublicKey = response.data.publicKey;
    }
    
    if (!vapidPublicKey) {
      console.error('VAPID public key not available');
      return false;
    }
    
    // Register service worker if not already registered
    const registration = await navigator.serviceWorker.ready;
    
    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });
    
    // Send subscription to server
    await api.post('/push/subscribe', { subscription });
    
    console.log('✓ Subscribed to push notifications');
    return true;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    return false;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      await api.post('/push/unsubscribe', {
        endpoint: subscription.endpoint
      });
      console.log('✓ Unsubscribed from push notifications');
    }
    
    return true;
  } catch (error) {
    console.error('Failed to unsubscribe from push notifications:', error);
    return false;
  }
}

/**
 * Check if push notifications are enabled
 */
export function isPushEnabled() {
  return Notification.permission === 'granted';
}

/**
 * Convert VAPID key
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

/**
 * Show a local notification (for testing)
 */
export function showLocalNotification(title, options = {}) {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      ...options
    });
  }
}
