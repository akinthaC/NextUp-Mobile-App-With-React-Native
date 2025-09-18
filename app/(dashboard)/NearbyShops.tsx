import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
  TextInput,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { Ionicons, MaterialIcons, FontAwesome, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

type Shop = {
  id: string;
  name: string;
  address: string;
  contact: string;
  location: { latitude: number; longitude: number };
  category: string;
};

const categories = [
  { label: 'All', value: '', icon: 'md-grid', iconType: 'ionicons', color: '#6366F1' },
  { label: 'Salon', value: 'salon', icon: 'cut', iconType: 'ionicons', color: '#EC4899' },
  { label: 'Restaurant', value: 'restaurant', icon: 'restaurant', iconType: 'ionicons', color: '#10B981' },
  { label: 'Grocery', value: 'grocery', icon: 'cart', iconType: 'ionicons', color: '#F59E0B' },
  { label: 'Electronics', value: 'electronics', icon: 'laptop', iconType: 'ionicons', color: '#3B82F6' },
  { label: 'Clothing', value: 'clothing', icon: 'shirt', iconType: 'ionicons', color: '#8B5CF6' },
];

export default function NearbyShops() {
  const [currentLoc, setCurrentLoc] = useState<{ latitude: number; longitude: number } | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [filtered, setFiltered] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const RADIUS_KM = 5;

  // Haversine distance (km)
  const distanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission denied', 'Enable location services to view nearby shops.');
          setLoading(false);
          return;
        }

        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const myLoc = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setCurrentLoc(myLoc);

        // Fetch shops
        const snap = await getDocs(collection(db, 'shops'));
        const allShops: Shop[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

        // Filter by distance
        const nearby = allShops.filter(
          (s) =>
            distanceKm(
              myLoc.latitude,
              myLoc.longitude,
              s.location.latitude,
              s.location.longitude
            ) <= RADIUS_KM
        );

        setShops(nearby);
        setFiltered(nearby);
      } catch (e) {
        console.error(e);
        Alert.alert('Error', 'Could not load nearby shops.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Search & category filter
  useEffect(() => {
    let list = shops;
    if (selectedCategory) {
      list = list.filter((s) => s.category === selectedCategory);
    }
    if (search.trim()) {
      const term = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(term) ||
          s.address.toLowerCase().includes(term)
      );
    }
    setFiltered(list);
  }, [search, selectedCategory, shops]);

  const openInMaps = (shop: Shop) => {
    if (!currentLoc) return;
    const googleURL = `https://www.google.com/maps/dir/?api=1&origin=${currentLoc.latitude},${currentLoc.longitude}&destination=${shop.location.latitude},${shop.location.longitude}`;
    const appleURL = `http://maps.apple.com/?saddr=${currentLoc.latitude},${currentLoc.longitude}&daddr=${shop.location.latitude},${shop.location.longitude}`;

    if (Platform.OS === 'ios') {
      Alert.alert('Open in Maps', 'Choose an app', [
        { text: 'Google Maps', onPress: () => Linking.openURL(googleURL) },
        { text: 'Apple Maps', onPress: () => Linking.openURL(appleURL) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } else {
      Linking.openURL(googleURL);
    }
  };

  const getIconComponent = (iconType: string, iconName: string, color: string) => {
    switch (iconType) {
      case 'ionicons':
        return <Ionicons name={iconName} size={16} color={color} />;
      case 'material':
        return <MaterialIcons name={iconName} size={16} color={color} />;
      case 'fontawesome':
        return <FontAwesome name={iconName} size={16} color={color} />;
      case 'fontawesome5':
        return <FontAwesome5 name={iconName} size={16} color={color} />;
      case 'materialcommunity':
        return <MaterialCommunityIcons name={iconName} size={16} color={color} />;
      default:
        return <Ionicons name={iconName} size={16} color={color} />;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Finding nearby shops...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nearby Shops</Text>
        <View style={styles.headerIcon}>
          <Ionicons name="location" size={20} color="#6366F1" />
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Search input */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search shops by name or address..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Mini Category buttons */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoryContainer}
          contentContainerStyle={styles.categoryContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.value}
              style={[
                styles.categoryButton,
                selectedCategory === category.value && { 
                  backgroundColor: category.color + '20',
                  borderColor: category.color,
                }
              ]}
              onPress={() => setSelectedCategory(category.value)}
            >
              <View style={[
                styles.categoryIconContainer,
                { backgroundColor: selectedCategory === category.value ? category.color : '#F3F4F6' }
              ]}>
                {getIconComponent(
                  category.iconType, 
                  category.icon, 
                  selectedCategory === category.value ? '#FFFFFF' : category.color
                )}
              </View>
              <Text style={[
                styles.categoryLabel,
                selectedCategory === category.value && { color: category.color, fontWeight: '600' }
              ]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Results count */}
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsText}>
            {filtered.length} {filtered.length === 1 ? 'shop' : 'shops'} found
            {selectedCategory ? ` in ${categories.find(c => c.value === selectedCategory)?.label}` : ''}
          </Text>
        </View>

        {currentLoc && (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: currentLoc.latitude,
              longitude: currentLoc.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            <Marker coordinate={currentLoc} title="You are here">
              <View style={styles.currentMarker}>
                <Ionicons name="person-circle" size={28} color="#6366F1" />
              </View>
            </Marker>
            {filtered.map((shop) => (
              <Marker
                key={shop.id}
                coordinate={shop.location}
                title={shop.name}
                description={shop.address}
                onCalloutPress={() => openInMaps(shop)}
              >
                <View style={styles.shopMarker}>
                  <Ionicons name="location" size={18} color="#EF4444" />
                </View>
              </Marker>
            ))}
          </MapView>
        )}

        <View style={styles.shopsContainer}>
          <Text style={styles.sectionTitle}>Nearby Shops</Text>
          {filtered.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={40} color="#D1D5DB" />
              <Text style={styles.emptyText}>No shops found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your search or category</Text>
            </View>
          ) : (
            filtered.map((item) => (
              <TouchableOpacity 
                key={item.id}
                style={styles.shopCard} 
                onPress={() => openInMaps(item)}
                activeOpacity={0.7}
              >
                <View style={styles.shopHeader}>
                  <Text style={styles.shopName}>{item.name}</Text>
                  <View style={[
                    styles.categoryBadge,
                    { backgroundColor: categories.find(c => c.value === item.category)?.color + '20' }
                  ]}>
                    <Text style={[
                      styles.categoryBadgeText,
                      { color: categories.find(c => c.value === item.category)?.color }
                    ]}>
                      {item.category}
                    </Text>
                  </View>
                </View>
                <View style={styles.shopInfoRow}>
                  <Ionicons name="location-outline" size={14} color="#6B7280" />
                  <Text style={styles.shopInfo}>{item.address}</Text>
                </View>
                <View style={styles.shopInfoRow}>
                  <Ionicons name="call-outline" size={14} color="#6B7280" />
                  <Text style={styles.shopInfo}>{item.contact}</Text>
                </View>
                <View style={styles.shopAction}>
                  <Text style={styles.directionText}>Get directions</Text>
                  <Ionicons name="arrow-forward-circle" size={20} color="#6366F1" />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F9FAFB' 
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827'
  },
  headerIcon: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#EEF2FF'
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    borderRadius: 10,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: '#111827'
  },
  categoryContainer: {
    marginBottom: 12,
  },
  categoryContent: {
    paddingHorizontal: 12,
  },
  categoryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    minWidth: 70,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  resultsContainer: {
    paddingHorizontal: 16,
    marginBottom: 12
  },
  resultsText: {
    fontSize: 13,
    color: '#6B7280'
  },
  map: { 
    height: 180, 
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  currentMarker: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  shopMarker: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  shopsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12
  },
  shopCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  shopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  shopName: { 
    fontSize: 16, 
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  shopInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  shopInfo: { 
    color: '#6B7280',
    marginLeft: 6,
    fontSize: 13,
    flex: 1
  },
  shopAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6'
  },
  directionText: {
    color: '#6366F1',
    fontWeight: '600',
    fontSize: 13
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 12
  },
  emptySubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4
  }
});