
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { db } from '../../../firebaseConfig';
import AlertCard from './AlertCard';

// alerts state will replace the previous hardcoded `alertsData`

const severityLevels = ['Critical', 'High', 'Moderate', 'Low'];
const severityColors: Record<string, { text: string; border: string }> = {
  Critical: { text: '#e53935', border: '#FFCDD2' },
  High: { text: '#FF6F00', border: '#FFE0B2' },
  Moderate: { text: '#F9A825', border: '#FFF9C4' }, 
  Low: { text: '#1565C0', border: '#BBDEFB' }, 
};

export default function AlertsScreen() {
  const router = useRouter();
  const { theme, isDark, isHighContrast, toggleTheme } = useTheme(); // Theme Hook
  const [pushEnabled, setPushEnabled] = useState(true);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [activeFilters, setActiveFilters] = useState(['Critical', 'High', 'Moderate', 'Low']);

  const toggleFilter = (level: string) => {
    setActiveFilters(prev =>
      prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
    );
  };

  useEffect(() => {
    let mounted = true;
    const loadAlerts = async () => {
      try {
        const snap = await getDocs(collection(db, 'alerts'));
        const items = snap.docs.map((doc: any) => {
          const d: any = doc.data();
          // Normalize fields to match existing UI expectations (use `level`)
          const severity = d.severity || d.level || 'Low';

          // Handle timestamp which can be Firestore Timestamp or ISO string
          let dateStr = '';
          if (d.timestamp) {
            try {
              let dt: Date;
              if ((d.timestamp as any).toDate) {
                dt = (d.timestamp as any).toDate();
              } else if (typeof d.timestamp === 'string') {
                dt = new Date(d.timestamp);
              } else {
                dt = new Date();
              }
              dateStr = dt.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
            } catch (e) {
              dateStr = '';
            }
          }

          // Map Firestore document to alert object expected by AlertCard
          return {
            id: doc.id,
            title: d.title || d.name || 'Untitled Alert',
            level: severity,
            // derive simple colors from severity mapping when possible
            levelColor: severityColors[severity]?.text || '#000',
            levelBg: severityColors[severity]?.border || '#fff',
            icon: d.icon || '⚠️',
            iconBg: d.iconBg || (severityColors[severity]?.border || '#fff'),
            desc: d.description || d.desc || '',
            time: d.predictedTime || d.time || '',
            date: dateStr || (d.date || ''),
            confidence: typeof d.confidence === 'number' ? d.confidence : (d.confidencePercent || 0),
            confidenceColor: d.confidenceColor || '#43a047',
            action: d.action || '',
            actionDesc: d.actionDesc || '',
            actionBg: d.actionBg || '#FFF',
            // include raw firestore fields for debugging or future use
            _raw: d,
          };
        });
        if (mounted) setAlerts(items);
      } catch (err) {
        console.warn('Failed to load alerts from Firestore', err);
      }
    };

    loadAlerts();
    return () => { mounted = false; };
  }, []);

  const filteredAlerts = alerts.filter(a => activeFilters.includes(a.level));

  const handleViewHistory = () => {
    router.push('/user/alerts/alert-history' as any);
  };

  const handleSOS = () => {
    const msg = '🚨 SOS TRIGGERED 🚨\n\nEmergency services and your emergency contacts have been notified.';
    if (Platform.OS === 'web') {
      window.alert(msg);
    } else {
      Alert.alert('🚨 SOS EMERGENCY 🚨', msg, [{ text: 'OK', style: 'destructive' }]);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Top Bar */}
      <View style={[styles.topBar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Text style={styles.logoText}>🏃</Text>
        <Text style={[styles.location, { color: theme.text }]}>📍 Karachi, Pakistan</Text>
        <TouchableOpacity style={[styles.darkBtn, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }]} onPress={toggleTheme}>
          <Text style={styles.darkBtnText}>{isDark ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {/* Header */}
        <View style={styles.titleRow}>
          <View>
            <Text style={[styles.pageTitle, { color: theme.text }]}>Future Alerts</Text>
            <Text style={[styles.pageSubtitle, { color: isHighContrast ? '#FFFFFF' : theme.secondaryText }]}>Forecast-based disaster predictions for the next 72 hours</Text>
          </View>
          <Text style={styles.bellIcon}>🔔</Text>
        </View>

        {/* Alert Cards */}
        {filteredAlerts.length === 0 ? (
          <Text style={{ textAlign: 'center', padding: 20, color: isHighContrast ? '#FFFFFF' : theme.secondaryText }}>
            No alerts match your selected filters.
          </Text>
        ) : (
          filteredAlerts.map((a, i) => (
            <AlertCard
              key={a.id ?? i}
              alert={a}
              isDark={isDark}
              isHighContrast={isHighContrast}
              theme={theme}
            />
          ))
        )}

        {/* Notification Preferences */}
        <View style={[styles.prefCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.prefTitle, { color: theme.text }]}>Notification Preferences</Text>
          <View style={styles.prefRow}>
            <View>
              <Text style={[styles.prefLabel, { color: theme.text }]}>Push Notifications</Text>
              <Text style={[styles.prefSub, { color: isHighContrast ? '#FFFFFF' : theme.secondaryText }]}>Real-time alerts on your device</Text>
            </View>
            <TouchableOpacity 
              style={[styles.toggle, pushEnabled ? styles.toggleOn : { backgroundColor: isHighContrast ? '#000000' : isDark ? theme.border : theme.bg, borderColor: isHighContrast ? '#FFFFFF' : 'transparent', borderWidth: isHighContrast ? 1 : 0 }]} 
              onPress={() => setPushEnabled(!pushEnabled)}
            >
              <View style={[styles.toggleThumb, pushEnabled && styles.toggleThumbOn]} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.filterLabel, { color: theme.text }]}>Alert Severity Filter</Text>
          <View style={styles.filterRow}>
            {severityLevels.map((level) => {
              const active = activeFilters.includes(level);
              return (
                <TouchableOpacity 
                  key={level} 
                  style={[
                    styles.filterBtn, 
                    { borderColor: theme.border },
                    active && { borderColor: severityColors[level].text, backgroundColor: severityColors[level].text }
                  ]} 
                  onPress={() => toggleFilter(level)}
                >
                  <Text style={[styles.filterText, active ? { color: '#FFFFFF' } : { color: isHighContrast ? '#FFFFFF' : theme.text }]}>{level}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity style={[styles.historyBtn, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={handleViewHistory}>
          <Text style={[styles.historyText, { color: theme.text }]}>View Alert History</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        {[
          { icon: 'home', label: 'Home', route: '/user' },
          { icon: 'map', label: 'Map', route: '/user/map' },
          { icon: 'alert-circle', label: 'Alerts', active: true, route: '/user/alerts/alerts' },
          { icon: 'message-circle', label: 'Chat', route: '/user/chat' },
          { icon: 'user', label: 'Profile', route: '/user/profile/profile' },
        ].map((tab, i) => (
          <TouchableOpacity key={i} style={styles.tabItem} onPress={() => { if (!tab.active) router.push(tab.route as any); }}>
            <Feather name={tab.icon as any} size={22} color={tab.active ? theme.text : isHighContrast ? '#FFFFFF' : '#6B7280'} style={styles.tabIcon} />
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
  scroll: { flex: 1 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  pageTitle: { fontSize: 22, fontWeight: '800' },
  pageSubtitle: { fontSize: 12, marginTop: 2, maxWidth: 260 },
  bellIcon: { fontSize: 22 },
  prefCard: { borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1 },
  prefTitle: { fontSize: 16, fontWeight: '700', marginBottom: 16 },
  prefRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  prefLabel: { fontSize: 14, fontWeight: '600' },
  prefSub: { fontSize: 12, marginTop: 2 },
  toggle: { width: 50, height: 28, borderRadius: 14, justifyContent: 'center', paddingHorizontal: 3 },
  toggleOn: { backgroundColor: '#CC2200' },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'white' },
  toggleThumbOn: { alignSelf: 'flex-end' },
  filterLabel: { fontSize: 13, fontWeight: '600', marginBottom: 10 },
  filterRow: { flexDirection: 'row', gap: 10 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 13, fontWeight: '500' },
  historyBtn: { borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, marginBottom: 16 },
  historyText: { fontSize: 15, fontWeight: '600' },
  tabBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', borderTopWidth: 1, paddingVertical: 8, paddingBottom: 24 },
  tabItem: { flex: 1, alignItems: 'center' },
  tabIcon: { fontSize: 20, marginBottom: 2 },
  tabLabel: { fontSize: 11 },
  sosBtn: { position: 'absolute', bottom: 100, right: 16, width: 48, height: 48, borderRadius: 24, backgroundColor: '#e53935', alignItems: 'center', justifyContent: 'center' },
  sosText: { color: 'white', fontWeight: '900', fontSize: 22 },
});