import { useRouter } from 'expo-router';
import { collection, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { db } from '../../firebaseConfig';
import AdminLayout from './components/AdminLayout';

const MOBILE_BREAKPOINT = 900;

export default function AdminAlerts() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width <= MOBILE_BREAKPOINT;

  const [alertsList, setAlertsList] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'alerts'), (snapshot) => {
      const alerts = snapshot.docs.map((alertDoc) => {
        const data = alertDoc.data();
        const severity = data.severity || 'Moderate';
        const normalizedSeverity = String(severity).toLowerCase();
        const color =
          normalizedSeverity === 'critical'
            ? '#ef4444'
            : normalizedSeverity === 'warning'
              ? '#f97316'
              : '#eab308';

        return {
          id: alertDoc.id,
          title: data.title || 'Untitled Alert',
          location: data.location || 'Unknown location',
          severity,
          time: 'Live',
          color,
        };
      });

      setAlertsList(alerts);
    });

    return unsubscribe;
  }, []);

  const handleCreateAlert = () => {
    router.push('/admin/create-alert');
  };

  const handleResolve = async (id: string, title: string) => {
    try {
      await deleteDoc(doc(db, 'alerts', id));
      if (Platform.OS === 'web') window.alert(`Resolved: ${title}`);
      else Alert.alert('Resolved', `${title} has been resolved and removed.`);
    } catch (error) {
      console.error('Error resolving alert:', error);
      if (Platform.OS === 'web') window.alert('Failed to resolve alert.');
      else Alert.alert('Error', 'Failed to resolve alert.');
    }
  };

  return (
    <AdminLayout>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 30 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, isMobile && styles.headerMobile]}>
          <View style={styles.titleWrap}>
            <Text style={styles.pageTitle}>Alert Management</Text>
            <Text style={styles.pageSubtitle}>Monitor and broadcast active disaster alerts</Text>
          </View>

          <TouchableOpacity style={[styles.primaryButton, isMobile && styles.primaryButtonMobile]} onPress={handleCreateAlert}>
            <Text style={styles.primaryButtonText}>+ Create New Alert</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listContainer}>
          {alertsList.length === 0 ? (
            <Text style={styles.emptyText}>All alerts resolved!</Text>
          ) : (
            alertsList.map((alert) => (
              <View key={alert.id} style={[styles.card, isMobile && styles.cardMobile]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.badge, { backgroundColor: `${alert.color}20` }]}>
                    <Text style={[styles.badgeText, { color: alert.color }]}>{alert.severity}</Text>
                  </View>
                  <Text style={styles.timeText}>{alert.time}</Text>
                </View>

                <Text style={styles.cardTitle}>{alert.title}</Text>
                <Text style={styles.cardLocation}>📍 {alert.location}</Text>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() =>
                      router.push({
                        pathname: '/admin/edit-alert',
                        params: { id: alert.id },
                      })
                    }
                  >
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.actionButton, styles.actionButtonDanger]} onPress={() => handleResolve(alert.id, alert.title)}>
                    <Text style={styles.actionButtonDangerText}>Resolve</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f5f6f8' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 20 },
  headerMobile: { flexDirection: 'column', alignItems: 'flex-start' },
  titleWrap: { flex: 1 },
  pageTitle: { fontSize: 42, fontWeight: '800', color: '#111827' },
  pageSubtitle: { fontSize: 16, color: '#6b7280', marginTop: 4 },
  primaryButton: { backgroundColor: '#111827', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
  primaryButtonMobile: { width: '100%', alignItems: 'center' },
  primaryButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 18 },
  listContainer: { gap: 16 },
  emptyText: { textAlign: 'center', marginTop: 20, color: '#6b7280', fontSize: 16 },
  card: {
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardMobile: { width: '100%' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  badge: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 18 },
  badgeText: { fontSize: 14, fontWeight: '700', textTransform: 'lowercase' },
  timeText: { fontSize: 16, color: '#9ca3af' },
  cardTitle: { fontSize: 24, fontWeight: '800', color: '#1f2937', marginBottom: 6 },
  cardLocation: { fontSize: 16, color: '#4b5563', marginBottom: 16 },
  cardActions: { flexDirection: 'row', gap: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 16 },
  actionButton: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10, backgroundColor: '#f3f4f6' },
  actionButtonText: { color: '#374151', fontWeight: '700', fontSize: 16 },
  actionButtonDanger: { backgroundColor: '#fef2f2' },
  actionButtonDangerText: { color: '#ef4444', fontWeight: '700', fontSize: 16 },
});
