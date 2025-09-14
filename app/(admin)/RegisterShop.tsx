// app/(admin)/RegisterShop.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
  ActivityIndicator,
  Modal
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { db, auth } from "../../firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useNavigation } from "@react-navigation/native";

const daysOfWeek = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export default function RegisterShop() {
  const navigation = useNavigation(); // ✅ fixes undefined navigation

  const [shopName, setShopName] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [location, setLocation] = useState({ latitude: 6.9271, longitude: 79.8612 });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showTimePicker, setShowTimePicker] = useState({ start: false, end: false });
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // ✅ loader

  const [businessHours, setBusinessHours] = useState(
    daysOfWeek.reduce((acc, day) => {
      acc[day] = { start: "09:00", end: "18:00" };
      return acc;
    }, {} as Record<string, { start: string; end: string }>)
  );

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Allow location access to use this feature");
      }
    })();
  }, []);

  const getCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      let currentLocation = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = currentLocation.coords;
      setLocation({ latitude, longitude });

      let geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geocode.length > 0) {
        const address = `${geocode[0].name}, ${geocode[0].city}, ${geocode[0].region}, ${geocode[0].country}`;
        setShopAddress(address);
      }
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert("Error", "Could not get your current location");
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleTimeChange = (event: any, selectedTime: Date | undefined, day: string, type: "start" | "end") => {
    setShowTimePicker({ ...showTimePicker, [type]: false });
    if (selectedTime) {
      const formattedTime = selectedTime.toTimeString().substring(0, 5);
      setBusinessHours({
        ...businessHours,
        [day]: { ...businessHours[day], [type]: formattedTime },
      });
    }
  };

  const handleRegisterShop = async () => {
    if (!shopName || !shopAddress || !contactNumber) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }
    if (!auth.currentUser) {
      Alert.alert("Error", "You must be logged in");
      return;
    }

    setIsSubmitting(true);

    try {
      // ✅ Check if user already has a shop
      const q = query(collection(db, "shops"), where("ownerId", "==", auth.currentUser.uid));
      const existing = await getDocs(q);
      if (!existing.empty) {
        setIsSubmitting(false);
        Alert.alert("Already Registered", "You have already registered a shop.");
        return;
      }

      // Add new shop
      const shopData = {
        name: shopName,
        address: shopAddress,
        contact: contactNumber,
        ownerId: auth.currentUser.uid,
        location,
        businessHours,
        createdAt: new Date(),
      };

      const docRef = await addDoc(collection(db, "shops"), shopData);
      console.log("Shop added with ID:", docRef.id);

      Alert.alert("Success", "Shop registered successfully!");
      navigation.navigate("home" as never); // type cast for TS
    } catch (error: any) {
      console.error("Error registering shop:", error);
      Alert.alert("Error", error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Full screen loader */}
      

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        

        <View style={styles.formContainer}>
          {/* Shop name */}
          <View style={styles.inputContainer}>
            <Ionicons name="business-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              placeholder="Shop Name"
              placeholderTextColor="#999"
              value={shopName}
              onChangeText={setShopName}
              style={styles.input}
            />
          </View>

          {/* Address */}
          <View style={styles.inputContainer}>
            <Ionicons name="location-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              placeholder="Address"
              placeholderTextColor="#999"
              value={shopAddress}
              onChangeText={setShopAddress}
              style={styles.input}
              multiline
            />
            <TouchableOpacity
              style={styles.locationButton}
              onPress={getCurrentLocation}
              disabled={isLoadingLocation}
            >
              {isLoadingLocation ? (
                <ActivityIndicator size="small" color="#4a6cff" />
              ) : (
                <Ionicons name="locate" size={20} color="#4a6cff" />
              )}
            </TouchableOpacity>
          </View>

          {/* Contact */}
          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              placeholder="Contact Number"
              placeholderTextColor="#999"
              value={contactNumber}
              onChangeText={setContactNumber}
              style={styles.input}
              keyboardType="phone-pad"
            />
          </View>

          {/* Map */}
          <Text style={styles.sectionTitle}>Select Location</Text>
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                ...location,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              onPress={(e) => setLocation(e.nativeEvent.coordinate)}
            >
              <Marker coordinate={location} />
            </MapView>
            <View style={styles.mapHint}>
              <Ionicons name="information-circle-outline" size={16} color="#666" />
              <Text style={styles.mapHintText}>Tap on the map to set shop location</Text>
            </View>
          </View>

          {/* Business hours */}
          <Text style={styles.sectionTitle}>Business Hours</Text>
          <View style={styles.daysContainer}>
            {daysOfWeek.map((day) => (
              <TouchableOpacity
                key={day}
                style={[styles.dayButton, selectedDay === day && styles.dayButtonActive]}
                onPress={() => setSelectedDay(day)}
              >
                <Text
                  style={[styles.dayButtonText, selectedDay === day && styles.dayButtonTextActive]}
                >
                  {day.substring(0, 3).toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedDay && (
            <View style={styles.timeContainer}>
              <View style={styles.timeInputGroup}>
                <Text style={styles.timeLabel}>Opening Time</Text>
                <TouchableOpacity
                  style={styles.timeInput}
                  onPress={() => setShowTimePicker({ ...showTimePicker, start: true })}
                >
                  <Text style={styles.timeText}>{businessHours[selectedDay].start}</Text>
                  <Ionicons name="time-outline" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.timeInputGroup}>
                <Text style={styles.timeLabel}>Closing Time</Text>
                <TouchableOpacity
                  style={styles.timeInput}
                  onPress={() => setShowTimePicker({ ...showTimePicker, end: true })}
                >
                  <Text style={styles.timeText}>{businessHours[selectedDay].end}</Text>
                  <Ionicons name="time-outline" size={20} color="#666" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {showTimePicker.start && (
            <DateTimePicker
              value={new Date()}
              mode="time"
              is24Hour
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, time) => handleTimeChange(event, time, selectedDay!, "start")}
            />
          )}

          {showTimePicker.end && (
            <DateTimePicker
              value={new Date()}
              mode="time"
              is24Hour
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, time) => handleTimeChange(event, time, selectedDay!, "end")}
            />
          )}

          <TouchableOpacity style={styles.registerButton} onPress={handleRegisterShop}>
            <Text style={styles.registerButtonText}>Register Shop</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eaeaea",
  },
  backButton: { padding: 5 },
  backButtonPlaceholder: { width: 34 },
  title: { fontSize: 22, fontWeight: "700", color: "#333" },
  formContainer: { padding: 20 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: 50, color: "#333", fontSize: 16 },
  locationButton: { padding: 8, borderRadius: 20, backgroundColor: "#f0f4ff" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 20,
    marginBottom: 15,
  },
  mapContainer: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  map: { width: "100%", height: 200 },
  mapHint: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f4ff",
    padding: 10,
  },
  mapHintText: { marginLeft: 5, fontSize: 12, color: "#666" },
  daysContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  dayButton: {
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    minWidth: 40,
  },
  dayButtonActive: { backgroundColor: "#4a6cff" },
  dayButtonText: { fontSize: 12, fontWeight: "500", color: "#666" },
  dayButtonTextActive: { color: "white" },
  timeContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30 },
  timeInputGroup: { width: "48%" },
  timeLabel: { fontSize: 14, color: "#666", marginBottom: 8, fontWeight: "500" },
  timeInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  timeText: { fontSize: 16, color: "#333", fontWeight: "500" },
  registerButton: {
    backgroundColor: "#4a6cff",
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
    shadowColor: "#4a6cff",
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  registerButtonText: { color: "white", fontSize: 16, fontWeight: "600" },
  loaderOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
});
