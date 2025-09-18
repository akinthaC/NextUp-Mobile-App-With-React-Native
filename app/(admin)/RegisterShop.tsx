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
} from "react-native";
import { db, auth } from "../../firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useNavigation } from "@react-navigation/native";

// Platform-safe import for react-native-maps
let MapView: any = null;
let Marker: any = null;
if (Platform.OS !== "web") {
  MapView = require("react-native-maps").default;
  Marker = require("react-native-maps").Marker;
}

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// --- Custom Dropdown Component ---
const CustomDropdown = ({ items, selectedValue, onValueChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View>
      <TouchableOpacity
        style={styles.dropdownHeader}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={[styles.dropdownHeaderText, !selectedValue && styles.placeholderText]}>
          {selectedValue ? items.find((i) => i.value === selectedValue)?.label : placeholder}
        </Text>
        <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={20} color="#666" />
      </TouchableOpacity>

      {isOpen &&
        items.map((item) => (
          <TouchableOpacity
            key={item.value}
            style={[styles.dropdownItem, selectedValue === item.value && styles.dropdownItemSelected]}
            onPress={() => {
              onValueChange(item.value);
              setIsOpen(false);
            }}
          >
            <Text
              style={[
                styles.dropdownItemText,
                selectedValue === item.value && styles.dropdownItemTextSelected,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
    </View>
  );
};

// --- Custom Time Picker ---
const CustomTimePicker = ({ value, onChange, label }) => {
  const [show, setShow] = useState(false);
  const [time, setTime] = useState(value || new Date());

  const onTimeChange = (event, selectedTime) => {
    setShow(false);
    if (selectedTime) {
      setTime(selectedTime);
      onChange(selectedTime);
    }
  };

  const formatTime = (date) => date.toTimeString().substring(0, 5);

  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.timeLabel}>{label}</Text>
      <TouchableOpacity style={styles.timeInput} onPress={() => setShow(true)}>
        <Text style={styles.timeText}>{formatTime(time)}</Text>
        <Ionicons name="time-outline" size={20} color="#666" />
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          value={time}
          mode="time"
          is24Hour={true}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onTimeChange}
        />
      )}
    </View>
  );
};

// --- Main Component ---
export default function RegisterShop() {
  const navigation = useNavigation();

  const [shopName, setShopName] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [location, setLocation] = useState({ latitude: 6.9271, longitude: 79.8612 });
  const [category, setCategory] = useState("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { label: "Salon", value: "salon" },
    { label: "Restaurant", value: "restaurant" },
    { label: "Grocery", value: "grocery" },
    { label: "Electronics", value: "electronics" },
    { label: "Clothing", value: "clothing" },
  ];

  const [businessHours, setBusinessHours] = useState(
    daysOfWeek.reduce((acc, day) => {
      const dayLower = day.toLowerCase();
      acc[dayLower] = {
        start: new Date(new Date().setHours(9, 0, 0, 0)),
        end: new Date(new Date().setHours(18, 0, 0, 0)),
      };
      return acc;
    }, {} as Record<string, { start: Date; end: Date }>)
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

  const handleTimeChange = (day: string, type: "start" | "end", newTime: Date) => {
    setBusinessHours({
      ...businessHours,
      [day]: { ...businessHours[day], [type]: newTime },
    });
  };

  function generateShopId(name: string) {
    const letters = name.replace(/\s+/g, "").substring(0, 2).toUpperCase();
    const digits = Math.floor(1000 + Math.random() * 9000);
    return letters + digits;
  }

  const handleRegisterShop = async () => {
    if (!shopName || !shopAddress || !contactNumber || !category) {
      Alert.alert("Error", "Please fill all fields and select a category");
      return;
    }
    if (!auth.currentUser) {
      Alert.alert("Error", "You must be logged in");
      return;
    }

    setIsSubmitting(true);

    try {
      const q = query(collection(db, "shops"), where("ownerId", "==", auth.currentUser.uid));
      const existing = await getDocs(q);
      if (!existing.empty) {
        setIsSubmitting(false);
        Alert.alert("Already Registered", "You have already registered a shop.");
        return;
      }

      const shopId = generateShopId(shopName);

      const businessHoursForFirestore = Object.keys(businessHours).reduce((acc, day) => {
        acc[day] = {
          start: businessHours[day].start.toTimeString().substring(0, 5),
          end: businessHours[day].end.toTimeString().substring(0, 5),
        };
        return acc;
      }, {} as Record<string, { start: string; end: string }>);

      const shopData = {
        shopId,
        name: shopName,
        address: shopAddress,
        contact: contactNumber,
        category,
        ownerId: auth.currentUser.uid,
        location,
        businessHours: businessHoursForFirestore,
        createdAt: new Date(),
      };

      const docRef = await addDoc(collection(db, "shops"), shopData);
      console.log("Shop added with ID:", docRef.id);

      Alert.alert("Success", "Shop registered successfully!");
      navigation.navigate("home" as never);
    } catch (error: any) {
      console.error("Error registering shop:", error);
      Alert.alert("Error", error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Register Your Shop</Text>

        {/* Shop Name */}
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

        {/* Category */}
        <CustomDropdown
          items={categories}
          selectedValue={category}
          onValueChange={setCategory}
          placeholder="Select Category"
        />

        {/* Map */}
        <View style={styles.mapContainer}>
          {Platform.OS !== "web" && MapView ? (
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              onPress={(e) => setLocation(e.nativeEvent.coordinate)}
            >
              <Marker coordinate={location} />
            </MapView>
          ) : (
            <View style={[styles.map, styles.webMapPlaceholder]}>
              <Text style={{ color: "#666" }}>Map unavailable on web</Text>
            </View>
          )}
        </View>

        {/* Business Hours */}
        <Text style={styles.sectionTitle}>Business Hours</Text>
        {daysOfWeek.map((day) => {
          const dayLower = day.toLowerCase();
          return (
            <View key={day} style={styles.businessHoursRow}>
              <Text style={styles.businessDay}>{day}</Text>
              <CustomTimePicker
                label="Start"
                value={businessHours[dayLower].start}
                onChange={(time) => handleTimeChange(dayLower, "start", time)}
              />
              <CustomTimePicker
                label="End"
                value={businessHours[dayLower].end}
                onChange={(time) => handleTimeChange(dayLower, "end", time)}
              />
            </View>
          );
        })}

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && { opacity: 0.7 }]}
          onPress={handleRegisterShop}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Register Shop</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  formContainer: { flex: 1 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20, color: "#333" },
  inputContainer: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, color: "#333" },
  locationButton: { marginLeft: 8, padding: 8 },
  dropdownHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginBottom: 10 },
  dropdownHeaderText: { fontSize: 16, color: "#333" },
  placeholderText: { color: "#999" },
  dropdownItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: "#eee" },
  dropdownItemSelected: { backgroundColor: "#e6f0ff" },
  dropdownItemText: { color: "#333" },
  dropdownItemTextSelected: { fontWeight: "bold", color: "#4a6cff" },
  mapContainer: { height: 200, marginVertical: 10 },
  map: { flex: 1, borderRadius: 8 },
  webMapPlaceholder: { justifyContent: "center", alignItems: "center", backgroundColor: "#f0f0f0" },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginVertical: 10, color: "#333" },
  businessHoursRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  businessDay: { width: 80, fontSize: 14, color: "#333" },
  timeLabel: { fontSize: 12, color: "#666" },
  timeInput: { flex: 1, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 8, marginHorizontal: 5 },
  timeText: { color: "#333" },
  submitButton: { backgroundColor: "#4a6cff", padding: 15, borderRadius: 8, alignItems: "center", marginVertical: 20 },
  submitButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
