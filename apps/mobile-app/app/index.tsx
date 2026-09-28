import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { neutralColors, defaultBrandColors, spacingNumeric } from '@tuite/design-tokens';

const MENU_ITEMS = [
  { title: 'Mark Attendance', subtitle: 'Daily batch attendance for teachers', icon: '✅', route: '/attendance' },
  { title: 'Leave Management', subtitle: 'Apply for leave or view history', icon: '📋', route: '/leave' },
];

export default function Index() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Tuite' }} />

      <Text style={styles.heading}>Welcome to Tuite</Text>
      <Text style={styles.subheading}>Tuition Management Portal</Text>

      <View style={styles.grid}>
        {MENU_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.route}
            style={styles.card}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.cardIcon}>{item.icon}</Text>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacingNumeric.xl,
    backgroundColor: neutralColors.gray50,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: neutralColors.gray900,
    marginTop: spacingNumeric.xl,
  },
  subheading: {
    fontSize: 15,
    color: neutralColors.gray500,
    marginTop: spacingNumeric.xs,
    marginBottom: spacingNumeric.xl,
  },
  grid: {
    gap: spacingNumeric.md,
  },
  card: {
    backgroundColor: neutralColors.white,
    borderRadius: 16,
    padding: spacingNumeric.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardIcon: {
    fontSize: 32,
    marginBottom: spacingNumeric.sm,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: neutralColors.gray900,
  },
  cardSubtitle: {
    fontSize: 13,
    color: neutralColors.gray500,
    marginTop: 4,
  },
});
