import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../context/authContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import "./../global.css";

const Index = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    const redirectUser = async () => {
      if (user) {
        try {
          // Fetch user role from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.data();

         console.log("Current Firebase User:", user); 
          if (userData?.role === 'admin') {
            router.replace('/(admin)/home'); // admin dashboard
          } else {
            router.replace('/(dashboard)/home'); // customer home
          }
        } catch (err) {
          console.error('Error fetching user role:', err);
          router.replace('/login'); // fallback
        }
      } else {
        router.replace('/login');
      }
      setCheckingRole(false);
    };

    if (!loading) {
      redirectUser();
    }
  }, [user, loading]);

  if (loading || checkingRole) {
    return (
      <View className="flex-1 w-full justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Optional fallback UI
  return (
    <View className="flex-1 w-full items-center justify-center">
      <Text className="text-4xl">Hello</Text>
      <TouchableOpacity
        onPress={() => router.push('/login')}
        className="bg-blue-500 p-4 rounded-lg mt-4"
      >
        <Text className="text-white text-lg">Go to Login</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Index;
