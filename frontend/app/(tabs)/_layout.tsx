import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize } from '../../constants/theme';
import { usePushNotifications } from '../../hooks/usePushNotifications';

// ── Tabs Layout ─────────────────────────────────────────────
// 5 tab: Home, Tasks, Arena, Social, Profile

export default function TabsLayout() {
  // Đăng ký nhận thông báo đẩy khi người dùng đăng nhập và mở app
  usePushNotifications();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.bg.card,
          borderTopColor: Colors.border.default,
          borderTopWidth: 2.5, // Doodle thick line
          height: 65,
          paddingBottom: 8,
          paddingTop: 4,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: Colors.brand.gold, // Chuyển màu vàng 
        tabBarInactiveTintColor: Colors.text.secondary,
        tabBarLabelStyle: {
          fontSize: FontSize.sm,
          fontWeight: '900', // Đậm nét hơn
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tổng Quan',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Nhiệm Vụ',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="arena"
        options={{
          title: 'Đấu Trường',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="flash" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: 'Xã Hội',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Hồ Sơ',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
