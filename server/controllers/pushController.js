import { query } from '../config/database.js';
import { sendPushNotification, vapidPublicKey } from '../config/webpush.js';

/**
 * Get VAPID public key for client subscription
 */
export async function getVapidPublicKey(req, res) {
  res.json({ publicKey: vapidPublicKey });
}

/**
 * Subscribe to push notifications
 */
export async function subscribe(req, res) {
  try {
    const userId = req.user.id;
    const { subscription } = req.body;
    
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ message: 'Invalid subscription' });
    }
    
    const userAgent = req.headers['user-agent'] || '';
    
    // Store subscription (upsert)
    await query(
      `INSERT INTO push_subscriptions (user_id, subscription_json, user_agent)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, subscription_json) DO UPDATE
       SET user_agent = $3, created_at = NOW()`,
      [userId, JSON.stringify(subscription), userAgent]
    );
    
    res.json({ message: 'Subscribed to push notifications successfully' });
  } catch (error) {
    console.error('Subscribe to push error:', error);
    res.status(500).json({ message: 'Failed to subscribe to push notifications' });
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribe(req, res) {
  try {
    const userId = req.user.id;
    const { endpoint } = req.body;
    
    if (endpoint) {
      // Delete specific subscription
      await query(
        `DELETE FROM push_subscriptions 
         WHERE user_id = $1 AND subscription_json::json->>'endpoint' = $2`,
        [userId, endpoint]
      );
    } else {
      // Delete all subscriptions for this user
      await query(
        'DELETE FROM push_subscriptions WHERE user_id = $1',
        [userId]
      );
    }
    
    res.json({ message: 'Unsubscribed from push notifications' });
  } catch (error) {
    console.error('Unsubscribe from push error:', error);
    res.status(500).json({ message: 'Failed to unsubscribe' });
  }
}

/**
 * Send push notification to user
 * @param {number} userId - User ID
 * @param {object} payload - Notification payload { title, body, icon, data }
 */
export async function notifyUser(userId, payload) {
  try {
    // Get user's subscriptions
    const result = await query(
      'SELECT subscription_json FROM push_subscriptions WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      console.log(`No push subscriptions found for user ${userId}`);
      return;
    }
    
    // Send to all subscriptions
    const promises = result.rows.map(async (row) => {
      const subscription = JSON.parse(row.subscription_json);
      const result = await sendPushNotification(subscription, payload);
      
      // Remove expired subscriptions
      if (result.shouldDelete) {
        await query(
          `DELETE FROM push_subscriptions 
           WHERE user_id = $1 AND subscription_json = $2`,
          [userId, row.subscription_json]
        );
      }
      
      return result;
    });
    
    await Promise.all(promises);
    console.log(`Sent push notifications to user ${userId}`);
  } catch (error) {
    console.error('Notify user error:', error);
  }
}

/**
 * Send push notification to nearby users
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} radius - Radius in meters
 * @param {object} payload - Notification payload
 */
export async function notifyNearbyUsers(lat, lng, radius, payload) {
  try {
    // This would require storing user locations
    // For now, just log
    console.log(`Would notify nearby users within ${radius}m of ${lat},${lng}`);
    console.log('Payload:', payload);
  } catch (error) {
    console.error('Notify nearby users error:', error);
  }
}
