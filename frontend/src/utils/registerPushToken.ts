import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export async function registerPushToken(): Promise<string | null> {
  // Simulator pe kaam nahi karta
  if (!Device.isDevice) {
    console.log('Push notifications only work on physical device');
    return null;
  }

  // Android channel setup
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2cc18a',
      sound: 'default',
    });
  }

  // Permission maango
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Permission denied for push notifications');
    return null;
  }

  // FCM Native token lo (direct Firebase ke liye)
  // Expo push token Expo server ke through jaata hai — FCM ke liye native token chahiye
  let tokenData: string;

  if (Platform.OS === 'android') {
    const nativeToken = await Notifications.getDevicePushTokenAsync();
    tokenData = nativeToken.data as string;
    console.log('FCM Native token:', tokenData);
  } else {
    // iOS ke liye Expo token theek hai
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const expoToken = await Notifications.getExpoPushTokenAsync({ projectId });
    tokenData = expoToken.data;
    console.log('Expo push token:', tokenData);
  }

  return tokenData;
}