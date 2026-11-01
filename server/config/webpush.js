import webpush from 'web-push';

// VAPID keys for web push (generate once and store in .env)
// To generate: npx web-push generate-vapid-keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:support@taskmtaa.com',
    vapidPublicKey,
    vapidPrivateKey
  );
  console.log('✓ Web Push configured with VAPID keys');
} else {
  console.warn('⚠ VAPID keys not found. Push notifications will not work.');
  console.warn('  Generate keys with: npx web-push generate-vapid-keys');
}

/**
 * Send push notification
 * @param {object} subscription - Push subscription object
 * @param {object} payload - Notification payload
 */
export async function sendPushNotification(subscription, payload) {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn('⚠ Cannot send push notification: VAPID keys not configured');
    return { success: false, error: 'VAPID keys not configured' };
  }
  
  try {
    const result = await webpush.sendNotification(
      subscription,
      JSON.stringify(payload)
    );
    
    console.log('🔔 Push notification sent successfully');
    return { success: true, result };
  } catch (error) {
    console.error('🔔 Push notification failed:', error);
    
    // Handle expired subscriptions
    if (error.statusCode === 410) {
      return { success: false, error: 'Subscription expired', shouldDelete: true };
    }
    
    return { success: false, error: error.message };
  }
}

export { vapidPublicKey };
