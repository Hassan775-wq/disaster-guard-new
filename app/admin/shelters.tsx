import { useRouter } from 'expo-router';
import { collection, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { db } from '../../firebaseConfig';
import AdminLayout from './components/AdminLayout';

type Shelter = {
  id: string;
  name: string;
  capacity: number;
  currentPopulation: number;
};

const MOBILE_BREAKPOINT = 900;

export default function AdminShelters() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width <= MOBILE_BREAKPOINT;
  const [shelters, setShelters] = useState<Shelter[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'shelters'), (snapshot) => {
      const shelterDocs = snapshot.docs.map((shelterDoc) => {
        const data = shelterDoc.data();
        return {
          id: shelterDoc.id,
          name: data.name || 'Unnamed Shelter',
          capacity: Number(data.capacity) || 0,
          currentPopulation: Number(data.currentPopulation) || 0,
        };
      });

      setShelters(shelterDocs);
    });

    return unsubscribe;
  }, []);

  const handleAddShelter = () => {
    router.push('/admin/add_shelter');
  };

  const totalCapacity = shelters.reduce((sum, shelter) => sum + shelter.capacity, 0);
  const currentlySheltered = shelters.reduce((sum, shelter) => sum + shelter.currentPopulation, 0);
  const activeShelters = shelters.length;

  return (
    <AdminLayout>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 30 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, isMobile && styles.headerMobile]}>
          <View style={styles.titleWrap}>
            <Text style={styles.pageTitle}>Shelter Management</Text>
            <Text style={styles.pageSubtitle}>Track capacities and resources across all active shelters</Text>
          </View>

          <TouchableOpacity style={[styles.primaryButton, isMobile && styles.primaryButtonMobile]} onPress={handleAddShelter}>
            <Text style={styles.primaryButtonText}>+ Add Shelter</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, isMobile && styles.statCardMobile]}>
            <Text style={styles.statLabel}>Total Capacity</Text>
            <Text style={styles.statValue}>{totalCapacity.toLocaleString()}</Text>
          </View>
          <View style={[styles.statCard, isMobile && styles.statCardMobile]}>
            <Text style={styles.statLabel}>Currently Sheltered</Text>
            <Text style={styles.statValue}>{currentlySheltered.toLocaleString()}</Text>
          </View>
          <View style={[styles.statCard, isMobile && styles.statCardMobile]}>
            <Text style={styles.statLabel}>Active Shelters</Text>
            <Text style={styles.statValue}>{activeShelters}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Active Locations</Text>

        <View style={styles.listContainer}>
          {shelters.map((shelter) => {
            const fillPercentage = shelter.capacity > 0 ? (shelter.currentPopulation / shelter.capacity) * 100 : 0;
            const clampedWidth = `${Math.min(fillPercentage, 100)}%`;
            const status = fillPercentage >= 100 ? 'Full' : fillPercentage >= 80 ? 'Near Full' : 'Available';
            const statusColor = fillPercentage >= 100 ? '#ef4444' : fillPercentage >= 80 ? '#f97316' : '#22c55e';

            return (
              <View key={shelter.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{shelter.name}</Text>
                  <View style={[styles.badge, { backgroundColor: `${statusColor}20` }]}>
                    <Text style={[styles.badgeText, { color: statusColor }]}>{status}</Text>
                  </View>
                </View>

                <Text style={styles.capacityText}>
                  <Text style={styles.boldText}>{shelter.currentPopulation}</Text> / {shelter.capacity} People
                </Text>

                <View style={styles.progressBarBackground}>
                  <View style={[styles.progressBarFill, { width: clampedWidth, backgroundColor: statusColor }]} />
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f5f6f8' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12 },
  headerMobile: { flexDirection: 'column', alignItems: 'flex-start' },
  titleWrap: { flex: 1 },
  pageTitle: { fontSize: 42, fontWeight: '800', color: '#111827' },
  pageSubtitle: { fontSize: 16, color: '#6b7280', marginTop: 4 },
  primaryButton: { backgroundColor: '#111827', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
  primaryButtonMobile: { width: '100%', alignItems: 'center' },
  primaryButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 18 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCard: {
    width: '31%',
    minWidth: 180,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statCardMobile: { width: '48%', minWidth: 0, alignSelf: 'center' },
  statLabel: { fontSize: 16, color: '#6b7280', marginBottom: 8 },
  statValue: { fontSize: 56, fontWeight: '800', color: '#111827' },
  sectionTitle: { fontSize: 46, fontWeight: '800', color: '#1f2937', marginBottom: 14 },
  listContainer: { gap: 16 },
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 8 },
  cardTitle: { fontSize: 24, fontWeight: '800', color: '#1f2937', flex: 1 },
  badge: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 16 },
  badgeText: { fontSize: 14, fontWeight: '700' },
  capacityText: { fontSize: 18, color: '#4b5563', marginBottom: 10 },
  boldText: { fontWeight: '800', color: '#111827' },
  progressBarBackground: { height: 12, backgroundColor: '#e5e7eb', borderRadius: 6, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 6 },
});
