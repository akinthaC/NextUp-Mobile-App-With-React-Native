// import React, { useState, useEffect, useRef } from 'react';
// import {
//   View, Text, ScrollView, TouchableOpacity,
//   Alert, ActivityIndicator, Modal, TextInput,
//   StyleSheet, Platform, StatusBar, RefreshControl
// } from 'react-native';
// import { Camera, CameraView } from 'expo-camera';
// import * as Notifications from 'expo-notifications';
// import { QrCode, Smartphone, User, X } from 'lucide-react-native';
// import { db, auth } from '../../firebase';
// import {
//   collection, addDoc, doc, getDocs, query,
//   orderBy, getDoc, where
// } from 'firebase/firestore';

// interface QueueItem {
//   id: string;
//   queueId: string;
//   shopName: string;
//   position: number;
//   waitTime: number;
//   totalCustomers: number;
//   customer: any;
// }

// export default function CustomerView() {
//   const [scanning, setScanning] = useState(false);
//   const [hasPermission, setHasPermission] = useState(false);
//   const [currentQueues, setCurrentQueues] = useState<QueueItem[]>([]);
//   const [loading, setLoading] = useState(false);

//   const [manualModal, setManualModal] = useState(false);
//   const [manualId, setManualId] = useState('');

//   const [customerModal, setCustomerModal] = useState(false);
//   const [shopForModal, setShopForModal] = useState<{ shopId: string; shopName: string } | null>(null);
//   const [custName, setCustName] = useState('');
//   const [custPhone, setCustPhone] = useState('');
//   const [custPurpose, setCustPurpose] = useState('');
//   const [shopId1, setShopId] = useState('');

//     const [refreshing, setRefreshing] = useState(false); // for pull-to-refresh
//   // Remember last positions to trigger notifications if user moves up
//   const lastPositions = useRef<Record<string, number>>({});

//   // ===== Camera permission
//   useEffect(() => {
//     (async () => {
//       const { status } = await Camera.requestCameraPermissionsAsync();
//       setHasPermission(status === 'granted');
//       if (status !== 'granted') Alert.alert('Camera permission is required');
//     })();
//   }, []);

  

//   // ===== Notifications permission
//   useEffect(() => {
//     (async () => {
//       await Notifications.requestPermissionsAsync();
//       await Notifications.setNotificationHandler({
//         handleNotification: async () => ({
//           shouldShowAlert: true,
//           shouldPlaySound: false,
//           shouldSetBadge: false,
//           shouldShowBanner: true,
//           shouldShowList: true,
//         }),
//       });
//     })();
//   }, []);

//   const onRefresh = async () => {
//     setRefreshing(true);
//     await fetchQueues();
//     setRefreshing(false);
//   };

//   // ===== Fetch today's queues
//   const fetchQueues = async () => {
//     setLoading(true);
//     try {
//       const today = new Date();
//       today.setHours(0, 0, 0, 0);
//       const shopsSnap = await getDocs(collection(db, 'shops'));
//       const queues: QueueItem[] = [];

//       for (const shopDoc of shopsSnap.docs) {
//         const ownerId = shopDoc.data().ownerId;
//         setShopId(ownerId);

//         const queuesSnap = await getDocs(
//           query(collection(db, `shops/${ownerId}/queues`), orderBy('date', 'asc'))
//         );

//         for (const qDoc of queuesSnap.docs) {
//           const queueData = qDoc.data();
//           if (!queueData.date) continue;

//           let queueDate: Date;
//           if (queueData.date?.toDate) queueDate = queueData.date.toDate();
//           else queueDate = new Date(queueData.date);

//           if (
//             queueDate.getFullYear() !== today.getFullYear() ||
//             queueDate.getMonth() !== today.getMonth() ||
//             queueDate.getDate() !== today.getDate()
//           ) continue;

//           const customersSnap = await getDocs(
//             collection(db, `shops/${ownerId}/queues/${qDoc.id}/customers`)
//           );

//           const customers = customersSnap.docs
//             .map(doc => ({ id: doc.id, ...doc.data() }))
//             .sort((a, b) => (a.appointmentTimestamp || 0) - (b.appointmentTimestamp || 0));

//           customers.forEach((c, index) => {
//             if (c.userId === auth.currentUser?.uid) {
//               const position = index + 1;
//               const waitTime = customers
//                 .slice(0, index)
//                 .reduce((sum, cust) => sum + (cust.duration || 20), 0);

//               queues.push({
//                 id: c.id,
//                 queueId: qDoc.id,
//                 shopName: shopDoc.data().name,
//                 position,
//                 waitTime,
//                 totalCustomers: customers.length,
//                 customer: c,
//               });

//               // ---- Notification: if moved up
//               const prev = lastPositions.current[c.id];
//               if (prev && position < prev) {
//                 Notifications.scheduleNotificationAsync({
//                   content: {
//                     title: `Queue Update: ${shopDoc.data().name}`,
//                     body: `You're now #${position} in line.`,
//                   },
//                   trigger: null,
//                 });
//               }
//               lastPositions.current[c.id] = position;
//             }
//           });
//         }
//       }
//       setCurrentQueues(queues.slice(0, 4));
//     } catch (err) {
//       console.error(err);
//       Alert.alert('Error', 'Failed to fetch queues.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Initial & auto refresh
//   useEffect(() => {
//     fetchQueues();
//     const interval = setInterval(fetchQueues, 30000); // every 30 sec
//     return () => clearInterval(interval);
//   }, []);

//   // ===== QR Scan
//   const handleBarCodeScanned = ({ data }: { data: string }) => {
//     setScanning(false);
//     try {
//       const parsed = JSON.parse(data);
//       setShopId(parsed.ownerId);
//       setShopForModal({ shopId: parsed.id, shopName: parsed.name });
//       setCustomerModal(true);
//     } catch {
//       Alert.alert('Error', 'Invalid QR code.');
//     }
//   };

//   // ===== Manual join
//   const joinById = async (enteredId: string) => {
//     if (!enteredId.trim()) return;

//     try {
//       // Look up a shop by its custom/public ID (not the Firestore doc ID)
//       const q = query(collection(db, 'shops'), where('shopId', '==', enteredId.trim()));
//       const snap = await getDocs(q);

//       if (snap.empty) {
//         Alert.alert('Not Found', `No shop found with ID: ${enteredId}`);
//         return;
//       }

//       // Assume first match is the correct shop
//       const shopDoc = snap.docs[0];
//       const shopData = shopDoc.data();

//       setShopId(shopData.ownerId);
//       // Save info for the modal and open the customer form
//       setShopForModal({ shopId: shopDoc.id, shopName: shopData.name || '' });
//       setManualModal(false);
//       setCustomerModal(true);

//     } catch (err) {
//       console.error('Join by ID error:', err);
//       Alert.alert('Error', 'Failed to find shop. Please try again.');
//     }
//   };

//   // ===== Confirm join
//   const confirmJoinQueue = async () => {
//     if (!custName || !custPhone || !custPurpose || !shopForModal) {
//       return Alert.alert('Error', 'Please fill all fields');
//     }
//     if (currentQueues.length >= 4) {
//       return Alert.alert('Limit reached', 'You can join up to 4 queues at the same time');
//     }
//     try {
//       const queuesRef = collection(db, `shops/${shopId1}/queues`);
//       const queuesSnap = await getDocs(queuesRef);

//       const today = new Date();
//       today.setHours(0, 0, 0, 0);
//       let queueDoc = queuesSnap.docs.find(doc => {
//         const qDate = doc.data().date?.toDate ? doc.data().date.toDate() : new Date(doc.data().date);
//         return qDate.toDateString() === today.toDateString();
//       });

//       let queueId = '';
//       let nextTimestamp = Date.now();
//       if (queueDoc) {
//         queueId = queueDoc.id;
//         const customersSnap = await getDocs(
//           collection(db, `shops/${shopId1}/queues/${queueId}/customers`)
//         );
//         const lastCustomer = customersSnap.docs[customersSnap.docs.length - 1];
//         if (lastCustomer) nextTimestamp =
//           (lastCustomer.data().appointmentTimestamp || Date.now()) + 20 * 60000;
//       } else {
//         const newQueueRef = await addDoc(queuesRef, { date: new Date(), createdAt: Date.now() });
//         queueId = newQueueRef.id;
//       }

//       await addDoc(collection(db, `shops/${shopId1}/queues/${queueId}/customers`), {
//         customerName: custName,
//         phoneNumber: custPhone,
//         purpose: custPurpose,
//         status: 'waiting',
//         duration: 20,
//         appointmentTimestamp: nextTimestamp,
//         date: new Date(),
//         createdAt: Date.now(),
//         userId: auth.currentUser?.uid,
//       });

//       Alert.alert('Success', `You joined the queue for ${shopForModal.shopName}`);
//       setCustomerModal(false);
//       setCustName(''); setCustPhone(''); setCustPurpose('');
//       setShopForModal(null);
//       fetchQueues();
//     } catch (err) {
//       console.error(err);
//       Alert.alert('Error', 'Failed to join queue.');
//     }
//   };

//   // ====== Camera Scanner UI
//   if (scanning) {
//     if (!hasPermission) return <Text style={styles.errorText}>No camera permission</Text>;
//     return (
//       <View style={styles.cameraContainer}>
//         <CameraView
//           style={StyleSheet.absoluteFill}
//           onBarcodeScanned={handleBarCodeScanned}
//           barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
//         >
//           <View style={styles.cameraOverlay}>
//             <View style={styles.cameraFrame} />
//             <Text style={styles.cameraText}>Align QR code within the frame</Text>
//             <TouchableOpacity
//               onPress={() => setScanning(false)}
//               style={styles.cancelButton}
//             >
//               <Text style={styles.cancelButtonText}>Cancel</Text>
//             </TouchableOpacity>
//           </View>
//         </CameraView>
//       </View>
//     );
//   }

//   // ====== Main UI
//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor="#2C6BED" />
      
//       {/* Header */}
//       <View style={styles.header}>
//         <View style={styles.headerTop}>
//           <View>
//             <Text style={styles.appName}>NextUp</Text>
//             <Text style={styles.appTagline}>Your turn is almost here</Text>
//           </View>
//           <TouchableOpacity style={styles.userButton}>
//             <User color="white" size={24} />
//           </TouchableOpacity>
//         </View>

//         <View style={styles.scanButtons}>
//           <TouchableOpacity
//             style={styles.scanButton}
//             onPress={() => setScanning(true)}
//           >
//             <QrCode color="#2C6BED" size={32} />
//             <Text style={styles.scanButtonText}>Scan QR</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.scanButton}
//             onPress={() => setManualModal(true)}
//           >
//             <Smartphone color="#2C6BED" size={32} />
//             <Text style={styles.scanButtonText}>Enter ID</Text>
//           </TouchableOpacity>
//         </View>
//       </View>

//       {/* Queue List */}
//       <ScrollView
//           style={styles.queueList}
//           refreshControl={
//             <RefreshControl
//               refreshing={refreshing}
//               onRefresh={onRefresh}
//               colors={['#2C6BED']}
//               tintColor="#2C6BED"
//             />
//           }
//         >
//         <Text style={styles.sectionTitle}>Your Queues</Text>
        
        
//         {loading ? (
//           <ActivityIndicator size="large" color="#2C6BED" style={styles.loader} />
//         ) : currentQueues.length === 0 ? (
//           <View style={styles.emptyState}>
//             <Text style={styles.emptyStateText}>No queues for today</Text>
//             <Text style={styles.emptyStateSubtext}>Scan a QR code or enter a shop ID to join a queue</Text>
//           </View>
//         ) : (
//           currentQueues.map(q => {
//             const progress = Math.min(q.position / q.totalCustomers, 1);
//             const avgWait = q.totalCustomers
//               ? Math.round(
//                   currentQueues.reduce((acc, item) => acc + item.waitTime, 0) /
//                   currentQueues.length
//                 )
//               : 0;
//             return (
//               <View
//                 key={q.id}
//                 style={styles.queueCard}
//               >
//                 <View style={styles.queueHeader}>
//                   <Text style={styles.customerName}>{q.customer.customerName}</Text>
//                   <Text style={styles.shopName}>{q.shopName}</Text>
//                 </View>
                
//                 <View style={styles.queueDetails}>
//                   <View style={styles.detailItem}>
//                     <Text style={styles.detailLabel}>Position</Text>
//                     <Text style={styles.detailValue}>#{q.position} of {q.totalCustomers}</Text>
//                   </View>
                  
//                   <View style={styles.detailItem}>
//                     <Text style={styles.detailLabel}>Est. Wait</Text>
//                     <Text style={styles.detailValue}>{q.waitTime} min</Text>
//                   </View>
                  
//                   <View style={styles.detailItem}>
//                     <Text style={styles.detailLabel}>Avg. Wait</Text>
//                     <Text style={styles.detailValue}>{avgWait} min</Text>
//                   </View>
//                 </View>
                
//                 <Text style={styles.joinTime}>
//                   Joined: {new Date(q.customer.createdAt).toLocaleTimeString()}
//                 </Text>

//                 <View style={styles.progressContainer}>
//                   <View style={styles.progressBar}>
//                     <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
//                   </View>
//                   <Text style={styles.progressText}>
//                     {Math.round(progress * 100)}% 
//                   </Text>
//                 </View>
//               </View>
//             );
//           })
//         )}
//       </ScrollView>

//       {/* Join New Queue Button */}
//       <TouchableOpacity
//         onPress={() => {
//           if (currentQueues.length >= 4) {
//             Alert.alert('Limit reached', 'You can join up to 4 queues at the same time');
//             return;
//           }
//           setManualModal(true);
//         }}
//         style={styles.joinButton}
//       >
//         <Text style={styles.joinButtonText}>Join New Queue</Text>
//       </TouchableOpacity>

//       {/* ---- Manual ID Modal ---- */}
//       <Modal visible={manualModal} transparent animationType="fade">
//         <View style={styles.modalContainer}>
//           <View style={styles.modalContent}>
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalTitle}>Enter Shop ID</Text>
//               <TouchableOpacity onPress={() => setManualModal(false)} style={styles.closeButton}>
//                 <X size={24} color="#666" />
//               </TouchableOpacity>
//             </View>
            
//             <TextInput
//               placeholder="Shop ID"
//               placeholderTextColor="#999"
//               value={manualId}
//               onChangeText={setManualId}
//               style={styles.input}
//             />
            
//             <View style={styles.modalActions}>
//               <TouchableOpacity
//                 onPress={() => joinById(manualId)}
//                 style={[styles.modalButton, styles.primaryButton]}
//               >
//                 <Text style={styles.primaryButtonText}>Next</Text>
//               </TouchableOpacity>
              
//               <TouchableOpacity 
//                 onPress={() => setManualModal(false)} 
//                 style={[styles.modalButton, styles.secondaryButton]}
//               >
//                 <Text style={styles.secondaryButtonText}>Cancel</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>

//       {/* ---- Customer Info Modal ---- */}
//       <Modal visible={customerModal} transparent animationType="fade">
//         <View style={styles.modalContainer}>
//           <View style={styles.modalContent}>
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalTitle}>
//                 Join Queue at {shopForModal?.shopName}
//               </Text>
//               <TouchableOpacity onPress={() => setCustomerModal(false)} style={styles.closeButton}>
//                 <X size={24} color="#666" />
//               </TouchableOpacity>
//             </View>
            
//             <TextInput
//               placeholder="Name"
//               placeholderTextColor="#999"
//               value={custName}
//               onChangeText={setCustName}
//               style={styles.input}
//             />
            
//             <TextInput
//               placeholder="Phone"
//               placeholderTextColor="#999"
//               value={custPhone}
//               onChangeText={setCustPhone}
//               keyboardType="phone-pad"
//               style={styles.input}
//             />
            
//             <TextInput
//               placeholder="Purpose"
//               placeholderTextColor="#999"
//               value={custPurpose}
//               onChangeText={setCustPurpose}
//               style={styles.input}
//             />

//             <View style={styles.modalActions}>
//               <TouchableOpacity
//                 onPress={confirmJoinQueue}
//                 style={[styles.modalButton, styles.primaryButton]}
//               >
//                 <Text style={styles.primaryButtonText}>Join Queue</Text>
//               </TouchableOpacity>
              
//               <TouchableOpacity 
//                 onPress={() => setCustomerModal(false)} 
//                 style={[styles.modalButton, styles.secondaryButton]}
//               >
//                 <Text style={styles.secondaryButtonText}>Cancel</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8f9fa',
//   },
//   header: {
//     backgroundColor: '#2C6BED',
//     paddingTop: Platform.OS === 'ios' ? 50 : 20,
//     paddingBottom: 20,
//     paddingHorizontal: 16,
//   },
//   headerTop: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   appName: {
//     color: 'white',
//     fontSize: 28,
//     fontWeight: 'bold',
//   },
//   appTagline: {
//     color: '#cce0ff',
//     marginTop: 4,
//     fontSize: 14,
//   },
//   userButton: {
//     backgroundColor: 'rgba(255,255,255,0.2)',
//     padding: 10,
//     borderRadius: 50,
//   },
//   scanButtons: {
//     flexDirection: 'row',
//     marginTop: 8,
//   },
//   scanButton: {
//     flex: 1,
//     backgroundColor: 'white',
//     marginHorizontal: 8,
//     padding: 16,
//     borderRadius: 16,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   scanButtonText: {
//     color: '#2C6BED',
//     marginTop: 8,
//     fontWeight: '600',
//     fontSize: 14,
//   },
//   queueList: {
//     flex: 1,
//     padding: 16,
//   },
//   sectionTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     marginBottom: 16,
//     color: '#333',
//   },
//   loader: {
//     marginTop: 40,
//   },
//   emptyState: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 40,
//   },
//   emptyStateText: {
//     fontSize: 18,
//     color: '#666',
//     marginBottom: 8,
//   },
//   emptyStateSubtext: {
//     fontSize: 14,
//     color: '#999',
//     textAlign: 'center',
//   },
//   queueCard: {
//     backgroundColor: '#fff',
//     padding: 20,
//     borderRadius: 16,
//     marginBottom: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   queueHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   customerName: {
//     fontWeight: 'bold',
//     fontSize: 18,
//     color: '#333',
//   },
//   shopName: {
//     color: '#2C6BED',
//     fontSize: 14,
//     fontWeight: '600',
//   },
//   queueDetails: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 12,
//   },
//   detailItem: {
//     alignItems: 'center',
//   },
//   detailLabel: {
//     fontSize: 12,
//     color: '#666',
//     marginBottom: 4,
//   },
//   detailValue: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333',
//   },
//   joinTime: {
//     color: '#888',
//     fontSize: 12,
//     marginBottom: 12,
//   },
//   progressContainer: {
//     marginTop: 8,
//   },
//   progressBar: {
//     height: 8,
//     backgroundColor: '#eee',
//     borderRadius: 4,
//     overflow: 'hidden',
//     marginBottom: 4,
//   },
//   progressFill: {
//     height: '100%',
//     backgroundColor: '#2C6BED',
//     borderRadius: 4,
//   },
//   progressText: {
//     fontSize: 12,
//     color: '#666',
//     textAlign: 'right',
//   },
//   joinButton: {
//     backgroundColor: '#2C6BED',
//     padding: 18,
//     borderRadius: 12,
//     alignItems: 'center',
//     margin: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   joinButtonText: {
//     color: '#fff',
//     fontWeight: 'bold',
//     fontSize: 16,
//   },
//   modalContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     backgroundColor: 'rgba(0,0,0,0.5)',
//     padding: 16,
//   },
//   modalContent: {
//     backgroundColor: 'white',
//     borderRadius: 16,
//     padding: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 12,
//     elevation: 5,
//   },
//   modalHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   modalTitle: {
//     fontWeight: 'bold',
//     fontSize: 20,
//     color: '#333',
//   },
//   closeButton: {
//     padding: 4,
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: '#ddd',
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 16,
//     fontSize: 16,
//     backgroundColor: '#f9f9f9',
//   },
//   modalActions: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
//   modalButton: {
//     flex: 1,
//     padding: 16,
//     borderRadius: 12,
//     alignItems: 'center',
//     marginHorizontal: 4,
//   },
//   primaryButton: {
//     backgroundColor: '#2C6BED',
//   },
//   primaryButtonText: {
//     color: 'white',
//     fontWeight: 'bold',
//     fontSize: 16,
//   },
//   secondaryButton: {
//     backgroundColor: '#f0f0f0',
//   },
//   secondaryButtonText: {
//     color: '#666',
//     fontWeight: '600',
//     fontSize: 16,
//   },
//   cameraContainer: {
//     flex: 1,
//   },
//   cameraOverlay: {
//     flex: 1,
//     backgroundColor: 'transparent',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   cameraFrame: {
//     width: 250,
//     height: 250,
//     borderWidth: 2,
//     borderColor: 'white',
//     borderRadius: 12,
//     backgroundColor: 'transparent',
//   },
//   cameraText: {
//     color: 'white',
//     fontSize: 16,
//     marginTop: 20,
//     textAlign: 'center',
//     backgroundColor: 'rgba(0,0,0,0.6)',
//     padding: 8,
//     borderRadius: 8,
//   },
//   cancelButton: {
//     position: 'absolute',
//     bottom: 40,
//     alignSelf: 'center',
//     backgroundColor: 'rgba(255,255,255,0.9)',
//     paddingVertical: 12,
//     paddingHorizontal: 24,
//     borderRadius: 24,
//   },
//   cancelButtonText: {
//     color: '#2C6BED',
//     fontWeight: 'bold',
//     fontSize: 16,
//   },
//   errorText: {
//     textAlign: 'center',
//     marginTop: 20,
//     fontSize: 16,
//     color: '#666',
//   },
// });

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, Modal, TextInput,
  StyleSheet, Platform, StatusBar, RefreshControl
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import * as Notifications from 'expo-notifications';
import { QrCode, Smartphone, User, X } from 'lucide-react-native';
import { db, auth } from '../../firebase';
import {
  collection, addDoc, doc, getDocs, query,
  orderBy, getDoc, where
} from 'firebase/firestore';

interface QueueItem {
  id: string;
  queueId: string;
  shopName: string;
  position: number;
  waitTime: number;
  totalCustomers: number;
  customer: any;
}

export default function CustomerView() {
  const [scanning, setScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [currentQueues, setCurrentQueues] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [manualModal, setManualModal] = useState(false);
  const [manualId, setManualId] = useState('');

  const [customerModal, setCustomerModal] = useState(false);
  const [shopForModal, setShopForModal] = useState<{ shopId: string; shopName: string } | null>(null);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custPurpose, setCustPurpose] = useState('');
  const [shopId1, setShopId] = useState('');

  const [refreshing, setRefreshing] = useState(false); // for pull-to-refresh
  // Remember last positions to trigger notifications if user moves up
  const lastPositions = useRef<Record<string, number>>({});

  // ===== Camera permission
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      if (status !== 'granted') Alert.alert('Camera permission is required');
    })();
  }, []);

  // ===== Notifications permission
  useEffect(() => {
    (async () => {
      await Notifications.requestPermissionsAsync();
      await Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    })();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchQueues();
    setRefreshing(false);
  };

  // ===== Fetch today's queues
  const fetchQueues = async () => {
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const shopsSnap = await getDocs(collection(db, 'shops'));
      const queues: QueueItem[] = [];

      console.log("shopsnap",shopsSnap)

      for (const shopDoc of shopsSnap.docs) {
        const ownerId = shopDoc.data().ownerId;
        console.log("ownerId",ownerId)
        setShopId(ownerId);
        console.log("shopId",shopId1)

        const queuesSnap = await getDocs(
          query(collection(db, `shops/${ownerId}/queues`), orderBy('date', 'asc'))
        );

        for (const qDoc of queuesSnap.docs) {
          const queueData = qDoc.data();
          if (!queueData.date) continue;

          let queueDate: Date;
          if (queueData.date?.toDate) queueDate = queueData.date.toDate();
          else queueDate = new Date(queueData.date);

          if (
            queueDate.getFullYear() !== today.getFullYear() ||
            queueDate.getMonth() !== today.getMonth() ||
            queueDate.getDate() !== today.getDate()
          ) continue;

          const customersSnap = await getDocs(
            collection(db, `shops/${ownerId}/queues/${qDoc.id}/customers`)
          );

          // Normalize customers: ensure appointmentTimestamp (ms), duration (minutes), createdAt (ms)
          const customers = customersSnap.docs
            .map(doc => {
              const raw = doc.data();
              // Normalize appointmentTimestamp (ms)
              let apptMs: number | null = null;
              if (typeof raw.appointmentTimestamp === 'number') apptMs = raw.appointmentTimestamp;
              else if (raw.appointmentTimestamp?.toMillis) apptMs = raw.appointmentTimestamp.toMillis();
              else if (raw.appointmentTimestamp?.toDate) apptMs = raw.appointmentTimestamp.toDate().getTime();
              // createdAt
              let createdMs = Date.now();
              if (typeof raw.createdAt === 'number') createdMs = raw.createdAt;
              else if (raw.createdAt?.toMillis) createdMs = raw.createdAt.toMillis();
              else if (raw.createdAt?.toDate) createdMs = raw.createdAt.toDate().getTime();

              return {
                id: doc.id,
                ...raw,
                appointmentTimestamp: apptMs, // may be null
                createdAtMs: createdMs,
                duration: raw.duration || 20, // minutes
                servedAt: raw.servedAt || null,
                status: raw.status || 'waiting',
              };
            })
            .filter(c => c.status === 'waiting')
            .sort((a, b) => {
              // Sort by appointmentTimestamp; if missing, sort by createdAt
              const aKey = a.appointmentTimestamp || a.createdAtMs || 0;
              const bKey = b.appointmentTimestamp || b.createdAtMs || 0;
              return aKey - bKey;
            });

          customers.forEach((c: any, index: number) => {
            if (c.userId === auth.currentUser?.uid) {
              // For display we calculate:
              // - position (index+1)
              // - waitTime (estimated minutes until this customer's appointment)
              //   use appointmentTimestamp if present, else derive from previous customers
              // We'll use the appointmentTimestamp when present; if it's missing, we fallback to createdAtMs.
              const appointmentTs = c.appointmentTimestamp || c.createdAtMs;
              const now = Date.now();
              const waitMinutes = Math.max(0, Math.ceil((appointmentTs - now) / 60000));

              queues.push({
                id: c.id,
                queueId: qDoc.id,
                shopName: shopDoc.data().name,
                position: index + 1,
                waitTime: waitMinutes,
                totalCustomers: customers.length,
                customer: {
                  ...c,
                  // include the full ordered customer list start so the UI can calculate better if needed
                  __queueCustomers: customers,
                },
              });

              // ---- Notification: if moved up
              const prev = lastPositions.current[c.id];
              if (prev && index + 1 < prev) {
                Notifications.scheduleNotificationAsync({
                  content: {
                    title: `Queue Update: ${shopDoc.data().name}`,
                    body: `You're now #${index + 1} in line.`,
                  },
                  trigger: null,
                });
              }
              lastPositions.current[c.id] = index + 1;
            }
          });
        }
      }
      setCurrentQueues(queues.slice(0, 4));
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to fetch queues.');
    } finally {
      setLoading(false);
    }
  };

  // Initial & auto refresh
  useEffect(() => {
    fetchQueues();
    const interval = setInterval(fetchQueues, 30000); // every 30 sec
    return () => clearInterval(interval);
  }, []);

  // ===== QR Scan
  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setScanning(false);
    try {
      const parsed = JSON.parse(data); 
      console.log("parrrrr",parsed.ownerId)

      setShopId(parsed.ownerId);
      console.log("owner",parsed.ownerId)
       console.log(shopId1)
      setShopForModal({ shopId: parsed.id, shopName: parsed.name });
      setCustomerModal(true);
    } catch {
      Alert.alert('Error', 'Invalid QR code.');
    }
  };

  // ===== Manual join
  const joinById = async (enteredId: string) => {
    if (!enteredId.trim()) return;

    try {
      // Look up a shop by its custom/public ID (not the Firestore doc ID)
      const q = query(collection(db, 'shops'), where('shopId', '==', enteredId.trim()));
      const snap = await getDocs(q);

      if (snap.empty) {
        Alert.alert('Not Found', `No shop found with ID: ${enteredId}`);
        return;
      }

      // Assume first match is the correct shop
      const shopDoc = snap.docs[0];
      const shopData = shopDoc.data();
      console.log("shopdata",shopData)
      console.log("shopId333",shopData.ownerId)

      setShopId(shopData.ownerId);
      console.log("shopId333",shopData.ownerId)
      // Save info for the modal and open the customer form
      setShopForModal({ shopId: shopDoc.id, shopName: shopData.name || '' });
      setManualModal(false);
      setCustomerModal(true);

    } catch (err) {
      console.error('Join by ID error:', err);
      Alert.alert('Error', 'Failed to find shop. Please try again.');
    }
  };

  // ===== Confirm join
 // ===== Confirm join
const confirmJoinQueue = async () => {
  if (!custName || !custPhone || !custPurpose || !shopForModal) {
    return Alert.alert('Error', 'Please fill all fields');
  }

  if (currentQueues.length >= 4) {
    return Alert.alert('Limit reached', 'You can join up to 4 queues at the same time');
  }

  console.log("lastShop",shopId1)

  try {
    const queuesRef = collection(db, `shops/${shopId1}/queues`);
    const queuesSnap = await getDocs(queuesRef);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // find today's queue
    let queueDoc = queuesSnap.docs.find(doc => {
      const qDate = doc.data().date?.toDate ? doc.data().date.toDate() : new Date(doc.data().date);
      return qDate.toDateString() === today.toDateString();
    });

    let queueId = '';
    if (queueDoc) {
      queueId = queueDoc.id;
    } else {
      // create new queue for today
      const newQueueRef = await addDoc(queuesRef, { date: new Date(), createdAt: Date.now() });
      queueId = newQueueRef.id;
    }

    // --- calculate next appointment timestamp
    const customersSnap = await getDocs(
      collection(db, `shops/d3h3Oyzi9bhkoQbww94ldTt0zTp2/queues/${queueId}/customers`),
      
    );

    let nextTimestamp = Date.now();
    const defaultDuration = 20; // default duration in minutes

    if (!customersSnap.empty) {
      // sort existing customers by appointmentTimestamp or createdAt
      const sortedCustomers = customersSnap.docs
        .map(doc => {
          const data = doc.data();
          const appt = data.appointmentTimestamp || data.createdAt || Date.now();
          const dur = data.duration || defaultDuration;
          return { appt, dur };
        })
        .filter(c => c.status === 'waiting')
        .sort((a, b) => a.appt - b.appt);

      // last customer end time
      const lastCustomer = sortedCustomers[sortedCustomers.length - 1];
      nextTimestamp = lastCustomer.appt + lastCustomer.dur * 60_000;
    }

    // --- add new customer
    await addDoc(collection(db, `shops/${shopId1}/queues/${queueId}/customers`), {
      customerName: custName,
      phoneNumber: custPhone,
      purpose: custPurpose,
      status: 'waiting',
      duration: defaultDuration,
      appointmentTimestamp: nextTimestamp,
      date: new Date(),
      createdAt: Date.now(),
      userId: auth.currentUser?.uid,
    });

    Alert.alert('Success', `You joined the queue for ${shopForModal.shopName}`);
    setCustomerModal(false);
    setCustName('');
    setCustPhone('');
    setCustPurpose('');
    setShopForModal(null);
    fetchQueues();
  } catch (err) {
    console.error(err);
    Alert.alert('Error', 'Failed to join queue.');
  }
};


  // ====== Camera Scanner UI
  if (scanning) {
    if (!hasPermission) return <Text style={styles.errorText}>No camera permission</Text>;
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          style={StyleSheet.absoluteFill}
          onBarcodeScanned={handleBarCodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        >
          <View style={styles.cameraOverlay}>
            <View style={styles.cameraFrame} />
            <Text style={styles.cameraText}>Align QR code within the frame</Text>
            <TouchableOpacity
              onPress={() => setScanning(false)}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

  // Helper to format time nicely
  const formatTime = (ms?: number | null) => {
    if (!ms) return '';
    try {
      return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // ====== Main UI
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2C6BED" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.appName}>NextUp</Text>
            <Text style={styles.appTagline}>Your turn is almost here</Text>
          </View>
          <TouchableOpacity style={styles.userButton}>
            <User color="white" size={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.scanButtons}>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => setScanning(true)}
          >
            <QrCode color="#2C6BED" size={32} />
            <Text style={styles.scanButtonText}>Scan QR</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => setManualModal(true)}
          >
            <Smartphone color="#2C6BED" size={32} />
            <Text style={styles.scanButtonText}>Enter ID</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Queue List */}
      <ScrollView
          style={styles.queueList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2C6BED']}
              tintColor="#2C6BED"
            />
          }
        >
        <Text style={styles.sectionTitle}>Your Queues</Text>
        
        
        {loading ? (
          <ActivityIndicator size="large" color="#2C6BED" style={styles.loader} />
        ) : currentQueues.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No queues for today</Text>
            <Text style={styles.emptyStateSubtext}>Scan a QR code or enter a shop ID to join a queue</Text>
          </View>
        ) : (
          currentQueues.map(q => {
            // compute more accurate times/progress based on stored appointmentTimestamp and duration
            const customer = q.customer;
            const appointmentTs = customer.appointmentTimestamp || customer.createdAtMs;
            const durationMin = customer.duration || 20;
            const durationMs = durationMin * 60_000;
            const now = Date.now();
            const startMs = appointmentTs;
            const endMs = startMs + durationMs;

            // waitMinutes: minutes until start (0 if started/past)
            const waitMinutes = Math.max(0, Math.ceil((startMs - now) / 60000));

            // progress: fraction of how far through this customer's slot we are (0..1)
            let progress = 0;
            if (now < startMs) progress = 0;
            else if (now >= endMs) progress = 1;
            else progress = (now - startMs) / durationMs;

            const progressPercent = Math.round(progress * 100);

            const dueTimeStr = formatTime(endMs);
            const apptTimeStr = formatTime(startMs);

            // show joined time from createdAtMs if present
            const joinedAtStr = formatTime(customer.createdAtMs);

            // average wait (as before)
            const avgWait = q.totalCustomers
              ? Math.round(
                  (q.totalCustomers === 0 ? 0 : q.waitTime)
                )
              : 0;

            return (
              <View
                key={q.id}
                style={styles.queueCard}
              >
                <View style={styles.queueHeader}>
                  <Text style={styles.customerName}>{customer.customerName}</Text>
                  <Text style={styles.shopName}>{q.shopName}</Text>
                </View>
                
                <View style={styles.queueDetails}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Position</Text>
                    <Text style={styles.detailValue}>#{q.position} of {q.totalCustomers}</Text>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Est. Wait</Text>
                    <Text style={styles.detailValue}>{waitMinutes} min</Text>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Duration</Text>
                    <Text style={styles.detailValue}>{durationMin} min</Text>
                  </View>
                </View>
                
                <Text style={styles.joinTime}>
                  Joined: {joinedAtStr} • Appt: {apptTimeStr} • Due: {dueTimeStr}
                </Text>

                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, progressPercent))}%` }]} />
                  </View>
                  <Text style={styles.progressText}>
                    {progressPercent}% 
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Join New Queue Button */}
      <TouchableOpacity
        onPress={() => {
          if (currentQueues.length >= 4) {
            Alert.alert('Limit reached', 'You can join up to 4 queues at the same time');
            return;
          }
          setManualModal(true);
        }}
        style={styles.joinButton}
      >
        <Text style={styles.joinButtonText}>Join New Queue</Text>
      </TouchableOpacity>

      {/* ---- Manual ID Modal ---- */}
      <Modal visible={manualModal} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enter Shop ID</Text>
              <TouchableOpacity onPress={() => setManualModal(false)} style={styles.closeButton}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <TextInput
              placeholder="Shop ID"
              placeholderTextColor="#999"
              value={manualId}
              onChangeText={setManualId}
              style={styles.input}
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => joinById(manualId)}
                style={[styles.modalButton, styles.primaryButton]}
              >
                <Text style={styles.primaryButtonText}>Next</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => setManualModal(false)} 
                style={[styles.modalButton, styles.secondaryButton]}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ---- Customer Info Modal ---- */}
      <Modal visible={customerModal} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Join Queue at {shopForModal?.shopName}
              </Text>
              <TouchableOpacity onPress={() => setCustomerModal(false)} style={styles.closeButton}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <TextInput
              placeholder="Name"
              placeholderTextColor="#999"
              value={custName}
              onChangeText={setCustName}
              style={styles.input}
            />
            
            <TextInput
              placeholder="Phone"
              placeholderTextColor="#999"
              value={custPhone}
              onChangeText={setCustPhone}
              keyboardType="phone-pad"
              style={styles.input}
            />
            
            <TextInput
              placeholder="Purpose"
              placeholderTextColor="#999"
              value={custPurpose}
              onChangeText={setCustPurpose}
              style={styles.input}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={confirmJoinQueue}
                style={[styles.modalButton, styles.primaryButton]}
              >
                <Text style={styles.primaryButtonText}>Join Queue</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => setCustomerModal(false)} 
                style={[styles.modalButton, styles.secondaryButton]}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#2C6BED',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  appTagline: {
    color: '#cce0ff',
    marginTop: 4,
    fontSize: 14,
  },
  userButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 10,
    borderRadius: 50,
  },
  scanButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  scanButton: {
    flex: 1,
    backgroundColor: 'white',
    marginHorizontal: 8,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  scanButtonText: {
    color: '#2C6BED',
    marginTop: 8,
    fontWeight: '600',
    fontSize: 14,
  },
  queueList: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  loader: {
    marginTop: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  queueCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerName: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#333',
  },
  shopName: {
    color: '#2C6BED',
    fontSize: 14,
    fontWeight: '600',
  },
  queueDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  joinTime: {
    color: '#888',
    fontSize: 12,
    marginBottom: 12,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2C6BED',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  joinButton: {
    backgroundColor: '#2C6BED',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 16,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: 20,
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  primaryButton: {
    backgroundColor: '#2C6BED',
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
  },
  secondaryButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  cameraContainer: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  cameraText: {
    color: 'white',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderRadius: 8,
  },
  cancelButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  cancelButtonText: {
    color: '#2C6BED',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
});
