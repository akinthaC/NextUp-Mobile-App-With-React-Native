import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { useAuth } from '../../context/authContext';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { db, auth } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { User, Clock4, BarChart3, Users, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const Setting = () => {
  const { logout } = useAuth();
  const router = useRouter();

  const [shop, setShop] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const shopId = auth.currentUser?.uid || null;

  const [analysisVisible, setAnalysisVisible] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState({
    todayCount: 0,
    totalCount: 0,
    waitingCount: 0,
    avgWaitingTime: 0,
  });

  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(height))[0];

  // ---------- Fetch Shop ----------
  const fetchShop = useCallback(async () => {
    setLoading(true);
    try {
      const qs = await getDocs(collection(db, 'shops'));
      const shopDoc = qs.docs.find(doc => doc.data().ownerId === shopId);
      if (shopDoc) setShop({ id: shopDoc.id, ...shopDoc.data() });
      else setShop(null);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to fetch shop details');
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    fetchShop();
  }, [fetchShop]);

  // ---------- Fetch Customers ----------
  const fetchCustomers = useCallback(async () => {
    if (!shop) return;
    try {
      const queuesSnap = await getDocs(collection(db, `shops/${shopId}/queues`));
      let allCustomers: any[] = [];

      for (const queueDoc of queuesSnap.docs) {
        const customersSnap = await getDocs(
          collection(db, `shops/${shopId}/queues/${queueDoc.id}/customers`)
        );

        const customersData = customersSnap.docs.map(c => {
          const cData = c.data();
          return {
            id: c.id,
            status: cData.status,
            waitTime: cData.waitTime || 0,
            createdAt: cData.createdAt?.toDate ? cData.createdAt.toDate() : new Date(cData.createdAt),
            ...cData,
          };
        });

        allCustomers = allCustomers.concat(customersData);
      }

      setCustomers(allCustomers);
    } catch (err) {
      console.error(err);
    }
  }, [shop, shopId]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // ---------- Pull-to-refresh ----------
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchShop(), fetchCustomers()]);
    setRefreshing(false);
  }, [fetchShop, fetchCustomers]);

  // Open modal animation
  const openAnalysisModal = () => {
    setAnalysisVisible(true);
    fadeAnim.setValue(0);
    slideAnim.setValue(height);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeAnalysisModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setAnalysisVisible(false));
  };

  // ---------- Analysis ----------
  const handleAnalysis = async () => {
    if (!shop) {
      Alert.alert('Error', 'Shop data not loaded yet.');
      return;
    }

    if (!customers || customers.length === 0) {
      Alert.alert('Please wait', 'Customer data is still loading.');
      return;
    }

    setIsAnalyzing(true);
    openAnalysisModal(); // open modal first
    // simulate loading
    setTimeout(() => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

      const todayCustomers = customers.filter(c => {
        const created = new Date(c.createdAt);
        return created >= todayStart && created < todayEnd;
      });

      const waitingCount = todayCustomers.filter(c => c.status === 'waiting').length;

      const avgWaitTime =
        todayCustomers.length > 0
          ? Math.round(todayCustomers.reduce((sum, c) => sum + (c.waitTime || 15), 0) / todayCustomers.length)
          : 0;

      setAnalysisData({
        todayCount: todayCustomers.length,
        totalCount: customers.length,
        waitingCount,
        avgWaitingTime: avgWaitTime,
      });

      setIsAnalyzing(false);
    }, 800);
  };

  const handleLogout = async () => {
      setLoading(true);
      try {
        await logout();
        router.replace("/login");
      } catch (err) {
        console.error(err);
        Alert.alert("Logout Failed", "Please try again.");
        setLoading(false);
      }
  }

  // ---------- Typing Ionicons name prop ----------
  type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

  const settingsOptions: { icon: IoniconName; title: string; onPress: () => void }[] = [
    { icon: 'person-outline', title: 'Profile', onPress: () => router.push('/profile') },
    { icon: 'notifications-outline', title: 'Notifications', onPress: () => {} },
    { icon: 'color-palette-outline', title: 'Theme', onPress: () => {} },
    { icon: 'help-circle-outline', title: 'Help & Support', onPress: () => {} },
    { icon: 'bar-chart-outline', title: 'Analysis', onPress: handleAnalysis },
  ];

  // ---------- Typing StatCard ----------
  type StatCardProps = {
    title: string;
    value: string | number;
    icon: React.ComponentType<{ size?: number; color?: string }>;
    color: string;
  };

  const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color }) => (
    <Animated.View 
      style={[
        styles.statCard,
        { borderLeftColor: color, opacity: fadeAnim }
      ]}
    >
      <View style={styles.statCardContent}>
        <View>
          <Text style={styles.statCardTitle}>{title}</Text>
          <Text style={styles.statCardValue}>{value}</Text>
        </View>
        <View style={[styles.statIconContainer, { backgroundColor: `${color}20`, marginLeft: -30 }]}>
          <Icon size={24} color={color} />
        </View>
      </View>
    </Animated.View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2C6BED" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <LinearGradient colors={['#6a11cb', '#2575fc']} style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>Manage your account and preferences</Text>
      </LinearGradient>

      {/* Settings Options */}
      <View style={styles.settingsContainer}>
        {settingsOptions.map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={item.onPress}
            style={styles.optionButton}
            disabled={item.title === 'Analysis' && isAnalyzing}
          >
            <Ionicons name={item.icon} size={24} color="#4a6cff" />
            <Text style={styles.optionText}>{item.title}</Text>
            {item.title === 'Analysis' && isAnalyzing ? (
              <ActivityIndicator size="small" color="#4a6cff" style={styles.optionSpinner} />
            ) : (
              <MaterialIcons name="keyboard-arrow-right" size={24} color="#ccc" style={styles.optionArrow} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout Button */}
      <View style={styles.logoutContainer}>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={22} color="white" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Analysis Modal */}
      <Modal visible={analysisVisible} transparent animationType="none" onRequestClose={closeAnalysisModal}>
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.modalContent,
              { 
                transform: [{ translateY: slideAnim }],
                opacity: fadeAnim,
                height: '100%',
              }
            ]}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Performance Analytics</Text>
              <TouchableOpacity onPress={closeAnalysisModal} style={styles.closeButton}>
                <X size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {isAnalyzing ? (
              <View style={{flex:1, justifyContent:'center', alignItems:'center', marginTop:50}}>
                <ActivityIndicator size="large" color="#4a6cff"/>
                <Text style={{marginTop:10, fontSize:16, color:'#374151'}}>Analyzing...</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                <View style={styles.statsGrid}>
                  <View style={styles.statColumn}>
                    <StatCard title="Today's Customers" value={analysisData.todayCount} icon={Users} color="#4a6cff" />
                  </View>
                  <View style={styles.statColumn}>
                    <StatCard title="Total Customers" value={analysisData.totalCount} icon={BarChart3} color="#10b981" />
                  </View>
                  <View style={styles.statColumn}>
                    <StatCard title="Waiting Customers" value={analysisData.waitingCount} icon={User} color="#f59e0b" />
                  </View>
                  <View style={styles.statColumn}>
                    <StatCard title="Avg Wait Time" value={`${analysisData.avgWaitingTime} min`} icon={Clock4} color="#ef4444" />
                  </View>
                </View>

                {/* Insights */}
                <View style={styles.insightsContainer}>
                  <Text style={styles.insightsTitle}>Performance Insights</Text>
                  {analysisData.todayCount > 0 ? (
                    <>
                      <View style={styles.insightItem}>
                        <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                        <Text style={styles.insightText}>Today's customers: <Text style={styles.insightHighlight}>{analysisData.todayCount}</Text></Text>
                      </View>
                      <View style={styles.insightItem}>
                        <Ionicons name="time" size={18} color="#f59e0b" />
                        <Text style={styles.insightText}>Average wait time: <Text style={styles.insightHighlight}>{analysisData.avgWaitingTime} minutes</Text></Text>
                      </View>
                      {analysisData.waitingCount > 0 ? (
                        <View style={styles.insightItem}>
                          <Ionicons name="alert-circle" size={18} color="#ef4444" />
                          <Text style={styles.insightText}><Text style={styles.insightHighlight}>{analysisData.waitingCount} customers</Text> currently waiting</Text>
                        </View>
                      ) : (
                        <View style={styles.insightItem}>
                          <Ionicons name="happy" size={18} color="#10b981" />
                          <Text style={styles.insightText}>No customers currently waiting</Text>
                        </View>
                      )}
                    </>
                  ) : (
                    <View style={styles.insightItem}>
                      <Ionicons name="information-circle" size={18} color="#4a6cff" />
                      <Text style={styles.insightText}>No customer data available for today</Text>
                    </View>
                  )}
                </View>

                <View style={styles.actionButtonsContainer}>
                  <TouchableOpacity style={styles.secondaryButton} onPress={onRefresh}>
                    <Text style={styles.secondaryButtonText}>Refresh Data</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primaryButton} onPress={closeAnalysisModal}>
                    <Text style={styles.primaryButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </Animated.View>
        </View>
      </Modal>
    </ScrollView>
  );
};

// Keep your existing styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loadingText: { marginTop: 15, fontSize: 16, color: '#666' },
  header: { paddingVertical: 40, paddingHorizontal: 24, alignItems: 'flex-start' },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: 'white', marginBottom: 8 },
  headerSubtitle: { fontSize: 16, color: 'rgba(255, 255, 255, 0.9)' },
  settingsContainer: { marginTop: 24, paddingHorizontal: 16 },
  optionButton: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: 'white', borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2, marginBottom: 12, borderWidth: 1, borderColor: '#f3f4f6' },
  optionText: { marginLeft: 16, fontSize: 18, fontWeight: '500', color: '#374151' },
  optionSpinner: { marginLeft: 'auto' },
  optionArrow: { marginLeft: 'auto' },
  logoutContainer: { paddingHorizontal: 16, marginTop: 32, marginBottom: 40 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ef4444', padding: 16, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  logoutText: { marginLeft: 12, color: 'white', fontWeight: '600', fontSize: 18 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalContent: { backgroundColor: 'white', padding: 24, width: '100%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
  closeButton: { padding: 8 },
  statsScrollView: { flex: 1 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  statColumn: { width: '48%', marginBottom: 16 },
  statCard: { backgroundColor: 'white', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, borderLeftWidth: 4 },
  statCardContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statCardTitle: { color: '#6b7280', fontSize: 14, fontWeight: '500', marginBottom: 4 },
  statCardValue: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
  statIconContainer: { padding: 12, borderRadius: 999 },
  insightsContainer: { backgroundColor: '#eef2ff', borderRadius: 16, padding: 20, marginBottom: 24 },
  insightsTitle: { fontSize: 18, fontWeight: '600', color: '#3730a3', marginBottom: 16 },
  insightItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  insightText: { marginLeft: 12, color: '#4b5563', fontSize: 16 },
  insightHighlight: { fontWeight: '600', color: '#1f2937' },
  actionButtonsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  primaryButton: { flex: 1, backgroundColor: '#4f46e5', padding: 16, borderRadius: 12, alignItems: 'center', marginLeft: 8 },
  primaryButtonText: { color: 'white', fontWeight: '600' },
  secondaryButton: { flex: 1, backgroundColor: '#e0e7ff', padding: 16, borderRadius: 12, alignItems: 'center', marginRight: 8 },
  secondaryButtonText: { color: '#4f46e5', fontWeight: '600' },
});

export default Setting;
