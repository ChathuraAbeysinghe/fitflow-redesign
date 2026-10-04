import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Chip, Page, SectionTitle, Stepper } from '../components/ui';
import { useApp } from '../data/AppState';
import { Goal, Injury, Level } from '../data/types';
import { colors, radius, type } from '../theme/theme';

const LEVELS: { id: Level; label: string; hint: string }[] = [
  { id: 'beginner', label: 'Beginner', hint: 'New to structured workouts or returning after a long break' },
  { id: 'intermediate', label: 'Intermediate', hint: 'Train 2 to 3 times a week and know the basic exercises' },
  { id: 'advanced', label: 'Advanced', hint: 'Train 4+ times a week and follow progressive programs' },
];
export const GOALS: { id: Goal; label: string }[] = [
  { id: 'strength', label: 'Build strength' },
  { id: 'weight', label: 'Lose weight' },
  { id: 'consistency', label: 'Stay consistent' },
  { id: 'energy', label: 'Get more energy' },
];
export const INJURIES: { id: Injury; label: string }[] = [
  { id: 'knee', label: 'Knees' },
  { id: 'shoulder', label: 'Shoulders' },
  { id: 'back', label: 'Lower back' },
  { id: 'wrist', label: 'Wrists' },
];

export default function Onboarding() {
  const { data, completeOnboarding } = useApp();
  const [name, setName] = useState(data.profile.name);
  const [level, setLevel] = useState<Level>('beginner');
  const [goal, setGoal] = useState<Goal>('consistency');
  const [days, setDays] = useState(3);
  const [minutes, setMinutes] = useState(25);
  const [injuries, setInjuries] = useState<Injury[]>([]);

  const toggle = (i: Injury) => setInjuries((l) => (l.includes(i) ? l.filter((x) => x !== i) : [...l, i]));

  return (
    <Page title="Let's build your first plan" sub="A few quick choices, then your plan is ready.">
      <SectionTitle>Your name</SectionTitle>
      <TextInput value={name} onChangeText={setName} placeholder="First name" placeholderTextColor={colors.muted} style={styles.input} accessibilityLabel="Your name" />

      <SectionTitle>Your fitness level</SectionTitle>
      {LEVELS.map((l) => {
        const on = level === l.id;
        return (
          <Pressable key={l.id} accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={() => setLevel(l.id)} style={[styles.option, on && styles.optionOn]}>
            <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={22} color={on ? colors.primary : colors.muted} />
            <View style={{ flex: 1 }}>
              <Text style={styles.optionTitle}>{l.label}</Text>
              <Text style={type.small}>{l.hint}</Text>
            </View>
          </Pressable>
        );
      })}

      <SectionTitle>Your main goal</SectionTitle>
      <View style={styles.wrap}>{GOALS.map((g) => <Chip key={g.id} label={g.label} on={goal === g.id} onPress={() => setGoal(g.id)} />)}</View>

      <Card style={{ marginTop: 14 }}>
        <View style={styles.row}>
          <Text style={type.body}>Days per week</Text>
          <Stepper value={days} onChange={setDays} min={2} max={6} />
        </View>
        <Text style={[type.body, { marginTop: 14, marginBottom: 8 }]}>Time per session</Text>
        <View style={styles.wrap}>{[15, 20, 25, 30, 45].map((m) => <Chip key={m} label={`${m} min`} on={minutes === m} onPress={() => setMinutes(m)} />)}</View>
      </Card>

      <SectionTitle>Anything we should go easy on?</SectionTitle>
      <View style={styles.wrap}>{INJURIES.map((i) => <Chip key={i.id} label={i.label} on={injuries.includes(i.id)} onPress={() => toggle(i.id)} />)}</View>
      <Text style={[type.small, { marginTop: 6 }]}>We will leave out moves that load these areas.</Text>

      <Button
        label="Create my plan"
        onPress={() => { completeOnboarding({ name, level, goal, daysPerWeek: days, minutes, injuries }); router.replace('/(tabs)'); }}
        style={{ marginTop: 24 }}
      />
    </Page>
  );
}

const styles = StyleSheet.create({
  input: { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, borderRadius: radius.button, padding: 14, fontSize: 16, color: colors.text },
  option: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: colors.surface, padding: 14, borderRadius: radius.card, marginBottom: 10, borderWidth: 1.5, borderColor: colors.border },
  optionOn: { borderColor: colors.primary },
  optionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
