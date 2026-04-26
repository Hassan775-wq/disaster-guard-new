import { Stack } from 'expo-router';
import { ThemeProvider } from '../context/ThemeContext'; // Ensure this path is correct based on your root

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="register" />
        
        {/* Admin Screens */}
        <Stack.Screen name="admin/index" />
        <Stack.Screen name="admin/users" />
        <Stack.Screen name="admin/broadcast" />
        <Stack.Screen name="admin/analytics" />
        
        {/* User Screens */}
        <Stack.Screen name="user/index" />
        <Stack.Screen name="user/map" />
        <Stack.Screen name="user/alerts" />
        <Stack.Screen name="user/chat" />
        <Stack.Screen name="user/profile" />
        
        {/* New User Feature Screens */}
        <Stack.Screen name="user/alert-history" />
        <Stack.Screen name="user/edit-profile" />
        <Stack.Screen name="user/add-contact" />
        <Stack.Screen name="user/edit-contact" />
        <Stack.Screen name="user/about" />
        <Stack.Screen name="user/privacy" />
        <Stack.Screen name="user/terms" />
      </Stack>
    </ThemeProvider>
  );
}