import { Feather } from '@expo/vector-icons';
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { db } from '../../firebaseConfig';
import AdminLayout from './components/AdminLayout';

const MOBILE_BREAKPOINT = 900;

export default function Broadcast() {
  const { width } = useWindowDimensions();
  const isMobile = width <= MOBILE_BREAKPOINT;

  const [priority, setPriority] = useState('Normal');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [audience, setAudience] = useState('All Users');
  const [channels, setChannels] = useState<string[]>(['Push Notification']);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [recentBroadcasts, setRecentBroadcasts] = useState<any[]>([]);

  useEffect(() => {
    const broadcastsQuery = query(collection(db, 'broadcasts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      broadcastsQuery,
      (snapshot) => {
        const mapped = snapshot.docs.map((broadcastDoc) => {
          const data = broadcastDoc.data();
          const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : null;

          return {
            id: broadcastDoc.id,
            title: data.title || 'Untitled Broadcast',
            audience: data.audience || 'All Users',
            sub: `${data.audience || 'All Users'} • ${createdAt ? createdAt.toLocaleString() : 'Just now'}`,
          };
        });
        setRecentBroadcasts(mapped);
      },
      (error) => {
        console.error('Error loading broadcasts:', error);
      }
    );

    return unsubscribe;
  }, []);

  const toggleChannel = (channelName: string) => {
    setChannels((prev) => (prev.includes(channelName) ? prev.filter((c) => c !== channelName) : [...prev, channelName]));
  };

  const handleSendBroadcast = () => {
    if (!title.trim() || !content.trim()) {
      if (Platform.OS === 'web') window.alert('Please enter both a message title and content.');
      else Alert.alert('Missing Fields', 'Please enter both a message title and content.');
      return;
    }

    if (channels.length === 0) {
      if (Platform.OS === 'web') window.alert('Please select at least one broadcast channel.');
      else Alert.alert('No Channel Selected', 'Please select at least one broadcast channel.');
      return;
    }

    const submit = async () => {
      try {
        await addDoc(collection(db, 'broadcasts'), {
          priority,
          title: title.trim(),
          content: content.trim(),
          audience,
          channels,
          createdAt: serverTimestamp(),
        });

        if (Platform.OS === 'web') window.alert(`Success! "${title}" has been broadcasted.`);
        else Alert.alert('Broadcast Sent', `Success! "${title}" has been broadcasted.`);

        setPriority('Normal');
        setTitle('');
        setContent('');
        setAudience('All Users');
        setChannels(['Push Notification']);
        setIsDropdownOpen(false);
      } catch (error) {
        console.error('Error sending broadcast:', error);
        if (Platform.OS === 'web') window.alert('Failed to send broadcast. Please try again.');
        else Alert.alert('Error', 'Failed to send broadcast. Please try again.');
      }
    };

    submit();
  };

  return (
    <AdminLayout>
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: 30 }]} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Broadcast Messages</Text>
        <Text style={styles.pageSubtitle}>Send emergency notifications to users</Text>

        <View style={[styles.contentRow, isMobile && styles.contentRowMobile]}>
          <View style={[styles.composeCard, isMobile && styles.composeCardMobile]}>
            <Text style={styles.cardTitle}>Compose Broadcast</Text>

            <Text style={styles.label}>Priority Level</Text>
            <View style={[styles.priorityRow, isMobile && styles.priorityRowMobile]}>
              {['Critical', 'High', 'Normal'].map((p) => (
                <TouchableOpacity key={p} style={[styles.priorityBtn, priority === p && styles.priorityBtnActive]} onPress={() => setPriority(p)}>
                  <Text style={[styles.priorityText, priority === p && styles.priorityTextActive]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Message Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Immediate Evacuation Required"
              placeholderTextColor="#aaa"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
            <Text style={styles.charCount}>{title.length}/100 characters</Text>

            <Text style={styles.label}>Message Content</Text>
            <TextInput
              style={styles.textarea}
              placeholder="Type your emergency message here..."
              placeholderTextColor="#aaa"
              value={content}
              onChangeText={setContent}
              multiline
              maxLength={500}
            />
            <Text style={styles.charCount}>{content.length}/500 characters</Text>

            <Text style={styles.label}>Target Audience</Text>
            <TouchableOpacity style={styles.dropdown} onPress={() => setIsDropdownOpen((prev) => !prev)}>
              <Text style={styles.dropdownText}>{audience}</Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>
            {isDropdownOpen && (
              <View style={styles.dropdownMenu}>
                {['All Users', 'Safe Users', 'Needs Help Users'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setAudience(option);
                      setIsDropdownOpen(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.label}>Broadcast Channels</Text>
            {[
              {
                key: 'push',
                label: 'Push Notification',
                sub: 'Instant in-app notification',
                icon: <Feather name="bell" size={22} color="#fb8c00" />,
              },
              {
                key: 'sms',
                label: 'SMS',
                sub: 'Text message to phone',
                icon: <Feather name="message-square" size={22} color="#1e88e5" />,
              },
              {
                key: 'email',
                label: 'Email',
                sub: 'Email notification',
                icon: <Feather name="mail" size={22} color="#43a047" />,
              },
            ].map((ch) => (
              <TouchableOpacity key={ch.key} style={styles.channelRow} onPress={() => toggleChannel(ch.label)}>
                <View style={[styles.checkbox, channels.includes(ch.label) && styles.checkboxActive]}>
                  {channels.includes(ch.label) && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.channelLabel}>{ch.label}</Text>
                  <Text style={styles.channelSub}>{ch.sub}</Text>
                </View>
                <View style={styles.channelIcon}>{ch.icon}</View>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={[styles.sendBtn, title && content ? styles.sendBtnActive : null]} onPress={handleSendBroadcast}>
              <Text style={styles.sendText}>✈ Send Broadcast</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.rightCol, isMobile && styles.rightColMobile]}>
            <View style={styles.previewCard}>
              <Text style={styles.cardTitle}>Preview</Text>
              <View style={styles.previewBox}>
                <Text style={styles.previewPriority}>● {priority.toUpperCase()} PRIORITY</Text>
                <Text style={styles.previewTitle}>{title || 'Message Title'}</Text>
                <Text style={styles.previewContent}>{content || 'Your message content will appear here...'}</Text>
                <Text style={styles.previewFooter}>DisasterGuard • Now</Text>
              </View>
            </View>

            <View style={styles.reachCard}>
              <Text style={styles.cardTitle}>Estimated Reach</Text>
              <View style={styles.reachRow}>
                <Text style={styles.reachLabel}>Recipients</Text>
                <Text style={styles.reachValue}>12,547</Text>
              </View>
              <View style={styles.reachRow}>
                <Text style={styles.reachLabel}>Channels</Text>
                <Text style={styles.reachValue}>{channels.length}</Text>
              </View>
            </View>

            <View style={styles.recentCard}>
              <Text style={styles.cardTitle}>Recent Broadcasts</Text>
              {recentBroadcasts.map((b) => (
                <View key={b.id} style={styles.recentItem}>
                  <Text style={styles.recentTitle}>{b.title}</Text>
                  <Text style={styles.recentSub}>{b.sub}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f5f6f8' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },
  pageTitle: { fontSize: 42, fontWeight: '800', color: '#111827' },
  pageSubtitle: { fontSize: 16, color: '#6b7280', marginBottom: 16 },
  contentRow: { flexDirection: 'row', gap: 20 },
  contentRowMobile: { flexDirection: 'column' },
  composeCard: { flex: 2, backgroundColor: 'white', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#eee' },
  composeCardMobile: { width: '100%' },
  cardTitle: { fontSize: 22, fontWeight: '800', color: '#111', marginBottom: 16 },
  label: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 8, marginTop: 12 },
  priorityRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  priorityRowMobile: { flexDirection: 'column' },
  priorityBtn: { flex: 1, width: '100%', paddingVertical: 15, paddingHorizontal: 15, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  priorityBtnActive: { backgroundColor: '#2255CC', borderColor: '#2255CC' },
  priorityText: { fontSize: 16, color: '#555', fontWeight: '700' },
  priorityTextActive: { color: 'white' },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 16,
    color: '#333',
  },
  charCount: { fontSize: 12, color: '#aaa', marginTop: 4, marginBottom: 4 },
  textarea: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 16,
    color: '#333',
    minHeight: 130,
    textAlignVertical: 'top',
  },
  dropdown: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingVertical: 14, paddingHorizontal: 15, flexDirection: 'row', justifyContent: 'space-between' },
  dropdownText: { fontSize: 16, color: '#333' },
  dropdownArrow: { fontSize: 12, color: '#888' },
  dropdownMenu: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginTop: 6, overflow: 'hidden' },
  dropdownItem: { paddingVertical: 12, paddingHorizontal: 12, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee' },
  dropdownItemText: { fontSize: 15, color: '#333' },
  channelRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 14, marginBottom: 10, gap: 12 },
  checkbox: { width: 20, height: 20, borderWidth: 1.5, borderColor: '#ccc', borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: '#2255CC', borderColor: '#2255CC' },
  checkmark: { color: 'white', fontSize: 12, fontWeight: '700' },
  channelLabel: { fontSize: 16, fontWeight: '700', color: '#111' },
  channelSub: { fontSize: 13, color: '#888' },
  channelIcon: { width: 24, alignItems: 'center', justifyContent: 'center' },
  sendBtn: { backgroundColor: '#ccc', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 16 },
  sendBtnActive: { backgroundColor: '#2255CC' },
  sendText: { color: 'white', fontWeight: '700', fontSize: 17 },
  rightCol: { flex: 1, gap: 16 },
  rightColMobile: { width: '100%' },
  previewCard: { backgroundColor: 'white', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#eee' },
  previewBox: { backgroundColor: '#f5f5f5', borderRadius: 8, padding: 14 },
  previewPriority: { fontSize: 12, color: '#2255CC', fontWeight: '700', marginBottom: 6 },
  previewTitle: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 4 },
  previewContent: { fontSize: 15, color: '#555', marginBottom: 8 },
  previewFooter: { fontSize: 12, color: '#aaa' },
  reachCard: { backgroundColor: 'white', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#eee' },
  reachRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  reachLabel: { fontSize: 16, color: '#555' },
  reachValue: { fontSize: 16, fontWeight: '700', color: '#111' },
  recentCard: { backgroundColor: 'white', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#eee' },
  recentItem: { backgroundColor: '#f5f5f5', borderRadius: 8, padding: 12, marginBottom: 10 },
  recentTitle: { fontSize: 15, fontWeight: '700', color: '#111' },
  recentSub: { fontSize: 13, color: '#888', marginTop: 2 },
});
