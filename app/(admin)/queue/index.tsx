// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
//   ActivityIndicator,
// } from 'react-native';
// import DateTimePicker from '@react-native-community/datetimepicker';
// import { db, auth } from '../../../firebase';
// import {
//   collection,
//   addDoc,
//   getDocs,
//   query,
//   orderBy,
//   serverTimestamp,
//   Timestamp,
// } from 'firebase/firestore';
// import { useRouter } from 'expo-router';
// import { Ionicons } from '@expo/vector-icons';

// export default function QueuePage() {
//   const [selectedDate, setSelectedDate] = useState(new Date());
//   const [showDatePicker, setShowDatePicker] = useState(false);
//   const [queues, setQueues] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);

//   const router = useRouter();
//   const shopId = auth.currentUser?.uid;

//   // fetch queues and auto-create today's queue if it doesn't exist
//   useEffect(() => {
//     const initQueues = async () => {
//       if (!shopId) return;

//       setLoading(true);
//       try {
//         const q = query(
//           collection(db, `shops/${shopId}/queues`),
//           orderBy('date', 'asc')
//         );
//         const snapshot = await getDocs(q);

//         const data = snapshot.docs.map(doc => {
//           const d = doc.data();
//           return { id: doc.id, ...d };
//         });

//         const today = new Date();

//         // find if today's queue exists
//         const todayQueue = data.find(queue => {
//           const jsDate =
//             queue.date instanceof Timestamp
//               ? queue.date.toDate()
//               : queue.date instanceof Date
//               ? queue.date
//               : null;
//           return jsDate && jsDate.toDateString() === today.toDateString();
//         });

//         // create today's queue if not found
//         if (!todayQueue) {
//           const docRef = await addDoc(
//             collection(db, `shops/${shopId}/queues`),
//             {
//               date: serverTimestamp(),
//               createdAt: serverTimestamp(),
//             }
//           );
//           data.push({
//             id: docRef.id,
//             date: Timestamp.fromDate(today),
//             createdAt: Timestamp.fromDate(today),
//           });
//           Alert.alert('Info', "Today's queue was automatically created.");
//         }

//         setQueues(data);
//       } catch (error) {
//         console.error(error);
//         Alert.alert('Error', 'Failed to fetch or create queues');
//       } finally {
//         setLoading(false);
//       }
//     };

//     initQueues();
//   }, [shopId]);

//   // manually create a queue for selectedDate
//   const createQueue = async () => {
//     if (!shopId) return;
//     try {
//       const existing = queues.find(q => {
//         const jsDate =
//           q.date instanceof Timestamp
//             ? q.date.toDate()
//             : q.date instanceof Date
//             ? q.date
//             : null;
//         return jsDate && jsDate.toDateString() === selectedDate.toDateString();
//       });

//       if (existing) {
//         Alert.alert('Queue exists', 'A queue for this date already exists.');
//         return;
//       }

//       await addDoc(collection(db, `shops/${shopId}/queues`), {
//         date: Timestamp.fromDate(selectedDate),
//         createdAt: serverTimestamp(),
//       });

//       Alert.alert('Success', 'Queue created!');

//       // refresh queues
//       const snapshot = await getDocs(
//         query(collection(db, `shops/${shopId}/queues`), orderBy('date', 'asc'))
//       );
//       const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//       setQueues(data);
//     } catch (error) {
//       console.error(error);
//       Alert.alert('Error', 'Failed to create queue');
//     }
//   };

//   return (
//     <View style={{ padding: 20 }}>
//       <TouchableOpacity
//         style={styles.datePickerBtn}
//         onPress={() => setShowDatePicker(true)}
//       >
//         <Ionicons name="calendar-outline" size={20} color="#fff" />
//         <Text style={styles.dateText}>{selectedDate.toDateString()}</Text>
//       </TouchableOpacity>

//       {showDatePicker && (
//         <DateTimePicker
//           value={selectedDate}
//           mode="date"
//           display="default"
//           onChange={(event, date) => {
//             setShowDatePicker(false);
//             if (date) setSelectedDate(date);
//           }}
//         />
//       )}

//       <TouchableOpacity style={styles.createBtn} onPress={createQueue}>
//         <Text style={styles.createBtnText}>Create Queue</Text>
//       </TouchableOpacity>

//       <Text style={styles.sectionTitle}>Queues</Text>

//       {loading ? (
//         <ActivityIndicator size="large" color="#4a6cff" />
//       ) : queues.length === 0 ? (
//         <Text style={{ textAlign: 'center', color: '#666', marginTop: 20 }}>
//           No queues created yet.
//         </Text>
//       ) : (
//         queues.map(queue => {
//           // safely convert to JS Date
//           const jsDate =
//             queue.date instanceof Timestamp
//               ? queue.date.toDate()
//               : queue.date instanceof Date
//               ? queue.date
//               : null;

//           return (
//             <TouchableOpacity
//               key={queue.id}
//               style={styles.queueItem}
//               onPress={() => router.push(`/queue/${queue.id}`)}
//             >
//               <Text style={styles.queueText}>
//                 {jsDate ? jsDate.toDateString() : 'Invalid date'}
//               </Text>
//               <Ionicons name="chevron-forward" size={20} color="#333" />
//             </TouchableOpacity>
//           );
//         })
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   datePickerBtn: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#4a6cff',
//     padding: 15,
//     borderRadius: 12,
//     marginBottom: 15,
//   },
//   dateText: { color: 'white', marginLeft: 10, fontWeight: '600' },
//   createBtn: {
//     backgroundColor: '#28a745',
//     padding: 15,
//     borderRadius: 12,
//     alignItems: 'center',
//     marginBottom: 25,
//   },
//   createBtnText: { color: 'white', fontWeight: '600', fontSize: 16 },
//   sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 10 },
//   queueItem: {
//     backgroundColor: 'white',
//     padding: 15,
//     borderRadius: 12,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 10,
//   },
//   queueText: { fontSize: 16, fontWeight: '500' },
// });
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { db, auth } from '../../../firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';


const { height } = Dimensions.get('window');

type QueueDoc = {
  id: string;
  date: Timestamp;
  createdAt?: Timestamp;
};

export default function QueuePage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [queues, setQueues] = useState<QueueDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // filter state
  const [filterMode, setFilterMode] = useState<'all' | 'today' | 'range' | 'month'>('all');
  const [rangeStart, setRangeStart] = useState<Date>(new Date());
  const [rangeEnd, setRangeEnd] = useState<Date>(new Date());
  const [monthFilter, setMonthFilter] = useState<number>(new Date().getMonth());
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());

  // for showing range pickers
  const [showRangeStartPicker, setShowRangeStartPicker] = useState(false);
  const [showRangeEndPicker, setShowRangeEndPicker] = useState(false);

  const router = useRouter();
  const shopId = auth.currentUser?.uid;

  /** Fetch queues and ensure today's queue exists */
  useEffect(() => {
    const initQueues = async () => {
      if (!shopId) return;

      setLoading(true);
      try {
        const q = query(collection(db, `shops/${shopId}/queues`), orderBy('date', 'asc'));
        const snapshot = await getDocs(q);

        const data: QueueDoc[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as QueueDoc[];

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayExists = data.find(q => {
          const d = q.date?.toDate();
          if (!d) return false;
          d.setHours(0, 0, 0, 0);
          return d.getTime() === today.getTime();
        });

        if (!todayExists) {
          const docRef = await addDoc(collection(db, `shops/${shopId}/queues`), {
            date: Timestamp.fromDate(today),
            createdAt: serverTimestamp(),
          });
          data.push({
            id: docRef.id,
            date: Timestamp.fromDate(today),
          });
          Alert.alert('Info', "Today's queue was automatically created.");
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
  }, [shopId]);

  /** Create queue for a chosen date */
  const createQueue = async () => {
    if (!shopId) return;
    try {
      const selectedDateNormalized = new Date(selectedDate);
      selectedDateNormalized.setHours(0, 0, 0, 0);
      
      const exists = queues.find(q => {
        const d = q.date?.toDate();
        if (!d) return false;
        d.setHours(0, 0, 0, 0);
        return d.getTime() === selectedDateNormalized.getTime();
      });
      
      if (exists) {
        Alert.alert('Queue exists', 'A queue for this date already exists.');
        return;
      }

      await addDoc(collection(db, `shops/${shopId}/queues`), {
        date: Timestamp.fromDate(selectedDateNormalized),
        createdAt: serverTimestamp(),
      });

      Alert.alert('Success', 'Queue created!');
      const snapshot = await getDocs(query(collection(db, `shops/${shopId}/queues`), orderBy('date', 'asc')));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as QueueDoc[];
      setQueues(data);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to create queue');
    }
  };

  /** Apply filter to queues */
  const filteredQueues = queues
    .filter(q => {
      const d = q.date?.toDate?.();
      if (!d) return false;

      if (filterMode === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      }
      
      if (filterMode === 'range') {
        const start = new Date(rangeStart);
        start.setHours(0, 0, 0, 0);
        const end = new Date(rangeEnd);
        end.setHours(23, 59, 59, 999);
        d.setHours(0, 0, 0, 0);
        return d >= start && d <= end;
      }
      
      if (filterMode === 'month') {
        return d.getMonth() === monthFilter && d.getFullYear() === yearFilter;
      }
      
      return true; // 'all' filter
    })
    .sort((a, b) => a.date.toDate().getTime() - b.date.toDate().getTime());

  // Get available years from queues for year filter
  const availableYears = Array.from(
    new Set(queues.map(q => q.date.toDate().getFullYear()))
  ).sort();

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#6a11cb', '#2575fc']} style={styles.header}>
                <Text style={styles.headerTitle}>Queue</Text>
                <Text style={styles.headerSubtitle}>Manage your Queues</Text>
        </LinearGradient>
      <ScrollView 
        style={styles.mainScrollView}
         contentContainerStyle={[styles.scrollContent, { paddingTop:40 }]}
        showsVerticalScrollIndicator={false} 
      >

        {/* Date selector for creating queue */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Create New Queue</Text>
          <TouchableOpacity 
            style={styles.datePickerBtn} 
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#fff" />
            <Text style={styles.dateText}>{selectedDate.toDateString()}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.createBtn} onPress={createQueue}>
            <Text style={styles.createBtnText}>Create Queue</Text>
          </TouchableOpacity>
        </View>

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

        {/* Filter controls */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Filter Queues</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.filterScroll}
            contentContainerStyle={styles.filterScrollContent}
          >
            <TouchableOpacity 
              style={[styles.filterBtn, filterMode === 'all' && styles.filterActive]} 
              onPress={() => setFilterMode('all')}
            >
              <Text style={[styles.filterText, filterMode === 'all' && styles.filterActiveText]}>All</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.filterBtn, filterMode === 'today' && styles.filterActive]} 
              onPress={() => setFilterMode('today')}
            >
              <Text style={[styles.filterText, filterMode === 'today' && styles.filterActiveText]}>Today</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.filterBtn, filterMode === 'range' && styles.filterActive]} 
              onPress={() => setFilterMode('range')}
            >
              <Text style={[styles.filterText, filterMode === 'range' && styles.filterActiveText]}>Range</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.filterBtn, filterMode === 'month' && styles.filterActive]} 
              onPress={() => setFilterMode('month')}
            >
              <Text style={[styles.filterText, filterMode === 'month' && styles.filterActiveText]}>Month</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Range filter pickers */}
          {filterMode === 'range' && (
            <View style={styles.rangeContainer}>
              <View style={styles.rangeInput}>
                <Text style={styles.rangeLabel}>From:</Text>
                <TouchableOpacity 
                  style={styles.rangeDateBtn} 
                  onPress={() => setShowRangeStartPicker(true)}
                >
                  <Text style={styles.rangeDateText}>{rangeStart.toDateString()}</Text>
                  <Ionicons name="calendar" size={16} color="#4a6cff" />
                </TouchableOpacity>
              </View>

              <View style={styles.rangeInput}>
                <Text style={styles.rangeLabel}>To:</Text>
                <TouchableOpacity 
                  style={styles.rangeDateBtn} 
                  onPress={() => setShowRangeEndPicker(true)}
                >
                  <Text style={styles.rangeDateText}>{rangeEnd.toDateString()}</Text>
                  <Ionicons name="calendar" size={16} color="#4a6cff" />
                </TouchableOpacity>
              </View>

              {showRangeStartPicker && (
                <DateTimePicker
                  value={rangeStart}
                  mode="date"
                  display="default"
                  onChange={(e, date) => {
                    setShowRangeStartPicker(false);
                    if (date) setRangeStart(date);
                  }}
                />
              )}
              {showRangeEndPicker && (
                <DateTimePicker
                  value={rangeEnd}
                  mode="date"
                  display="default"
                  onChange={(e, date) => {
                    setShowRangeEndPicker(false);
                    if (date) setRangeEnd(date);
                  }}
                />
              )}
            </View>
          )}

          {/* Month filter */}
          {filterMode === 'month' && (
            <View style={styles.monthFilterContainer}>
              <View style={styles.yearSelector}>
                <Text style={styles.filterLabel}>Year:</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  style={styles.yearScroll}
                  contentContainerStyle={styles.yearScrollContent}
                >
                  {availableYears.map(year => (
                    <TouchableOpacity
                      key={year}
                      style={[styles.yearBtn, yearFilter === year && styles.yearActive]}
                      onPress={() => setYearFilter(year)}
                    >
                      <Text style={[styles.yearText, yearFilter === year && styles.yearActiveText]}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              <Text style={styles.filterLabel}>Month:</Text>
              <View style={styles.monthGrid}>
                {Array.from({ length: 12 }, (_, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.monthBtn, monthFilter === i && styles.monthActive]}
                    onPress={() => setMonthFilter(i)}
                  >
                    <Text style={[styles.monthText, monthFilter === i && styles.monthActiveText]}>
                      {new Date(0, i).toLocaleString('default', { month: 'short' })}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {filterMode === 'today' ? "Today's Queues" : 
              filterMode === 'range' ? 'Queues in Range' : 
              filterMode === 'month' ? 'Queues by Month' : 'All Queues'}
            {filteredQueues.length > 0 && ` (${filteredQueues.length})`}
          </Text>

          {loading ? (
            <ActivityIndicator size="large" color="#4a6cff" style={styles.loader} />
          ) : filteredQueues.length === 0 ? (
            <Text style={styles.emptyText}>No queues match the current filter.</Text>
          ) : (
            <View style={styles.queueListContainer}>
              {filteredQueues.map(queue => {
                const jsDate = queue.date.toDate();
                return (
                  <TouchableOpacity 
                    key={queue.id} 
                    style={styles.queueItem} 
                    onPress={() => router.push(`/queue/${queue.id}`)}
                  >
                    <View style={styles.queueInfo}>
                      <Text style={styles.queueDate}>{jsDate.toDateString()}</Text>
                      <Text style={styles.queueDay}>{jsDate.toLocaleDateString('en-US', { weekday: 'long' })}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  header: { paddingVertical: 40, paddingHorizontal: 20, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, },

  headerTitle: { fontSize: 32, fontWeight: 'bold', color: 'white', marginBottom: 8 },

  headerSubtitle: { fontSize: 16, color: 'rgba(255, 255, 255, 0.9)' },
  mainScrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 5, // Extra padding at the bottom
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4a6cff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  dateText: { 
    color: 'white', 
    marginLeft: 10, 
    fontWeight: '600' 
  },
  createBtn: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  createBtnText: { 
    color: 'white', 
    fontWeight: '600', 
    fontSize: 16 
  },
  filterScroll: {
    marginBottom: 12,
    maxHeight: 40,
  },
  filterScrollContent: {
    paddingVertical: 4,
  },
  filterBtn: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  filterActive: { 
    backgroundColor: '#4a6cff' 
  },
  filterText: { 
    color: '#666', 
    fontWeight: '600',
  },
  filterActiveText: { 
    color: 'white' 
  },
  rangeContainer: {
    marginTop: 8,
  },
  rangeInput: {
    marginBottom: 12,
  },
  rangeLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  rangeDateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
  },
  rangeDateText: {
    color: '#333',
  },
  monthFilterContainer: {
    marginTop: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  yearSelector: {
    marginBottom: 12,
  },
  yearScroll: {
    maxHeight: 40,
  },
  yearScrollContent: {
    paddingVertical: 4,
  },
  yearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  yearActive: {
    backgroundColor: '#4a6cff',
  },
  yearText: {
    color: '#666',
    fontWeight: '600',
  },
  yearActiveText: {
    color: 'white',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  monthBtn: {
    width: '23%',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginBottom: 8,
  },
  monthActive: {
    backgroundColor: '#4a6cff',
  },
  monthText: {
    color: '#666',
    fontWeight: '600',
  },
  monthActiveText: {
    color: 'white',
  },
  loader: {
    marginVertical: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: 20,
    fontStyle: 'italic',
  },
  queueListContainer: {
    maxHeight: height * 0.4, // Limit height for better scrolling
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  queueInfo: {
    flex: 1,
  },
  queueDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  queueDay: {
    fontSize: 14,
    color: '#666',
  },
});