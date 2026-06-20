const { getMessaging } = require('../config/firebase');

const sendPushNotification = async (pushToken, title, body, data = {}) => {
  if (!pushToken) return;

  const messaging = getMessaging();
  if (!messaging) return; // Firebase not configured — skip silently

  try {
    await messaging.send({
      token: pushToken,
      notification: { title, body },
      data,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default',
        },
      },
    });
    console.log('✅ Push notification sent');
  } catch (err) {
    console.error('❌ Push notification failed:', err.message);
  }
};

module.exports = sendPushNotification;