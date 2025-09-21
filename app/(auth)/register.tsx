

import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image
} from "react-native";
import Animated, { FadeIn, FadeInUp, ZoomIn, FadeOut } from "react-native-reanimated";
import { ActivityIndicator } from "react-native-paper";
import { Register } from "../../services/authService";

const RegisterScreen = () => {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    if (!username || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await Register(email, password, username); // always customer role
      router.replace("/login");
    } catch (err: any) {
      setError(err?.message || "Registration failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-6 bg-gradient-to-b from-blue-50 to-white">
        <Animated.View entering={FadeIn.duration(800)} className="w-full items-center mb-6">
          <Animated.View entering={ZoomIn.duration(1000).springify().delay(200)}
            className="w-40 h-20 mb-4 rounded-2xl bg-blue-500 items-center justify-center shadow-lg shadow-blue-500/50">
            <Image source={require("./../../assets/logo/whiteLogo.png")} className="w-100 h-40" resizeMode="contain" />
          </Animated.View>
          <Animated.Text entering={FadeInUp.duration(1000).delay(400)} className="text-2xl font-bold text-blue-600">NextUp</Animated.Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(800).delay(600)} className="w-full max-w-md bg-white p-8 rounded-3xl shadow-lg">
          <Text className="text-2xl font-bold mb-2 text-gray-800">Create Account</Text>
          <Text className="text-gray-500 mb-6">Join us to manage your tasks</Text>

          {error && (
            <Animated.View entering={FadeIn} exiting={FadeOut} className="bg-red-100 p-3 rounded-lg mb-4">
              <Text className="text-red-700 text-center">{error}</Text>
            </Animated.View>
          )}

          <TextInput
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            className='bg-gray-100 p-4 rounded-xl w-full mb-4 text-gray-900'
            placeholderTextColor="#9CA3AF"
          />

          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            className='bg-gray-100 p-4 rounded-xl w-full mb-4 text-gray-900'
            placeholderTextColor="#9CA3AF"
          />

          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            className='bg-gray-100 p-4 rounded-xl w-full mb-4 text-gray-900'
            placeholderTextColor="#9CA3AF"
          />

          <TextInput
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            className='bg-gray-100 p-4 rounded-xl w-full mb-4 text-gray-900'
            placeholderTextColor="#9CA3AF"
          />


          <TouchableOpacity onPress={handleRegister} disabled={isLoading} className={`bg-blue-600 p-4 rounded-xl w-full items-center ${isLoading ? "opacity-70" : ""}`}>
            {isLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text className="text-white text-lg font-semibold">Register</Text>}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;
