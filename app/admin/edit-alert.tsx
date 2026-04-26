import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { db } from '../../firebaseConfig';

export default function EditAlert() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [severity, setSeverity] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlert = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        const alertSnap = await getDoc(doc(db, 'alerts', id as string));
        if (alertSnap.exists()) {
          const data = alertSnap.data();
          setTitle(data.title || '');
          setLocation(data.location || '');
          setSeverity(data.severity || '');
        } else {
          if (Platform.OS === 'web') window.alert('Alert not found.');
          else Alert.alert('Not Found', 'Alert not found.');
          router.back();
        }
      } catch (error) {
        console.error('Error fetching alert:', error);
        if (Platform.OS === 'web') window.alert('Failed to load alert.');
        else Alert.alert('Error', 'Failed to load alert.');
      } finally {
        setLoading(false);
      }
    };

    fetchAlert();
  }, [id, router]);

  const handleUpdate = async () => {
    if (!id) {
      if (Platform.OS === 'web') window.alert('Invalid alert ID.');
      else Alert.alert('Error', 'Invalid alert ID.');
      return;
    }

    try {
      await updateDoc(doc(db, 'alerts', id as string), {
        title: title.trim(),
        location: location.trim(),
        severity: severity.trim(),
      });

      if (Platform.OS === 'web') window.alert('Alert updated successfully!');
      else Alert.alert('Success', 'Alert updated successfully!');
      router.back();
    } catch (error) {
      console.error('Error updating alert:', error);
      if (Platform.OS === 'web') window.alert('Failed to update alert.');
      else Alert.alert('Error', 'Failed to update alert.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Edit Alert</Text>
        <Text style={styles.pageSubtitle}>Update the details of an existing disaster warning</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
      ) : (
      <View style={styles.card}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Alert Title</Text>
          <TextInput 
            style={styles.input} 
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Affected Location</Text>
          <TextInput 
            style={styles.input} 
            value={location}
            onChangeText={setLocation}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Severity Level</Text>
          <TextInput 
            style={styles.input} 
            value={severity}
            onChangeText={setSeverity}
          />
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.saveButton} onPress={handleUpdate}>
            <Text style={styles.saveButtonText}>Update Alert</Text>
          </TouchableOpacity>
        </View>
      </View>
      )}
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
  saveButton: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, backgroundColor: '#3b82f6' }, // Blue button for updating
  saveButtonText: { color: '#ffffff', fontWeight: '600', fontSize: 16 },
});