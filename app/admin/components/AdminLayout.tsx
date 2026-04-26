import { Feather } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React, { ReactNode, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type AdminLayoutProps = {
  children: ReactNode;
};

const MOBILE_BREAKPOINT = 900;

const navItems = [
  { label: 'Overview', route: '/admin' },
  { label: 'Alert Management', route: '/admin/alerts' },
  { label: 'Shelters', route: '/admin/shelters' },
  { label: 'User Management', route: '/admin/users' },
  { label: 'Broadcast', route: '/admin/broadcast' },
  { label: 'Analytics', route: '/admin/analytics' },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const isMobile = width <= MOBILE_BREAKPOINT;
  const [drawerOpen, setDrawerOpen] = useState(false);

  const activeRoute = useMemo(() => {
    if (pathname === '/admin') return '/admin';
    const active = navItems.find((item) => pathname.startsWith(item.route));
    return active?.route ?? '/admin';
  }, [pathname]);

  const handleNavigate = (route: string) => {
    router.push(route as never);
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  const SidebarContent = (
    <View style={styles.sidebarInner}>
      <View style={styles.logoBlock}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoShield}>🛡️</Text>
        </View>
        <View>
          <Text style={styles.logoTitle}>DisasterGuard</Text>
          <Text style={styles.logoSub}>Admin Panel</Text>
        </View>
      </View>

      <View style={styles.navList}>
        {navItems.map((item) => {
          const isActive = activeRoute === item.route;
          return (
            <TouchableOpacity key={item.route} style={[styles.navItem, isActive && styles.navItemActive]} onPress={() => handleNavigate(item.route)}>
              <Text style={[styles.navText, isActive && styles.navTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={() => handleNavigate('/')}>
        <Text style={styles.logoutText}>→ Logout</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.shell}>
        <View style={styles.header}>
          <View style={styles.headerBrand}>
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>🛡️</Text>
            </View>
            <Text style={styles.headerTitle}>DisasterGuard</Text>
          </View>

          <TouchableOpacity style={styles.menuButton} onPress={() => setDrawerOpen((prev) => !prev)}>
            <Feather name="menu" size={22} color="#111827" />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          {!isMobile && <View style={styles.desktopSidebar}>{SidebarContent}</View>}
          <View style={styles.content}>{children}</View>
        </View>

        {isMobile && drawerOpen && (
          <>
            <Pressable style={styles.drawerBackdrop} onPress={() => setDrawerOpen(false)} />
            <View style={styles.mobileDrawer}>{SidebarContent}</View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f6f8' },
  shell: { flex: 1 },
  header: {
    height: 64,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerBrand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#CC2200',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadgeText: { fontSize: 16 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, flexDirection: 'row' },
  desktopSidebar: {
    width: 250,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  content: { flex: 1 },
  sidebarInner: { flex: 1, padding: 16 },
  logoBlock: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 22 },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#CC2200',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoShield: { fontSize: 18 },
  logoTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },
  logoSub: { fontSize: 13, color: '#6b7280' },
  navList: { gap: 6 },
  navItem: { paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10 },
  navItemActive: { backgroundColor: '#111827' },
  navText: { fontSize: 16, color: '#4b5563', fontWeight: '500' },
  navTextActive: { color: '#ffffff', fontWeight: '700' },
  logoutBtn: { marginTop: 'auto', paddingVertical: 14 },
  logoutText: { color: '#CC2200', fontSize: 18, fontWeight: '700' },
  drawerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    top: 64,
    backgroundColor: 'rgba(0,0,0,0.35)',
    zIndex: 40,
  },
  mobileDrawer: {
    position: 'absolute',
    top: 64,
    left: 0,
    bottom: 0,
    width: '82%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    zIndex: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
  },
});
