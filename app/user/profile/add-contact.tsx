import { useRouter } from 'expo-router';
import { addDoc, collection } from 'firebase/firestore';
import { useState } from 'react';
import { Alert, Platform, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { auth, db } from '../../../firebaseConfig';

export default function AddContactScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [phone, setPhone] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name || !phone) {
      if (Platform.OS === 'web') window.alert("Name and Phone are required.");
      else Alert.alert("Required", "Name and Phone are required.");
      return;
    }

    if (!auth.currentUser) {
      if (Platform.OS === 'web') window.alert("You must be logged in.");
      else Alert.alert("Error", "You must be logged in.");
      return;
    }
    
    setSaving(true);
    try {
      // Save this contact to a "contacts" sub-collection inside the specific user's document
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'contacts'), {
        name,
        relation: relation || 'Friend',
        phone,
        primary: isPrimary,
        createdAt: new Date().toISOString()
      });
      
      if (Platform.OS === 'web') window.alert("Contact added successfully!");
      else Alert.alert("Success", "Contact added successfully!");
      
      router.back(); // Go back to profile
    } catch (error) {
      console.error("Error adding contact", error);
      if (Platform.OS === 'web') window.alert("Failed to add contact.");
      else Alert.alert("Error", "Failed to add contact.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Add Contact</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.label}>Contact Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Ayesha Hassan"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Relationship</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Spouse, Father, Friend"
          value={relation}
          onChangeText={setRelation}
        />

        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. +92-300-1234567"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        <View style={styles.switchRow}>
          <View>
            <Text style={styles.label}>Primary Contact</Text>
            <Text style={styles.subLabel}>This person will be prioritized during SOS</Text>
          </View>
          <Switch 
            value={isPrimary} 
            onValueChange={setIsPrimary} 
            trackColor={{ false: '#ccc', true: '#111' }}
            thumbColor={'#fff'}
          />
        </View>

        <TouchableOpacity 
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]} 
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Contact'}</Text>
        </TouchableOpacity>
      </View>
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
  saveBtn: { backgroundColor: '#111', padding: 16, borderRadius: 8, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
});