import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';

export default function PrivacyScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.backBtnText}>← Back</Text></TouchableOpacity>
        <Text style={styles.pageTitle}>Privacy Policy</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.text}>Your privacy is critical to us. DisasterGuard Karachi collects location data only to provide nearest shelter routing and emergency alerts. We do not sell your data to third parties.</Text>
        <Text style={styles.sectionTitle}>1. Data Collection</Text>
        <Text style={styles.text}>We collect your name, phone number, and GPS coordinates when the app is in use.</Text>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topBar: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  backBtnText: { fontSize: 16, color: '#1565C0', fontWeight: '600', marginRight: 10 },
  pageTitle: { fontSize: 18, fontWeight: '700' },
  content: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginTop: 20, marginBottom: 10 },
  text: { fontSize: 15, color: '#444', lineHeight: 22 },
});