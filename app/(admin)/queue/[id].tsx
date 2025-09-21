// import React, { useEffect, useState } from 'react';
// import {
//   View,
//   Text,
//   ActivityIndicator,
//   TouchableOpacity,
//   FlatList,
//   Alert,
//   StyleSheet,
//   ScrollView,
//   KeyboardAvoidingView,
//   Platform,
//   Linking,
//   TextInput,
// } from 'react-native';
// import { db, auth } from '../../../firebase';
// import {
//   collection,
//   addDoc,
//   getDocs,
//   query,
//   orderBy,
//   deleteDoc,
//   doc,
// } from 'firebase/firestore';
// import { useLocalSearchParams } from 'expo-router';
// import { Ionicons } from '@expo/vector-icons';
// import DateTimePicker from '@react-native-community/datetimepicker';

// export default function QueueDetails() {
//   const { id } = useLocalSearchParams();
//   const shopId = auth.currentUser?.uid;

//   const [customers, setCustomers] = useState<any[]>([]);
//   const [name, setName] = useState('');
//   const [phone, setPhone] = useState('');
//   const [purpose, setPurpose] = useState('');
//   const [startTime, setStartTime] = useState<Date | null>(null);
//   const [duration, setDuration] = useState<number | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isProcessing, setIsProcessing] = useState(false); // <-- Loader for buttons
//   const [showTimePicker, setShowTimePicker] = useState(false);

//   const fetchCustomers = async () => {
//     if (!shopId || !id) return;
//     try {
//       setIsLoading(true);
//       const q = query(
//         collection(db, `shops/${shopId}/queues/${id}/customers`),
//         orderBy('appointmentTimestamp', 'asc')
//       );
//       const snapshot = await getDocs(q);
//       setCustomers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
//     } catch (err) {
//       console.error(err);
//       Alert.alert('Error', 'Failed to fetch customers');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchCustomers();
//   }, [id]);

//   const addCustomer = async () => {
//     if (!shopId || !id) return;
//     if (!name || !phone || !purpose || !startTime || !duration) {
//       return Alert.alert('Error', 'Please fill all fields');
//     }

//     const newStart = startTime.getTime();
//     const newEnd = newStart + duration * 60000;

//     // Overlap check
//     for (let c of customers) {
//       const existingStart = c.appointmentTimestamp;
//       const existingEnd = existingStart + (c.duration || 30) * 60000;
//       const overlap =
//         (newStart >= existingStart && newStart < existingEnd) ||
//         (newEnd > existingStart && newEnd <= existingEnd);
//       if (overlap) {
//         return Alert.alert(
//           'Time Conflict',
//           `Overlaps with ${c.customerName}'s appointment at ${formatTime(
//             new Date(existingStart)
//           )}`
//         );
//       }
//     }

//     try {
//       setIsProcessing(true);
//       await addDoc(
//         collection(db, `shops/${shopId}/queues/${id}/customers`),
//         {
//           customerName: name,
//           phoneNumber: phone,
//           appointmentTimestamp: newStart,
//           duration,
//           purpose,
//           createdAt: new Date().getTime(),
//           date: new Date().toISOString().split('T')[0],
//           status: 'waiting',
//         }
//       );
//       setName('');
//       setPhone('');
//       setPurpose('');
//       setStartTime(null);
//       setDuration(null);
//       fetchCustomers();
//       Alert.alert('Success', 'Customer added');
//     } catch (err) {
//       console.error(err);
//       Alert.alert('Error', 'Failed to add customer');
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   const deleteCustomer = async (cid: string) => {
//     if (!shopId || !id) return;
//     try {
//       setIsProcessing(true);
//       await deleteDoc(
//         doc(db, `shops/${shopId}/queues/${id}/customers/${cid}`)
//       );
//       fetchCustomers();
//     } catch (err) {
//       console.error(err);
//       Alert.alert('Error', 'Failed to delete appointment');
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   const formatTime = (d: Date) => {
//     const h = d.getHours();
//     const m = d.getMinutes().toString().padStart(2, '0');
//     const suffix = h >= 12 ? 'PM' : 'AM';
//     const hh = h % 12 || 12;
//     return `${hh}:${m} ${suffix}`;
//   };

//   const handleCall = (number: string) => {
//     if (!number) return Alert.alert('Error', 'No phone number available');
//     setIsProcessing(true);
//     Linking.openURL(`tel:${number}`).finally(() => setIsProcessing(false));
//   };

//   return (
//     <KeyboardAvoidingView
//       style={styles.container}
//       behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//     >
//       <ScrollView
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={{ paddingTop: 20 }}
//       >
        
//         {/* --- Form --- */}
//         <View style={styles.formCard}>
//           <Text style={styles.formTitle}>Add New Appointment</Text>

//           <TextInputField
//             icon="person-outline"
//             placeholder="Customer Name"
//             value={name}
//             onChangeText={setName}
//           />
//           <TextInputField
//             icon="call-outline"
//             placeholder="Phone Number"
//             keyboardType="phone-pad"
//             value={phone}
//             onChangeText={setPhone}
//           />
//           <TouchableOpacity
//             style={styles.timeButton}
//             onPress={() => setShowTimePicker(true)}
//           >
//             <Ionicons name="time-outline" size={20} color="#666" />
//             <Text style={styles.timeText}>
//               {startTime ? formatTime(startTime) : 'Select Start Time'}
//             </Text>
//           </TouchableOpacity>
//           {showTimePicker && (
//             <DateTimePicker
//               value={startTime || new Date()}
//               mode="time"
//               is24Hour={true}
//               onChange={(e, date) => {
//                 setShowTimePicker(false);
//                 if (date) setStartTime(date);
//               }}
//             />
//           )}

//           <TextInputField
//             icon="hourglass-outline"
//             placeholder="Duration (minutes)"
//             keyboardType="numeric"
//             value={duration ? duration.toString() : ''}
//             onChangeText={t => setDuration(parseInt(t, 10) || null)}
//           />
//           <TextInputField
//             icon="document-text-outline"
//             placeholder="Purpose"
//             value={purpose}
//             onChangeText={setPurpose}
//           />

//           <TouchableOpacity
//             style={styles.addButton}
//             onPress={addCustomer}
//             disabled={isProcessing}
//           >
//             {isProcessing ? (
//               <ActivityIndicator color="white" />
//             ) : (
//               <>
//                 <Ionicons name="add-circle" size={22} color="white" />
//                 <Text style={styles.addButtonText}>Add Customer</Text>
//               </>
//             )}
//           </TouchableOpacity>
//         </View>

//         {/* --- List --- */}
//         <View style={styles.listCard}>
//           <Text style={styles.listTitle}>Scheduled Appointments</Text>
//           {isLoading ? (
//             <ActivityIndicator style={{ marginTop: 20 }} color="#4a6cff" />
//           ) : (
//             <FlatList
//               data={customers}
//               keyExtractor={item => item.id}
//               scrollEnabled={false}
//               renderItem={({ item }) => {
//                 const start = new Date(item.appointmentTimestamp);
//                 const end = new Date(
//                   item.appointmentTimestamp + item.duration * 60000
//                 );
//                 return (
//                   <View style={styles.customerRow}>
//                     <View style={{ flex: 1 }}>
//                       <Text style={styles.customerName}>{item.customerName}</Text>
//                       <Text style={styles.customerInfo}>
//                         {formatTime(start)} – {formatTime(end)} ({item.duration}m)
//                       </Text>
//                       <Text style={styles.customerInfo}>{item.phoneNumber}</Text>
//                       <Text style={styles.customerInfo}>{item.purpose}</Text>
//                     </View>

//                     <View style={{ flexDirection: 'row', alignItems: 'center' }}>
//                       {/* Call Button */}
//                       <TouchableOpacity
//                         onPress={() => handleCall(item.phoneNumber)}
//                         style={styles.callButton}
//                         disabled={isProcessing}
//                       >
//                         {isProcessing ? (
//                           <ActivityIndicator color="#4a6cff" />
//                         ) : (
//                           <Ionicons name="call-outline" size={22} color="#4a6cff" />
//                         )}
//                       </TouchableOpacity>

//                       {/* Delete Button */}
//                       <TouchableOpacity
//                         onPress={() =>
//                           Alert.alert('Delete', 'Remove this appointment?', [
//                             { text: 'Cancel', style: 'cancel' },
//                             {
//                               text: 'Delete',
//                               style: 'destructive',
//                               onPress: () => deleteCustomer(item.id),
//                             },
//                           ])
//                         }
//                         disabled={isProcessing}
//                       >
//                         <Ionicons name="trash" size={22} color="red" />
//                       </TouchableOpacity>
//                     </View>
//                   </View>
//                 );
//               }}
//               ListEmptyComponent={
//                 <Text style={styles.emptyText}>No appointments</Text>
//               }
//             />
//           )}
//         </View>
//       </ScrollView>
//     </KeyboardAvoidingView>
//   );
// }

// /* ---------- Small helper component ---------- */
// const TextInputField = ({ icon, ...props }) => (
//   <View style={styles.inputContainer}>
//     <Ionicons name={icon} size={20} color="#666" style={{ marginRight: 10 }} />
//     <TextInput style={styles.input} placeholderTextColor="#999" {...props} />
//   </View>
// );

// /* ---------- Styles ---------- */
// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#f8f9fa', padding: 20 },
//   formCard: {
//     backgroundColor: 'white',
//     borderRadius: 16,
//     padding: 20,
//     marginBottom: 25,
//   },
//   formTitle: { fontSize: 18, fontWeight: '600', marginBottom: 20 },
//   inputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#f1f1f1',
//     borderRadius: 12,
//     marginBottom: 15,
//     paddingHorizontal: 15,
//   },
//   input: { flex: 1, height: 48, color: '#333', fontSize: 16 },
//   timeButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#f1f1f1',
//     borderRadius: 12,
//     padding: 15,
//     marginBottom: 15,
//   },
//   timeText: { marginLeft: 10, color: '#333', fontSize: 16 },
//   addButton: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#4a6cff',
//     padding: 16,
//     borderRadius: 12,
//     marginTop: 10,
//   },
//   addButtonText: { color: 'white', fontWeight: '600', fontSize: 16, marginLeft: 8 },
//   listCard: {
//     backgroundColor: 'white',
//     borderRadius: 16,
//     padding: 20,
//     marginBottom: 30,
//   },
//   listTitle: { fontSize: 18, fontWeight: '600', marginBottom: 15 },
//   customerRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     borderBottomWidth: StyleSheet.hairlineWidth,
//     borderColor: '#ddd',
//     paddingVertical: 12,
//   },
//   customerName: { fontSize: 16, fontWeight: '600' },
//   customerInfo: { color: '#555', fontSize: 14 },
//   emptyText: { textAlign: 'center', color: '#666', marginTop: 20 },
//   callButton: { marginRight: 15 },
// });
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Linking,
  TextInput,
  TextInputProps,
} from 'react-native';
import { db, auth } from '../../../firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function QueueDetails() {
  const { id } = useLocalSearchParams();
  const shopId = auth.currentUser?.uid;

  const [customers, setCustomers] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [purpose, setPurpose] = useState('');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // <-- Loader for buttons
  const [showTimePicker, setShowTimePicker] = useState(false);

  const fetchCustomers = async () => {
    if (!shopId || !id) return;
    try {
      setIsLoading(true);
      const q = query(
        collection(db, `shops/${shopId}/queues/${id}/customers`),
        orderBy('appointmentTimestamp', 'asc')
      );
      const snapshot = await getDocs(q);
      setCustomers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to fetch customers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [id]);

  const addCustomer = async () => {
    if (!shopId || !id) return;
    if (!name || !phone || !purpose || !startTime || !duration) {
      return Alert.alert('Error', 'Please fill all fields');
    }

    const newStart = startTime.getTime();
    const newEnd = newStart + duration * 60000;

    // Overlap check
    for (let c of customers) {
      const existingStart = c.appointmentTimestamp;
      const existingEnd = existingStart + (c.duration || 30) * 60000;
      const overlap =
        (newStart >= existingStart && newStart < existingEnd) ||
        (newEnd > existingStart && newEnd <= existingEnd);
      if (overlap) {
        return Alert.alert(
          'Time Conflict',
          `Overlaps with ${c.customerName}'s appointment at ${formatTime(
            new Date(existingStart)
          )}`
        );
      }
    }

    try {
      setIsProcessing(true);
      await addDoc(
        collection(db, `shops/${shopId}/queues/${id}/customers`),
        {
          customerName: name,
          phoneNumber: phone,
          appointmentTimestamp: newStart,
          duration,
          purpose,
          createdAt: new Date().getTime(),
          date: new Date().toISOString().split('T')[0],
          status: 'waiting',
        }
      );
      setName('');
      setPhone('');
      setPurpose('');
      setStartTime(null);
      setDuration(null);
      fetchCustomers();
      Alert.alert('Success', 'Customer added');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to add customer');
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteCustomer = async (cid: string) => {
    if (!shopId || !id) return;
    try {
      setIsProcessing(true);
      await deleteDoc(
        doc(db, `shops/${shopId}/queues/${id}/customers/${cid}`)
      );
      fetchCustomers();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to delete appointment');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (d: Date) => {
    const h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, '0');
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hh = h % 12 || 12;
    return `${hh}:${m} ${suffix}`;
  };

  const handleCall = (number: string) => {
    if (!number) return Alert.alert('Error', 'No phone number available');
    setIsProcessing(true);
    Linking.openURL(`tel:${number}`).finally(() => setIsProcessing(false));
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 20 }}
      >
        
        {/* --- Form --- */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Add New Appointment</Text>

          <TextInputField
            icon="person-outline"
            placeholder="Customer Name"
            value={name}
            onChangeText={setName}
          />
          <TextInputField
            icon="call-outline"
            placeholder="Phone Number"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Ionicons name="time-outline" size={20} color="#666" />
            <Text style={styles.timeText}>
              {startTime ? formatTime(startTime) : 'Select Start Time'}
            </Text>
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              value={startTime || new Date()}
              mode="time"
              is24Hour={true}
              onChange={(e, date) => {
                setShowTimePicker(false);
                if (date) setStartTime(date);
              }}
            />
          )}

          <TextInputField
            icon="hourglass-outline"
            placeholder="Duration (minutes)"
            keyboardType="numeric"
            value={duration ? duration.toString() : ''}
            onChangeText={(t: string) => setDuration(parseInt(t, 10) || null)}
          />
          <TextInputField
            icon="document-text-outline"
            placeholder="Purpose"
            value={purpose}
            onChangeText={setPurpose}
          />

          <TouchableOpacity
            style={styles.addButton}
            onPress={addCustomer}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="add-circle" size={22} color="white" />
                <Text style={styles.addButtonText}>Add Customer</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* --- List --- */}
        <View style={styles.listCard}>
          <Text style={styles.listTitle}>Scheduled Appointments</Text>
          {isLoading ? (
            <ActivityIndicator style={{ marginTop: 20 }} color="#4a6cff" />
          ) : (
            <FlatList
              data={customers}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => {
                const start = new Date(item.appointmentTimestamp);
                const end = new Date(
                  item.appointmentTimestamp + item.duration * 60000
                );
                return (
                  <View style={styles.customerRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.customerName}>{item.customerName}</Text>
                      <Text style={styles.customerInfo}>
                        {formatTime(start)} – {formatTime(end)} ({item.duration}m)
                      </Text>
                      <Text style={styles.customerInfo}>{item.phoneNumber}</Text>
                      <Text style={styles.customerInfo}>{item.purpose}</Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {/* Call Button */}
                      <TouchableOpacity
                        onPress={() => handleCall(item.phoneNumber)}
                        style={styles.callButton}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <ActivityIndicator color="#4a6cff" />
                        ) : (
                          <Ionicons name="call-outline" size={22} color="#4a6cff" />
                        )}
                      </TouchableOpacity>

                      {/* Delete Button */}
                      <TouchableOpacity
                        onPress={() =>
                          Alert.alert('Delete', 'Remove this appointment?', [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Delete',
                              style: 'destructive',
                              onPress: () => deleteCustomer(item.id),
                            },
                          ])
                        }
                        disabled={isProcessing}
                      >
                        <Ionicons name="trash" size={22} color="red" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No appointments</Text>
              }
            />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ---------- Small helper component ---------- */
const TextInputField = ({
  icon,
  ...props
}: { icon: string } & TextInputProps) => (
  <View style={styles.inputContainer}>
    <Ionicons name={icon as any} size={20} color="#666" style={{ marginRight: 10 }} />
    <TextInput style={styles.input} placeholderTextColor="#999" {...props} />
  </View>
);

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 20 },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
  },
  formTitle: { fontSize: 18, fontWeight: '600', marginBottom: 20 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f1f1',
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  input: { flex: 1, height: 48, color: '#333', fontSize: 16 },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f1f1',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  timeText: { marginLeft: 10, color: '#333', fontSize: 16 },
  addButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4a6cff',
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
  },
  addButtonText: { color: 'white', fontWeight: '600', fontSize: 16, marginLeft: 8 },
  listCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
  },
  listTitle: { fontSize: 18, fontWeight: '600', marginBottom: 15 },
  customerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    paddingVertical: 12,
  },
  customerName: { fontSize: 16, fontWeight: '600' },
  customerInfo: { color: '#555', fontSize: 14 },
  emptyText: { textAlign: 'center', color: '#666', marginTop: 20 },
  callButton: { marginRight: 15 },
});
