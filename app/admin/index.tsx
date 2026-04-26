import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import AdminLayout from './components/AdminLayout';

const initialAlerts = [
  { id: '1', title: 'Flood - Critical', location: 'Saddar Town', time: '30 mins ago', color: '#e53935' },
  { id: '2', title: 'Heat Wave - High', location: 'Citywide', time: '2 hours ago', color: '#e53935' },
  { id: '3', title: 'Earthquake - Moderate', location: 'North Karachi', time: '5 hours ago', color: '#9e9e9e' },
];

const MOBILE_BREAKPOINT = 900;

export default function AdminOverviewScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width <= MOBILE_BREAKPOINT;

  const [alerts, setAlerts] = useState(initialAlerts);
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [editingAlert, setEditingAlert] = useState<any>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editLocation, setEditLocation] = useState('');

  const handleOpenEdit = (alert: any) => {
    setEditingAlert(alert);
    setEditTitle(alert.title);
    setEditLocation(alert.location);
    setEditModalVisible(true);
  };

  const handleUpdateAlert = () => {
    if (!editingAlert) return;

    const updatedAlerts = alerts.map((a) => (a.id === editingAlert.id ? { ...a, title: editTitle, location: editLocation } : a));
    setAlerts(updatedAlerts);
    setEditModalVisible(false);
  };

  return (
    <AdminLayout>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 30 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.statsGrid, isMobile && styles.statsGridMobile]}>
          <View style={[styles.statCard, isMobile && styles.statCardMobile]}>
            <Feather name="alert-triangle" size={28} color="#e53935" style={{ marginBottom: 10 }} />
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>Active Alerts</Text>
            <Text style={styles.statSubRed}>+2 today</Text>
          </View>
          <View style={[styles.statCard, isMobile && styles.statCardMobile]}>
            <Feather name="users" size={28} color="#1e88e5" style={{ marginBottom: 10 }} />
            <Text style={styles.statNumber}>12,547</Text>
            <Text style={styles.statLabel}>Total Users</Text>
            <Text style={styles.statSubGreen}>+234 this week</Text>
          </View>
          <View style={[styles.statCard, isMobile && styles.statCardMobile]}>
            <Feather name="home" size={28} color="#43a047" style={{ marginBottom: 10 }} />
            <Text style={styles.statNumber}>18</Text>
            <Text style={styles.statLabel}>Active Shelters</Text>
            <Text style={styles.statSubGreen}>5 at capacity</Text>
          </View>
          <View style={[styles.statCard, isMobile && styles.statCardMobile]}>
            <Feather name="trending-up" size={28} color="#fb8c00" style={{ marginBottom: 10 }} />
            <Text style={styles.statNumber}>3,892</Text>
            <Text style={styles.statLabel}>People Evacuated</Text>
            <Text style={styles.statSubGreen}>Today</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Disaster Alerts</Text>
            <TouchableOpacity onPress={() => router.push('/admin/alerts')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          {alerts.map((alert) => (
            <View key={alert.id} style={styles.alertRow}>
              <View style={[styles.dot, { backgroundColor: alert.color }]} />
              <View style={styles.alertInfo}>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text style={styles.alertSub}>{alert.location} • {alert.time}</Text>
              </View>
              <TouchableOpacity style={styles.editBtn} onPress={() => handleOpenEdit(alert)}>
                <Text style={styles.editIcon}>✏️</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shelter Capacity Overview</Text>
            <TouchableOpacity onPress={() => router.push('/admin/shelters')}>
              <Text style={styles.viewAll}>Manage Shelters</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.progressBlock}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Karachi Grammar School</Text>
              <Text style={styles.progressLabel}>425/800</Text>
            </View>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { width: '53%', backgroundColor: '#4caf50' }]} />
            </View>
          </View>

          <View style={styles.progressBlock}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Expo Centre</Text>
              <Text style={styles.progressLabel}>1150/2000</Text>
            </View>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { width: '57%', backgroundColor: '#4caf50' }]} />
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal visible={isEditModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Alert</Text>

            <Text style={styles.inputLabel}>Alert Title</Text>
            <TextInput style={styles.input} value={editTitle} onChangeText={setEditTitle} />

            <Text style={styles.inputLabel}>Location</Text>
            <TextInput style={styles.input} value={editLocation} onChangeText={setEditLocation} />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.updateBtn} onPress={handleUpdateAlert}>
                <Text style={styles.updateText}>Update Alert</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f5f6f8' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },
  statsGrid: { flexDirection: 'row', gap: 16, marginBottom: 20, flexWrap: 'wrap' },
  statsGridMobile: { flexDirection: 'column', gap: 12 },
  statCard: { flex: 1, minWidth: 180, backgroundColor: 'white', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#eee' },
  statCardMobile: { width: '100%', minWidth: 0, alignSelf: 'center' },
  statNumber: { fontSize: 28, fontWeight: 'bold', color: '#111' },
  statLabel: { fontSize: 14, color: '#555', marginTop: 4, flexWrap: 'wrap' },
  statSubRed: { fontSize: 12, color: '#e53935', marginTop: 8, flexWrap: 'wrap' },
  statSubGreen: { fontSize: 12, color: '#4caf50', marginTop: 8, flexWrap: 'wrap' },
  section: { backgroundColor: 'white', borderRadius: 12, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#eee' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: '#111', flexShrink: 1, paddingRight: 10 },
  viewAll: { color: '#888', fontSize: 18 },
  alertRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', padding: 15, borderRadius: 8, marginBottom: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 15 },
  alertInfo: { flex: 1, minWidth: 0 },
  alertTitle: { fontSize: 18, fontWeight: '700', color: '#111', flexWrap: 'wrap' },
  alertSub: { fontSize: 14, color: '#888', marginTop: 4, flexWrap: 'wrap' },
  editBtn: { padding: 8, backgroundColor: '#fff', borderRadius: 6, borderWidth: 1, borderColor: '#ddd' },
  editIcon: { fontSize: 16 },
  progressBlock: { marginBottom: 16 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 14, color: '#333', fontWeight: '500' },
  barBg: { height: 8, backgroundColor: '#eee', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { width: '100%', maxWidth: 460, backgroundColor: 'white', borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 24, fontWeight: '800', marginBottom: 16 },
  inputLabel: { fontSize: 14, color: '#555', marginBottom: 6, fontWeight: '500' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  cancelText: { color: '#555', fontWeight: '700', fontSize: 16 },
  updateBtn: { backgroundColor: '#111', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  updateText: { color: 'white', fontWeight: '700', fontSize: 16 },
});
