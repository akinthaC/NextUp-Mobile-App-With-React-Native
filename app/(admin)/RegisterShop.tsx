// // app/(admin)/RegisterShop.tsx
// import React, { useState, useEffect } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
//   ScrollView,
//   Platform,
//   ActivityIndicator,
//   Modal
// } from "react-native";
// import MapView, { Marker } from "react-native-maps";
// import { db, auth } from "../../firebase";
// import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
// import DateTimePicker from "@react-native-community/datetimepicker";
// import { Ionicons } from "@expo/vector-icons";
// import * as Location from "expo-location";
// import { useNavigation } from "@react-navigation/native";

// const daysOfWeek = [
//   "monday",
//   "tuesday",
//   "wednesday",
//   "thursday",
//   "friday",
//   "saturday",
//   "sunday",
// ];

// export default function RegisterShop() {
//   const navigation = useNavigation(); // ✅ fixes undefined navigation

//   const [shopName, setShopName] = useState("");
//   const [shopAddress, setShopAddress] = useState("");
//   const [contactNumber, setContactNumber] = useState("");
//   const [location, setLocation] = useState({ latitude: 6.9271, longitude: 79.8612 });
//   const [selectedDay, setSelectedDay] = useState<string | null>(null);
//   const [showTimePicker, setShowTimePicker] = useState({ start: false, end: false });
//   const [isLoadingLocation, setIsLoadingLocation] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false); // ✅ loader

//   const [businessHours, setBusinessHours] = useState(
//     daysOfWeek.reduce((acc, day) => {
//       acc[day] = { start: "09:00", end: "18:00" };
//       return acc;
//     }, {} as Record<string, { start: string; end: string }>)
//   );

//   useEffect(() => {
//     (async () => {
//       const { status } = await Location.requestForegroundPermissionsAsync();
//       if (status !== "granted") {
//         Alert.alert("Permission denied", "Allow location access to use this feature");
//       }
//     })();
//   }, []);

//   const getCurrentLocation = async () => {
//     setIsLoadingLocation(true);
//     try {
//       let currentLocation = await Location.getCurrentPositionAsync({});
//       const { latitude, longitude } = currentLocation.coords;
//       setLocation({ latitude, longitude });

//       let geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
//       if (geocode.length > 0) {
//         const address = `${geocode[0].name}, ${geocode[0].city}, ${geocode[0].region}, ${geocode[0].country}`;
//         setShopAddress(address);
//       }
//     } catch (error) {
//       console.error("Error getting location:", error);
//       Alert.alert("Error", "Could not get your current location");
//     } finally {
//       setIsLoadingLocation(false);
//     }
//   };

//   const handleTimeChange = (event: any, selectedTime: Date | undefined, day: string, type: "start" | "end") => {
//     setShowTimePicker({ ...showTimePicker, [type]: false });
//     if (selectedTime) {
//       const formattedTime = selectedTime.toTimeString().substring(0, 5);
//       setBusinessHours({
//         ...businessHours,
//         [day]: { ...businessHours[day], [type]: formattedTime },
//       });
//     }
//   };

//   const handleRegisterShop = async () => {
//     if (!shopName || !shopAddress || !contactNumber) {
//       Alert.alert("Error", "Please fill all fields");
//       return;
//     }
//     if (!auth.currentUser) {
//       Alert.alert("Error", "You must be logged in");
//       return;
//     }

//     setIsSubmitting(true);

//     try {
//       // ✅ Check if user already has a shop
//       const q = query(collection(db, "shops"), where("ownerId", "==", auth.currentUser.uid));
//       const existing = await getDocs(q);
//       if (!existing.empty) {
//         setIsSubmitting(false);
//         Alert.alert("Already Registered", "You have already registered a shop.");
//         return;
//       }

//       // Add new shop
//       const shopData = {
//         name: shopName,
//         address: shopAddress,
//         contact: contactNumber,
//         ownerId: auth.currentUser.uid,
//         location,
//         businessHours,
//         createdAt: new Date(),
//       };

//       const docRef = await addDoc(collection(db, "shops"), shopData);
//       console.log("Shop added with ID:", docRef.id);

//       Alert.alert("Success", "Shop registered successfully!");
//       navigation.navigate("home" as never); // type cast for TS
//     } catch (error: any) {
//       console.error("Error registering shop:", error);
//       Alert.alert("Error", error.message);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <>
//       {/* Full screen loader */}
      

//       <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
//         <View style={styles.header}>
//           <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
//             <Ionicons name="arrow-back" size={24} color="#333" />
//           </TouchableOpacity>
//           <Text style={styles.title}>Register Shop</Text>
//           <View style={styles.backButtonPlaceholder} />
//         </View>

//         <View style={styles.formContainer}>
//           {/* Shop name */}
//           <View style={styles.inputContainer}>
//             <Ionicons name="business-outline" size={20} color="#666" style={styles.inputIcon} />
//             <TextInput
//               placeholder="Shop Name"
//               placeholderTextColor="#999"
//               value={shopName}
//               onChangeText={setShopName}
//               style={styles.input}
//             />
//           </View>

//           {/* Address */}
//           <View style={styles.inputContainer}>
//             <Ionicons name="location-outline" size={20} color="#666" style={styles.inputIcon} />
//             <TextInput
//               placeholder="Address"
//               placeholderTextColor="#999"
//               value={shopAddress}
//               onChangeText={setShopAddress}
//               style={styles.input}
//               multiline
//             />
//             <TouchableOpacity
//               style={styles.locationButton}
//               onPress={getCurrentLocation}
//               disabled={isLoadingLocation}
//             >
//               {isLoadingLocation ? (
//                 <ActivityIndicator size="small" color="#4a6cff" />
//               ) : (
//                 <Ionicons name="locate" size={20} color="#4a6cff" />
//               )}
//             </TouchableOpacity>
//           </View>

//           {/* Contact */}
//           <View style={styles.inputContainer}>
//             <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
//             <TextInput
//               placeholder="Contact Number"
//               placeholderTextColor="#999"
//               value={contactNumber}
//               onChangeText={setContactNumber}
//               style={styles.input}
//               keyboardType="phone-pad"
//             />
//           </View>

//           {/* Map */}
//           <Text style={styles.sectionTitle}>Select Location</Text>
//           <View style={styles.mapContainer}>
//             <MapView
//               style={styles.map}
//               initialRegion={{
//                 ...location,
//                 latitudeDelta: 0.01,
//                 longitudeDelta: 0.01,
//               }}
//               onPress={(e) => setLocation(e.nativeEvent.coordinate)}
//             >
//               <Marker coordinate={location} />
//             </MapView>
//             <View style={styles.mapHint}>
//               <Ionicons name="information-circle-outline" size={16} color="#666" />
//               <Text style={styles.mapHintText}>Tap on the map to set shop location</Text>
//             </View>
//           </View>

//           {/* Business hours */}
//           <Text style={styles.sectionTitle}>Business Hours</Text>
//           <View style={styles.daysContainer}>
//             {daysOfWeek.map((day) => (
//               <TouchableOpacity
//                 key={day}
//                 style={[styles.dayButton, selectedDay === day && styles.dayButtonActive]}
//                 onPress={() => setSelectedDay(day)}
//               >
//                 <Text
//                   style={[styles.dayButtonText, selectedDay === day && styles.dayButtonTextActive]}
//                 >
//                   {day.substring(0, 3).toUpperCase()}
//                 </Text>
//               </TouchableOpacity>
//             ))}
//           </View>

//           {selectedDay && (
//             <View style={styles.timeContainer}>
//               <View style={styles.timeInputGroup}>
//                 <Text style={styles.timeLabel}>Opening Time</Text>
//                 <TouchableOpacity
//                   style={styles.timeInput}
//                   onPress={() => setShowTimePicker({ ...showTimePicker, start: true })}
//                 >
//                   <Text style={styles.timeText}>{businessHours[selectedDay].start}</Text>
//                   <Ionicons name="time-outline" size={20} color="#666" />
//                 </TouchableOpacity>
//               </View>

//               <View style={styles.timeInputGroup}>
//                 <Text style={styles.timeLabel}>Closing Time</Text>
//                 <TouchableOpacity
//                   style={styles.timeInput}
//                   onPress={() => setShowTimePicker({ ...showTimePicker, end: true })}
//                 >
//                   <Text style={styles.timeText}>{businessHours[selectedDay].end}</Text>
//                   <Ionicons name="time-outline" size={20} color="#666" />
//                 </TouchableOpacity>
//               </View>
//             </View>
//           )}

//           {showTimePicker.start && (
//             <DateTimePicker
//               value={new Date()}
//               mode="time"
//               is24Hour
//               display={Platform.OS === "ios" ? "spinner" : "default"}
//               onChange={(event, time) => handleTimeChange(event, time, selectedDay!, "start")}
//             />
//           )}

//           {showTimePicker.end && (
//             <DateTimePicker
//               value={new Date()}
//               mode="time"
//               is24Hour
//               display={Platform.OS === "ios" ? "spinner" : "default"}
//               onChange={(event, time) => handleTimeChange(event, time, selectedDay!, "end")}
//             />
//           )}

//           <TouchableOpacity style={styles.registerButton} onPress={handleRegisterShop}>
//             <Text style={styles.registerButtonText}>Register Shop</Text>
//           </TouchableOpacity>
//         </View>
//       </ScrollView>
//     </>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#f8f9fa" },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingHorizontal: 20,
//     paddingTop: 60,
//     paddingBottom: 20,
//     backgroundColor: "white",
//     borderBottomWidth: 1,
//     borderBottomColor: "#eaeaea",
//   },
//   backButton: { padding: 5 },
//   backButtonPlaceholder: { width: 34 },
//   title: { fontSize: 22, fontWeight: "700", color: "#333" },
//   formContainer: { padding: 20 },
//   inputContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "white",
//     borderRadius: 12,
//     paddingHorizontal: 15,
//     marginBottom: 15,
//     shadowColor: "#000",
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//     elevation: 2,
//   },
//   inputIcon: { marginRight: 10 },
//   input: { flex: 1, height: 50, color: "#333", fontSize: 16 },
//   locationButton: { padding: 8, borderRadius: 20, backgroundColor: "#f0f4ff" },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: "600",
//     color: "#333",
//     marginTop: 20,
//     marginBottom: 15,
//   },
//   mapContainer: {
//     borderRadius: 12,
//     overflow: "hidden",
//     marginBottom: 15,
//     shadowColor: "#000",
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//     elevation: 3,
//   },
//   map: { width: "100%", height: 200 },
//   mapHint: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#f0f4ff",
//     padding: 10,
//   },
//   mapHintText: { marginLeft: 5, fontSize: 12, color: "#666" },
//   daysContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
//   dayButton: {
//     paddingVertical: 8,
//     paddingHorizontal: 5,
//     borderRadius: 10,
//     backgroundColor: "#f0f0f0",
//     alignItems: "center",
//     minWidth: 40,
//   },
//   dayButtonActive: { backgroundColor: "#4a6cff" },
//   dayButtonText: { fontSize: 12, fontWeight: "500", color: "#666" },
//   dayButtonTextActive: { color: "white" },
//   timeContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30 },
//   timeInputGroup: { width: "48%" },
//   timeLabel: { fontSize: 14, color: "#666", marginBottom: 8, fontWeight: "500" },
//   timeInput: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     backgroundColor: "white",
//     borderRadius: 12,
//     padding: 15,
//     shadowColor: "#000",
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//     elevation: 2,
//   },
//   timeText: { fontSize: 16, color: "#333", fontWeight: "500" },
//   registerButton: {
//     backgroundColor: "#4a6cff",
//     borderRadius: 12,
//     padding: 18,
//     alignItems: "center",
//     marginTop: 10,
//     marginBottom: 30,
//     shadowColor: "#4a6cff",
//     shadowOpacity: 0.3,
//     shadowRadius: 4.65,
//     elevation: 8,
//   },
//   registerButtonText: { color: "white", fontSize: 16, fontWeight: "600" },
//   loaderOverlay: {
//     flex: 1,
//     backgroundColor: "rgba(0,0,0,0.5)",
//     justifyContent: "center",
//     alignItems: "center",
//   },
// });
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
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { db, auth } from "../../firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useNavigation } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// Custom Dropdown Component for better cross-platform experience
const CustomDropdown = ({ 
  items, 
  selectedValue, 
  onValueChange, 
  placeholder 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View>
      <TouchableOpacity
        style={styles.dropdownHeader}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={[
          styles.dropdownHeaderText, 
          !selectedValue && styles.placeholderText
        ]}>
          {selectedValue ? items.find(item => item.value === selectedValue)?.label : placeholder}
        </Text>
        <Ionicons 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={20} 
          color="#666" 
        />
      </TouchableOpacity>
      
      {isOpen && (
        <View style={styles.dropdownList}>
          {items.map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.dropdownItem,
                selectedValue === item.value && styles.dropdownItemSelected
              ]}
              onPress={() => {
                onValueChange(item.value);
                setIsOpen(false);
              }}
            >
              <Text style={[
                styles.dropdownItemText,
                selectedValue === item.value && styles.dropdownItemTextSelected
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

// Custom Time Picker Component
const CustomTimePicker = ({ 
  value, 
  onChange, 
  label 
}) => {
  const [show, setShow] = useState(false);
  const [time, setTime] = useState(value || new Date());

  const onTimeChange = (event, selectedTime) => {
    setShow(false);
    if (selectedTime) {
      setTime(selectedTime);
      onChange(selectedTime);
    }
  };

  const formatTime = (date) => {
    return date.toTimeString().substring(0, 5);
  };

  return (
    <View>
      <Text style={styles.timeLabel}>{label}</Text>
      <TouchableOpacity
        style={styles.timeInput}
        onPress={() => setShow(true)}
      >
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

export default function RegisterShop() {
  const navigation = useNavigation();

  const [shopName, setShopName] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [location, setLocation] = useState({ latitude: 6.9271, longitude: 79.8612 });

  // Category dropdown
  const categories = [
    { label: "Salon", value: "salon" },
    { label: "Restaurant", value: "restaurant" },
    { label: "Grocery", value: "grocery" },
    { label: "Electronics", value: "electronics" },
    { label: "Clothing", value: "clothing" },
  ];
  const [category, setCategory] = useState("");

  const [selectedDay, setSelectedDay] = useState("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [businessHours, setBusinessHours] = useState(
    daysOfWeek.reduce((acc, day) => {
      const dayLower = day.toLowerCase();
      acc[dayLower] = { 
        start: new Date(new Date().setHours(9, 0, 0, 0)), 
        end: new Date(new Date().setHours(18, 0, 0, 0)) 
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

      // Convert Date objects to strings for Firestore
      const businessHoursForFirestore = Object.keys(businessHours).reduce((acc, day) => {
        acc[day] = {
          start: businessHours[day].start.toTimeString().substring(0, 5),
          end: businessHours[day].end.toTimeString().substring(0, 5)
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

        {/* Category Dropdown */}
        <Text style={styles.sectionTitle}>Category</Text>
        <View style={styles.dropdownWrapper}>
          <CustomDropdown
            items={categories}
            selectedValue={category}
            onValueChange={setCategory}
            placeholder="-- Select Category --"
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
        </View>

        {/* Business hours */}
        <Text style={styles.sectionTitle}>Business Hours</Text>
        <View style={styles.daysContainer}>
          {daysOfWeek.map((day) => {
            const dayLower = day.toLowerCase();
            return (
              <TouchableOpacity
                key={dayLower}
                style={[
                  styles.dayButton,
                  selectedDay === dayLower && styles.dayButtonActive
                ]}
                onPress={() => setSelectedDay(selectedDay === dayLower ? "" : dayLower)}
              >
                <Text style={[
                  styles.dayButtonText,
                  selectedDay === dayLower && styles.dayButtonTextActive
                ]}>
                  {day.substring(0, 3)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedDay && (
          <View style={styles.timeContainer}>
            <CustomTimePicker
              value={businessHours[selectedDay].start}
              onChange={(time) => handleTimeChange(selectedDay, "start", time)}
              label="Opening Time"
            />
            
            <CustomTimePicker
              value={businessHours[selectedDay].end}
              onChange={(time) => handleTimeChange(selectedDay, "end", time)}
              label="Closing Time"
            />
          </View>
        )}

        <TouchableOpacity
          style={[styles.registerButton, isSubmitting && styles.registerButtonDisabled]}
          onPress={handleRegisterShop}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.registerButtonText}>Register Shop</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  formContainer: { padding: 20 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 25,
  },
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
  dropdownWrapper: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 15,
    overflow: "hidden",
    elevation: 2,
  },
  dropdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    height: 50,
  },
  dropdownHeaderText: {
    fontSize: 16,
    color: "#333",
  },
  placeholderText: {
    color: "#999",
  },
  dropdownList: {
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownItemSelected: {
    backgroundColor: "#f0f4ff",
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#333",
  },
  dropdownItemTextSelected: {
    color: "#4a6cff",
    fontWeight: "500",
  },
  mapContainer: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    height: 200,
  },
  map: { width: "100%", height: "100%" },
  daysContainer: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginBottom: 20,
    flexWrap: "wrap",
    gap: 8,
  },
  dayButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    minWidth: 50,
  },
  dayButtonActive: { backgroundColor: "#4a6cff" },
  dayButtonText: { fontSize: 12, fontWeight: "500", color: "#666" },
  dayButtonTextActive: { color: "white" },
  timeContainer: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginBottom: 30,
    gap: 15,
  },
  timeLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    fontWeight: "500",
  },
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
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: { color: "white", fontSize: 16, fontWeight: "600" },
});