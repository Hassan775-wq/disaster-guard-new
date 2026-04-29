import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

type AiMessage = {
  id: string;
  role: 'ai' | 'user';
  text: string;
  time: string;
  isTyping?: boolean;
};

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY
console.log('API Key loaded:', GROQ_API_KEY ? 'YES' : 'NO - KEY IS MISSING');

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const SYSTEM_PROMPT =
  'You are DisasterGuard AI, an expert emergency assistant. Provide concise, practical guidance for emergency safety, evacuation routes, shelter information, and disaster preparedness. Prioritize life safety, include actionable steps, and advise contacting local emergency services for immediate danger.';

// Original static data, now used as the starting point for our State
const initialCommunityMessages = [
  { id: 1, name: 'PDMA Sindh', initial: '🛡', isOfficial: true, status: null, message: 'All residents in Saddar and Clifton areas must evacuate immediately. Use Shahrah-e-Faisal route towards University Road.', time: '2:45 PM', pinned: true },
  { id: 2, name: 'Ahmed Khan', initial: 'A', isOfficial: false, status: 'Evacuating', statusColor: '#FF6F00', statusBg: '#FFF3E0', message: 'Just evacuated from Clifton. Shahrah-e-Faisal is clear and traffic is moving well. Avoid Kharadar route.', time: '2:43 PM', pinned: false },
  { id: 3, name: 'Fatima Ali', initial: 'F', isOfficial: false, status: 'Safe', statusColor: '#43a047', statusBg: '#E8F5E9', message: 'Reached Expo Centre safely. They have enough supplies and medical staff. Very organized.', time: '2:40 PM', pinned: false },
  { id: 4, name: 'Edhi Foundation', initial: '🛡', isOfficial: true, status: null, message: 'Free ambulance service available. Call 115 for emergency medical assistance. Our teams are active in all affected areas.', time: '2:38 PM', pinned: true },
  { id: 5, name: 'Sara Malik', initial: 'S', isOfficial: false, status: 'Safe', statusColor: '#43a047', statusBg: '#E8F5E9', message: 'Does NED University shelter allow families with children? Need urgent info.', time: '2:35 PM', pinned: false },
  { id: 6, name: 'Imran Sheikh', initial: 'I', isOfficial: false, status: 'Evacuating', statusColor: '#FF6F00', statusBg: '#FFF3E0', message: 'Abdullah Haroon Road completely flooded near Metropole Hotel! Don\'t take this route!', time: '2:32 PM', pinned: false },
  { id: 7, name: 'Aisha Siddiqui', initial: 'A', isOfficial: false, status: 'Safe', statusColor: '#43a047', statusBg: '#E8F5E9', message: 'KGS shelter has separate area for women and children. Very safe and well-managed.', time: '2:30 PM', pinned: false },
];

export default function ChatScreen() {
  const router = useRouter();
  const { theme, isDark, isHighContrast, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('Community');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [userStatus, setUserStatus] = useState('Safe');

  // NEW: Moved community messages to state so we can add to them!
  const [communityMessages, setCommunityMessages] = useState(initialCommunityMessages);

  const [aiMessages, setAiMessages] = useState<AiMessage[]>([
    {
      id: 'ai-welcome',
      role: 'ai',
      text: "Hello! I'm DisasterGuard AI Assistant. I can help you with emergency information, safety tips, and evacuation guidance. How can I assist you today?",
      time: '3:34 PM'
    }
  ]);

  // NEW: Function to send a message to the Community Chat
  const sendCommunityMessage = () => {
    if (!message.trim()) return;
    
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Determine colors based on current selected status
    let sColor = '#555';
    let sBg = '#f5f5f5';
    if (userStatus === 'Safe') { sColor = '#43a047'; sBg = '#E8F5E9'; }
    if (userStatus === 'Evacuating') { sColor = '#FF6F00'; sBg = '#FFF3E0'; }

    const newMsg = {
      id: Date.now(),
      name: 'You', // In a real app, this would be the logged-in user's name
      initial: 'Y',
      isOfficial: false,
      status: userStatus,
      statusColor: sColor,
      statusBg: sBg,
      message: message.trim(),
      time: now,
      pinned: false
    };

    setCommunityMessages([...communityMessages, newMsg]);
    setMessage(''); // Clear input box
  };
  const sendAiMessage = async () => {
    if (!message.trim() || loading) return;
    if (!GROQ_API_KEY) {
      setAiMessages((prev) => [...prev, {
        id: `error-${Date.now()}`,
        role: 'ai',
        text: 'API key is not configured. Please contact support.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      return;
    }

    const userMsg = message.trim();
    setMessage('');
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const typingId = `typing-${Date.now()}`;

    setAiMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: 'user', text: userMsg, time: now },
      { id: typingId, role: 'ai', text: 'Typing...', time: now, isTyping: true },
    ]);
    setLoading(true);

    try {
      const aiReply = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', GROQ_ENDPOINT);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Authorization', `Bearer ${GROQ_API_KEY}`);
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const data = JSON.parse(xhr.responseText);
            resolve(data?.choices?.[0]?.message?.content || "I'm here to help. Could you rephrase that?");
          } else {
            reject(new Error(`API error: ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error('Network request failed'));
        xhr.send(JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userMsg },
          ],
        }));
      });

      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setAiMessages((prev) =>
        prev.map((msg) =>
          msg.id === typingId
            ? { id: `ai-${Date.now()}`, role: 'ai', text: aiReply.trim(), time: replyTime }
            : msg
        )
      );
    } catch (error: any) {
      console.error('Groq API Error:', error);
      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setAiMessages((prev) =>
        prev.map((msg) =>
          msg.id === typingId
            ? {
                id: `error-${Date.now()}`,
                role: 'ai',
                text: `Emergency services are busy (${error?.message || 'Unknown error'}). Please try again shortly.`,
                time: replyTime,
              }
            : msg
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // NEW: SOS Button Action
  const handleSOS = () => {
    if (Platform.OS === 'web') {
      window.alert('🚨 SOS TRIGGERED 🚨\n\nEmergency services and your emergency contacts have been notified.');
    } else {
      Alert.alert(
        '🚨 SOS EMERGENCY 🚨',
        'Emergency services and your emergency contacts have been notified.',
        [{ text: 'OK', style: 'destructive' }]
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Top Bar */}
      <View style={[styles.topBar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Text style={styles.logoText}>🏃</Text>
        <Text style={[styles.location, { color: theme.text }]}>📍 Karachi, Pakistan</Text>
        <TouchableOpacity
          style={[styles.darkBtn, { backgroundColor: theme.bg, borderColor: theme.border }]}
          onPress={toggleTheme}
        >
          <Text style={[styles.darkBtnText, { color: theme.text }]}>{isDark ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.pageTitle, { backgroundColor: theme.card, color: theme.text }]}>Community & AI Assistant</Text>

      {/* Tabs */}
      <View style={[styles.tabsRow, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        {['Community', 'AI'].map((tab) => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, { color: theme.text }]}>{tab === 'Community' ? '🛡 Community Chat' : '🤖 AI Assistant'}</Text>
            {activeTab === tab && <View style={[styles.tabUnderline, { backgroundColor: theme.text }]} />}
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'Community' ? (
        <>
          <View style={[styles.activeBar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
            <View style={styles.activeDot} />
            <Text style={[styles.activeText, { color: isHighContrast ? theme.accent : theme.text }]}>342 people active in Downtown District</Text>
          </View>
          <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 16, paddingBottom: 20 }}>
            {communityMessages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.msgCard,
                  { backgroundColor: theme.card, borderColor: theme.border },
                  msg.pinned && [
                    styles.msgCardPinned,
                    isHighContrast
                      ? styles.msgCardPinnedHighContrast
                      : isDark
                        ? styles.msgCardPinnedDark
                      : { borderColor: theme.border },
                  ],
                ]}
              >
                {msg.pinned && <Text style={[styles.pinnedLabel, { color: isHighContrast ? theme.accent : '#FFFFFF' }]}>🛡 PINNED MESSAGE</Text>}
                <View style={styles.msgHeader}>
                  <View style={[styles.avatar, { backgroundColor: theme.bg }, msg.isOfficial && styles.avatarOfficial]}>
                    <Text style={styles.avatarText}>{msg.initial}</Text>
                  </View>
                  <Text style={[styles.msgName, { color: theme.text }]}>{msg.name}</Text>
                  {msg.isOfficial && <View style={styles.officialBadge}><Text style={styles.officialText}>Official</Text></View>}
                  {msg.status && (
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            isDark && !isHighContrast
                              ? msg.status === 'Safe'
                                ? '#14532D'
                                : msg.status === 'Evacuating'
                                  ? '#7C2D12'
                                  : '#374151'
                              : msg.statusBg,
                          borderWidth: isDark && !isHighContrast ? 1 : 0,
                          borderColor:
                            isDark && !isHighContrast
                              ? msg.status === 'Safe'
                                ? '#4ADE80'
                                : msg.status === 'Evacuating'
                                  ? '#FB923C'
                                  : '#9CA3AF'
                              : 'transparent',
                          shadowColor:
                            isDark && !isHighContrast
                              ? msg.status === 'Safe'
                                ? '#22C55E'
                                : msg.status === 'Evacuating'
                                  ? '#F97316'
                                  : '#9CA3AF'
                              : 'transparent',
                          shadowOpacity: isDark && !isHighContrast ? 0.35 : 0,
                          shadowRadius: isDark && !isHighContrast ? 4 : 0,
                          shadowOffset: { width: 0, height: 0 },
                        },
                      ]}
                    >
                      <Text style={[styles.statusText, { color: isDark && !isHighContrast ? '#FFFFFF' : msg.statusColor }]}>{msg.status}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.msgText, { color: theme.text }]}>{msg.message}</Text>
                <Text style={[styles.msgTime, { color: isHighContrast ? theme.accent : theme.secondaryText }]}>{msg.time}</Text>
              </View>
            ))}
          </ScrollView>
          
          {/* UPDATED: Community Input Area */}
          <View style={[styles.inputArea, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
            <TextInput 
              style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} 
              placeholder="Share updates with your community..." 
              placeholderTextColor={isHighContrast ? '#FFFF00' : theme.secondaryText} 
              value={message} 
              onChangeText={setMessage} 
              onSubmitEditing={sendCommunityMessage}
            />
            <TouchableOpacity style={[styles.sendBtn, { backgroundColor: theme.bg, borderColor: theme.border }]} onPress={sendCommunityMessage}>
              <Text style={styles.sendIcon}>✈</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.statusRow, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
            <Text style={[styles.statusLabel, { color: isHighContrast ? theme.accent : theme.text }]}>Your status:</Text>
            {['Safe', 'Evacuating', 'Need Help'].map((s) => (
              <TouchableOpacity key={s} style={[styles.statusBtn, { backgroundColor: theme.card, borderColor: theme.border }, userStatus === s && styles.statusBtnActive, s === 'Safe' && userStatus === s && { backgroundColor: '#E8F5E9', borderColor: '#43a047' }, s === 'Evacuating' && userStatus === s && { backgroundColor: '#FFF3E0', borderColor: '#FF6F00' }, s === 'Need Help' && userStatus === s && { backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5', borderColor: isDark ? '#666' : '#555' }]} onPress={() => setUserStatus(s)}>
                <Text style={[styles.statusBtnText, s === 'Safe' && userStatus === s && { color: '#43a047' }, s === 'Evacuating' && userStatus === s && { color: '#FF6F00' }]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      ) : (
        <>
          <View style={[styles.aiHeader, { backgroundColor: theme.card }]}>
            <View style={styles.aiAvatar}><Text style={styles.aiAvatarText}>🤖</Text></View>
            <View>
              <Text style={[styles.aiName, { color: theme.text }]}>DisasterGuard AI ✨</Text>
              <Text style={[styles.aiSub, { color: isHighContrast ? theme.accent : theme.text }]}>Powered by AI • Always Available</Text>
            </View>
          </View>
          <Text style={[styles.aiDesc, { color: isHighContrast ? theme.accent : theme.text, backgroundColor: theme.card }]}>Get instant answers about disaster safety, shelters, and emergency procedures.</Text>
          <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 16, paddingBottom: 20 }}>
            {aiMessages.map((msg) => (
              <View key={msg.id} style={[styles.aiMsgRow, msg.role === 'user' && styles.aiMsgRowUser]}>
                <View
                  style={[
                    styles.aiMsgBubble,
                    msg.role === 'user'
                      ? styles.aiMsgBubbleUser
                      : {
                          backgroundColor: isHighContrast ? '#000000' : isDark ? '#2a2a2a' : '#f0f0f0',
                          borderColor: theme.border,
                        },
                  ]}
                >
                  {msg.role === 'ai' && <Text style={[styles.aiMsgLabel, { color: isHighContrast ? theme.accent : '#1565C0' }]}>🤖 AI Assistant</Text>}
                  <Text style={[styles.aiMsgText, { color: theme.text }, msg.role === 'user' && styles.aiMsgTextUser]}>{msg.text}</Text>
                  <Text
                    style={[
                      styles.aiMsgTime,
                      {
                        color: msg.role === 'user'
                          ? (isHighContrast ? '#FFFFFF' : '#ffffff')
                            : (isHighContrast ? theme.accent : theme.secondaryText),
                      },
                    ]}
                  >
                    {msg.time}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* UPDATED: AI Input Area */}
          <View style={[styles.inputArea, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
            <TextInput 
              style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} 
              placeholder="Ask AI about safety, shelters, emergencies..." 
              placeholderTextColor={isHighContrast ? '#FFFF00' : theme.secondaryText} 
              value={message} 
              onChangeText={setMessage} 
              onSubmitEditing={sendAiMessage} 
            />
            <TouchableOpacity style={[styles.sendBtn, { backgroundColor: theme.bg, borderColor: theme.border }]} onPress={sendAiMessage}>
              <Text style={styles.sendIcon}>✈</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Bottom Tab Bar */}
      <View style={[styles.bottomTabBar, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        {[
          { icon: 'home', label: 'Home', route: '/user' },
          { icon: 'map', label: 'Map', route: '/user/map' },
          { icon: 'alert-circle', label: 'Alerts', route: '/user/alerts/alerts' },
          { icon: 'message-circle', label: 'Chat', active: true, route: '/user/chat' },
          { icon: 'user', label: 'Profile', route: '/user/profile/profile' },
        ].map((tab, i) => (
          <TouchableOpacity key={i} style={styles.tabItem} onPress={() => { if (!tab.active) router.push(tab.route as any); }}>
            <Feather name={tab.icon as any} size={22} color={tab.active ? theme.text : theme.secondaryText} style={styles.tabIcon} />
            <Text
              style={[
                styles.tabLabel,
                { color: tab.active ? theme.text : theme.secondaryText },
                tab.active && styles.tabLabelActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.sosBtn} onPress={handleSOS}>
        <Text style={styles.sosText}>!</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  logoText: { fontSize: 22, marginRight: 8 },
  location: { flex: 1, fontSize: 14, fontWeight: '500' },
  darkBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  darkBtnText: { fontSize: 16 },
  pageTitle: { fontSize: 20, fontWeight: '800', padding: 16, paddingBottom: 0 },
  tabsRow: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, padding: 14, alignItems: 'center' },
  tabActive: {},
  tabText: { fontSize: 14, fontWeight: '600' },
  tabUnderline: { height: 2, width: '100%', marginTop: 8 },
  activeBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, gap: 8, borderBottomWidth: 1 },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#43a047' },
  activeText: { fontSize: 13 },
  scroll: { flex: 1 },
  msgCard: { borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1 },
  msgCardPinned: { backgroundColor: '#EEF2FF' },
  msgCardPinnedDark: { backgroundColor: '#1E3A8A', borderColor: '#3B82F6', borderWidth: 1 },
  msgCardPinnedHighContrast: { backgroundColor: '#000000', borderColor: '#FFFFFF', borderWidth: 2 },
  pinnedLabel: { fontSize: 11, fontWeight: '700', marginBottom: 8 },
  msgHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarOfficial: { backgroundColor: '#1565C0' },
  avatarText: { fontSize: 16 },
  msgName: { fontSize: 14, fontWeight: '700' },
  officialBadge: { backgroundColor: '#1565C0', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  officialText: { color: 'white', fontSize: 11, fontWeight: '700' },
  statusBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  msgText: { fontSize: 13, lineHeight: 20, marginBottom: 6 },
  msgTime: { fontSize: 11 },
  inputArea: { flexDirection: 'row', padding: 12, gap: 10, borderTopWidth: 1 },
  input: { flex: 1, borderRadius: 8, padding: 12, fontSize: 14, borderWidth: 1 },
  sendBtn: { width: 44, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  sendIcon: { fontSize: 18 },
  statusRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8, borderTopWidth: 1 },
  statusLabel: { fontSize: 13 },
  statusBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  statusBtnActive: {},
  statusBtnText: { fontSize: 12, color: '#555', fontWeight: '500' },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  aiAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1565C0', alignItems: 'center', justifyContent: 'center' },
  aiAvatarText: { fontSize: 22 },
  aiName: { fontSize: 16, fontWeight: '700' },
  aiSub: { fontSize: 12 },
  aiDesc: { fontSize: 13, paddingHorizontal: 16, paddingVertical: 8 },
  aiMsgRow: { marginBottom: 12 },
  aiMsgRowUser: { alignItems: 'flex-end' },
  aiMsgBubble: { borderRadius: 12, padding: 14, maxWidth: '85%', borderWidth: 1 },
  aiMsgBubbleUser: { backgroundColor: '#1565C0', borderColor: '#1565C0' },
  aiMsgLabel: { fontSize: 11, fontWeight: '700', color: '#1565C0', marginBottom: 6 },
  aiMsgText: { fontSize: 13, lineHeight: 20 },
  aiMsgTextUser: { color: 'white' },
  aiMsgTime: { fontSize: 11, marginTop: 6 },
  bottomTabBar: { flexDirection: 'row', borderTopWidth: 1, paddingVertical: 8, paddingBottom: 16 },
  tabItem: { flex: 1, alignItems: 'center' },
  tabIcon: { fontSize: 20, marginBottom: 2 },
  tabLabel: { fontSize: 11 },
  tabLabelActive: { fontWeight: '700' },
  sosBtn: { position: 'absolute', bottom: 140, right: 16, width: 48, height: 48, borderRadius: 24, backgroundColor: '#e53935', alignItems: 'center', justifyContent: 'center' },
  sosText: { color: 'white', fontWeight: '900', fontSize: 22 },
});