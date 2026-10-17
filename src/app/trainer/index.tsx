import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Chip, inputStyle, Page, SectionTitle, Segmented, Stepper, Tag } from '../../components/ui';
import { useApp } from '../../data/AppState';
import { Goal, Injury, Level } from '../../data/types';
import { colors, radius, type } from '../../theme/theme';
import { GOALS, INJURIES } from '../onboarding';

const GOAL: Record<string, string> = {
  strength: 'Strength',
  weight: 'Weight loss',
  consistency: 'Consistency',
  energy: 'Energy',
};

export default function TrainerHome() {
  const { data, addClient } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [level, setLevel] = useState<Level>('beginner');
  const [goal, setGoal] = useState<Goal>('strength');
  const [days, setDays] = useState(3);
  const [minutes, setMinutes] = useState(30);
  const [injuries, setInjuries] = useState<Injury[]>([]);

  const toggleInjury = (i: Injury) =>
    setInjuries((list) => (list.includes(i) ? list.filter((x) => x !== i) : [...list, i]));

  const submitClient = () => {
    if (!name.trim()) return;
    addClient(name.trim(), {
      level,
      goal,
      daysPerWeek: days,
      minutes,
      injuries,
    });
    setName('');
    setInjuries([]);
    setShowAdd(false);
  };

  return (
    <Page back title="Trainer Dashboard" sub="Review, assign, and customize AI plans for clients">
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Text style={type.h2}>Your Clients ({data.clients.length})</Text>
        <Button
          label={showAdd ? 'Cancel' : '+ Add Client'}
          variant={showAdd ? 'ghost' : 'light'}
          onPress={() => setShowAdd(!showAdd)}
          style={{ minHeight: 38, paddingVertical: 8, paddingHorizontal: 12 }}
        />
      </View>

      {/* Add New Client Form */}
      {showAdd && (
        <Card style={{ marginBottom: 16, borderColor: colors.primary }}>
          <Text style={[type.h2, { marginBottom: 8 }]}>Add New Client</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Client Name e.g. Kusal Mendis"
            placeholderTextColor={colors.muted}
            style={[inputStyle, { marginBottom: 10 }]}
            accessibilityLabel="Client name"
          />

          <Text style={[type.small, { marginBottom: 6 }]}>Fitness Level</Text>
          <Segmented<Level>
            options={[
              { value: 'beginner', label: 'Beginner' },
              { value: 'intermediate', label: 'Intermediate' },
              { value: 'advanced', label: 'Advanced' },
            ]}
            value={level}
            onChange={setLevel}
          />

          <Text style={[type.small, { marginTop: 12, marginBottom: 6 }]}>Goal</Text>
          <View style={styles.wrap}>
            {GOALS.map((g) => (
              <Chip key={g.id} label={g.label} on={goal === g.id} onPress={() => setGoal(g.id)} />
            ))}
          </View>

          <View style={[styles.row, { marginTop: 12 }]}>
            <Text style={type.small}>Days per week</Text>
            <Stepper value={days} onChange={setDays} min={2} max={6} />
          </View>

          <View style={[styles.row, { marginTop: 12 }]}>
            <Text style={type.small}>Session duration</Text>
            <Stepper value={minutes} onChange={setMinutes} min={15} max={60} step={5} format={(n) => `${n}m`} />
          </View>

          <Text style={[type.small, { marginTop: 12, marginBottom: 6 }]}>Injuries / Limits to avoid</Text>
          <View style={styles.wrap}>
            {INJURIES.map((i) => (
              <Chip key={i.id} label={i.label} on={injuries.includes(i.id)} onPress={() => toggleInjury(i.id)} />
            ))}
          </View>

          <Button
            label="Generate & Add Client Plan"
            disabled={!name.trim()}
            onPress={submitClient}
            style={{ marginTop: 14 }}
          />
        </Card>
      )}

      {/* Client List */}
      {data.clients.map((c) => {
        const sessions = c.plan.sessions.filter((s) => !s.rest).length;
        return (
          <Pressable
            key={c.id}
            accessibilityRole="button"
            accessibilityLabel={`Open ${c.name}'s plan`}
            onPress={() => router.push({ pathname: '/trainer/[id]', params: { id: c.id } })}
          >
            <Card style={styles.row}>
              <View style={styles.avatar}>
                <Text style={{ color: colors.bg, fontWeight: '800', fontSize: 16 }}>{c.name[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontWeight: '700', color: colors.text, fontSize: 16 }}>{c.name}</Text>
                  <Tag color={colors.primaryText}>{c.profile.level.toUpperCase()}</Tag>
                </View>
                <Text style={type.small}>
                  {GOAL[c.profile.goal]} • {sessions} sessions/wk • {c.profile.minutes} min
                </Text>
                {c.profile.injuries.length > 0 && (
                  <Text style={[type.small, { color: colors.amber }]}>
                    Limits: {c.profile.injuries.join(', ')}
                  </Text>
                )}
                {c.notes ? (
                  <Text style={[type.small, { fontStyle: 'italic', color: colors.muted, marginTop: 2 }]} numberOfLines={1}>
                    Note: "{c.notes}"
                  </Text>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </Card>
          </Pressable>
        );
      })}

      <Text style={[type.small, { marginTop: 10, textAlign: 'center' }]}>
        All client AI workout plans and trainer adjustments are stored locally for immediate testing.
      </Text>
    </Page>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'space-between' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
