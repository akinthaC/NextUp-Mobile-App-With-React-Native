import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, Modal, TextInput
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { QrCode, Smartphone, User } from 'lucide-react-native';
import { db, auth } from '../../firebase';
import {
  collection, addDoc, doc, getDocs, query,
  orderBy, getDoc
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

  // Request camera permission
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      if (status !== 'granted') Alert.alert('Camera permission is required');
    })();
  }, []);

  // Fetch today's queues
  const fetchQueues = async () => {
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const shopsSnap = await getDocs(collection(db, 'shops'));
      let queues: QueueItem[] = [];

      for (const shopDoc of shopsSnap.docs) {
        const ownerId = shopDoc.data().ownerId;
        setShopId(ownerId);

        const queuesSnap = await getDocs(
          query(collection(db, `shops/${ownerId}/queues`), orderBy('date', 'asc'))
        );

        for (const qDoc of queuesSnap.docs) {
          const queueData = qDoc.data();
          if (!queueData.date) continue;

          let queueDate: Date;
          if (queueData.date?.toDate) queueDate = queueData.date.toDate();
          else queueDate = new Date(queueData.date);

          // Only today's queues
          if (
            queueDate.getFullYear() !== today.getFullYear() ||
            queueDate.getMonth() !== today.getMonth() ||
            queueDate.getDate() !== today.getDate()
          ) continue;

          // Fetch customers
         // Fetch customers
            // Fetch customers
            const customersSnap = await getDocs(collection(db, `shops/${ownerId}/queues/${qDoc.id}/customers`));

          const customers = customersSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => (a.appointmentTimestamp || 0) - (b.appointmentTimestamp || 0));

          customers.forEach((c, index) => {
            if (c.userId === auth.currentUser?.uid) {
              queues.push({
                id: c.id,
                queueId: qDoc.id,
                shopName: shopDoc.data().name,
                position: index + 1,           // correct relative to full queue
                waitTime: (index +1) * (c.duration || 20),
                totalCustomers: customers.length,
                customer: c,
              });
            }
          });


          };
        }
      
      

      setCurrentQueues(queues.slice(0, 4)); // max 4 queues
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to fetch queues.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueues();
  }, []);

  // Handle QR scan
  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setScanning(false);
    try {
      const parsed = JSON.parse(data);
      setShopForModal({ shopId: parsed.id, shopName: parsed.name });
      setCustomerModal(true);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Invalid QR code.');
    }
  };

  // Manual join
  const joinById = async (shopId: string) => {
    if (!shopId) return;
    try {
      const shopDoc = await getDoc(doc(db, 'shops', shopId));
      if (!shopDoc.exists()) return Alert.alert('Error', 'Shop not found');
      setShopForModal({ shopId, shopName: shopDoc.data()?.name || '' });
      setManualModal(false);
      setCustomerModal(true);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to join queue.');
    }
  };

  // Confirm join queue
  const confirmJoinQueue = async () => {
    if (!custName || !custPhone || !custPurpose || !shopForModal) {
      return Alert.alert('Error', 'Please fill all fields');
    }

    if (currentQueues.length >= 4) {
      return Alert.alert('Limit reached', 'You can join up to 4 queues at the same time');
    }

    try {
      const queuesRef = collection(db, `shops/${shopId1}/queues`);
      const queuesSnap = await getDocs(queuesRef);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find today's queue
      let queueDoc = queuesSnap.docs.find(doc => {
        const qDate = doc.data().date?.toDate ? doc.data().date.toDate() : new Date(doc.data().date);
        return (
          qDate.getFullYear() === today.getFullYear() &&
          qDate.getMonth() === today.getMonth() &&
          qDate.getDate() === today.getDate()
        );
      });

      let queueId = '';
      let nextTimestamp = Date.now();

      if (queueDoc) {
        queueId = queueDoc.id;
        const customersSnap = await getDocs(collection(db, `shops/${shopId1}/queues/${queueId}/customers`));
        const lastCustomer = customersSnap.docs[customersSnap.docs.length - 1];
        if (lastCustomer) nextTimestamp = (lastCustomer.data().appointmentTimestamp || Date.now()) + 20 * 60000;
      } else {
        const newQueueRef = await addDoc(queuesRef, { date: new Date(), createdAt: Date.now() });
        queueId = newQueueRef.id;
      }

      await addDoc(collection(db, `shops/${shopId1}/queues/${queueId}/customers`), {
        customerName: custName,
        phoneNumber: custPhone,
        purpose: custPurpose,
        status: 'waiting',
        duration: 20,
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

  if (scanning) {
    if (!hasPermission) return <Text>No camera permission</Text>;
    return (
      <CameraView
        style={{ flex: 1 }}
        onBarcodeScanned={handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      >
        <View style={{ flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end', padding: 20 }}>
          <TouchableOpacity
            onPress={() => setScanning(false)}
            style={{ alignSelf: 'center', backgroundColor: '#fff', padding: 10, borderRadius: 8 }}
          >
            <Text style={{ color: '#000', fontWeight: 'bold' }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <View style={{ backgroundColor: '#2C6BED', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>NextUp</Text>
            <Text style={{ color: '#cce0ff', marginTop: 4 }}>Your turn is almost here</Text>
          </View>
          <TouchableOpacity style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 50 }}>
            <User color="white" size={24} />
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', marginTop: 16 }}>
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: 'white', marginRight: 8, padding: 16, borderRadius: 20, alignItems: 'center' }}
            onPress={() => setScanning(true)}
          >
            <QrCode color="#2C6BED" size={32} />
            <Text style={{ color: '#2C6BED', marginTop: 8, fontWeight: '600' }}>Scan QR</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ flex: 1, backgroundColor: 'white', marginLeft: 8, padding: 16, borderRadius: 20, alignItems: 'center' }}
            onPress={() => setManualModal(true)}
          >
            <Smartphone color="#2C6BED" size={32} />
            <Text style={{ color: '#2C6BED', marginTop: 8, fontWeight: '600' }}>Enter ID</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Queue List */}
      <ScrollView style={{ flex: 1, padding: 16 }}>
        {loading ? (
          <ActivityIndicator />
        ) : currentQueues.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 20 }}>No queues for today</Text>
        ) : (
          currentQueues.map((q, i) => {
            const progress = Math.min(q.position / q.totalCustomers, 1);
            return (
              <View key={q.id} style={{ backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{q.customer.customerName}</Text>
                  <Text style={{ color: '#888', fontSize: 12 }}>{q.shopName}</Text>
                </View>
                <Text>Position: #{q.position} / {q.totalCustomers}</Text>
                <Text>Estimated Wait: {q.waitTime} min</Text>

                <View style={{ marginTop: 8, height: 12, backgroundColor: '#eee', borderRadius: 6, overflow: 'hidden' }}>
                  <View style={{ width: `${progress * 100}%`, height: '100%', backgroundColor: '#2C6BED', borderRadius: 6 }} />
                </View>
              </View>
            );
          })
        )}

        {/* Join Queue Button */}
        <TouchableOpacity
          onPress={() => {
            if (currentQueues.length >= 4) {
              Alert.alert('Limit reached', 'You can join up to 4 queues at the same time');
              return;
            }
            setManualModal(true);
          }}
          style={{ backgroundColor: '#2C6BED', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 12 }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Join New Queue</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Manual ID Modal */}
      <Modal visible={manualModal} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 16 }}>
          <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 20 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>Enter Shop ID</Text>
            <TextInput
              placeholder="Shop ID"
              value={manualId}
              onChangeText={setManualId}
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 20 }}
            />
            <TouchableOpacity
              onPress={() => joinById(manualId)}
              style={{ backgroundColor: '#2C6BED', padding: 12, borderRadius: 8 }}
            >
              <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>Next</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setManualModal(false)} style={{ marginTop: 10 }}>
              <Text style={{ textAlign: 'center', color: 'red' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Customer Info Modal */}
      <Modal visible={customerModal} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 16 }}>
          <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 20 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>
              Join Queue at {shopForModal?.shopName}
            </Text>

            <TextInput
              placeholder="Name"
              value={custName}
              onChangeText={setCustName}
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 10 }}
            />
            <TextInput
              placeholder="Phone"
              value={custPhone}
              onChangeText={setCustPhone}
              keyboardType="phone-pad"
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 10 }}
            />
            <TextInput
              placeholder="Purpose"
              value={custPurpose}
              onChangeText={setCustPurpose}
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 20 }}
            />

            <TouchableOpacity
              onPress={confirmJoinQueue}
              style={{ backgroundColor: '#2C6BED', padding: 12, borderRadius: 8 }}
            >
              <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>Join Queue</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setCustomerModal(false)} style={{ marginTop: 10 }}>
              <Text style={{ textAlign: 'center', color: 'red' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
