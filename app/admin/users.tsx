import { useRouter } from 'expo-router';
import { collection, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { db } from '../../firebaseConfig';
import AdminLayout from './components/AdminLayout';

const statusColor: Record<string, { bg: string; text: string }> = {
  SAFE: { bg: '#e8f5e9', text: '#2e7d32' },
  EVACUATING: { bg: '#fff3e0', text: '#e65100' },
  'NEEDS HELP': { bg: '#ffebee', text: '#c62828' },
};

const filterOptions = ['All Statuses', 'SAFE', 'EVACUATING', 'NEEDS HELP'];
const MOBILE_BREAKPOINT = 900;

export default function UserManagement() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width <= MOBILE_BREAKPOINT;

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<'SAFE' | 'EVACUATING' | 'NEEDS HELP' | null>(null);
  const [statusUpdated, setStatusUpdated] = useState<'SAFE' | 'EVACUATING' | 'NEEDS HELP' | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const data = snapshot.docs.map((userDoc, i) => {
          const rawStatus = String(userDoc.data().status || 'SAFE').toUpperCase();
          const normalizedStatus = rawStatus === 'EVACUATING' || rawStatus === 'NEEDS HELP' || rawStatus === 'SAFE' ? rawStatus : 'SAFE';

          const name = userDoc.data().name || 'Unknown User';
          return {
            id: userDoc.id,
            displayId: `user-${String(i + 1).padStart(3, '0')}`,
            name,
            phone: userDoc.data().phone || 'No phone',
            email: userDoc.data().email || `${String(name).toLowerCase().replace(' ', '.')}@example.com`,
            location: userDoc.data().address || userDoc.data().location || 'Unknown Location',
            status: normalizedStatus,
            lastActive: userDoc.data().lastActive || 'Recently active',
          };
        });

        setUsers(data);
        setLoading(false);
      },
      (error) => {
        console.error('Failed to subscribe to users:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All Statuses' || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const safe = users.filter((u) => u.status === 'SAFE').length;
  const evacuating = users.filter((u) => u.status === 'EVACUATING').length;
  const needsHelp = users.filter((u) => u.status === 'NEEDS HELP').length;

  const handleFilterToggle = () => {
    const currentIndex = filterOptions.indexOf(statusFilter);
    const nextIndex = (currentIndex + 1) % filterOptions.length;
    setStatusFilter(filterOptions[nextIndex]);
  };

  const closeActionModal = () => {
    setIsModalVisible(false);
    setSelectedUser(null);
    setStatusUpdating(null);
    setStatusUpdated(null);
  };

  const handleOpenActions = (user: any) => {
    setSelectedUser(user);
    setStatusUpdated(null);
    setIsModalVisible(true);
  };

  const updateUserStatus = async (userId: string, newStatus: 'SAFE' | 'EVACUATING' | 'NEEDS HELP') => {
    setStatusUpdating(newStatus);
    try {
      await updateDoc(doc(db, 'users', userId), { status: newStatus });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u)));
      setSelectedUser((prev: any) => (prev ? { ...prev, status: newStatus } : prev));
      setStatusUpdated(newStatus);
    } catch (error) {
      console.error('Failed to update user status:', error);
      Alert.alert('Error', 'Failed to update user status.');
    } finally {
      setStatusUpdating(null);
    }
  };

  const handleUpdateStatus = async (status: 'SAFE' | 'EVACUATING' | 'NEEDS HELP') => {
    if (!selectedUser) return;
    await updateUserStatus(selectedUser.id, status);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      await deleteDoc(doc(db, 'users', selectedUser.id));
      setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
      closeActionModal();
    } catch (error) {
      console.error('Failed to delete user:', error);
      Alert.alert('Error', 'Failed to delete user.');
    }
  };

  return (
    <AdminLayout>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 30 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>User Management</Text>
        <Text style={styles.pageSubtitle}>Monitor and manage registered users</Text>

        <View style={styles.statsRow}>
          {[
            { label: 'Total Users', value: String(users.length), color: '#111' },
            { label: 'Safe', value: String(safe), color: '#2e7d32' },
            { label: 'Evacuating', value: String(evacuating), color: '#e65100' },
            { label: 'Needs Help', value: String(needsHelp), color: '#c62828' },
          ].map((s, i) => (
            <View key={i} style={[styles.statCard, isMobile && styles.statCardMobile]}>
              <Text style={styles.statLabel}>{s.label}</Text>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.searchRow, isMobile && styles.searchRowMobile]}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search users by name or email..."
            placeholderTextColor="#aaa"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          <TouchableOpacity style={[styles.filterBox, isMobile && styles.filterBoxMobile]} onPress={handleFilterToggle}>
            <Text style={styles.filterText}>{statusFilter}</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <Text style={styles.infoText}>Loading users...</Text>
        ) : filteredUsers.length === 0 ? (
          <Text style={styles.infoText}>No users found matching your criteria.</Text>
        ) : isMobile ? (
          <View style={styles.mobileList}>
            {filteredUsers.map((u) => (
              <View key={u.id} style={styles.mobileUserCard}>
                <View style={styles.mobileUserHeader}>
                  <View style={styles.mobileNameBlock}>
                    <Text style={styles.userName}>{u.name}</Text>
                    <Text style={styles.userId}>ID: {u.displayId}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: statusColor[u.status]?.bg }]}>
                    <Text style={[styles.badgeText, { color: statusColor[u.status]?.text }]}>{u.status}</Text>
                  </View>
                </View>

                <Text style={styles.mobileDetail}>📞 {u.phone}</Text>
                <Text style={styles.mobileDetail}>✉️ {u.email}</Text>
                <Text style={styles.mobileDetail}>📍 {u.location}</Text>
                <Text style={styles.mobileLastActive}>Last active: {u.lastActive}</Text>

                <TouchableOpacity onPress={() => handleOpenActions(u)} style={styles.mobileActionButton}>
                  <Text style={styles.mobileActionText}>Manage User</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              {['USER', 'CONTACT', 'LOCATION', 'STATUS', 'LAST ACTIVE', 'ACTIONS'].map((h, i) => (
                <Text key={i} style={[styles.tableHeaderText, i === 0 && { flex: 2 }]}>
                  {h}
                </Text>
              ))}
            </View>

            {filteredUsers.map((u) => (
              <View key={u.id} style={styles.tableRow}>
                <View style={[styles.cell, styles.cellUser, { flex: 2 }]}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>👤</Text>
                  </View>
                  <View>
                    <Text style={styles.userName}>{u.name}</Text>
                    <Text style={styles.userId}>ID: {u.displayId}</Text>
                  </View>
                </View>
                <View style={styles.cell}>
                  <Text style={styles.cellText}>📞 {u.phone}</Text>
                  <Text style={styles.cellText}>✉️ {u.email}</Text>
                </View>
                <View style={styles.cell}>
                  <Text style={styles.cellText}>📍 {u.location}</Text>
                </View>
                <View style={styles.cell}>
                  <View style={[styles.badge, { backgroundColor: statusColor[u.status]?.bg }]}>
                    <Text style={[styles.badgeText, { color: statusColor[u.status]?.text }]}>{u.status}</Text>
                  </View>
                </View>
                <View style={styles.cell}>
                  <Text style={styles.cellText}>{u.lastActive}</Text>
                </View>
                <View style={styles.cell}>
                  <TouchableOpacity onPress={() => handleOpenActions(u)} style={styles.actionButton}>
                    <Text style={styles.actionDots}>⋮</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={isModalVisible} transparent animationType="fade" onRequestClose={closeActionModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>User Actions</Text>
            <Text style={styles.modalUserName}>{selectedUser?.name || 'Unknown User'}</Text>

            <Text style={styles.modalSectionTitle}>Update Status</Text>
            {statusUpdated ? (
              <View style={styles.statusUpdatedRow}>
                <Text style={styles.statusUpdatedText}>✓ Status updated to {statusUpdated}</Text>
              </View>
            ) : null}
            <View style={[styles.statusButtonRow, isMobile && styles.statusButtonRowMobile]}>
              <TouchableOpacity style={[styles.statusBtn, styles.statusBtnSafe]} onPress={() => void handleUpdateStatus('SAFE')} disabled={statusUpdating !== null}>
                {statusUpdating === 'SAFE' ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.statusBtnText}>{statusUpdated === 'SAFE' ? '✓ Safe' : 'Safe'}</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={[styles.statusBtn, styles.statusBtnEvacuating]} onPress={() => void handleUpdateStatus('EVACUATING')} disabled={statusUpdating !== null}>
                {statusUpdating === 'EVACUATING' ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.statusBtnText}>{statusUpdated === 'EVACUATING' ? '✓ Evacuating' : 'Evacuating'}</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={[styles.statusBtn, styles.statusBtnNeedsHelp]} onPress={() => void handleUpdateStatus('NEEDS HELP')} disabled={statusUpdating !== null}>
                {statusUpdating === 'NEEDS HELP' ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.statusBtnText}>{statusUpdated === 'NEEDS HELP' ? '✓ Needs Help' : 'Needs Help'}</Text>}
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteUser}>
              <Text style={styles.deleteBtnText}>Delete User</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={closeActionModal}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f5f6f8' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20 },
  pageTitle: { fontSize: 42, fontWeight: '800', color: '#111827' },
  pageSubtitle: { fontSize: 16, color: '#6b7280', marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16, flexWrap: 'wrap' },
  statCard: { width: '24%', minWidth: 160, backgroundColor: 'white', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#eee' },
  statCardMobile: { width: '48%', minWidth: 0 },
  statLabel: { fontSize: 14, color: '#888', marginBottom: 6 },
  statValue: { fontSize: 34, fontWeight: '800' },
  searchRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  searchRowMobile: { flexDirection: 'column' },
  searchInput: { flex: 1, backgroundColor: 'white', borderRadius: 10, borderWidth: 1, borderColor: '#eee', padding: 14, fontSize: 16 },
  filterBox: { backgroundColor: 'white', borderRadius: 10, borderWidth: 1, borderColor: '#eee', padding: 14, justifyContent: 'center' },
  filterBoxMobile: { width: '100%' },
  filterText: { fontSize: 16, color: '#555', fontWeight: '600' },
  infoText: { padding: 20, color: '#888', fontSize: 16, textAlign: 'center' },
  table: { backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#eee', overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f9f9f9', padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  tableHeaderText: { flex: 1, fontSize: 12, fontWeight: '700', color: '#888' },
  tableRow: { flexDirection: 'row', padding: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', alignItems: 'center' },
  cell: { flex: 1, justifyContent: 'center', minWidth: 0 },
  cellUser: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 36, height: 36, backgroundColor: '#f0f0f0', borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  avatarText: { fontSize: 16 },
  userName: { fontSize: 18, fontWeight: '700', color: '#111' },
  userId: { fontSize: 13, color: '#888' },
  cellText: { fontSize: 14, color: '#555', marginBottom: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: '700' },
  actionButton: { paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  actionDots: { fontSize: 20, color: '#555' },
  mobileList: { gap: 12 },
  mobileUserCard: {
    width: '100%',
    alignSelf: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 14,
  },
  mobileUserHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 8 },
  mobileNameBlock: { flex: 1, minWidth: 0 },
  mobileDetail: { fontSize: 14, color: '#4b5563', marginBottom: 4 },
  mobileLastActive: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  mobileActionButton: { marginTop: 10, backgroundColor: '#111827', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  mobileActionText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 420, backgroundColor: 'white', borderRadius: 14, padding: 20, borderWidth: 1, borderColor: '#eee' },
  modalTitle: { fontSize: 24, fontWeight: '800', color: '#111', marginBottom: 8 },
  modalUserName: { fontSize: 16, color: '#555', marginBottom: 16 },
  modalSectionTitle: { fontSize: 14, color: '#666', fontWeight: '600', marginBottom: 10 },
  statusButtonRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statusButtonRowMobile: { flexDirection: 'column' },
  statusBtn: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  statusBtnSafe: { backgroundColor: '#2e7d32' },
  statusBtnEvacuating: { backgroundColor: '#e65100' },
  statusBtnNeedsHelp: { backgroundColor: '#c62828' },
  statusBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  statusUpdatedRow: { marginBottom: 12, alignItems: 'center' },
  statusUpdatedText: { color: '#2e7d32', fontWeight: '700', fontSize: 13 },
  deleteBtn: { backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginBottom: 10 },
  deleteBtnText: { color: '#b91c1c', fontWeight: '700', fontSize: 15 },
  cancelBtn: { backgroundColor: '#f3f4f6', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { color: '#374151', fontWeight: '600', fontSize: 15 },
});
