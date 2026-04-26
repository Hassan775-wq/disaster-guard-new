import { useRouter } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { auth, db } from '../../../firebaseConfig';

export default function EditProfileScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch the current user's data when the screen loads
  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setName(data.name || '');
          setPhone(data.phone || '');
          setAddress(data.address || '');
        }
      } catch (error) {
        console.error("Error fetching profile", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  // Save the updated data back to Firebase
  const handleSave = async () => {
    if (!auth.currentUser) {
      if (Platform.OS === 'web') window.alert("You must be logged in to save.");
      else Alert.alert("Error", "You must be logged in to save.");
      return;
    }
    
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        name,
        phone,
        address,
      });
      
      if (Platform.OS === 'web') window.alert("Profile updated successfully!");
      else Alert.alert("Success", "Profile updated successfully!");
      
      router.back(); // Go back to the profile screen after saving
    } catch (error) {
      console.error("Error updating profile", error);
      if (Platform.OS === 'web') window.alert("Failed to update profile.");
      else Alert.alert("Error", "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Top Bar with Back Button */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Edit Profile</Text>
        <View style={{ width: 50 }} /> {/* Spacer to center the title */}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#CC2200" style={{ marginTop: 40 }} />
      ) : (
        <View style={styles.formContainer}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <Text style={styles.label}>Home Address</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter your home address"
            multiline={true}
            numberOfLines={3}
            value={address}
            onChangeText={setAddress}
          />

          <TouchableOpacity 
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]} 
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
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
  input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 14, fontSize: 15, marginBottom: 20 },
  textArea: { height: 100, textAlignVertical: 'top' },
  saveBtn: { backgroundColor: '#111', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
});