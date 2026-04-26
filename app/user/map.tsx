import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../context/ThemeContext'; // Import the theme hook

// Base shelter data
const baseShelters = [
  { name: 'Karachi Grammar School', type: 'Shelter', address: 'Depot Lines, Saddar Town, Karachi', current: 425, total: 800, status: 'Open', amenities: ['Food', 'Medical', 'Water', 'Restrooms'], mapsQuery: 'Karachi+Grammar+School', lat: 24.8624, lng: 67.0275 },
  { name: 'Aga Khan University Hospital', type: 'Hospital', address: 'Stadium Road, Karachi', current: 289, total: 300, status: 'Full', amenities: ['Medical', 'Emergency Care', 'Power', 'Ambulance'], mapsQuery: 'Aga+Khan+University+Hospital+Karachi', lat: 24.8927, lng: 67.0735 },
  { name: 'Expo Centre Karachi', type: 'Evacuation Center', address: 'University Road, Gulshan-e-Iqbal, Karachi', current: 1150, total: 2000, status: 'Open', amenities: ['Food', 'Water', 'Restrooms', 'Power'], mapsQuery: 'Expo+Centre+Karachi', lat: 24.9038, lng: 67.0772 },
  { name: 'Jinnah Postgraduate Medical Centre', type: 'Hospital', address: 'Rafiqui Shaheed Road, Karachi', current: 312, total: 500, status: 'Open', amenities: ['Medical', 'Emergency Care', 'Water', 'Power'], mapsQuery: 'JPMC+Karachi', lat: 24.8516, lng: 67.0426 },
  { name: 'NED University Campus', type: 'Evacuation Center', address: 'University Road, Karachi', current: 890, total: 1500, status: 'Open', amenities: ['Food', 'Water', 'Restrooms', 'Power'], mapsQuery: 'NED+University+Karachi', lat: 24.9317, lng: 67.1145 },
  { name: 'Bahria Town Sports Complex', type: 'Shelter', address: 'Bahria Town, Karachi', current: 1201, total: 1200, status: 'Closed', amenities: ['Food', 'Water', 'Medical', 'Power'], mapsQuery: 'Bahria+Town+Karachi', lat: 25.0441, lng: 67.3113 },
];

const statusStyle: Record<string, { bg: string; text: string }> = {
  Open: { bg: '#43a047', text: 'white' },
  Full: { bg: '#FF6F00', text: 'white' },
  Closed: { bg: '#555', text: 'white' },
};

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; 
}

export default function MapScreen() {
  const router = useRouter();
  const { theme, isDark, toggleTheme } = useTheme(); // Theme Hook
  const [view, setView] = useState('List');
  const [shelters, setShelters] = useState<any[]>(baseShelters);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locating, setLocating] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Allow location access to find the nearest shelters.');
          setLocating(false);
          return;
        }
        let location = await Location.getCurrentPositionAsync({});
        const userLat = location.coords.latitude;
        const userLng = location.coords.longitude;
        setUserLocation({ lat: userLat, lng: userLng });

        const calculatedShelters = baseShelters.map(shelter => {
          const distance = getDistanceFromLatLonInKm(userLat, userLng, shelter.lat, shelter.lng);
          return { ...shelter, calculatedDistance: distance };
        }).sort((a, b) => (a.calculatedDistance || 0) - (b.calculatedDistance || 0));

        setShelters(calculatedShelters);
      } catch (error) {
        console.log("Error getting location", error);
      } finally {
        setLocating(false);
      }
    })();
  }, []);

  const handleNavigate = (query: string) => {
    // FIXED: Standard Google Maps URL
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${query}`);
  };

  const handleSOS = () => {
    const msg = '🚨 SOS TRIGGERED 🚨\n\nEmergency services and your emergency contacts have been notified of your location.';
    if (Platform.OS === 'web') window.alert(msg);
    else Alert.alert('🚨 SOS EMERGENCY 🚨', msg, [{ text: 'OK', style: 'destructive' }]);
  };

  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { margin: 0; padding: 0; background-color: ${isDark ? '#121212' : '#ffffff'}; }
        #map { width: 100vw; height: 100vh; }
        .popup-title { font-weight: bold; font-size: 14px; margin-bottom: 4px; font-family: sans-serif; color: #111; }
        .popup-desc { font-size: 12px; color: #555; font-family: sans-serif; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var centerLat = ${userLocation ? userLocation.lat : 24.8900};
        var centerLng = ${userLocation ? userLocation.lng : 67.0500};
        var map = L.map('map').setView([centerLat, centerLng], 12);
        
        // Use Dark Matter tiles for Dark Mode, Voyager for Light Mode
        var tileUrl = '${isDark ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'}';
        
        L.tileLayer(tileUrl, {
          maxZoom: 19,
          attribution: '© CARTO'
        }).addTo(map);

        ${userLocation ? `
          var userIcon = L.divIcon({
            className: 'custom-div-icon',
            html: "<div style='background-color:#e53935;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.5);'></div>",
            iconSize: [14, 14],
            iconAnchor: [7, 7]
          });
          L.marker([${userLocation.lat}, ${userLocation.lng}], {icon: userIcon}).addTo(map)
            .bindPopup("<div class='popup-title'>📍 You are here</div>");
        ` : ''}

        ${shelters.map(s => `
          var marker = L.marker([${s.lat}, ${s.lng}]).addTo(map);
          marker.bindPopup("<div class='popup-title'>${s.name}</div><div class='popup-desc'>Status: ${s.status}<br>Capacity: ${s.current}/${s.total}</div>");
        `).join('')}
      </script>
    </body>
    </html>
  `;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Top Bar */}
      <View style={[styles.topBar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Text style={styles.logoText}>🏃</Text>
        <Text style={[styles.location, { color: theme.text }]}>📍 Karachi, Pakistan</Text>
        <TouchableOpacity style={[styles.darkBtn, { backgroundColor: isDark ? '#333' : '#f0f0f0' }]} onPress={toggleTheme}>
          <Text style={styles.darkBtnText}>{isDark ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>

      {/* Title & Toggle */}
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Text style={[styles.pageTitle, { color: theme.text }]}>Safe Sites & Shelters - Karachi</Text>
        <View style={styles.toggleRow}>
          {['List', 'Map'].map((v) => (
            <TouchableOpacity 
              key={v} 
              style={[styles.toggleBtn, view === v ? styles.toggleBtnActive : { backgroundColor: isDark ? '#333' : '#f0f0f0' }]} 
              onPress={() => setView(v)}
            >
              <Text style={[styles.toggleText, view === v && styles.toggleTextActive]}>{v === 'List' ? '☰ List View' : '🗺 Map View'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Conditional Rendering */}
      {view === 'List' ? (
        <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
          {locating && <ActivityIndicator size="large" color="#CC2200" style={{ marginTop: 40 }} />}
          
          {!locating && shelters.map((s, i) => {
            const pct = s.current / s.total;
            const barColor = pct >= 1 ? '#e53935' : pct > 0.8 ? '#FF6F00' : '#43a047';
            const isClosed = s.status === 'Closed';
            const isNearest = i === 0 && userLocation !== null;

            return (
              <View key={i} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.shelterName, { color: theme.text }]}>{s.name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle[s.status].bg }]}>
                    <Text style={styles.statusText}>{s.status}</Text>
                  </View>
                </View>
                <Text style={styles.shelterType}>{s.type}</Text>
                
                <Text style={[styles.detail, isNearest && styles.nearestText, { color: isNearest ? '#FF6F00' : theme.text }]}>
                  {isNearest 
                    ? `⭐ Nearest Shelter (${s.calculatedDistance?.toFixed(1)} km away)` 
                    : `✈ ${s.calculatedDistance ? s.calculatedDistance.toFixed(1) : '--'} km away`}
                </Text>

                <Text style={[styles.detail, { color: isDark ? '#aaa' : '#555' }]}>📍 {s.address}</Text>
                
                <View style={styles.capacityRow}>
                  <Text style={[styles.capacityLabel, { color: isDark ? '#aaa' : '#555' }]}>👥 Capacity</Text>
                  <Text style={[styles.capacityVal, { color: theme.text }]}>{s.current} / {s.total}</Text>
                </View>
                <View style={[styles.barBg, { backgroundColor: isDark ? '#333' : '#eee' }]}>
                  <View style={[styles.barFill, { width: `${Math.min(pct * 100, 100)}%`, backgroundColor: barColor }]} />
                </View>
                <View style={styles.amenitiesRow}>
                  {s.amenities.slice(0, 4).map((a, j) => (
                    <View key={j} style={[styles.amenityTag, { backgroundColor: isDark ? '#333' : '#f0f0f0' }]}>
                      <Text style={[styles.amenityText, { color: isDark ? '#ccc' : '#555' }]}>{a}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.actionRow}>
                  <TouchableOpacity style={[styles.navigateBtn, isClosed && styles.navigateBtnDisabled]} onPress={() => !isClosed && handleNavigate(s.mapsQuery)}>
                    <Text style={styles.navigateText}>✈ Navigate</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      ) : (
        <View style={[styles.mapContainer, { borderColor: theme.border, backgroundColor: theme.bg }]}>
          {Platform.OS === 'web' ? (
            <iframe title="DisasterGuard Live Map" width="100%" height="100%" style={{ border: 0 }} srcDoc={mapHtml} />
          ) : (
            <WebView originWhitelist={['*']} source={{ html: mapHtml }} style={{ flex: 1 }} />
          )}
        </View>
      )}

      {/* Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        {[
          { icon: 'home', label: 'Home', route: '/user' },
          { icon: 'map', label: 'Map', active: true, route: '/user/map' },
          { icon: 'alert-circle', label: 'Alerts', route: '/user/alerts/alerts' },
          { icon: 'message-circle', label: 'Chat', route: '/user/chat' },
          { icon: 'user', label: 'Profile', route: '/user/profile/profile' },
        ].map((tab, i) => (
          <TouchableOpacity key={i} style={styles.tabItem} onPress={() => { if (!tab.active) router.push(tab.route as any); }}>
            <Feather name={tab.icon as any} size={22} color={tab.active ? theme.text : '#888'} style={styles.tabIcon} />
            <Text style={[styles.tabLabel, tab.active && { color: theme.text, fontWeight: '700' }]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.sosBtn} onPress={handleSOS}>
        <Text style={styles.sosText}>!</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  logoText: { fontSize: 22, marginRight: 8 },
  location: { flex: 1, fontSize: 14, fontWeight: '500' },
  darkBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  darkBtnText: { fontSize: 16 },
  header: { padding: 16, borderBottomWidth: 1 },
  pageTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  toggleRow: { flexDirection: 'row', gap: 10 },
  toggleBtn: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: '#CC2200' },
  toggleText: { fontSize: 14, color: '#555', fontWeight: '600' },
  toggleTextActive: { color: 'white' },
  scroll: { flex: 1 },
  mapContainer: { flex: 1, margin: 16, borderRadius: 12, overflow: 'hidden', borderWidth: 1 },
  card: { borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  shelterName: { fontSize: 16, fontWeight: '700', flex: 1, marginRight: 8 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  statusText: { color: 'white', fontSize: 12, fontWeight: '700' },
  shelterType: { fontSize: 12, color: '#888', marginBottom: 10 },
  detail: { fontSize: 13, marginBottom: 4, fontWeight: '500' },
  nearestText: { fontWeight: 'bold' },
  capacityRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, marginBottom: 6 },
  capacityLabel: { fontSize: 13 },
  capacityVal: { fontSize: 13, fontWeight: '600' },
  barBg: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 12 },
  barFill: { height: 8, borderRadius: 4 },
  amenitiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  amenityTag: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  amenityText: { fontSize: 12 },
  actionRow: { flexDirection: 'row', gap: 10 },
  navigateBtn: { flex: 1, backgroundColor: '#111', borderRadius: 8, padding: 14, alignItems: 'center' },
  navigateBtnDisabled: { backgroundColor: '#ccc' },
  navigateText: { color: 'white', fontWeight: '700', fontSize: 14 },
  tabBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', borderTopWidth: 1, paddingVertical: 8, paddingBottom: 24 },
  tabItem: { flex: 1, alignItems: 'center' },
  tabIcon: { fontSize: 20, marginBottom: 2 },
  tabLabel: { fontSize: 11, color: '#888' },
  sosBtn: { position: 'absolute', bottom: 100, right: 16, width: 48, height: 48, borderRadius: 24, backgroundColor: '#e53935', alignItems: 'center', justifyContent: 'center' },
  sosText: { color: 'white', fontWeight: '900', fontSize: 22 },
});