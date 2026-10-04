import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, Page } from '../../components/ui';
import { useApp } from '../../data/AppState';
import { colors, type } from '../../theme/theme';

const GOAL: Record<string, string> = { strength: 'Strength', weight: 'Weight loss', consistency: 'Consistency', energy: 'Energy' };

export default function TrainerHome() {
  const { data } = useApp();
  return (
    <Page back title="Trainer view" sub="Review and adjust your clients' AI plans">
      {data.clients.map((c) => {
        const sessions = c.plan.sessions.filter((s) => !s.rest).length;
        return (
          <Pressable key={c.id} accessibilityRole="button" accessibilityLabel={`Open ${c.name}`} onPress={() => router.push({ pathname: '/trainer/[id]', params: { id: c.id } })}>
            <Card style={styles.row}>
              <View style={styles.avatar}><Text style={{ color: '#fff', fontWeight: '800' }}>{c.name[0]}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: colors.text, fontSize: 16 }}>{c.name}</Text>
                <Text style={type.small}>{c.profile.level}, {GOAL[c.profile.goal]}, {sessions} sessions a week</Text>
                {c.profile.injuries.length > 0 && <Text style={type.small}>Go easy on: {c.profile.injuries.join(', ')}</Text>}
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </Card>
          </Pressable>
        );
      })}
      <Text style={[type.small, { marginTop: 6 }]}>These clients are demo data. Real client linking arrives with accounts.</Text>
    </Page>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
