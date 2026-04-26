import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { db } from '../../firebaseConfig';

type LiveAlert = {
  source: 'firebase' | 'gdacs';
  name: string;
  severity: string;
  description: string;
  locations: string[];
};

function extractGdacsEvent(payload: any) {
  const candidates = Array.isArray(payload?.features)
    ? payload.features
    : Array.isArray(payload?.events)
      ? payload.events
      : Array.isArray(payload?.data)
        ? payload.data
        : [];

  for (const item of candidates) {
    const fields = item?.properties ?? item;
    const countryChunks = [
      fields?.country,
      fields?.fromcountry,
      fields?.tocountry,
      fields?.where?.country,
      fields?.iso3,
    ]
      .filter(Boolean)
      .map((v: any) => String(v).toLowerCase());

    const isPakistanEvent = countryChunks.some((v: string) => v.includes('pakistan'));
    if (!isPakistanEvent) continue;

    return {
      name: fields?.eventname || fields?.name || fields?.title || 'GDACS Pakistan Alert',
      severity: fields?.alertlevel || fields?.severity || fields?.episodealertlevel || 'Moderate',
    };
  }

  return null;
}

export default function UserHome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, isDark, toggleTheme } = useTheme();
  const [liveAlert, setLiveAlert] = useState<LiveAlert | null>(null);
  const [isLoadingAlert, setIsLoadingAlert] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const currentUserLocation = 'Clifton';

  const fetchAlertData = useCallback(async () => {
    setIsLoadingAlert(true);

    try {
      const gdacsPromise = fetch('https://www.gdacs.org/gdacsapi/api/events/geteventlist/json').then((res) => res.json());
      const firebasePromise = getDocs(query(collection(db, 'alerts'), orderBy('createdAt', 'desc'), limit(1)));

      const [gdacsPayload, firebaseSnapshot] = await Promise.all([gdacsPromise, firebasePromise]);

      let firebaseAlert: LiveAlert | null = null;
      if (!firebaseSnapshot.empty) {
        const doc = firebaseSnapshot.docs[0].data() as any;
        const locationField = typeof doc?.location === 'string'
          ? doc.location
          : typeof doc?.locations === 'string'
            ? doc.locations
            : '';

        const locationList = locationField
          ? locationField.split(',').map((s: string) => s.trim()).filter(Boolean)
          : [];

        firebaseAlert = {
          source: 'firebase',
          name: doc?.title || doc?.name || 'Local Alert',
          severity: doc?.severity || 'Critical',
          description: doc?.description || 'Local authorities have issued an alert for your area.',
          locations: locationList,
        };
      }

      const gdacsEvent = extractGdacsEvent(gdacsPayload);
      const gdacsAlert: LiveAlert | null = gdacsEvent
        ? {
            source: 'gdacs',
            name: gdacsEvent.name,
            severity: gdacsEvent.severity,
            description: 'Global disaster event detected. Please stay tuned for local updates.',
            locations: ['Pakistan'],
          }
        : null;

      if (firebaseAlert) {
        setLiveAlert(firebaseAlert);
      } else if (gdacsAlert) {
        setLiveAlert(gdacsAlert);
      } else {
        setLiveAlert(null);
      }
    } catch (error) {
      setLiveAlert(null);
    } finally {
      setIsLoadingAlert(false);
    }
  }, []);

  useEffect(() => {
    fetchAlertData();
  }, [fetchAlertData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAlertData();
    setRefreshing(false);
  }, [fetchAlertData]);

  const affectedAreas = liveAlert?.source === 'firebase'
    ? (liveAlert.locations.length ? liveAlert.locations : ['No neighborhood details available'])
    : liveAlert?.source === 'gdacs'
      ? (liveAlert.locations.length ? liveAlert.locations : ['Pakistan'])
      : ['No active alerts'];

  const isHighRisk = !!(
    liveAlert?.source === 'firebase' &&
    liveAlert.locations.some((loc) => loc.toLowerCase().includes(currentUserLocation.toLowerCase()))
  );

  // SOS Button Action
  const handleSOS = () => {
    if (Platform.OS === 'web') {
      window.alert('🚨 SOS TRIGGERED 🚨\n\nEmergency services and your emergency contacts have been notified of your location.');
    } else {
      Alert.alert(
        '🚨 SOS EMERGENCY 🚨',
        'Emergency services and your emergency contacts have been notified of your location.',
        [{ text: 'OK', style: 'destructive' }]
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Top Bar */}
      <View style={[styles.topBar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Feather name="activity" size={24} color={theme.text} style={styles.logoIcon} />
        <View style={styles.locationRow}>
          <Feather name="map-pin" size={16} color={theme.text} style={{ marginRight: 4 }} />
          <Text style={[styles.location, { color: theme.text }]}>Karachi, Pakistan</Text>
        </View>
        <TouchableOpacity
          style={[styles.darkBtn, { backgroundColor: theme.bg, borderColor: theme.border }]}
          onPress={toggleTheme}
        >
          <Feather name={isDark ? 'sun' : 'moon'} size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 96 + insets.bottom }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.text} />}
      >
        {/* Title */}
        <Text style={[styles.pageTitle, { color: theme.text }]}>Emergency Dashboard</Text>
        <Text style={[styles.pageSubtitle, { color: theme.text, opacity: 0.65 }]}>Real-time disaster updates for Karachi</Text>

        {/* Active Emergency Banner */}
        <View
          style={[
            styles.emergencyBanner,
            !isHighRisk && { backgroundColor: isDark ? '#263238' : '#1565C0' },
          ]}
        >
          <View style={styles.bannerLeft}>
            <Feather name="alert-triangle" size={20} color="white" style={styles.bannerIcon} />
            <View>
              <Text style={styles.bannerTitle}>{isHighRisk ? 'EVACUATE NOW' : 'ALERT STATUS'}</Text>
              <Text style={styles.bannerSub}>
                {isLoadingAlert ? 'Checking global and local feeds...' : liveAlert?.name ?? 'No active alerts'}
              </Text>
            </View>
          </View>
          {isLoadingAlert ? (
            <ActivityIndicator size="small" color="white" />
          ) : isHighRisk ? (
            <View style={styles.criticalBadge}>
              <Text style={styles.criticalText}>High Risk</Text>
            </View>
          ) : null}
        </View>

        {/* Alert Card */}
        <View style={[styles.alertCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.alertHeader}>
            <Feather name="alert-triangle" size={20} color="#e53935" style={styles.alertIcon} />
            <Text style={[styles.alertTitle, { color: theme.text }]}>{liveAlert?.name ?? 'No active alerts'}</Text>
          </View>
          <Text style={[styles.alertDesc, { color: theme.text, opacity: 0.8 }]}>
            {isLoadingAlert
              ? 'Checking global and neighborhood alerts...'
              : liveAlert?.source === 'firebase'
                ? liveAlert.description
                : liveAlert?.source === 'gdacs'
                  ? `GDACS reports a Pakistan event with ${liveAlert.severity} severity. Please stay tuned for local updates.`
                  : 'No active alerts at the moment. Please check back later for updates.'}
          </Text>
          <View style={[styles.expiryBox, { backgroundColor: theme.bg }]}>
            <Text style={[styles.expiryLabel, { color: theme.text, opacity: 0.65 }]}>Alert Expires In</Text>
            <View style={styles.expiryTimeRow}>
              <Feather name="clock" size={14} color="#e53935" />
              <Text style={styles.expiryTime}> -1230h -31m</Text>
            </View>
            <View style={[styles.progressBg, { backgroundColor: theme.border }]}>
              <View style={styles.progressFill} />
            </View>
          </View>
          
          {/* Evacuate Button - Routes to Map */}
          <TouchableOpacity 
            style={styles.evacuateBtn}
            onPress={() => router.push('/user/map')}
          >
            <View style={styles.evacuateContent}>
              <Feather name="navigation" size={18} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.evacuateText}>EVACUATE NOW</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Current Location Status */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Current Location Status</Text>
          <View style={styles.locationStatusRow}>
            <Feather name="map-pin" size={16} color={theme.text} style={{ marginRight: 4 }} />
            <Text style={[styles.locationText, { color: theme.text }]}>Block 5, {currentUserLocation}, Karachi</Text>
          </View>
          <View style={styles.riskRow}>
            <Feather name="alert-triangle" size={16} color={isHighRisk ? '#e53935' : '#43a047'} style={{ marginRight: 6 }} />
            <Text style={[styles.riskText, { color: isHighRisk ? '#e53935' : '#43a047' }]}>
              {isLoadingAlert
                ? 'Assessing latest risk...'
                : isHighRisk
                  ? 'High Risk Zone - Evacuation Required'
                  : 'No immediate neighborhood risk detected'}
            </Text>
          </View>
        </View>

        {/* Affected Areas */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Affected Areas</Text>
          {affectedAreas.map((area, i) => (
            <View key={i} style={[styles.areaRow, { backgroundColor: theme.bg }]}>
              <View style={styles.areaDot} />
              <Text style={[styles.areaText, { color: theme.text }]}>{area}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickRow}>
          {/* Find Shelter - Routes to Map */}
          <TouchableOpacity 
            style={[styles.quickBtn, { backgroundColor: theme.card, borderColor: theme.border }]} 
            onPress={() => router.push('/user/map')}
          >
            <Feather name="map-pin" size={24} color={theme.text} style={styles.quickIcon} />
            <Text style={[styles.quickText, { color: theme.text }]}>Find Shelter</Text>
          </TouchableOpacity>
          
          {/* View Alerts - Routes to Alerts */}
          <TouchableOpacity 
            style={[styles.quickBtn, { backgroundColor: theme.card, borderColor: theme.border }]} 
            onPress={() => router.push('/user/alerts/alerts')}
          >
            <Feather name="alert-circle" size={24} color={theme.text} style={styles.quickIcon} />
            <Text style={[styles.quickText, { color: theme.text }]}>View Alerts</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Tab Bar */}
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: '#ffffff',
            borderTopColor: theme.border,
            paddingBottom: Math.max(insets.bottom, 8),
            height: 60 + insets.bottom,
          },
        ]}
      >
        {[
          { icon: 'home', label: 'Home', active: true, route: '/user' },
          { icon: 'map', label: 'Map', route: '/user/map' },
          { icon: 'alert-circle', label: 'Alerts', route: '/user/alerts/alerts' },
          { icon: 'message-circle', label: 'Chat', route: '/user/chat' },
          { icon: 'user', label: 'Profile', route: '/user/profile/profile' },
        ].map((tab, i) => (
          <TouchableOpacity key={i} style={styles.tabItem} onPress={() => { if (!tab.active) router.push(tab.route as any); }}>
            <Feather name={tab.icon as any} size={22} color={tab.active ? theme.text : '#888'} style={styles.tabIcon} />
            <Text
              style={[
                styles.tabLabel,
                { color: theme.text, opacity: tab.active ? 1 : 0.65 },
                tab.active && styles.tabLabelActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* SOS Button */}
      <TouchableOpacity style={[styles.sosBtn, { bottom: 76 + insets.bottom }]} onPress={handleSOS}>
        <Text style={styles.sosText}>!</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  logoIcon: { marginRight: 8 },
  locationRow: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  location: { fontSize: 14, fontWeight: '500' },
  darkBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 80 },
  pageTitle: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  pageSubtitle: { fontSize: 13, marginBottom: 16 },
  emergencyBanner: { backgroundColor: '#e53935', borderRadius: 10, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  bannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  bannerIcon: { marginRight: 2 },
  bannerTitle: { color: 'white', fontWeight: '800', fontSize: 13 },
  bannerSub: { color: 'rgba(255,255,255,0.85)', fontSize: 11, marginTop: 2 },
  criticalBadge: { backgroundColor: 'white', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  criticalText: { color: '#e53935', fontWeight: '700', fontSize: 12 },
  alertCard: { borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1.5 },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  alertIcon: { marginRight: 2 },
  alertTitle: { fontSize: 16, fontWeight: '700' },
  alertDesc: { fontSize: 13, lineHeight: 20, marginBottom: 14 },
  expiryBox: { borderRadius: 8, padding: 12, marginBottom: 14 },
  expiryLabel: { fontSize: 12, marginBottom: 4 },
  expiryTimeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  expiryTime: { fontSize: 13, color: '#e53935', fontWeight: '600' },
  progressBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, width: '30%', backgroundColor: '#e53935', borderRadius: 3 },
  evacuateBtn: { backgroundColor: '#e53935', borderRadius: 10, padding: 16, alignItems: 'center' },
  evacuateContent: { flexDirection: 'row', alignItems: 'center' },
  evacuateText: { color: 'white', fontWeight: '800', fontSize: 16, letterSpacing: 1 },
  card: { borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  locationStatusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  locationText: { fontSize: 14, fontWeight: '500', marginBottom: 6 },
  riskRow: { flexDirection: 'row', alignItems: 'center' },
  riskText: { fontSize: 13, color: '#e65100', fontWeight: '500' },
  areaRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, padding: 12, marginBottom: 8, gap: 10 },
  areaDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#e53935' },
  areaText: { fontSize: 14, fontWeight: '500' },
  quickRow: { flexDirection: 'row', gap: 12 },
  quickBtn: { flex: 1, borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 1 },
  quickIcon: { marginBottom: 8 },
  quickText: { fontSize: 14, fontWeight: '600' },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 12,
  },
  tabItem: { flex: 1, alignItems: 'center' },
  tabIcon: { marginBottom: 2 },
  tabLabel: { fontSize: 11 },
  tabLabelActive: { fontWeight: '700' },
  sosBtn: { position: 'absolute', bottom: 80, right: 16, width: 48, height: 48, borderRadius: 24, backgroundColor: '#e53935', alignItems: 'center', justifyContent: 'center' },
  sosText: { color: 'white', fontWeight: '900', fontSize: 22 },
});