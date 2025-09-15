import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { db, auth } from '../../../firebase';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function QueuePage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [queues, setQueues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const shopId = auth.currentUser?.uid;


  // Fetch queues and auto-create today's queue if not exist
  useEffect(() => {
    const initQueues = async () => {
      if (!shopId) return;

      setLoading(true);
      try {
        console.log("Initializing queues for shopId:", shopId);
        const q = query(collection(db, `shops/${shopId}/queues`), orderBy('date', 'asc'));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Fetched queues:", data);

        // Check if today's queue exists
        const today = new Date();
        const todayQueue = data.find(queue =>
          new Date(queue.date.toDate()).toDateString() === today.toDateString()
        );

        // If not, create today's queue
        if (!todayQueue) {
          const docRef = await addDoc(collection(db, `shops/${shopId}/queues`), {
            date: today,
            createdAt: new Date(),
          });
          data.push({ id: docRef.id, date: today, createdAt: new Date() });
          Alert.alert('Info', 'Today\'s queue was automatically created.');
        }

        setQueues(data);
      } catch (error) {
        console.error(error);
        Alert.alert('Error', 'Failed to fetch or create queues');
      } finally {
        setLoading(false);
      }
    };

    initQueues();
  }, []);

  // Manual create queue button
  const createQueue = async () => {
    if (!shopId) return;
    try {
      const existing = queues.find(q =>
        new Date(q.date.toDate()).toDateString() === selectedDate.toDateString()
      );
      if (existing) {
        Alert.alert('Queue exists', 'A queue for this date already exists.');
        return;
      }

      await addDoc(collection(db, `shops/${shopId}/queues`), {
        date: selectedDate,
        createdAt: new Date(),
      });

      Alert.alert('Success', 'Queue created!');
      // Refresh queues
      const snapshot = await getDocs(query(collection(db, `shops/${shopId}/queues`), orderBy('date', 'asc')));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setQueues(data);
      console.log("Queues after creation:", data);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to create queue');
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowDatePicker(true)}>
        <Ionicons name="calendar-outline" size={20} color="#fff" />
        <Text style={styles.dateText}>{selectedDate.toDateString()}</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) setSelectedDate(date);
          }}
        />
      )}

      <TouchableOpacity style={styles.createBtn} onPress={createQueue}>
        <Text style={styles.createBtnText}>Create Queue</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Queues</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#4a6cff" />
      ) : queues.length === 0 ? (
        <Text style={{ textAlign: 'center', color: '#666', marginTop: 20 }}>No queues created yet.</Text>
      ) : (
        queues.map(queue => (
          <TouchableOpacity
            key={queue.id}
            style={styles.queueItem}
            onPress={() => router.push(`/queue/${queue.id}`)}
          >
            <Text style={styles.queueText}>{new Date(queue.date.toDate()).toDateString()}</Text>
            <Ionicons name="chevron-forward" size={20} color="#333" />
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4a6cff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  dateText: { color: 'white', marginLeft: 10, fontWeight: '600' },
  createBtn: { backgroundColor: '#28a745', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 25 },
  createBtnText: { color: 'white', fontWeight: '600', fontSize: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 10 },
  queueItem: { backgroundColor: 'white', padding: 15, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  queueText: { fontSize: 16, fontWeight: '500' },
});
