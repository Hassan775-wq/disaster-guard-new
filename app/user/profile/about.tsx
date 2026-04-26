import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';

export default function AboutScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>About DisasterGuard</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoEmoji}>🏃🛡️</Text>
          <Text style={styles.appName}>DisasterGuard Karachi</Text>
          <Text style={styles.version}>Version 2.1.0</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.text}>
            DisasterGuard is a community-driven platform designed to provide real-time 
            emergency alerts, shelter locations, and disaster management resources 
            specifically for the citizens of Karachi.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          <Text style={styles.bullet}>• Real-time high-accuracy disaster alerts.</Text>
          <Text style={styles.bullet}>• Smart shelter routing based on your GPS.</Text>
          <Text style={styles.bullet}>• 24/7 AI-powered emergency assistance.</Text>
          <Text style={styles.bullet}>• Direct SOS link to emergency services.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal & Development</Text>
          <Text style={styles.text}>
            Developed for Karachi Disaster Management. All data is synchronized 
            with official meteorological and civic records.
          </Text>
        </View>

        <Text style={styles.footer}>© 2026 DisasterGuard Karachi Team</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topBar: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  backBtn: { paddingRight: 16 },
  backBtnText: { fontSize: 16, color: '#1565C0', fontWeight: '600' },
  pageTitle: { fontSize: 18, fontWeight: '700' },
  content: { padding: 20 },
  logoContainer: { alignItems: 'center', marginBottom: 30 },
  logoEmoji: { fontSize: 50, marginBottom: 10 },
  appName: { fontSize: 22, fontWeight: '800', color: '#111' },
  version: { fontSize: 14, color: '#888' },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 10 },
  text: { fontSize: 15, color: '#444', lineHeight: 22 },
  bullet: { fontSize: 15, color: '#444', lineHeight: 28, marginLeft: 5 },
  footer: { textAlign: 'center', color: '#bbb', marginTop: 20, fontSize: 12 },
});