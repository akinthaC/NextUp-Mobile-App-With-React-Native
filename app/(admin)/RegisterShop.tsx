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
//   Animated,
//   Easing,
// } from "react-native";
// import { db, auth } from "../../firebase";
// import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
// import DateTimePicker from "@react-native-community/datetimepicker";
// import { Ionicons } from "@expo/vector-icons";
// import * as Location from "expo-location";
// import { useNavigation } from "@react-navigation/native";
// import { LinearGradient } from 'expo-linear-gradient';

// // Platform-safe import for react-native-maps
// let MapView: any = null;
// let Marker: any = null;
// if (Platform.OS !== "web") {
//   MapView = require("react-native-maps").default;
//   Marker = require("react-native-maps").Marker;
// }

// const daysOfWeek = [
//   "Monday",
//   "Tuesday",
//   "Wednesday",
//   "Thursday",
//   "Friday",
//   "Saturday",
//   "Sunday",
// ];

// // --- Custom Dropdown Component ---
// const CustomDropdown = ({ items, selectedValue, onValueChange, placeholder }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const rotateAnim = useState(new Animated.Value(0))[0];

//   useEffect(() => {
//     Animated.timing(rotateAnim, {
//       toValue: isOpen ? 1 : 0,
//       duration: 200,
//       easing: Easing.linear,
//       useNativeDriver: true,
//     }).start();
//   }, [isOpen]);

//   const rotate = rotateAnim.interpolate({
//     inputRange: [0, 1],
//     outputRange: ['0deg', '180deg']
//   });

//   return (
//     <View>
//       <TouchableOpacity
//         style={styles.dropdownHeader}
//         onPress={() => setIsOpen(!isOpen)}
//         activeOpacity={0.7}
//       >
//         <Text style={[styles.dropdownHeaderText, !selectedValue && styles.placeholderText]}>
//           {selectedValue ? items.find((i) => i.value === selectedValue)?.label : placeholder}
//         </Text>
//         <Animated.View style={{ transform: [{ rotate }] }}>
//           <Ionicons name="chevron-down" size={20} color="#666" />
//         </Animated.View>
//       </TouchableOpacity>

//       {isOpen && (
//         <View style={styles.dropdownList}>
//           {items.map((item) => (
//             <TouchableOpacity
//               key={item.value}
//               style={[styles.dropdownItem, selectedValue === item.value && styles.dropdownItemSelected]}
//               onPress={() => {
//                 onValueChange(item.value);
//                 setIsOpen(false);
//               }}
//               activeOpacity={0.7}
//             >
//               <Text
//                 style={[
//                   styles.dropdownItemText,
//                   selectedValue === item.value && styles.dropdownItemTextSelected,
//                 ]}
//               >
//                 {item.label}
//               </Text>
//             </TouchableOpacity>
//           ))}
//         </View>
//       )}
//     </View>
//   );
// };

// // --- Custom Time Picker ---
// const CustomTimePicker = ({ value, onChange, label }) => {
//   const [show, setShow] = useState(false);
//   const [time, setTime] = useState(value || new Date());

//   const onTimeChange = (event, selectedTime) => {
//     setShow(false);
//     if (selectedTime) {
//       setTime(selectedTime);
//       onChange(selectedTime);
//     }
//   };

//   const formatTime = (date) => date.toTimeString().substring(0, 5);

//   return (
//     <View style={{ flex: 1 }}>
//       <Text style={styles.timeLabel}>{label}</Text>
//       <TouchableOpacity 
//         style={styles.timeInput} 
//         onPress={() => setShow(true)}
//         activeOpacity={0.7}
//       >
//         <Text style={styles.timeText}>{formatTime(time)}</Text>
//         <Ionicons name="time-outline" size={20} color="#666" />
//       </TouchableOpacity>

//       {show && (
//         <DateTimePicker
//           value={time}
//           mode="time"
//           is24Hour={true}
//           display={Platform.OS === "ios" ? "spinner" : "default"}
//           onChange={onTimeChange}
//         />
//       )}
//     </View>
//   );
// };

// // --- Main Component ---
// export default function RegisterShop() {
//   const navigation = useNavigation();

//   const [shopName, setShopName] = useState("");
//   const [shopAddress, setShopAddress] = useState("");
//   const [contactNumber, setContactNumber] = useState("");
//   const [location, setLocation] = useState({ latitude: 6.9271, longitude: 79.8612 });
//   const [category, setCategory] = useState("");
//   const [isLoadingLocation, setIsLoadingLocation] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const categories = [
//     { label: "Salon", value: "salon" },
//     { label: "Restaurant", value: "restaurant" },
//     { label: "Grocery", value: "grocery" },
//     { label: "Electronics", value: "electronics" },
//     { label: "Clothing", value: "clothing" },
//   ];

//   const [businessHours, setBusinessHours] = useState(
//     daysOfWeek.reduce((acc, day) => {
//       const dayLower = day.toLowerCase();
//       acc[dayLower] = {
//         start: new Date(new Date().setHours(9, 0, 0, 0)),
//         end: new Date(new Date().setHours(18, 0, 0, 0)),
//       };
//       return acc;
//     }, {} as Record<string, { start: Date; end: Date }>)
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

//   const handleTimeChange = (day: string, type: "start" | "end", newTime: Date) => {
//     setBusinessHours({
//       ...businessHours,
//       [day]: { ...businessHours[day], [type]: newTime },
//     });
//   };

//   function generateShopId(name: string) {
//     const letters = name.replace(/\s+/g, "").substring(0, 2).toUpperCase();
//     const digits = Math.floor(1000 + Math.random() * 9000);
//     return letters + digits;
//   }

//   const handleRegisterShop = async () => {
//     if (!shopName || !shopAddress || !contactNumber || !category) {
//       Alert.alert("Error", "Please fill all fields and select a category");
//       return;
//     }
//     if (!auth.currentUser) {
//       Alert.alert("Error", "You must be logged in");
//       return;
//     }

//     setIsSubmitting(true);

//     try {
//       const q = query(collection(db, "shops"), where("ownerId", "==", auth.currentUser.uid));
//       const existing = await getDocs(q);
//       if (!existing.empty) {
//         setIsSubmitting(false);
//         Alert.alert("Already Registered", "You have already registered a shop.");
//         return;
//       }

//       const shopId = generateShopId(shopName);

//       const businessHoursForFirestore = Object.keys(businessHours).reduce((acc, day) => {
//         acc[day] = {
//           start: businessHours[day].start.toTimeString().substring(0, 5),
//           end: businessHours[day].end.toTimeString().substring(0, 5),
//         };
//         return acc;
//       }, {} as Record<string, { start: string; end: string }>);

//       const shopData = {
//         shopId,
//         name: shopName,
//         address: shopAddress,
//         contact: contactNumber,
//         category,
//         ownerId: auth.currentUser.uid,
//         location,
//         businessHours: businessHoursForFirestore,
//         createdAt: new Date(),
//       };

//       const docRef = await addDoc(collection(db, "shops"), shopData);
//       console.log("Shop added with ID:", docRef.id);

//       Alert.alert("Success", "Shop registered successfully!");
//       navigation.navigate("home" as never);
//     } catch (error: any) {
//       console.error("Error registering shop:", error);
//       Alert.alert("Error", error.message);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <ScrollView 
//       style={styles.container} 
//       contentContainerStyle={styles.contentContainer}
//       showsVerticalScrollIndicator={false}
//     >
//       <LinearGradient
//         colors={['#6a11cb', '#2575fc']}
//         style={styles.header}
//       >
//         <Text style={styles.title}>Register Your Shop</Text>
//         <Text style={styles.subtitle}>Fill in your shop details to get started</Text>
//       </LinearGradient>

//       <View style={styles.formContainer}>
//         {/* Shop Name */}
//         <View style={styles.inputContainer}>
//           <Ionicons name="business-outline" size={20} color="#666" style={styles.inputIcon} />
//           <TextInput
//             placeholder="Shop Name"
//             placeholderTextColor="#999"
//             value={shopName}
//             onChangeText={setShopName}
//             style={styles.input}
//           />
//         </View>

//         {/* Address */}
//         <View style={styles.inputContainer}>
//           <Ionicons name="location-outline" size={20} color="#666" style={styles.inputIcon} />
//           <TextInput
//             placeholder="Address"
//             placeholderTextColor="#999"
//             value={shopAddress}
//             onChangeText={setShopAddress}
//             style={[styles.input, { paddingRight: 50 }]}
//             multiline
//           />
//           <TouchableOpacity
//             style={styles.locationButton}
//             onPress={getCurrentLocation}
//             disabled={isLoadingLocation}
//           >
//             {isLoadingLocation ? (
//               <ActivityIndicator size="small" color="#4a6cff" />
//             ) : (
//               <Ionicons name="locate" size={20} color="#4a6cff" />
//             )}
//           </TouchableOpacity>
//         </View>

//         {/* Contact */}
//         <View style={styles.inputContainer}>
//           <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
//           <TextInput
//             placeholder="Contact Number"
//             placeholderTextColor="#999"
//             value={contactNumber}
//             onChangeText={setContactNumber}
//             style={styles.input}
//             keyboardType="phone-pad"
//           />
//         </View>

//         {/* Category */}
//         <Text style={styles.label}>Category</Text>
//         <CustomDropdown
//           items={categories}
//           selectedValue={category}
//           onValueChange={setCategory}
//           placeholder="Select Category"
//         />

//         {/* Map */}
//         <Text style={styles.label}>Location</Text>
//         <View style={styles.mapContainer}>
//           {Platform.OS !== "web" && MapView ? (
//             <MapView
//               style={styles.map}
//               initialRegion={{
//                 latitude: location.latitude,
//                 longitude: location.longitude,
//                 latitudeDelta: 0.01,
//                 longitudeDelta: 0.01,
//               }}
//               onPress={(e) => setLocation(e.nativeEvent.coordinate)}
//             >
//               <Marker coordinate={location} />
//             </MapView>
//           ) : (
//             <View style={[styles.map, styles.webMapPlaceholder]}>
//               <Ionicons name="map-outline" size={40} color="#999" />
//               <Text style={{ color: "#666", marginTop: 10 }}>Map unavailable on web</Text>
//             </View>
//           )}
//         </View>

//         {/* Business Hours */}
//         <Text style={styles.sectionTitle}>Business Hours</Text>
//         {daysOfWeek.map((day) => {
//           const dayLower = day.toLowerCase();
//           return (
//             <View key={day} style={styles.businessHoursRow}>
//               <Text style={styles.businessDay}>{day}</Text>
//               <CustomTimePicker
//                 label="Start"
//                 value={businessHours[dayLower].start}
//                 onChange={(time) => handleTimeChange(dayLower, "start", time)}
//               />
//               <CustomTimePicker
//                 label="End"
//                 value={businessHours[dayLower].end}
//                 onChange={(time) => handleTimeChange(dayLower, "end", time)}
//               />
//             </View>
//           );
//         })}

//         <TouchableOpacity
//           style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
//           onPress={handleRegisterShop}
//           disabled={isSubmitting}
//           activeOpacity={0.8}
//         >
//           <LinearGradient
//             colors={['#6a11cb', '#2575fc']}
//             style={styles.gradientButton}
//             start={{ x: 0, y: 0 }}
//             end={{ x: 1, y: 0 }}
//           >
//             {isSubmitting ? (
//               <ActivityIndicator size="small" color="#fff" />
//             ) : (
//               <Text style={styles.submitButtonText}>Register Shop</Text>
//             )}
//           </LinearGradient>
//         </TouchableOpacity>
//       </View>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { 
//     flex: 1, 
//     backgroundColor: "#f8f9fa" 
//   },
//   contentContainer: {
//     paddingBottom: 40
//   },
//   header: {
//     paddingVertical: 30,
//     paddingHorizontal: 20,
//     borderBottomLeftRadius: 20,
//     borderBottomRightRadius: 20,
//   },
//   title: { 
//     fontSize: 28, 
//     fontWeight: "bold", 
//     color: "white", 
//     marginBottom: 8 
//   },
//   subtitle: {
//     fontSize: 16,
//     color: "rgba(255, 255, 255, 0.8)"
//   },
//   formContainer: { 
//     flex: 1, 
//     padding: 20 
//   },
//   inputContainer: { 
//     flexDirection: "row", 
//     alignItems: "center", 
//     backgroundColor: "white",
//     borderRadius: 12,
//     paddingHorizontal: 15,
//     height: 56,
//     marginBottom: 16,
//     shadowColor: "#000",
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//     elevation: 3,
//   },
//   inputIcon: { 
//     marginRight: 12 
//   },
//   input: { 
//     flex: 1, 
//     fontSize: 16, 
//     color: "#333" 
//   },
//   locationButton: { 
//     padding: 8 
//   },
//   label: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#2d3748',
//     marginBottom: 8,
//     marginTop: 8
//   },
//   dropdownHeader: { 
//     flexDirection: "row", 
//     justifyContent: "space-between", 
//     alignItems: "center", 
//     backgroundColor: "white",
//     borderRadius: 12, 
//     padding: 16, 
//     marginBottom: 16,
//     shadowColor: "#000",
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//     elevation: 3,
//   },
//   dropdownHeaderText: { 
//     fontSize: 16, 
//     color: "#333" 
//   },
//   placeholderText: { 
//     color: "#999" 
//   },
//   dropdownList: {
//     backgroundColor: "white",
//     borderRadius: 12,
//     marginTop: -10,
//     marginBottom: 16,
//     paddingVertical: 8,
//     shadowColor: "#000",
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//     elevation: 3,
//     zIndex: 10,
//   },
//   dropdownItem: { 
//     padding: 16, 
//   },
//   dropdownItemSelected: { 
//     backgroundColor: "#f0f5ff" 
//   },
//   dropdownItemText: { 
//     color: "#333" 
//   },
//   dropdownItemTextSelected: { 
//     fontWeight: "bold", 
//     color: "#4a6cff" 
//   },
//   mapContainer: { 
//     height: 200, 
//     marginBottom: 20,
//     borderRadius: 12,
//     overflow: 'hidden',
//   },
//   map: { 
//     flex: 1 
//   },
//   webMapPlaceholder: { 
//     justifyContent: "center", 
//     alignItems: "center", 
//     backgroundColor: "#f0f0f0",
//     borderWidth: 1,
//     borderColor: '#e2e8f0',
//     borderStyle: 'dashed'
//   },
//   sectionTitle: { 
//     fontSize: 20, 
//     fontWeight: "bold", 
//     marginVertical: 16, 
//     color: "#2d3748" 
//   },
//   businessHoursRow: { 
//     flexDirection: "row", 
//     alignItems: "center", 
//     backgroundColor: "white",
//     borderRadius: 12,
//     padding: 12,
//     marginBottom: 12,
//     shadowColor: "#000",
//     shadowOffset: {
//       width: 0,
//       height: 1,
//     },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//     elevation: 2,
//   },
//   businessDay: { 
//     width: 100, 
//     fontSize: 14, 
//     fontWeight: '500',
//     color: "#333" 
//   },
//   timeLabel: { 
//     fontSize: 12, 
//     color: "#666",
//     marginBottom: 4
//   },
//   timeInput: { 
//     flex: 1, 
//     flexDirection: "row", 
//     justifyContent: "space-between", 
//     alignItems: "center", 
//     backgroundColor: '#f8f9fa',
//     borderRadius: 8, 
//     padding: 10, 
//     marginHorizontal: 5 
//   },
//   timeText: { 
//     color: "#333" 
//   },
//   submitButton: {
//     borderRadius: 12,
//     marginTop: 20,
//     overflow: 'hidden',
//     shadowColor: "#000",
//     shadowOffset: {
//       width: 0,
//       height: 3,
//     },
//     shadowOpacity: 0.27,
//     shadowRadius: 4.65,
//     elevation: 6,
//   },
//   submitButtonDisabled: {
//     opacity: 0.7
//   },
//   gradientButton: {
//     padding: 18,
//     alignItems: 'center',
//     justifyContent: 'center'
//   },
//   submitButtonText: { 
//     color: "#fff", 
//     fontSize: 16, 
//     fontWeight: "bold" 
//   },
// });
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
  Animated,
  Easing,
} from "react-native";
import { db, auth } from "../../firebase";
import { collection, addDoc, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";

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
type DropdownItem = { label: string; value: string };
interface CustomDropdownProps {
  items: DropdownItem[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  placeholder: string;
}
const CustomDropdown: React.FC<CustomDropdownProps> = ({
  items,
  selectedValue,
  onValueChange,
  placeholder,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const rotateAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: isOpen ? 1 : 0,
      duration: 200,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  }, [isOpen]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <View>
      <TouchableOpacity
        style={styles.dropdownHeader}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.dropdownHeaderText,
            !selectedValue && styles.placeholderText,
          ]}
        >
          {selectedValue
            ? items.find((i) => i.value === selectedValue)?.label
            : placeholder}
        </Text>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </Animated.View>
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.dropdownList}>
          {items.map((item: DropdownItem) => (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.dropdownItem,
                selectedValue === item.value && styles.dropdownItemSelected,
              ]}
              onPress={() => {
                onValueChange(item.value);
                setIsOpen(false);
              }}
              activeOpacity={0.7}
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
      )}
    </View>
  );
};

// --- Main Component ---
type BusinessHoursType = Record<string, { start: Date; end: Date }>;
interface LocationType {
  latitude: number;
  longitude: number;
}

export default function RegisterShop() {
  const navigation = useNavigation();

  const [shopId, setShopId] = useState<string | null>(null); // <--- added to track Firestore doc ID
  const [shopName, setShopName] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [location, setLocation] = useState<LocationType>({
    latitude: 6.9271,
    longitude: 79.8612,
  });
  const [category, setCategory] = useState("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories: DropdownItem[] = [
    { label: "Salon", value: "salon" },
    { label: "Restaurant", value: "restaurant" },
    { label: "Grocery", value: "grocery" },
    { label: "Electronics", value: "electronics" },
    { label: "Clothing", value: "clothing" },
  ];

  const [businessHours, setBusinessHours] = useState<BusinessHoursType>(
    daysOfWeek.reduce((acc, day) => {
      const dayLower = day.toLowerCase();
      acc[dayLower] = {
        start: new Date(new Date().setHours(9, 0, 0, 0)),
        end: new Date(new Date().setHours(18, 0, 0, 0)),
      };
      return acc;
    }, {} as BusinessHoursType)
  );

  // Single time picker state
  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<"start" | "end">("start");

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Allow location access to use this feature");
      }

      // --- Load existing shop data ---
      if (auth.currentUser) {
        try {
          const q = query(
            collection(db, "shops"),
            where("ownerId", "==", auth.currentUser.uid)
          );
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const docSnap = snapshot.docs[0];
            const data = docSnap.data();
            setShopId(docSnap.id); // store doc ID

            setShopName(data.name || "");
            setShopAddress(data.address || "");
            setContactNumber(data.contact || "");
            setCategory(data.category || "");
            setLocation(data.location || { latitude: 6.9271, longitude: 79.8612 });

            // Convert businessHours from strings to Date
            const loadedBusinessHours: BusinessHoursType = {};
            for (let day in data.businessHours) {
              const startParts = data.businessHours[day].start.split(":").map(Number);
              const endParts = data.businessHours[day].end.split(":").map(Number);
              loadedBusinessHours[day] = {
                start: new Date(new Date().setHours(startParts[0], startParts[1], 0, 0)),
                end: new Date(new Date().setHours(endParts[0], endParts[1], 0, 0)),
              };
            }
            setBusinessHours(loadedBusinessHours);
          }
        } catch (error) {
          console.error("Error loading shop:", error);
        }
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

  const handleTimePress = (dayKey: string, field: "start" | "end") => {
    setSelectedDayKey(dayKey);
    setEditingField(field);
    setIsTimePickerVisible(true);
  };

  const handleTimePicked = (_event: any, date?: Date) => {
    setIsTimePickerVisible(false);
    if (!date || !selectedDayKey) return;

    setBusinessHours((prev) => ({
      ...prev,
      [selectedDayKey]: {
        ...prev[selectedDayKey],
        [editingField]: date,
      },
    }));
  };

  function generateShopId(name: string) {
    const letters = name.replace(/\s+/g, "").substring(0, 2).toUpperCase();
    const digits = Math.floor(1000 + Math.random() * 9000);
    return letters + digits;
  }

  const handleSaveShop = async () => {
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
      const businessHoursForFirestore = Object.keys(businessHours).reduce(
        (acc, day) => {
          acc[day] = {
            start: businessHours[day].start.toTimeString().substring(0, 5),
            end: businessHours[day].end.toTimeString().substring(0, 5),
          };
          return acc;
        },
        {} as Record<string, { start: string; end: string }>
      );

      const shopData = {
        name: shopName,
        address: shopAddress,
        contact: contactNumber,
        category,
        location,
        businessHours: businessHoursForFirestore,
        updatedAt: new Date(),
      };

      if (shopId) {
        // Update existing shop
        const shopDocRef = doc(db, "shops", shopId);
        await updateDoc(shopDocRef, shopData);
        Alert.alert("Success", "Shop updated successfully!");
      } else {
        // Create new shop
        const newShopId = generateShopId(shopName);
        await addDoc(collection(db, "shops"), { ...shopData, shopId: newShopId, ownerId: auth.currentUser.uid, createdAt: new Date() });
        Alert.alert("Success", "Shop registered successfully!");
      }

      navigation.navigate("home" as never);
    } catch (error: any) {
      console.error("Error saving shop:", error);
      Alert.alert("Error", error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      
    >
      <LinearGradient colors={["#6a11cb", "#2575fc"]} style={styles.header}>
        <Text style={styles.title}>Register Your Shop</Text>
        <Text style={styles.subtitle}>Fill in your shop details to get started</Text>
      </LinearGradient>

      <View style={styles.formContainer}>
        {/* Shop Name */}
        <View style={styles.inputContainer}>
          <Ionicons
            name="business-outline"
            size={20}
            color="#666"
            style={styles.inputIcon}
          />
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
          <Ionicons
            name="location-outline"
            size={20}
            color="#666"
            style={styles.inputIcon}
          />
          <TextInput
            placeholder="Address"
            placeholderTextColor="#999"
            value={shopAddress}
            onChangeText={setShopAddress}
            style={[styles.input, { paddingRight: 50 }]}
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
        <Text style={styles.label}>Category</Text>
        <CustomDropdown
          items={categories}
          selectedValue={category}
          onValueChange={setCategory}
          placeholder="Select Category"
        />

        {/* Map */}
        <Text style={styles.label}>Location</Text>
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
              onPress={(e: { nativeEvent: { coordinate: LocationType } }) =>
                setLocation(e.nativeEvent.coordinate)
              }
            >
              <Marker coordinate={location} />
            </MapView>
          ) : (
            <View style={[styles.map, styles.webMapPlaceholder]}>
              <Ionicons name="map-outline" size={40} color="#999" />
              <Text style={{ color: "#666", marginTop: 10 }}>Map unavailable on web</Text>
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

              <TouchableOpacity
                style={styles.timeInput}
                onPress={() => handleTimePress(dayLower, "start")}
              >
                <Text style={styles.timeText}>
                  {businessHours[dayLower].start.toTimeString().substring(0, 5)}
                </Text>
                <Ionicons name="time-outline" size={20} color="#666" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.timeInput}
                onPress={() => handleTimePress(dayLower, "end")}
              >
                <Text style={styles.timeText}>
                  {businessHours[dayLower].end.toTimeString().substring(0, 5)}
                </Text>
                <Ionicons name="time-outline" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          );
        })}

        {isTimePickerVisible && selectedDayKey && (
          <DateTimePicker
            value={businessHours[selectedDayKey][editingField]}
            mode="time"
            is24Hour={true}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleTimePicked}
          />
        )}

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSaveShop}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#6a11cb", "#2575fc"]}
            style={styles.gradientButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>
                {shopId ? "Update Shop" : "Register Shop"}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  contentContainer: { paddingBottom: 40 ,paddingTop: 20},
  header: { paddingVertical: 40, paddingHorizontal: 20, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  title: { fontSize: 28, fontWeight: "bold", color: "white", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "rgba(255, 255, 255, 0.8)" },
  formContainer: { flex: 1, padding: 20 },
  inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "white", borderRadius: 12, paddingHorizontal: 15, height: 56, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: "#333" },
  locationButton: { padding: 8 },
  label: { fontSize: 16, fontWeight: "600", color: "#2d3748", marginBottom: 8, marginTop: 8 },
  dropdownHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "white", borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
  dropdownHeaderText: { fontSize: 16, color: "#333" },
  placeholderText: { color: "#999" },
  dropdownList: { backgroundColor: "white", borderRadius: 12, marginTop: -10, marginBottom: 16, paddingVertical: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3, zIndex: 10 },
  dropdownItem: { padding: 16 },
  dropdownItemSelected: { backgroundColor: "#f0f5ff" },
  dropdownItemText: { color: "#333" },
  dropdownItemTextSelected: { fontWeight: "bold", color: "#4a6cff" },
  mapContainer: { height: 200, marginBottom: 20, borderRadius: 12, overflow: "hidden" },
  map: { flex: 1 },
  webMapPlaceholder: { justifyContent: "center", alignItems: "center", backgroundColor: "#f0f0f0", borderWidth: 1, borderColor: "#e2e8f0", borderStyle: "dashed" },
  sectionTitle: { fontSize: 20, fontWeight: "bold", marginVertical: 16, color: "#2d3748" },
  businessHoursRow: { flexDirection: "row", alignItems: "center", backgroundColor: "white", borderRadius: 12, padding: 12, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  businessDay: { width: 100, fontSize: 14, fontWeight: "500", color: "#333" },
  timeInput: { flex: 1, flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f8f9fa", borderRadius: 8, padding: 10, marginHorizontal: 5 },
  timeText: { fontSize: 14, color: "#333" },
  submitButton: { marginTop: 20, borderRadius: 12, overflow: "hidden" },
  submitButtonDisabled: { opacity: 0.7 },
  gradientButton: { paddingVertical: 16, justifyContent: "center", alignItems: "center", borderRadius: 12 },
  submitButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
});
