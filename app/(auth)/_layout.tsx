import { View, Text } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'


const AuthLayout = () => {
  return (
    <Stack screenOptions={{
      headerShown: true,
      contentStyle: { backgroundColor: 'white' },
      animation: 'slide_from_right',
      headerTitleStyle: { fontSize: 20, fontWeight: 'bold', color: '#1E40AF' },
      headerTintColor: '#1E40AF',
    }}>
        <Stack.Screen
          name="login"
          options={{ title: 'login' }}
          />
        
        <Stack.Screen
          name="register"
          options={{ title: 'register' }}
          />
        
    </Stack>
  )
}

export default AuthLayout