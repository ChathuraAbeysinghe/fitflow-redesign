import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Bar, Button, Card, Chip, Page, SectionTitle, Stepper, Tag } from '../components/ui';
import { useApp } from '../data/AppState';
import { Goal, Injury, Level } from '../data/types';
import { colors, radius, type } from '../theme/theme';

export const LEVELS: { id: Level; label: string; hint: string; detail: string }[] = [
  {
    id: 'beginner',
    label: 'Beginner',
    hint: 'New to structured workouts or returning after a long break',
    detail: 'Focuses on fundamental movement patterns and lighter progression.',
  },
  {
    id: 'intermediate',
    label: 'Intermediate',
    hint: 'Train 2 to 3 times a week and know the basic exercises',
    detail: 'Balanced combinations of strength, cardio, and core stability.',
  },
  {
    id: 'advanced',
    label: 'Advanced',
    hint: 'Train 4+ times a week and follow progressive programs',
    detail: 'Higher training volume, intensity intervals, and advanced circuits.',
  },
];

export const GOALS: { id: Goal; label: string; desc: string; icon: 'barbell-outline' | 'flame-outline' | 'calendar-outline' | 'flash-outline' }[] = [
  { id: 'consistency', label: 'Stay consistent', desc: 'Build an everyday routine that fits around your schedule', icon: 'calendar-outline' },
  { id: 'strength', label: 'Build strength', desc: 'Progressive upper and lower body muscle endurance', icon: 'barbell-outline' },
  { id: 'weight', label: 'Lose weight', desc: 'High-energy cardio intervals paired with full-body activation', icon: 'flame-outline' },
  { id: 'energy', label: 'Get more energy', desc: 'Mobility, dynamic movement, and stress-free pacing', icon: 'flash-outline' },
];

export const INJURIES: { id: Injury; label: string; icon: 'medkit-outline' }[] = [
  { id: 'knee', label: 'Knees', icon: 'medkit-outline' },
  { id: 'shoulder', label: 'Shoulders', icon: 'medkit-outline' },
  { id: 'back', label: 'Lower back', icon: 'medkit-outline' },
  { id: 'wrist', label: 'Wrists', icon: 'medkit-outline' },
];

export default function Onboarding() {
  const { data, completeOnboarding } = useApp();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState(data.profile.name || '');
  const [level, setLevel] = useState<Level>('beginner');
  const [goal, setGoal] = useState<Goal>('consistency');
  const [days, setDays] = useState(3);
  const [minutes, setMinutes] = useState(25);
  const [injuries, setInjuries] = useState<Injury[]>([]);

  const toggleInjury = (i: Injury) =>
    setInjuries((l) => (l.includes(i) ? l.filter((x) => x !== i) : [...l, i]));

  const next = () => {
    if (step < 3) setStep((s) => (s + 1) as 2 | 3);
  };
  const prev = () => {
    if (step > 1) setStep((s) => (s - 1) as 1 | 2);
  };

  const finish = () => {
    const finalName = name.trim() || 'Athlete';
    completeOnboarding({
      name: finalName,
      level,
      goal,
      daysPerWeek: days,
      minutes,
      injuries,
    });
    router.replace('/(tabs)');
  };

  return (
    <Page
      title={step === 1 ? "Let's personalize FitFlow" : step === 2 ? 'Your Schedule' : 'Goals & Protection'}
      sub={
        step === 1
          ? 'Step 1 of 3 • Tell us about yourself'
          : step === 2
          ? 'Step 2 of 3 • How you like to work out'
          : 'Step 3 of 3 • Tailor your AI workout engine'
      }
    >
      {/* Visual step progress */}
      <View style={styles.progressContainer}>
        <Bar value={step} max={3} color={colors.primary} />
        <View style={styles.stepLabels}>
          <Text style={[styles.stepLabel, step >= 1 && styles.stepLabelActive]}>1. Profile</Text>
          <Text style={[styles.stepLabel, step >= 2 && styles.stepLabelActive]}>2. Schedule</Text>
          <Text style={[styles.stepLabel, step >= 3 && styles.stepLabelActive]}>3. Tailoring</Text>
        </View>
      </View>

      {/* STEP 1: NAME & FITNESS LEVEL */}
      {step === 1 && (
        <View>
          <SectionTitle>What should we call you?</SectionTitle>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Alex or Priya"
            placeholderTextColor={colors.muted}
            style={styles.input}
            accessibilityLabel="Your name"
          />

          <SectionTitle>Your fitness level</SectionTitle>
          <Text style={[type.small, { marginBottom: 12 }]}>
            This calibrates reps, hold times, and exercise complexity.
          </Text>
          {LEVELS.map((l) => {
            const on = level === l.id;
            return (
              <Pressable
                key={l.id}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                onPress={() => setLevel(l.id)}
                style={[styles.option, on && styles.optionOn]}
              >
                <Ionicons
                  name={on ? 'radio-button-on' : 'radio-button-off'}
                  size={22}
                  color={on ? colors.primary : colors.muted}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionTitle}>{l.label}</Text>
                  <Text style={type.small}>{l.hint}</Text>
                </View>
              </Pressable>
            );
          })}

          <Button label="Next: Your Schedule" onPress={next} style={{ marginTop: 20 }} />
        </View>
      )}

      {/* STEP 2: DAYS & TIME PER SESSION */}
      {step === 2 && (
        <View>
          <Card>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={type.h2}>Days per week</Text>
                <Text style={type.small}>How many days can you commit to?</Text>
              </View>
              <Stepper value={days} onChange={setDays} min={2} max={6} />
            </View>

            <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 16 }} />

            <Text style={type.h2}>Time per session</Text>
            <Text style={[type.small, { marginBottom: 10 }]}>Short, effective routines fit busy days easily.</Text>
            <View style={styles.wrap}>
              {[15, 20, 25, 30, 45].map((m) => (
                <Chip
                  key={m}
                  label={`${m} min`}
                  on={minutes === m}
                  onPress={() => setMinutes(m)}
                />
              ))}
            </View>
          </Card>

          <Card style={{ backgroundColor: colors.surface2, borderColor: colors.border }}>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <Ionicons name="sparkles" size={20} color={colors.primaryText} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '700', fontSize: 14 }}>Adaptive Scheduling</Text>
                <Text style={[type.small, { marginTop: 2 }]}>
                  Missed a day? FitFlow automatically reschedules it so you never lose momentum.
                </Text>
              </View>
            </View>
          </Card>

          <View style={styles.btnRow}>
            <Button label="Back" variant="ghost" onPress={prev} style={{ flex: 1 }} />
            <Button label="Next: Goals" onPress={next} style={{ flex: 2 }} />
          </View>
        </View>
      )}

      {/* STEP 3: GOALS & INJURIES */}
      {step === 3 && (
        <View>
          <SectionTitle>Your primary goal</SectionTitle>
          <View style={{ gap: 10, marginBottom: 16 }}>
            {GOALS.map((g) => {
              const on = goal === g.id;
              return (
                <Pressable
                  key={g.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  onPress={() => setGoal(g.id)}
                  style={[styles.option, on && styles.optionOn]}
                >
                  <Ionicons name={g.icon} size={22} color={on ? colors.primary : colors.muted} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.optionTitle}>{g.label}</Text>
                    <Text style={type.small}>{g.desc}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <SectionTitle>Any injury or areas to protect?</SectionTitle>
          <Text style={[type.small, { marginBottom: 10 }]}>
            The AI engine automatically removes exercises that strain these joints.
          </Text>
          <View style={styles.wrap}>
            {INURIES_RENDER(injuries, toggleInjury)}
          </View>

          {/* AI Plan Preview Summary Card */}
          <Card style={{ marginTop: 20, borderColor: colors.primary, backgroundColor: 'rgba(99,102,241,0.08)' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Tag color={colors.primaryText}>AI GENERATOR READY</Tag>
              <Ionicons name="checkmark-circle" size={18} color={colors.green} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>
              {name.trim() || 'Athlete'}'s Custom Routine
            </Text>
            <Text style={[type.small, { marginTop: 4 }]}>
              {level.toUpperCase()} • {days} sessions/week • {minutes} min/session
              {injuries.length > 0 ? ` • Avoiding: ${injuries.join(', ')}` : ''}
            </Text>
          </Card>

          <View style={styles.btnRow}>
            <Button label="Back" variant="ghost" onPress={prev} style={{ flex: 1 }} />
            <Button label="Create My AI Plan" onPress={finish} style={{ flex: 2 }} />
          </View>
        </View>
      )}
    </Page>
  );
}

function INURIES_RENDER(injuries: Injury[], toggleInjury: (i: Injury) => void) {
  return INJURIES.map((i) => (
    <Chip
      key={i.id}
      label={i.label}
      on={injuries.includes(i.id)}
      onPress={() => toggleInjury(i.id)}
    />
  ));
}

const styles = StyleSheet.create({
  progressContainer: { marginBottom: 20 },
  stepLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  stepLabel: { fontSize: 12, fontWeight: '600', color: colors.muted },
  stepLabelActive: { color: colors.primaryText, fontWeight: '700' },
  input: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    padding: 14,
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
  option: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: radius.card,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  optionOn: { borderColor: colors.primary, backgroundColor: 'rgba(99,102,241,0.1)' },
  optionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
});
