import { useRouter } from 'expo-router';
import { addDoc, collection } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { db } from '../../firebaseConfig';

export default function AddShelter() {
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !capacity.trim() || !address.trim()) {
      if (Platform.OS === 'web') window.alert('Please fill in name, capacity, and address.');
      else Alert.alert('Required', 'Please fill in name, capacity, and address.');
      return;
    }

    const parsedCapacity = Number(capacity);
    if (Number.isNaN(parsedCapacity) || parsedCapacity <= 0) {
      if (Platform.OS === 'web') window.alert('Capacity must be a valid number greater than 0.');
      else Alert.alert('Invalid Capacity', 'Capacity must be a valid number greater than 0.');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'shelters'), {
        name: name.trim(),
        capacity: parsedCapacity,
        address: address.trim(),
        currentPopulation: 0,
      });

      if (Platform.OS === 'web') window.alert('Shelter saved successfully!');
      else Alert.alert('Success', 'Shelter saved successfully!');

      router.back();
    } catch (error) {
      console.error('Error saving shelter:', error);
      if (Platform.OS === 'web') window.alert('Failed to save shelter.');
      else Alert.alert('Error', 'Failed to save shelter.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Add New Shelter</Text>
        <Text style={styles.pageSubtitle}>Register a new safe zone location</Text>
      </View>

      <View style={styles.card}>
        {/* Shelter Name Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Shelter Name</Text>
          <TextInput 
            style={styles.input} 
            placeholder="e.g. Central High School Gym" 
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Capacity Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Maximum Capacity (People)</Text>
          <TextInput 
            style={styles.input} 
            placeholder="e.g. 500" 
            keyboardType="numeric"
            value={capacity}
            onChangeText={setCapacity}
          />
        </View>

        {/* Location Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Location / Address</Text>
          <TextInput 
            style={[styles.input, styles.textArea]} 
            placeholder="Enter full address" 
            multiline={true}
            numberOfLines={3}
            value={address}
            onChangeText={setAddress}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.saveButton, loading && styles.saveButtonDisabled]} onPress={handleSave} disabled={loading}>
            <Text style={styles.saveButtonText}>{loading ? 'Saving...' : 'Save Shelter'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 24 },
  header: { marginBottom: 24 },
  pageTitle: { fontSize: 28, fontWeight: 'bold', color: '#111827' },
  pageSubtitle: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  
  card: { backgroundColor: '#ffffff', padding: 24, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#1f2937', backgroundColor: '#f9fafb' },
  textArea: { height: 100, textAlignVertical: 'top' },
  
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 20 },
  cancelButton: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, backgroundColor: '#f3f4f6' },
  cancelButtonText: { color: '#4b5563', fontWeight: '600', fontSize: 16 },
  saveButton: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, backgroundColor: '#111827' },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: '#ffffff', fontWeight: '600', fontSize: 16 },
});