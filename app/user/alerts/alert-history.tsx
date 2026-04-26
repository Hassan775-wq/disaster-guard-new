import { useRouter } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { db } from '../../../firebaseConfig';

export default function AlertHistoryScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'alerts'));
      const fetchedAlerts: any[] = [];
      querySnapshot.forEach((doc) => {
        fetchedAlerts.push({ id: doc.id, ...doc.data() });
      });
      
      // Sort by date (newest first)
      fetchedAlerts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setAlerts(fetchedAlerts);
    } catch (error) {
      console.error("Error fetching alerts: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Top Bar with Back Button */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.push('/user/alerts')} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Alert History</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text style={styles.desc}>Archive of past emergency broadcasts and warnings.</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#CC2200" style={{ marginTop: 40 }} />
        ) : alerts.length === 0 ? (
          <Text style={styles.emptyText}>No past alerts found in the database.</Text>
        ) : (
          alerts.map((alert) => (
            <View key={alert.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[
                  styles.badge, 
                  (alert.severity?.toLowerCase() === 'high' || alert.severity?.toLowerCase() === 'critical') 
                    ? styles.badgeHigh 
                    : styles.badgeNormal
                ]}>
                  <Text style={styles.badgeText}>{alert.severity} Severity</Text>
                </View>
                <Text style={styles.dateText}>{alert.date}</Text>
              </View>
              <Text style={styles.alertTitle}>{alert.title}</Text>
              <Text style={styles.alertMessage}>{alert.message}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  topBar: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee' },
  backBtn: { paddingRight: 16 },
  backBtnText: { fontSize: 16, color: '#1565C0', fontWeight: '600' },
  pageTitle: { fontSize: 18, fontWeight: '700', color: '#111' },
  scroll: { flex: 1 },
  desc: { fontSize: 14, color: '#555', marginBottom: 20 },
  emptyText: { textAlign: 'center', color: '#888', marginTop: 40, fontSize: 15 },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#eee' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#f0f0f0' },
  badgeHigh: { backgroundColor: '#FFEBEE' },
  badgeNormal: { backgroundColor: '#FFF3E0' },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#333', textTransform: 'capitalize' },
  dateText: { fontSize: 12, color: '#888' },
  alertTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 6, textTransform: 'capitalize' },
  alertMessage: { fontSize: 14, color: '#444', lineHeight: 20 },
});