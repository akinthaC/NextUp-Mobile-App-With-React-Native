import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';

export default function QueueLayout({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.container}>
      <Stack screenOptions={{ headerShown: false }} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
});
