import React from 'react';
import { Tabs } from 'expo-router/tabs';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DashboardLayout = () => {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F3F4F6',
          height: 80,
          paddingBottom: 16,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#6366F1',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <View className={`items-center justify-center ${focused ? 'bg-indigo-100 rounded-full p-2' : ''}`}>
              <Ionicons 
                name={focused ? 'home' : 'home-outline'} 
                size={size} 
                color={color} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="NearbyShops"
        options={{
          title: 'Nearby',
          tabBarIcon: ({ color, size, focused }) => (
            <View className={`items-center justify-center ${focused ? 'bg-indigo-100 rounded-full p-1.1' : ''}`}>
              <Ionicons 
                name={focused ? 'location' : 'location-outline'} 
                size={size} 
                color={color} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <View className={`items-center justify-center ${focused ? 'bg-indigo-100 rounded-full p-1.4' : ''}`}>
              <Ionicons 
                name={focused ? 'person' : 'person-outline'} 
                size={size} 
                color={color} 
              />
            </View>
          ),
        }}
      />
      
    </Tabs>
  );
};

export default DashboardLayout;