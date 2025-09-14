import { View, Text, TouchableOpacity } from 'react-native';
import React from 'react';
import { useAuth } from '../../context/authContext';
import { useRouter } from 'expo-router';

const Setting = () => {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login'); // Redirect to login screen after logout
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl mb-6">Settings</Text>

      <TouchableOpacity
        onPress={handleLogout}
        className="bg-red-500 p-4 rounded-lg"
      >
        <Text className="text-white font-semibold text-lg">Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Setting;
