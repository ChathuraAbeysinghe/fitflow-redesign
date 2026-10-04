import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Check, Page, Tag } from '../../components/ui';
import { useApp } from '../../data/AppState';
import { DAY_NAMES, todayIndex } from '../../logic/dates';
import { colors, radius, type } from '../../theme/theme';

export default function Plan() {
  const { data, swapDays, completeSession, undoSession, rebuildPlan, showToast } = useApp();
  const [open, setOpen] = useState<string | null>(null);
  const t = todayIndex(new Date());
  const { plan } = data;

  const canMove = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    const s = plan.sessions[i];
    if (s.rest || s.done || i < t || j < t || j > 6) return false;
    return !plan.sessions[j].done;
  };

  const recreate = () =>
    Alert.alert('Recreate this week?', 'Upcoming sessions get new exercises. Workouts you already finished stay in your history.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Recreate', onPress: rebuildPlan },
    ]);

  return (
    <Page title="AI Workout Planner" sub="Customized weekly training schedule" tabbed>
      <Card>
        <Text style={type.h2}>Why this plan</Text>
        {plan.rationale.map((r) => (
          <View key={r} style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <Ionicons name="sparkles" size={15} color={colors.primaryText} style={{ marginTop: 2 }} />
            <Text style={[type.small, { flex: 1 }]}>{r}</Text>
          </View>
        ))}
      </Card>

      {plan.sessions.map((s, i) => {
        const isOpen = open === s.id;
        if (s.rest) {
          return (
            <View key={s.id} style={[styles.rest, i === t && { borderColor: colors.primary }]}>
              <Tag color={colors.muted}>{DAY_NAMES[i]}{i === t ? ' - today' : ''}</Tag>
              <Text style={[type.small, { marginTop: 2 }]}>Rest day</Text>
            </View>
          );
        }
        const missed = !s.done && i < t;
        return (
          <View key={s.id} style={[styles.row, s.done && styles.rowDone, missed && { borderColor: colors.amber }, i === t && !s.done && { borderColor: colors.primaryText }]}>
            <View style={styles.top}>
              <View style={styles.arrows}>
                <Pressable accessibilityLabel={`Move ${s.title} earlier`} hitSlop={8} onPress={() => swapDays(i, i - 1)} disabled={!canMove(i, -1)}>
                  <Ionicons name="chevron-up" size={20} color={canMove(i, -1) ? colors.muted : colors.border} />
                </Pressable>
                <Pressable accessibilityLabel={`Move ${s.title} later`} hitSlop={8} onPress={() => swapDays(i, i + 1)} disabled={!canMove(i, 1)}>
                  <Ionicons name="chevron-down" size={20} color={canMove(i, 1) ? colors.muted : colors.border} />
                </Pressable>
              </View>
              <Pressable style={{ flex: 1 }} onPress={() => setOpen(isOpen ? null : s.id)} accessibilityRole="button" accessibilityLabel={`${s.title}, show details`}>
                <Tag color={missed ? colors.amber : s.done || i === t ? colors.primaryText : colors.muted}>
                  {DAY_NAMES[i]}{i === t ? ' - today' : ''}{missed ? ' - missed' : ''}
                </Tag>
                <Text style={[styles.title, !s.done && i !== t && { color: colors.muted }]}>{s.title}</Text>
                <Text style={type.small}>{s.minutes} min, {s.exercises.length} exercises</Text>
              </Pressable>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: s.done }}
                accessibilityLabel={`Mark ${s.title} done`}
                onPress={() => (s.done ? undoSession(s.id) : completeSession(s.id))}
                hitSlop={8}
              >
                <Check on={s.done} />
              </Pressable>
            </View>

            {/* Lab 4 fix R3: a visible reschedule action next to reordering */}
            {canMove(i, 1) && (
              <Pressable onPress={() => swapDays(i, i + 1)} hitSlop={6} style={{ marginTop: 10 }}>
                <Text style={styles.link}>Move to tomorrow</Text>
              </Pressable>
            )}

            {isOpen && (
              <View style={styles.details}>
                {s.exercises.map((e) => (
                  <View key={e.exerciseId} style={{ marginBottom: 10 }}>
                    <Text style={{ color: colors.text, fontWeight: '700' }}>{e.name}</Text>
                    <Text style={type.small}>{e.sets} x {e.kind === 'reps' ? `${e.reps} reps` : `${e.seconds} sec`}. {e.tip}</Text>
                  </View>
                ))}
                {!s.done && (
                  <Button label="Start this workout" variant="ghost" onPress={() => router.push({ pathname: '/workout', params: { sessionId: s.id } })} />
                )}
              </View>
            )}
          </View>
        );
      })}

      <Button label="Accept Plan" onPress={() => { showToast('Plan saved. Your week is set.'); router.navigate('/'); }} style={{ marginTop: 8 }} />
      <Button label="Recreate with AI" variant="ghost" onPress={recreate} style={{ marginTop: 10 }} />
    </Page>
  );
}

const styles = StyleSheet.create({
  row: { backgroundColor: colors.surface, borderRadius: radius.card, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  rowDone: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rest: { borderRadius: radius.card, padding: 12, marginBottom: 10, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border },
  arrows: { alignItems: 'center', gap: 4 },
  title: { fontSize: 16, fontWeight: '700', color: colors.text, marginVertical: 2 },
  link: { color: colors.primaryText, fontWeight: '700', fontSize: 13 },
  details: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
});
