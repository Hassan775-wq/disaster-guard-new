import { Feather } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import AdminLayout from './components/AdminLayout';

const monthlyData = [
  { month: 'Jan', floods: 2, earthquakes: 1, fires: 3, heatWaves: 0, total: 6 },
  { month: 'Feb', floods: 4, earthquakes: 0, fires: 2, heatWaves: 1, total: 7 },
  { month: 'Mar', floods: 1, earthquakes: 2, fires: 1, heatWaves: 2, total: 6 },
  { month: 'Apr', floods: 3, earthquakes: 1, fires: 4, heatWaves: 3, total: 11 },
  { month: 'May', floods: 5, earthquakes: 0, fires: 2, heatWaves: 5, total: 12 },
  { month: 'Jun', floods: 2, earthquakes: 1, fires: 1, heatWaves: 4, total: 8 },
];

const weeklyData = [
  { day: 'Mon', value: 120 },
  { day: 'Tue', value: 89 },
  { day: 'Wed', value: 250 },
  { day: 'Thu', value: 420 },
  { day: 'Fri', value: 380 },
  { day: 'Sat', value: 145 },
  { day: 'Sun', value: 98 },
];

const maxWeekly = Math.max(...weeklyData.map((d) => d.value));
const MOBILE_BREAKPOINT = 900;

export default function Analytics() {
  const { width } = useWindowDimensions();
  const isMobile = width <= MOBILE_BREAKPOINT;

  return (
    <AdminLayout>
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: 50 }]} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Analytics Dashboard</Text>
        <Text style={styles.pageSubtitle}>Performance metrics and insights</Text>

        <View style={styles.statsRow}>
          {[
            {
              icon: <Feather name="alert-triangle" size={isMobile ? 22 : 28} color="#e53935" />,
              value: '28',
              label: 'Total Alerts (This Month)',
              change: '12%',
              up: true,
              bg: '#fff0f0',
            },
            {
              icon: <Feather name="users" size={isMobile ? 22 : 28} color="#1e88e5" />,
              value: '1,502',
              label: 'Users Evacuated (This Week)',
              change: '24%',
              up: true,
              bg: '#f0f4ff',
            },
            {
              icon: <Feather name="home" size={isMobile ? 22 : 28} color="#43a047" />,
              value: '18',
              label: 'Active Shelters',
              change: '2',
              up: true,
              bg: '#f0fff4',
            },
            {
              icon: <Feather name="clock" size={isMobile ? 22 : 28} color="#8e24aa" />,
              value: '8.5 min',
              label: 'Response Time (Avg)',
              change: '15%',
              up: false,
              bg: '#f5f0ff',
            },
          ].map((s, i) => (
            <View key={i} style={[styles.statCard, { backgroundColor: s.bg }, isMobile && styles.statCardMobile]}>
              <View style={styles.statTop}>
                {s.icon}
                <Text style={[styles.statChange, { color: s.up ? '#43a047' : '#e53935' }]}>
                  {s.up ? '↑' : '↓'}{s.change}
                </Text>
              </View>
              <View style={styles.statMain}>
                <Text style={[styles.statValue, isMobile && styles.statValueMobile]} numberOfLines={1}>
                  {s.value}
                </Text>
                <Text style={[styles.statLabel, isMobile && styles.statLabelMobile]} numberOfLines={2}>
                  {s.label}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Disaster Alerts Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Disaster Alerts by Type</Text>
          {monthlyData.map((row, i) => (
            <View key={i} style={styles.barRow}>
              <View style={styles.barLabelRow}>
                <Text style={styles.barMonth}>{row.month}</Text>
                <Text style={styles.barTotal}>{row.total} alerts</Text>
              </View>
              <View style={styles.stackedBar}>
                {row.floods > 0 && <View style={[styles.barSegment, { flex: row.floods, backgroundColor: '#2196F3' }]}><Text style={styles.barSegText}>{row.floods}</Text></View>}
                {row.earthquakes > 0 && <View style={[styles.barSegment, { flex: row.earthquakes, backgroundColor: '#e53935' }]}><Text style={styles.barSegText}>{row.earthquakes}</Text></View>}
                {row.fires > 0 && <View style={[styles.barSegment, { flex: row.fires, backgroundColor: '#FF6F00' }]}><Text style={styles.barSegText}>{row.fires}</Text></View>}
                {row.heatWaves > 0 && <View style={[styles.barSegment, { flex: row.heatWaves, backgroundColor: '#9C27B0' }]}><Text style={styles.barSegText}>{row.heatWaves}</Text></View>}
              </View>
            </View>
          ))}
          
          <View style={styles.legend}>
            {[
              ['#2196F3', 'Floods'],
              ['#e53935', 'Earthquakes'],
              ['#FF6F00', 'Fires'],
              ['#9C27B0', 'Heat Waves'],
            ].map(([color, label]) => (
              <View key={label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: color }]} />
                <Text style={styles.legendText}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Trend Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Evacuation Trend</Text>
          <View style={styles.barChart}>
            {weeklyData.map((d, i) => (
              <View key={i} style={styles.barCol}>
                <View style={styles.barWrapper}>
                  <View style={[styles.vertBar, { height: `${(d.value / maxWeekly) * 100}%`, backgroundColor: '#2196F3' }]} />
                </View>
                <Text style={styles.barDay}>{d.day}</Text>
                <Text style={styles.barVal}>{d.value}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f5f6f8' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20 },
  pageTitle: { fontSize: 32, fontWeight: '800', color: '#111827' },
  pageSubtitle: { fontSize: 14, color: '#6b7280', marginBottom: 20 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 10 },
  statCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#eee', width: '48%' },
  statCardMobile: {
    width: '48%',
    aspectRatio: 1.1,
    padding: 12,
    marginBottom: 12,
  },
  statTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' },
  statChange: { fontSize: 12, fontWeight: '700' },
  statMain: { marginTop: 'auto' },
  statValue: { fontSize: 28, fontWeight: '800', color: '#111' },
  statValueMobile: { fontSize: 22, lineHeight: 28 },
  statLabel: { fontSize: 13, color: '#666', marginTop: 2 },
  statLabelMobile: { fontSize: 11, lineHeight: 14 },
  section: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#eee' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111', marginBottom: 16 },
  barRow: { marginBottom: 12 },
  barLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  barMonth: { fontSize: 12, fontWeight: '700', color: '#333' },
  barTotal: { fontSize: 11, color: '#999' },
  stackedBar: { flexDirection: 'row', height: 24, borderRadius: 6, overflow: 'hidden' },
  barSegment: { alignItems: 'center', justifyContent: 'center' },
  barSegText: { color: 'white', fontSize: 10, fontWeight: '700' },
  legend: { flexDirection: 'row', gap: 12, marginTop: 16, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: '#666' },
  barChart: { flexDirection: 'row', height: 180, alignItems: 'flex-end', gap: 6 },
  barCol: { flex: 1, alignItems: 'center' },
  barWrapper: { flex: 1, width: '100%', justifyContent: 'flex-end', backgroundColor: '#f9fafb', borderRadius: 4 },
  vertBar: { width: '100%', borderRadius: 4 },
  barDay: { fontSize: 10, color: '#999', marginTop: 4 },
  barVal: { fontSize: 10, color: '#666', fontWeight: '600' },
});