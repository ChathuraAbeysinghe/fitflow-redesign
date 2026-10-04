import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Card, Chip, Empty, Page, SectionTitle, Stepper } from '../../components/ui';
import { useApp } from '../../data/AppState';
import { DAY_LONG } from '../../logic/dates';
import { colors, type } from '../../theme/theme';
import { INJURIES } from '../onboarding';

export default function ClientDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, setClientInjuries, setClientSessionMinutes, setClientNotes } = useApp();
  const client = data.clients.find((c) => c.id === id);
  const [notes, setNotes] = useState(client?.notes ?? '');

  if (!client) {
    return (
      <Page back title="Client not found">
        <Empty text="This client is no longer available." />
        <Button label="Back" onPress={() => router.back()} />
      </Page>
    );
  }

  const toggle = (i: (typeof INJURIES)[number]['id']) => {
    const cur = client.profile.injuries;
    setClientInjuries(client.id, cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]);
  };

  return (
    <Page back title={client.name} sub={`${client.profile.level}, ${client.profile.minutes} min sessions`}>
      <Card>
        <Text style={type.h2}>Injuries and limits</Text>
        <Text style={[type.small, { marginVertical: 6 }]}>Changing these rebuilds the plan without the affected moves.</Text>
        <View style={styles.wrap}>{INJURIES.map((i) => <Chip key={i.id} label={i.label} on={client.profile.injuries.includes(i.id)} onPress={() => toggle(i.id)} />)}</View>
      </Card>

      <Card>
        <Text style={type.h2}>Why this plan</Text>
        {client.plan.rationale.map((r) => <Text key={r} style={[type.small, { marginTop: 4 }]}>{r}</Text>)}
      </Card>

      <SectionTitle>Sessions</SectionTitle>
      {client.plan.sessions.filter((s) => !s.rest).map((s) => (
        <Card key={s.id}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>{DAY_LONG[s.dayIndex]}</Text>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>{s.title}</Text>
          <Text style={[type.small, { marginVertical: 4 }]}>{s.exercises.map((e) => e.name).join(', ')}</Text>
          <View style={styles.row}>
            <Text style={type.small}>Length</Text>
            <Stepper value={s.minutes} onChange={(m) => setClientSessionMinutes(client.id, s.dayIndex, m)} min={10} max={60} step={5} format={(n) => `${n} min`} />
          </View>
        </Card>
      ))}

      <SectionTitle>Trainer note</SectionTitle>
      <Card>
        <TextInput value={notes} onChangeText={setNotes} placeholder="Notes for this client" placeholderTextColor={colors.muted} multiline style={styles.input} accessibilityLabel="Trainer note" />
        <Button label="Save note" onPress={() => setClientNotes(client.id, notes)} />
      </Card>
    </Page>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, marginBottom: 10, fontSize: 15, color: colors.text, minHeight: 80, textAlignVertical: 'top' },
});
