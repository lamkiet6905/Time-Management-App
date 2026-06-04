import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import api from '../services/api';

// Đặt cấu hình handler hiển thị thông báo khi app đang mở (Foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const usePushNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>('');
  const [notification, setNotification] = useState<Notifications.Notification | false>(false);
  
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      setExpoPushToken(token);
      // Gửi token lên backend nếu có
      if (token) {
        api.put('/auth/fcm-token', { fcmToken: token })
          .catch(err => console.log('Không thể lưu push token:', err));
      }
    });

    // Bắt sự kiện khi nhận được thông báo lúc app đang mở
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    // Bắt sự kiện khi người dùng bấm vào thông báo
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('User bấm vào thông báo:', response.notification.request.content.data);
      // TODO: Có thể chuyển hướng đến màn hình chat hoặc màn hình Arena
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return {
    expoPushToken,
    notification,
  };
};

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('liferpg-default', {
      name: 'LifeRPG Notifications',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Không được cấp quyền gửi Push Notification!');
      return undefined;
    }
    // Lấy FCM token để backend firebase-admin gửi
    token = (await Notifications.getDevicePushTokenAsync()).data;
  } else {
    console.log('Phải dùng máy thật (Physical Device) để lấy Push Token');
  }

  return token;
}
