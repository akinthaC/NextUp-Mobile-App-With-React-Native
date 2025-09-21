import React from 'react';
import { Tabs } from 'expo-router/tabs';
import Entypo from '@expo/vector-icons/Entypo';

type EntypoIconName =
  | 'home'
  | 'shop'
  | 'flow-tree'
  | 'user'
  | 'cog';

const tabs: { label: string; name: string; icon: EntypoIconName }[] = [
  { label: 'Home',          name: 'home',         icon: 'home' },
  { label: 'Register Shop', name: 'RegisterShop', icon: 'shop' },       // 🏬
  { label: 'Queue',         name: 'queue',        icon: 'flow-tree' },   // ⏳
  { label: 'Profile',       name: 'profile',      icon: 'user' },        // 👤
  { label: 'Settings',      name: 'setting',      icon: 'cog' },         // ⚙️
];

export default function DashboardLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,                 // hide header
        tabBarActiveTintColor: '#2C6BED',   // primary/active color
        tabBarInactiveTintColor: '#94a3b8', // muted gray
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          height: 60,
          paddingBottom: 6,
          paddingTop: 4,
          elevation: 8,
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 6,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarIcon: ({ color, size }) => (
              <Entypo name={tab.icon} size={size} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
