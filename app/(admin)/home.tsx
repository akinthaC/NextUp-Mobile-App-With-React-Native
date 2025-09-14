import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator
} from 'react-native';
import {
  Users, Clock, Play, RotateCcw, Plus, Bell,
  Calendar, TrendingUp
} from 'lucide-react-native';
import { db, auth } from '../../firebase';
import {
  collection, query, getDocs, orderBy, updateDoc, doc
} from 'firebase/firestore';

export default function BusinessView() {
  const [queueActive, setQueueActive] = useState(true);
  const [shop, setShop] = useState<any>(null);
  const [loadingShop, setLoadingShop] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);

  const shopId = auth.currentUser?.uid;

  // ---------- Greeting ----------
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else if (hour < 21) setGreeting('Good Evening');
    else setGreeting('Good Night');
  }, []);

  // ---------- Load Shop ----------
  useEffect(() => {
    const fetchShop = async () => {
      setLoadingShop(true);
      try {
        const qs = await getDocs(collection(db, 'shops'));
        const shopDoc = qs.docs.find(doc => doc.data().ownerId === shopId);
        if (shopDoc) setShop({ id: shopDoc.id, ...shopDoc.data() });
        else setShop(null);
      } catch (err) {
        console.error(err);
        Alert.alert('Error', 'Failed to fetch shop details');
      } finally {
        setLoadingShop(false);
      }
    };
    fetchShop();
  }, [shopId]);

  // ---------- Merge & Calculate Positions ----------
  const mergeAndCalculateQueue = (customerList: any[]) => {
    const merged = [...customerList].sort((a, b) => {
      const aTime = (a.appointmentTimestamp instanceof Date)
        ? a.appointmentTimestamp.getTime()
        : (a.createdAt instanceof Date ? a.createdAt.getTime() : 0);

      const bTime = (b.appointmentTimestamp instanceof Date)
        ? b.appointmentTimestamp.getTime()
        : (b.createdAt instanceof Date ? b.createdAt.getTime() : 0);

      return aTime - bTime;
    });

    const estimatedPerCustomer = 15; // minutes per customer
    merged.forEach((c, idx) => {
      c.position = idx + 1;
      c.waitTime = idx * estimatedPerCustomer;
    });

    return merged;
  };

  // ---------- Fetch Today's Queue ----------
  useEffect(() => {
    const fetchTodayQueue = async () => {
      if (!shop) return;
      setLoadingQueue(true);
      try {
        const queuesSnap = await getDocs(collection(db, `shops/${shopId}/queues`));
        let allCustomers: any[] = [];

        for (const queueDoc of queuesSnap.docs) {
          const queueData = queueDoc.data();
          if (!queueData.date) continue;

          const queueDate = queueData.date.toDate ? queueData.date.toDate() : queueData.date;
          const today = new Date();
          if (queueDate.toDateString() !== today.toDateString()) continue;

          const customersSnap = await getDocs(collection(db, `shops/${shopId}/queues/${queueDoc.id}/customers`));
          const customersData = customersSnap.docs.map(c => {
            const cData = c.data();
            return {
              id: c.id,
              queueId: queueDoc.id,
              name: cData.customerName,
              createdAt: cData.createdAt?.toDate ? cData.createdAt.toDate() : new Date(),
              appointmentTimestamp: cData.appointmentTimestamp?.toDate ? cData.appointmentTimestamp.toDate() : null,
              waitTime: cData.waitTime || 0,
              ...cData
            };
          });

          allCustomers = allCustomers.concat(customersData);
        }

        setCustomers(mergeAndCalculateQueue(allCustomers));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingQueue(false);
      }
    };
    fetchTodayQueue();
  }, [shop]);

  // ---------- Fetch Tomorrow Appointments ----------
  useEffect(() => {
    const fetchTomorrowAppointments = async () => {
      if (!shop) return;
      setLoadingAppointments(true);
      try {
        const queuesSnap = await getDocs(collection(db, `shops/${shopId}/queues`));
        let allAppointments: any[] = [];

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        for (const queueDoc of queuesSnap.docs) {
          const queueData = queueDoc.data();
          if (!queueData.date) continue;

          const queueDate = queueData.date.toDate ? queueData.date.toDate() : queueData.date;
          if (queueDate.toDateString() !== tomorrow.toDateString()) continue;

          const customersSnap = await getDocs(collection(db, `shops/${shopId}/queues/${queueDoc.id}/customers`));
          const customersData = customersSnap.docs.map(c => {
            const cData = c.data();
            const appointmentDate = cData.appointmentTimestamp?.toDate
              ? cData.appointmentTimestamp.toDate()
              : cData.appointmentTimestamp instanceof Date
              ? cData.appointmentTimestamp
              : null;

            return {
              id: c.id,
              queueId: queueDoc.id,
              name: cData.customerName,
              appointmentTimestamp: appointmentDate,
              position: 0,
              time: appointmentDate
                ? appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '',
              ...cData
            };
          });

          allAppointments = allAppointments.concat(customersData);
        }

        setAppointments(mergeAndCalculateQueue(allAppointments));
      } catch (err) {
        console.error(err);
        Alert.alert('Error', 'Failed to load tomorrow appointments');
      } finally {
        setLoadingAppointments(false);
      }
    };
    fetchTomorrowAppointments();
  }, [shop]);

  // ---------- Controls ----------
  const toggleQueue = () => setQueueActive(!queueActive);

  const callNextCustomer = async () => {
    if (!customers.length) return;
    try {
      const next = customers[0];
      await updateDoc(doc(db, `shops/${shop.id}/queues/${next.queueId}/customers`, next.id), {
        status: 'served'
      });
      setCustomers(prev => prev.slice(1));
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to update next customer');
    }
  };

  const resetQueue = () => setCustomers([]);

  const addWaitTimeToCustomer = (id: string, extra: number) =>
    setCustomers(prev =>
      prev.map(c => (c.id === id ? { ...c, waitTime: (c.waitTime || 0) + extra } : c))
    );

  const notifyCustomer = (id: string) => {
    const c = customers.find(x => x.id === id);
    if (c) Alert.alert('Notification Sent', `Customer ${c.name} notified`);
  };

  // ---------- Render ----------
  return (
    <View className="flex-1 bg-gray-50">
      {/* HEADER */}
      <View className="bg-teal-600 pt-12 pb-6 px-4">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-white text-2xl font-bold">NextUp Business</Text>
          <TouchableOpacity className="bg-teal-500 p-2 rounded-full">
            <Users color="white" size={24} />
          </TouchableOpacity>
        </View>
        {loadingShop ? (
          <ActivityIndicator color="#fff" />
        ) : shop ? (
          <>
            <Text className="text-white text-lg font-semibold">{greeting},</Text>
            <Text className="text-white text-lg font-semibold">shop {shop.name}</Text>
            <Text className="text-teal-100 text-sm">{shop.address}</Text>
          </>
        ) : (
          <Text className="text-red-200">No shop found</Text>
        )}
        <Text className="text-teal-100 mt-1">Manage your queue efficiently</Text>
      </View>

      <ScrollView className="flex-1 px-4 py-6" showsVerticalScrollIndicator={false}>
        {/* Queue Controls */}
        <View className="bg-white rounded-xl p-5 mb-6 shadow-sm border border-gray-100">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-gray-900 text-lg font-bold">Queue Controls</Text>
            <TouchableOpacity
              className={`px-4 py-2 rounded-full ${queueActive ? 'bg-red-100' : 'bg-green-100'}`}
              onPress={toggleQueue}
            >
              <Text className={`font-medium ${queueActive ? 'text-red-600' : 'text-green-600'}`}>
                {queueActive ? 'Pause' : 'Resume'}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 bg-teal-600 py-3 rounded-lg flex-row justify-center items-center"
              onPress={callNextCustomer}
            >
              <Play color="white" size={18} />
              <Text className="text-white font-medium ml-2">Call Next</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-gray-200 py-3 rounded-lg flex-row justify-center items-center"
              onPress={resetQueue}
            >
              <RotateCcw color="#1A2C3B" size={18} />
              <Text className="text-gray-900 font-medium ml-2">Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Customer Queue */}
        <View className="mb-6">
          <Text className="text-gray-900 text-lg font-bold mb-3">
            Customer Queue ({customers.length})
          </Text>
          {loadingQueue ? (
            <ActivityIndicator />
          ) : customers.length === 0 ? (
            <Text className="text-gray-500 text-center">No customers in queue</Text>
          ) : (
            customers.map(c => (
              <View
                key={c.id}
                className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="font-medium text-gray-900">{c.name}</Text>
                    <Text className="text-gray-500 text-sm">Position: #{c.position}</Text>
                  </View>
                  <View className="flex-row items-center bg-teal-100 px-3 py-1 rounded-full">
                    <Clock color="#4ECDC4" size={14} />
                    <Text className="text-teal-700 font-medium ml-1">{c.waitTime} min</Text>
                  </View>
                </View>

                <View className="flex-row mt-3 gap-2">
                  <TouchableOpacity
                    className="bg-gray-100 p-2 rounded-lg flex-1 flex-row items-center justify-center"
                    onPress={() => addWaitTimeToCustomer(c.id, 5)}
                  >
                    <Plus color="#5A6B7C" size={16} />
                    <Text className="text-gray-700 ml-1">+5 min</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="bg-blue-100 p-2 rounded-lg flex-1 flex-row items-center justify-center"
                    onPress={() => notifyCustomer(c.id)}
                  >
                    <Bell color="#2C6BED" size={16} />
                    <Text className="text-blue-700 ml-1">Notify</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Tomorrow Appointments */}
        <View className="mb-6">
          <Text className="text-gray-900 text-lg font-bold mb-3">Tomorrow's Appointments</Text>
          {loadingAppointments ? (
            <ActivityIndicator />
          ) : appointments.length === 0 ? (
            <Text className="text-gray-500">No appointments</Text>
          ) : (
            appointments.map(a => (
              <View
                key={a.id}
                className="flex-row items-center bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100"
              >
                <View className="flex-1">
                  <Text className="font-medium text-gray-900">{a.name}</Text>
                  <Text className="text-gray-500 text-sm">Position #{a.position}</Text>
                </View>
                <Text className="text-teal-600 font-medium">{a.time || ''}</Text>
              </View>
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View className="flex-row gap-3 mb-6">
          <TouchableOpacity className="flex-1 bg-white rounded-xl p-4 shadow-sm border border-gray-100 items-center">
            <Calendar color="#4ECDC4" size={24} />
            <Text className="mt-2 font-medium text-gray-900">Schedule</Text>
          </TouchableOpacity>

          <TouchableOpacity className="flex-1 bg-white rounded-xl p-4 shadow-sm border border-gray-100 items-center">
            <TrendingUp color="#4ECDC4" size={24} />
            <Text className="mt-2 font-medium text-gray-900">Reports</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
