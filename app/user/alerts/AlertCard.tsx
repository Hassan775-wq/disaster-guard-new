import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type AlertItem = {
  title: string;
  level: string;
  levelColor: string;
  levelBg: string;
  icon: string;
  iconBg: string;
  desc: string;
  time: string;
  date: string;
  confidence: number;
  confidenceColor: string;
  action: string;
  actionDesc: string;
  actionBg: string;
};

type ThemeShape = {
  bg: string;
  card: string;
  text: string;
  secondaryText: string;
  border: string;
  accent: string;
};

type AlertCardProps = {
  alert: AlertItem;
  isDark: boolean;
  isHighContrast: boolean;
  theme: ThemeShape;
};

export default function AlertCard({ alert, isDark, isHighContrast, theme }: AlertCardProps) {
  const getHCColor = (defaultColor: string) => (isHighContrast ? '#FFFFFF' : defaultColor);
  const getAdaptiveColor = (lightColor: string, darkColor = theme.secondaryText) =>
    isHighContrast ? '#FFFFFF' : isDark ? darkColor : lightColor;

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
    >
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.alertIconBox,
            {
              backgroundColor: isHighContrast ? '#000000' : isDark ? theme.border : alert.iconBg,
              borderColor: isHighContrast ? '#FFFFFF' : 'transparent',
              borderWidth: isHighContrast ? 1 : 0,
            },
          ]}
        >
          <Text style={styles.alertIcon}>{alert.icon}</Text>
        </View>

        <Text style={[styles.alertTitle, { color: getHCColor(theme.text) }]}>{alert.title}</Text>

        <View
          style={[
            styles.levelBadge,
            {
              backgroundColor: isHighContrast ? '#000000' : isDark ? theme.border : alert.levelBg,
              borderColor: isHighContrast ? '#FFFFFF' : 'transparent',
              borderWidth: isHighContrast ? 1 : 0,
            },
          ]}
        >
          <Text style={[styles.levelText, { color: isHighContrast ? '#FFFF00' : alert.levelColor }]}>{alert.level}</Text>
        </View>
      </View>

      <Text style={[styles.alertDesc, { color: getAdaptiveColor('#374151', '#D1D5DB') }]}>{alert.desc}</Text>

      <View style={styles.infoRow}>
        <View
          style={[
            styles.infoBox,
            {
              backgroundColor: isHighContrast ? '#000000' : isDark ? theme.border : theme.bg,
              borderWidth: isHighContrast ? 1 : 0,
              borderColor: isHighContrast ? '#FFFFFF' : 'transparent',
            },
          ]}
        >
          <Text style={[styles.infoLabel, { color: getAdaptiveColor('#374151') }]}>Predicted Time</Text>
          <Text style={[styles.infoValue, { color: getHCColor(theme.text) }]}>{alert.time}</Text>
          <Text style={[styles.infoDate, { color: getAdaptiveColor('#4B5563') }]}>{alert.date}</Text>
        </View>

        <View
          style={[
            styles.infoBox,
            {
              backgroundColor: isHighContrast ? '#000000' : isDark ? theme.border : theme.bg,
              borderWidth: isHighContrast ? 1 : 0,
              borderColor: isHighContrast ? '#FFFFFF' : 'transparent',
            },
          ]}
        >
          <Text style={[styles.infoLabel, { color: getAdaptiveColor('#374151') }]}>Confidence Percentage</Text>
          <Text style={[styles.infoValue, { color: getHCColor(theme.text) }]}>{alert.confidence}%</Text>
          <View
            style={[
              styles.confBarBg,
              {
                backgroundColor: isHighContrast ? '#000000' : isDark ? '#0F172A' : theme.bg,
                borderColor: isHighContrast ? '#FFFFFF' : 'transparent',
                borderWidth: isHighContrast ? 1 : 0,
              },
            ]}
          >
            <View
              style={[
                styles.confBarFill,
                {
                  width: `${alert.confidence}%`,
                  backgroundColor: isHighContrast ? '#39FF14' : alert.confidenceColor,
                },
              ]}
            />
          </View>
        </View>
      </View>

      <View
        style={[
          styles.actionBox,
          {
            backgroundColor: isHighContrast ? '#000000' : isDark ? '#1A1A1A' : alert.actionBg,
            borderColor: isHighContrast ? '#FFFF00' : alert.levelColor,
            borderWidth: isHighContrast ? 2 : isDark ? 1 : 0,
          },
        ]}
      >
        <Text style={[styles.actionTitle, { color: isHighContrast ? '#FFFF00' : isDark ? '#FFFFFF' : '#1F2937' }]}>{alert.action}</Text>
        <Text style={[styles.actionDesc, { color: getAdaptiveColor('#374151') }]}>{alert.actionDesc}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  alertIconBox: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  alertIcon: { fontSize: 18 },
  alertTitle: { flex: 1, fontSize: 15, fontWeight: '700' },
  levelBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  levelText: { fontSize: 12, fontWeight: '700' },
  alertDesc: { fontSize: 13, lineHeight: 20, marginBottom: 12 },
  infoRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  infoBox: { flex: 1, borderRadius: 8, padding: 12 },
  infoLabel: { fontSize: 11, marginBottom: 4, fontWeight: '600' },
  infoValue: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  infoDate: { fontSize: 11 },
  confBarBg: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 4 },
  confBarFill: { height: 6, borderRadius: 3 },
  actionBox: { borderRadius: 8, padding: 12 },
  actionTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  actionDesc: { fontSize: 12 },
});
