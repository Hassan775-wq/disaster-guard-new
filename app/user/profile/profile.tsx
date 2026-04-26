import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { auth, db } from '../../../firebaseConfig';

export default function ProfileScreen() {
  const router = useRouter();
  const { theme, isDark, isHighContrast, toggleTheme, toggleHighContrast } = useTheme(); 
  
  const [userName, setUserName] = useState('Loading...');
  const [userPhone, setUserPhone] = useState('...');
  const [userAddress, setUserAddress] = useState('...');
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [savedContacts, setSavedContacts] = useState<any[]>([]);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const setGuestDefaults = () => {
      setUserName('Guest User');
      setUserPhone('No phone set');
      setUserAddress('No address set');
      setSavedContacts([]);
      setNotificationsEnabled(true);
    };

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return;

      setLoading(true);
      setProfileError(null);
      let didTimeout = false;

      timeoutId = setTimeout(() => {
        if (!isMounted) return;
        didTimeout = true;
        setProfileError('Failed to load profile');
        setGuestDefaults();
        setLoading(false);
      }, 5000);

      try {
        if (!firebaseUser) {
          setGuestDefaults();
          return;
        }

        const userRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userRef);
        if (!isMounted || didTimeout) return;

        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserName(data.name || 'Guest User');
          setUserPhone(data.phone || 'No phone set');
          setUserAddress(data.address || 'No address set');
          setNotificationsEnabled(data.pushEnabled ?? true);
          toggleHighContrast(data.highContrast ?? false);
        } else {
          setGuestDefaults();
          toggleHighContrast(false);
        }

        const contactsSnap = await getDocs(collection(db, 'users', firebaseUser.uid, 'contacts'));
        if (!isMounted || didTimeout) return;
        const fetchedContacts = contactsSnap.docs.map(contactDoc => ({ id: contactDoc.id, ...contactDoc.data() }));
        setSavedContacts(fetchedContacts);
      } catch (error) {
        console.error('Error loading profile:', error);
        if (!isMounted || didTimeout) return;
        setProfileError('Failed to load profile');
        setGuestDefaults();
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        if (isMounted && !didTimeout) {
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  const handleNotificationsToggle = async (value: boolean) => {
    const previous = notificationsEnabled;
    setNotificationsEnabled(value);

    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { pushEnabled: value });
    } catch (e) {
      setNotificationsEnabled(previous);
    }
  };

  const handleHighContrastToggle = async (value: boolean) => {
    const previous = isHighContrast;
    toggleHighContrast(value);

    try {
      if (auth.currentUser) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), { highContrast: value });
      }
    } catch (e) {
      toggleHighContrast(previous);
    }
  };

  const handleSignOut = () => {
    const performSignOut = () => auth.signOut().then(() => router.replace('/'));
    if (Platform.OS === 'web') {
      if (window.confirm('Sign out of DisasterGuard?')) performSignOut();
    } else {
      Alert.alert('Sign Out', 'Are you sure?', [{ text: 'Cancel' }, { text: 'Sign Out', onPress: performSignOut }]);
    }
  };

  const Toggle = ({ value, onValueChange }: { value: boolean; onValueChange: (value: boolean) => void }) => (
    <TouchableOpacity 
      style={[styles.toggle, value && styles.toggleOn, !value && { backgroundColor: isDark ? '#444' : '#ccc' }]} 
      onPress={() => onValueChange(!value)}
    >
      <View style={[styles.toggleThumb, value && styles.toggleThumbOn]} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.topBar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Text style={styles.logoText}>🏃</Text>
        <Text style={[styles.location, { color: theme.text }]}>📍 Karachi, Pakistan</Text>
        
        <TouchableOpacity 
          style={[styles.themeBtn, { backgroundColor: isDark ? '#333' : '#f0f0f0' }]} 
          onPress={toggleTheme}
        >
          <Text style={{ fontSize: 16 }}>{isDark ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Text style={[styles.pageTitle, { color: theme.text }]}>Profile & Settings</Text>

        {/* User Card - Updated route to /user/profile/edit-profile */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {loading ? <ActivityIndicator color={theme.text} /> : (
            <View>
              {profileError && <Text style={styles.errorText}>{profileError}</Text>}
              <View style={styles.profileRow}>
                <View style={[styles.avatar, { backgroundColor: isDark ? '#444' : '#333' }]}><Text style={styles.avatarText}>👤</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.userName, { color: theme.text }]}>{userName}</Text>
                  <Text style={styles.userPhone}>{userPhone}</Text>
                  <Text style={styles.locationText}>📍 {userAddress}</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/user/profile/edit-profile')}>
                  <Text style={[styles.editIcon, { color: theme.text }]}>✏️</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Emergency Contacts - Updated route to /user/profile/add-contact & edit-contact */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Emergency Contacts</Text>
            <TouchableOpacity onPress={() => router.push('/user/profile/add-contact')}>
              <Text style={[styles.addIcon, { color: theme.text }]}>+</Text>
            </TouchableOpacity>
          </View>
          {savedContacts.map((c) => (
            <TouchableOpacity 
              key={c.id} 
              style={[styles.contactRow, { backgroundColor: isDark ? '#2a2a2a' : '#f9f9f9' }]} 
              onPress={() => router.push({ pathname: '/user/profile/edit-contact', params: { id: c.id } } as any)}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.contactName, { color: theme.text }]}>{c.name} {c.primary && '⭐'}</Text>
                <Text style={styles.contactSub}>{c.relation} • {c.phone}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Preferences */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Preferences</Text>
          <View style={styles.prefRow}>
            <Text style={[styles.prefLabel, { color: theme.text }]}>Push Notifications</Text>
            <Toggle
              value={notificationsEnabled}
              onValueChange={handleNotificationsToggle}
            />
          </View>
          <View style={styles.prefRow}>
            <Text style={[styles.prefLabel, { color: theme.text }]}>High Contrast</Text>
            <Toggle
              value={isHighContrast}
              onValueChange={handleHighContrastToggle}
            />
          </View>
        </View>

        {/* Legal Section - Updated routes to /user/profile/... */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.border }]} onPress={() => router.push('/user/profile/about')}>
            <Text style={[styles.menuText, { color: theme.text }]}>About DisasterGuard</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.border }]} onPress={() => router.push('/user/profile/privacy')}>
            <Text style={[styles.menuText, { color: theme.text }]}>Privacy Policy</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={() => router.push('/user/profile/terms')}>
            <Text style={[styles.menuText, { color: theme.text }]}>Terms of Service</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
        <Text style={styles.version}>DisasterGuard v2.1.0</Text>
      </ScrollView>

      {/* Tab Bar - Note the route for profile itself is now /user/profile/profile */}
      <View style={[styles.tabBar, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        {[
          { icon: 'home', label: 'Home', route: '/user' },
          { icon: 'map', label: 'Map', route: '/user/map' },
          { icon: 'alert-circle', label: 'Alerts', route: '/user/alerts/alerts' },
          { icon: 'message-circle', label: 'Chat', route: '/user/chat' },
          { icon: 'user', label: 'Profile', active: true, route: '/user/profile/profile' }
        ].map((tab, i) => (
          <TouchableOpacity key={i} style={styles.tabItem} onPress={() => { if (!tab.active) router.push(tab.route as any); }}>
            <Feather name={tab.icon as any} size={22} color={tab.active ? theme.text : '#888'} style={styles.tabIcon} />
            <Text style={[styles.tabLabel, tab.active && { color: theme.text, fontWeight: '700' }]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', padding: 16, alignItems: 'center', borderBottomWidth: 1 },
  themeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 22, marginRight: 8 },
  location: { flex: 1, fontSize: 14, fontWeight: '500' },
  scroll: { flex: 1 },
  pageTitle: { fontSize: 22, fontWeight: '800', marginBottom: 16 },
  card: { borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 24 },
  userName: { fontSize: 18, fontWeight: '700' },
  userPhone: { fontSize: 13, color: '#888' },
  locationText: { fontSize: 12, color: '#555', marginTop: 4 },
  errorText: { fontSize: 12, color: '#e53935', marginBottom: 10, fontWeight: '600' },
  editIcon: { fontSize: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  addIcon: { fontSize: 24, fontWeight: 'bold' },
  contactRow: { flexDirection: 'row', padding: 12, borderRadius: 8, marginBottom: 8, alignItems: 'center' },
  contactName: { fontSize: 14, fontWeight: '600' },
  contactSub: { fontSize: 12, color: '#888' },
  chevron: { fontSize: 20, color: '#ccc' },
  prefRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  prefLabel: { fontSize: 14 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1 },
  menuText: { fontSize: 14, fontWeight: '500' },
  toggle: { width: 44, height: 24, borderRadius: 12, padding: 2 },
  toggleOn: { backgroundColor: '#CC2200' },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: 'white' },
  toggleThumbOn: { alignSelf: 'flex-end' },
  signOutBtn: { backgroundColor: '#e53935', padding: 16, borderRadius: 12, alignItems: 'center' },
  signOutText: { color: 'white', fontWeight: 'bold' },
  version: { textAlign: 'center', color: '#bbb', fontSize: 12, marginTop: 16 },
  tabBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', borderTopWidth: 1, paddingVertical: 8, paddingBottom: 24 },
  tabItem: { flex: 1, alignItems: 'center' },
  tabIcon: { fontSize: 20, marginBottom: 2 },
  tabLabel: { fontSize: 11, color: '#888' },
});