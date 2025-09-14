import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { db, auth } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import QRCode from 'react-native-qrcode-svg';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy'; // Use legacy API
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function Profile() {
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const qrRef = useRef<QRCode>(null);

  useEffect(() => {
    const fetchShop = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'shops'),
          where('ownerId', '==', auth.currentUser?.uid)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const shopData = querySnapshot.docs[0].data();
          setShop({ id: querySnapshot.docs[0].id, ...shopData });
        } else {
          setShop(null);
        }
      } catch (error) {
        console.error('Error fetching shop:', error);
        Alert.alert('Error', 'Failed to fetch shop details');
      } finally {
        setLoading(false);
      }
    };

    fetchShop();
  }, []);

  const saveQrToGallery = async () => {
    if (!qrRef.current || !shop) return;

    qrRef.current.toDataURL(async (data: string) => {
      try {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission denied',
            'Cannot save QR code without permission'
          );
          return;
        }

        const path = `${FileSystem.cacheDirectory}${shop.name}_QR.png`;
        await FileSystem.writeAsStringAsync(path, data, { encoding: 'base64' });
        await MediaLibrary.saveToLibraryAsync(path);

        Alert.alert('Success', 'QR code saved to gallery!');
      } catch (error) {
        console.error(error);
        Alert.alert('Error', 'Failed to save QR code');
      }
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a6cff" />
        <Text style={styles.loadingText}>Loading your shop details...</Text>
      </View>
    );
  }

  if (!shop) {
    return (
      <View style={styles.noShopContainer}>
        <LinearGradient colors={['#6a11cb', '#2575fc']} style={styles.gradient}>
          <Ionicons name="business-outline" size={80} color="white" />
          <Text style={styles.message}>No shop registered yet.</Text>
          <Text style={styles.subMessage}>
            Please register your shop first to generate a QR code.
          </Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <LinearGradient colors={['#6a11cb', '#2575fc']} style={styles.header}>
        <Ionicons name="storefront" size={50} color="white" />
        <Text style={styles.shopName}>{shop.name}</Text>
        <Text style={styles.ownerName}>
          {auth.currentUser?.displayName || auth.currentUser?.email}
        </Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Shop Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Shop Information</Text>
          <View style={styles.infoItem}>
            <Ionicons name="location" size={20} color="#666" />
            <Text style={styles.infoText}>{shop.address}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="navigate" size={20} color="#666" />
            <Text style={styles.infoText}>
              Lat: {shop.location.latitude.toFixed(4)}, Lon:{' '}
              {shop.location.longitude.toFixed(4)}
            </Text>
          </View>
        </View>

        {/* QR Code */}
        <View style={styles.qrCard}>
          <Text style={styles.qrTitle}>Shop QR Code</Text>
          <QRCode
            value={shop.id || shop.name}
            size={220}
            getRef={qrRef}
            backgroundColor="white"
            color="#4a6cff"
          />
          <TouchableOpacity style={styles.downloadButton} onPress={saveQrToGallery}>
            <Ionicons name="download-outline" size={22} color="white" />
            <Text style={styles.downloadText}>Save QR Code</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: { marginTop: 15, fontSize: 16, color: '#666' },
  noShopContainer: { flex: 1 },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 80,
  },
  message: { fontSize: 22, color: 'white', marginTop: 20, textAlign: 'center' },
  subMessage: { fontSize: 16, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 10 },
  container: { flexGrow: 1, backgroundColor: '#f8f9fa' },
  header: {
    paddingVertical: 40,
    alignItems: 'center',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  shopName: { fontSize: 28, color: 'white', fontWeight: '700', marginTop: 10 },
  ownerName: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 5 },
  content: { padding: 20 },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
  },
  infoTitle: { fontSize: 18, fontWeight: '600', marginBottom: 15 },
  infoItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  infoText: { marginLeft: 10, fontSize: 16, color: '#333' },
  qrCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  qrTitle: { fontSize: 18, fontWeight: '600', marginBottom: 15 },
  downloadButton: {
    flexDirection: 'row',
    backgroundColor: '#4a6cff',
    padding: 12,
    borderRadius: 12,
    marginTop: 20,
    alignItems: 'center',
  },
  downloadText: { color: 'white', fontWeight: '600', marginLeft: 10, fontSize: 16 },
});
