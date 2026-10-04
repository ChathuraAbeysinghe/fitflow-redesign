import { Alert, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Chip, Page, PrivacyBadge, SectionTitle, Segmented, Stepper } from '../components/ui';
import { useApp } from '../data/AppState';
import { Injury, Level, Visibility } from '../data/types';
import { timeLabel } from '../logic/dates';
import { colors, type } from '../theme/theme';
import { GOALS, INJURIES } from './onboarding';

export default function Profile() {
  const { data, updateProfile, rebuildPlan, setReminders, setVisibility, resetAll } = useApp();
  const p = data.profile;
  const r = data.reminders;

  const toggleInjury = (i: Injury) =>
    updateProfile({ injuries: p.injuries.includes(i) ? p.injuries.filter((x) => x !== i) : [...p.injuries, i] });

  const reset = () =>
    Alert.alert('Clear all data?', 'This deletes your plan, history, meals and settings from this phone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear everything', style: 'destructive', onPress: async () => { await resetAll(); router.replace('/'); } },
    ]);

  return (
    <Page back title="Profile and settings" sub="Changes save automatically">
      <Card>
        <Text style={type.h2}>About you</Text>
        <TextInput value={p.name} onChangeText={(name) => updateProfile({ name })} placeholder="First name" placeholderTextColor={colors.muted} style={styles.input} accessibilityLabel="Your name" />
        <Text style={[type.small, { marginBottom: 6 }]}>Fitness level</Text>
        <Segmented<Level>
          options={[{ value: 'beginner', label: 'Beginner' }, { value: 'intermediate', label: 'Intermediate' }, { value: 'advanced', label: 'Advanced' }]}
          value={p.level} onChange={(level) => updateProfile({ level })}
        />
        <Text style={[type.small, { marginTop: 14, marginBottom: 6 }]}>Main goal</Text>
        <View style={styles.wrap}>{GOALS.map((g) => <Chip key={g.id} label={g.label} on={p.goal === g.id} onPress={() => updateProfile({ goal: g.id })} />)}</View>
      </Card>

      <Card>
        <Text style={type.h2}>Training</Text>
        <View style={styles.row}><Text style={type.body}>Days per week</Text><Stepper value={p.daysPerWeek} onChange={(daysPerWeek) => updateProfile({ daysPerWeek })} min={2} max={6} /></View>
        <Text style={[type.body, { marginTop: 14, marginBottom: 8 }]}>Time per session</Text>
        <View style={styles.wrap}>{[15, 20, 25, 30, 45].map((m) => <Chip key={m} label={`${m} min`} on={p.minutes === m} onPress={() => updateProfile({ minutes: m })} />)}</View>
        <Text style={[type.body, { marginTop: 14, marginBottom: 8 }]}>Go easy on</Text>
        <View style={styles.wrap}>{INJURIES.map((i) => <Chip key={i.id} label={i.label} on={p.injuries.includes(i.id)} onPress={() => toggleInjury(i.id)} />)}</View>
        <Button label="Rebuild my plan" onPress={rebuildPlan} style={{ marginTop: 16 }} />
        <Text style={[type.small, { marginTop: 6 }]}>Applies your changes to the rest of this week.</Text>
      </Card>

      <Card>
        <Text style={type.h2}>Nutrition</Text>
        <View style={[styles.row, { marginTop: 8 }]}>
          <Text style={type.body}>Daily calorie goal</Text>
          <Stepper value={p.calorieGoal} onChange={(calorieGoal) => updateProfile({ calorieGoal })} min={1200} max={4000} step={100} format={(n) => `${n}`} />
        </View>
      </Card>

      <Card>
        <Text style={type.h2}>Reminders</Text>
        <View style={[styles.row, { marginTop: 8 }]}>
          <Text style={type.body}>Workout reminder</Text>
          <Switch value={r.workoutEnabled} onValueChange={(workoutEnabled) => setReminders({ ...r, workoutEnabled })} trackColor={{ true: colors.primary, false: colors.border }} accessibilityLabel="Workout reminder" />
        </View>
        {r.workoutEnabled && (
          <View style={[styles.row, { marginTop: 10 }]}>
            <Text style={type.small}>Time</Text>
            <Stepper value={r.workoutHour} onChange={(workoutHour) => setReminders({ ...r, workoutHour })} min={5} max={22} format={(h) => timeLabel(h, r.workoutMinute)} />
          </View>
        )}
        {r.workoutEnabled && (
          <View style={[styles.wrap, { marginTop: 10 }]}>
            {[0, 15, 30, 45].map((m) => <Chip key={m} label={`:${String(m).padStart(2, '0')}`} on={r.workoutMinute === m} onPress={() => setReminders({ ...r, workoutMinute: m })} />)}
          </View>
        )}
        <View style={[styles.row, { marginTop: 14 }]}>
          <Text style={type.body}>Meal logging reminders</Text>
          <Switch value={r.mealEnabled} onValueChange={(mealEnabled) => setReminders({ ...r, mealEnabled })} trackColor={{ true: colors.primary, false: colors.border }} accessibilityLabel="Meal logging reminders" />
        </View>
        <Text style={[type.small, { marginTop: 6 }]}>Meal reminders arrive at 13:00 and 19:30.</Text>
      </Card>

      <Card>
        <Text style={type.h2}>Privacy</Text>
        <View style={{ marginVertical: 8 }}>
          <Segmented<Visibility>
            options={[{ value: 'private', label: 'Only me' }, { value: 'circle', label: 'My circles' }, { value: 'public', label: 'Everyone' }]}
            value={data.visibility} onChange={setVisibility}
          />
        </View>
        <PrivacyBadge visibility={data.visibility} />
        <Text style={[type.small, { marginTop: 6 }]}>Everything on this screen is stored only on this phone for now.</Text>
      </Card>

      <SectionTitle>For trainers</SectionTitle>
      <Button label="Open trainer view" variant="ghost" onPress={() => router.push('/trainer')} />

      <SectionTitle>Data</SectionTitle>
      <Button label="Clear all data and start over" variant="danger" onPress={reset} />
    </Page>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, marginVertical: 10, fontSize: 16, color: colors.text },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
