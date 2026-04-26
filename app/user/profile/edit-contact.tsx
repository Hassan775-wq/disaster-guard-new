import { useLocalSearchParams, useRouter } from 'expo-router';
import { deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { auth, db } from '../../../firebaseConfig';

export default function EditContactScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { id } = useLocalSearchParams(); // Gets the contact ID from the URL
  
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [phone, setPhone] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch the specific contact's data when the screen loads
  useEffect(() => {
    const fetchContact = async () => {
      if (!auth.currentUser || !id) return;
      try {
        const contactRef = doc(db, 'users', auth.currentUser.uid, 'contacts', id as string);
        const contactSnap = await getDoc(contactRef);
        
        if (contactSnap.exists()) {
          const data = contactSnap.data();
          setName(data.name || '');
          setRelation(data.relation || '');
          setPhone(data.phone || '');
          setIsPrimary(data.primary || false);
        }
      } catch (error) {
        console.error("Error fetching contact", error);
      } finally {
        setLoading(false);
      }
    };
    fetchContact();
  }, [id]);

  // Update the contact
  const handleUpdate = async () => {
    if (!name || !phone) {
      if (Platform.OS === 'web') window.alert("Name and Phone are required.");
      else Alert.alert("Required", "Name and Phone are required.");
      return;
    }

    setSaving(true);
    try {
      const contactRef = doc(db, 'users', auth.currentUser!.uid, 'contacts', id as string);
      await updateDoc(contactRef, {
        name,
        relation: relation || 'Friend',
        phone,
        primary: isPrimary
      });
      
      if (Platform.OS === 'web') window.alert("Contact updated successfully!");
      else Alert.alert("Success", "Contact updated successfully!");
      
      router.back();
    } catch (error) {
      console.error("Error updating contact", error);
      if (Platform.OS === 'web') window.alert("Failed to update contact.");
      else Alert.alert("Error", "Failed to update contact.");
    } finally {
      setSaving(false);
    }
  };

  // Delete the contact
  const executeDelete = async () => {
    setDeleting(true);
    try {
      const contactRef = doc(db, 'users', auth.currentUser!.uid, 'contacts', id as string);
      await deleteDoc(contactRef);
      
      if (Platform.OS === 'web') window.alert("Contact deleted.");
      
      router.back();
    } catch (error) {
      console.error("Error deleting contact", error);
      if (Platform.OS === 'web') window.alert("Failed to delete contact.");
      else Alert.alert("Error", "Failed to delete contact.");
      setDeleting(false);
    }
  };

  // Ask for confirmation before deleting
  const handleDeleteRequest = () => {
    if (Platform.OS === 'web') {
      if (window.confirm("Are you sure you want to delete this contact?")) {
        executeDelete();
      }
    } else {
      Alert.alert("Delete Contact", "Are you sure you want to delete this contact?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: executeDelete }
      ]);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Edit Contact</Text>
        <View style={{ width: 50 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#CC2200" style={{ marginTop: 40 }} />
      ) : (
        <View style={styles.formContainer}>
          <Text style={styles.label}>Contact Name *</Text>
          <TextInput style={styles.input} placeholder="e.g. Ayesha Hassan" value={name} onChangeText={setName} />

          <Text style={styles.label}>Relationship</Text>
          <TextInput style={styles.input} placeholder="e.g. Spouse, Father, Friend" value={relation} onChangeText={setRelation} />

          <Text style={styles.label}>Phone Number *</Text>
          <TextInput style={styles.input} placeholder="e.g. +92-300-1234567" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.label}>Primary Contact</Text>
              <Text style={styles.subLabel}>This person will be prioritized during SOS</Text>
            </View>
            <Switch value={isPrimary} onValueChange={setIsPrimary} trackColor={{ false: '#ccc', true: '#111' }} thumbColor={'#fff'} />
          </View>

          <TouchableOpacity style={[styles.saveBtn, saving && styles.disabled]} onPress={handleUpdate} disabled={saving || deleting}>
            <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.deleteBtn, deleting && styles.disabled]} onPress={handleDeleteRequest} disabled={saving || deleting}>
            <Text style={styles.deleteBtnText}>{deleting ? 'Deleting...' : 'Delete Contact'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee' },
  backBtn: { paddingRight: 16, width: 50 },
  backBtnText: { fontSize: 16, color: '#1565C0', fontWeight: '600' },
  pageTitle: { fontSize: 18, fontWeight: '700', color: '#111' },
  formContainer: { padding: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  subLabel: { fontSize: 12, color: '#888', marginTop: -4 },
  input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 14, fontSize: 15, marginBottom: 20 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, backgroundColor: 'white', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
  saveBtn: { backgroundColor: '#111', padding: 16, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
  deleteBtn: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e53935', padding: 15, borderRadius: 8, alignItems: 'center' },
  deleteBtnText: { color: '#e53935', fontSize: 16, fontWeight: '700' },
  disabled: { opacity: 0.6 },
});