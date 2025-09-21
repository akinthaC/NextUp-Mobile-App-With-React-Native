import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Platform,
  StatusBar,
  RefreshControl,
} from 'react-native';
import {
  Users,
  Clock,
  Play,
  RotateCcw,
  Plus,
  Bell,
  Calendar,
  TrendingUp,
  User,
  ChevronRight,
  MoreVertical,
} from 'lucide-react-native';
import { db, auth } from '../../firebase';
import { collection, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';

export default function BusinessView() {
  const [queueActive, setQueueActive] = useState(true);
  const [shop, setShop] = useState<any>(null);
  const [loadingShop, setLoadingShop] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [refreshing, setRefreshing] = useState(false);   // ← added state

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
  const fetchShop = useCallback(async () => {
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
  }, [shopId]);

  useEffect(() => {
    fetchShop();
  }, [fetchShop]);

  // ---------- Merge & Calculate Positions ----------
  const mergeAndCalculateQueue = (customerList: any[]) => {
    const merged = [...customerList].sort((a, b) => {
      const aTime = a.appointmentTimestamp
        ? a.appointmentTimestamp
        : a.createdAt?.getTime() ?? 0;
      const bTime = b.appointmentTimestamp
        ? b.appointmentTimestamp
        : b.createdAt?.getTime() ?? 0;
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
  const fetchWaitingCustomers = useCallback(async () => {
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

        const customersSnap = await getDocs(
          collection(db, `shops/${shopId}/queues/${queueDoc.id}/customers`)
        );

        const customersData = customersSnap.docs
          .map(c => {
            const cData = c.data();
            if (cData.status && cData.status !== "waiting") return null;

            const apptTime =
              typeof cData.appointmentTimestamp === 'number'
                ? cData.appointmentTimestamp
                : cData.appointmentTimestamp?.toMillis?.() ??
                  cData.appointmentTimestamp?.toDate?.().getTime() ?? null;

            return {
              id: c.id,
              queueId: queueDoc.id,
              name: cData.customerName,
              createdAt: cData.createdAt?.toDate ? cData.createdAt.toDate() : new Date(),
              appointmentTimestamp: apptTime,
              waitTime: cData.waitTime || 0,
              ...cData,
            };
          })
          .filter(Boolean) as any[];

        allCustomers = allCustomers.concat(customersData);
      }

      const sortedCustomers = allCustomers
        .filter(c => c.appointmentTimestamp)
        .sort((a, b) => a.appointmentTimestamp - b.appointmentTimestamp);

      setCustomers(mergeAndCalculateQueue(sortedCustomers));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingQueue(false);
    }
  }, [shop, shopId]);

  useEffect(() => {
    fetchWaitingCustomers();
    const interval = setInterval(fetchWaitingCustomers, 10000);
    return () => clearInterval(interval);
  }, [fetchWaitingCustomers]);

  // ---------- Fetch Tomorrow Appointments ----------
  const fetchTomorrowAppointments = useCallback(async () => {
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

        const customersSnap = await getDocs(
          collection(db, `shops/${shopId}/queues/${queueDoc.id}/customers`)
        );

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
            ...cData,
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
  }, [shop, shopId]);

  useEffect(() => {
    fetchTomorrowAppointments();
  }, [fetchTomorrowAppointments]);

  // ---------- Pull-to-Refresh ----------
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchShop(),
      fetchWaitingCustomers(),
      fetchTomorrowAppointments(),
    ]);
    setRefreshing(false);
  }, [fetchShop, fetchWaitingCustomers, fetchTomorrowAppointments]);

  // ---------- Controls ----------
  const toggleQueue = () => setQueueActive(!queueActive);

  const callNextCustomer = async () => {
    if (!customers.length) {
      Alert.alert('Queue Empty', 'No customers are waiting.');
      return;
    }

    try {
      const next = customers[0];
      if (!next.queueId || !next.id) {
        Alert.alert('Error', 'Invalid customer data');
        return;
      }

      const customerRef = doc(db, `shops/${shopId}/queues/${next.queueId}/customers/${next.id}`);
      const customerSnap = await getDoc(customerRef);

      if (!customerSnap.exists()) {
        Alert.alert('Error', 'Customer document does not exist in Firestore');
        setCustomers(prev => prev.filter(c => c.id !== next.id));
        return;
      }

      await updateDoc(customerRef, { status: 'served', servedAt: Date.now() });
      setCustomers(prev => mergeAndCalculateQueue(prev.filter(c => c.id !== next.id)));
      Alert.alert('Next Customer Called', `Customer ${next.name} is being served.`);
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2C6BED" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.appName}>NextUp Business</Text>
            <Text style={styles.appTagline}>Manage your queue efficiently</Text>
          </View>
          <TouchableOpacity style={styles.userButton}>
            <User color="white" size={24} />
          </TouchableOpacity>
        </View>
        
        {loadingShop ? (
          <ActivityIndicator color="#fff" />
        ) : shop ? (
          <View style={styles.shopInfo}>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.shopName}>{shop.name}</Text>
            <Text style={styles.shopAddress}>{shop.address}</Text>
          </View>
        ) : (
          <Text style={styles.errorText}>No shop found</Text>
        )}
      </View>
<ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Queue Overview */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Queue Overview</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{customers.length}</Text>
              <Text style={styles.statLabel}>Total in Queue</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {customers.length > 0 ? customers[0].waitTime : 0}
              </Text>
              <Text style={styles.statLabel}>Next Wait (min)</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{appointments.length}</Text>
              <Text style={styles.statLabel}>Tomorrow</Text>
            </View>
          </View>

          {/* Next Customer */}
          {customers.length > 0 ? (
            <View style={styles.nextCustomerCard}>
              <View style={styles.nextCustomerHeader}>
                <Text style={styles.nextCustomerTitle}>Next Customer</Text>
                <View style={styles.waitTimeBadge}>
                  <Clock color="#2C6BED" size={14} />
                  <Text style={styles.waitTimeText}>{customers[0].waitTime} min</Text>
                </View>
              </View>
              
              <Text style={styles.customerName}>{customers[0].name}</Text>
              <Text style={styles.customerPurpose}>
                Purpose: {customers[0].purpose || 'Not specified'}
              </Text>
              
              <TouchableOpacity
                style={styles.callNextButton}
                onPress={callNextCustomer}
              >
                <Play color="white" size={18} />
                <Text style={styles.callNextText}>Call Next Customer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyQueue}>
              <Users color="#ccc" size={40} />
              <Text style={styles.emptyQueueText}>No customers in queue</Text>
            </View>
          )}
        </View>

        {/* Customer Queue */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Customer Queue ({customers.length})</Text>
            <TouchableOpacity>
              <MoreVertical color="#666" size={20} />
            </TouchableOpacity>
          </View>
          
          {loadingQueue ? (
            <ActivityIndicator size="large" color="#2C6BED" style={styles.loader} />
          ) : customers.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No customers in queue</Text>
            </View>
          ) : (
            customers.map((c, index) => (
              <View
                key={c.id}
                style={[
                  styles.customerCard,
                  index === 0 && { borderLeftWidth: 4, borderLeftColor: '#2C6BED' }
                ]}
              >
                <View style={styles.customerInfo}>
                  <View style={styles.customerMain}>
                    <Text style={styles.customerNameSmall}>{c.name}</Text>
                    <Text style={styles.customerPosition}>Position #{c.position}</Text>
                  </View>
                  
                  <View style={styles.waitTime}>
                    <Clock color="#2C6BED" size={14} />
                    <Text style={styles.waitTimeTextSmall}>{c.waitTime} min</Text>
                  </View>
                </View>
                
                <View style={styles.customerActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => addWaitTimeToCustomer(c.id, 5)}
                  >
                    <Plus color="#5A6B7C" size={16} />
                    <Text style={styles.actionButtonText}>+5 min</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.notifyButton]}
                    onPress={() => notifyCustomer(c.id)}
                  >
                    <Bell color="#2C6BED" size={16} />
                    <Text style={[styles.actionButtonText, styles.notifyButtonText]}>Notify</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Tomorrow Appointments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tomorrow's Appointments</Text>
            <TouchableOpacity>
              <Calendar color="#2C6BED" size={20} />
            </TouchableOpacity>
          </View>

          {loadingAppointments ? (
            <ActivityIndicator size="large" color="#2C6BED" style={styles.loader} />
          ) : appointments.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No appointments scheduled</Text>
            </View>
          ) : (
            appointments.map(a => {
              const scheduledTime = new Date(a.appointmentTimestamp);

              // Calculate checkout time
              const checkoutTime = new Date(a.appointmentTimestamp + a.duration * 60000);

              // Function to format time in 12-hour AM/PM format
              const formatTimeAMPM = (date: Date) => {
                let hours = date.getHours();
                const minutes = date.getMinutes();
                const ampm = hours >= 12 ? 'PM' : 'AM';
                hours = hours % 12;
                hours = hours ? hours : 12; // hour '0' should be '12'
                const minutesStr = minutes.toString().padStart(2, '0');
                return `${hours}.${minutesStr} ${ampm}`;
              };

              return (
                <View key={a.id} style={styles.appointmentCard}>
                  <View style={styles.appointmentInfo}>
                    <Text style={styles.appointmentName}>{a.customerName}</Text>
                    <Text style={styles.appointmentPurpose}>{a.purpose}</Text>
                    <Text style={styles.appointmentTimes}>
                      Scheduled: {formatTimeAMPM(scheduledTime)} | Checkout: {formatTimeAMPM(checkoutTime)}
                    </Text>
                  </View>
                  <ChevronRight color="#ccc" size={20} />
                </View>
              );
            })
          )}
        </View>


        {/* Quick Actions */}
        
      </ScrollView>
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
    fontSize: 24,
    fontWeight: 'bold',
  },
  appTagline: {
    color: '#cce0ff',
    fontSize: 14,
  },
  userButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 10,
    borderRadius: 50,
  },
  shopInfo: {
    marginTop: 8,
  },
  greeting: {
    color: 'white',
    fontSize: 16,
  },
  shopName: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  shopAddress: {
    color: '#cce0ff',
    fontSize: 14,
    marginTop: 2,
  },
  errorText: {
    color: '#ffcccc',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C6BED',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  nextCustomerCard: {
    backgroundColor: '#F0F7FF',
    borderRadius: 12,
    padding: 16,
  },
  nextCustomerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nextCustomerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  waitTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  waitTimeText: {
    color: '#2C6BED',
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 14,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  customerPurpose: {
    color: '#666',
    marginBottom: 16,
  },
  callNextButton: {
    flexDirection: 'row',
    backgroundColor: '#2C6BED',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callNextText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  emptyQueue: {
    alignItems: 'center',
    padding: 20,
  },
  emptyQueueText: {
    color: '#999',
    marginTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  loader: {
    marginVertical: 20,
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    color: '#999',
  },
  customerCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  customerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerMain: {
    flex: 1,
  },
  customerNameSmall: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  customerPosition: {
    fontSize: 14,
    color: '#666',
  },
  waitTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  waitTimeTextSmall: {
    color: '#2C6BED',
    fontWeight: '600',
    marginLeft: 4,
  },
  customerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  actionButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#5A6B7C',
  },
  notifyButton: {
    backgroundColor: '#E3F2FD',
  },
  notifyButtonText: {
    color: '#2C6BED',
  },
  appointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  appointmentPurpose: {
   
  },

   appointmentTimes: {
    fontSize: 14,
    color: '#2C6BED',
  },

  appointmentTime: {
    fontSize: 14,
    color: '#2C6BED',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});