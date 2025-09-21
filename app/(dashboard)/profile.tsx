import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from "react-native";
import { useAuth } from "../../context/authContext";
import { useRouter } from "expo-router";
import { getDoc, doc } from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "../../firebase";
import { Ionicons } from "@expo/vector-icons";

interface ProfileData {
  username: string;
  role: string;
}

export default function Setting() {
  const { user: authUser, logout } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetSending, setResetSending] = useState(false);

  // 🔹 Fetch Firestore profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!authUser?.uid) return;
        const snap = await getDoc(doc(db, "users", authUser.uid));
        if (snap.exists()) {
          setProfile(snap.data() as ProfileData);
        }
      } catch (err) {
        console.error("Profile load error:", err);
        Alert.alert("Error", "Failed to load profile info.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [authUser]);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      router.replace("/login");
    } catch (err) {
      console.error(err);
      Alert.alert("Logout Failed", "Please try again.");
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!authUser?.email) return;
    setResetSending(true);
    try {
      await sendPasswordResetEmail(auth, authUser.email);
      Alert.alert("Password Reset", `Reset link sent to ${authUser.email}`);
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err.message || "Could not send reset email.");
    } finally {
      setResetSending(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 pt-12 pb-4 shadow-sm">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-2xl font-bold text-gray-900">Profile</Text>
          <TouchableOpacity 
            onPress={() => router.back()}
            className="p-2 rounded-full bg-gray-100"
          >
            <Ionicons name="close" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View className="bg-white rounded-xl p-5 my-6 shadow-sm border border-gray-100">
          <View className="flex-row items-center mb-4">
            <View className="w-12 h-12 bg-indigo-100 rounded-full items-center justify-center mr-4">
              <Ionicons name="person" size={20} color="#6366F1" />
            </View>
            <View>
              <Text className="text-lg font-semibold text-gray-900">
                {profile?.username ?? "User"}
              </Text>
              <Text className="text-gray-500">
                {authUser?.email}
              </Text>
            </View>
          </View>
          
          <View className="flex-row justify-between items-center py-3 border-t border-gray-100">
            <Text className="text-gray-600"></Text>
            <Text className="font-medium text-gray-900">{profile?.role ?? "—"}</Text>
          </View>
        </View>

        {/* Password Reset */}
        <View className="bg-white rounded-xl p-5 mb-6 shadow-sm border border-gray-100">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Password</Text>
          <TouchableOpacity
            onPress={handlePasswordReset}
            className="bg-indigo-600 rounded-xl py-4 items-center flex-row justify-center"
            disabled={resetSending}
          >
            {resetSending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="key-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text className="text-white font-semibold text-base">
                  Send Password Reset Email
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-white rounded-xl py-4 mb-10 items-center flex-row justify-center border border-gray-200"
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#EF4444" />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={18} color="#EF4444" style={{ marginRight: 8 }} />
              <Text className="text-red-500 font-semibold text-base">Logout</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}