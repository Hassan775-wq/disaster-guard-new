import { useRouter } from 'expo-router';
import { addDoc, collection } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { db } from '../../firebaseConfig';

export default function CreateAlert() {
  const router = useRouter();
  
  // State to hold our form inputs
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [severity, setSeverity] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);

  const handleBroadcast = async () => {
    if (!title.trim() || !location.trim() || !severity.trim()) {
      if (Platform.OS === 'web') window.alert('Please fill in title, location, and severity.');
      else Alert.alert('Required', 'Please fill in title, location, and severity.');
      return;
    }

    setBroadcasting(true);
    try {
      await addDoc(collection(db, 'alerts'), {
        title: title.trim(),
        location: location.trim(),
        severity: severity.trim(),
        createdAt: new Date().toISOString(),
      });

      if (Platform.OS === 'web') window.alert('Alert broadcasted successfully!');
      else Alert.alert('Success', 'Alert broadcasted successfully!');

      router.back();
    } catch (error) {
      console.error('Error broadcasting alert:', error);
      if (Platform.OS === 'web') window.alert('Failed to broadcast alert. Please try again.');
      else Alert.alert('Error', 'Failed to broadcast alert. Please try again.');
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Create New Alert</Text>
        <Text style={styles.pageSubtitle}>Draft and broadcast a new disaster warning</Text>
      </View>

      <View style={styles.card}>
        {/* Alert Title Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Alert Title</Text>
          <TextInput 
            style={styles.input} 
            placeholder="e.g. Severe Flood Warning" 
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Location Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Affected Location</Text>
          <TextInput 
            style={styles.input} 
            placeholder="e.g. Coastal District" 
            value={location}
            onChangeText={setLocation}
          />
        </View>

        {/* Severity Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Severity Level (Critical, Warning, Moderate)</Text>
          <TextInput 
            style={styles.input} 
            placeholder="e.g. Critical" 
            value={severity}
            onChangeText={setSeverity}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.saveButton, broadcasting && styles.saveButtonDisabled]} onPress={handleBroadcast} disabled={broadcasting}>
            <Text style={styles.saveButtonText}>{broadcasting ? 'Broadcasting...' : 'Broadcast Alert'}</Text>
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
  
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 20 },
  cancelButton: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, backgroundColor: '#f3f4f6' },
  cancelButtonText: { color: '#4b5563', fontWeight: '600', fontSize: 16 },
  saveButton: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, backgroundColor: '#ef4444' }, // Red button for alerts!
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: '#ffffff', fontWeight: '600', fontSize: 16 },
});