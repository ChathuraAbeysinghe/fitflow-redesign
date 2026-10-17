import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Check, Page, Tag } from '../../components/ui';
import { useApp } from '../../data/AppState';
import { DAY_NAMES, todayIndex } from '../../logic/dates';
import { colors, radius, type } from '../../theme/theme';

export default function Plan() {
  const { data, swapDays, moveSessionToDay, completeSession, undoSession, rebuildPlan, showToast } = useApp();
  const [open, setOpen] = useState<string | null>(null);
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const t = todayIndex(new Date());
  const { plan } = data;

  const canMove = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    const s = plan.sessions[i];
    if (s.rest || s.done || i < t || j < t || j > 6) return false;
    return !plan.sessions[j].done;
  };

  const recreate = () =>
    Alert.alert(
      'Recreate this week?',
      'Upcoming sessions get new exercises adapted to your latest profile. Workouts you already finished remain safely in your history.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Recreate Plan', onPress: rebuildPlan },
      ]
    );

  return (
    <Page title="AI Workout Planner" sub="Customized weekly training schedule" tabbed>
      {/* AI Plan Rationale Card */}
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <Ionicons name="sparkles" size={18} color={colors.primaryText} />
          <Text style={type.h2}>Why this plan</Text>
        </View>
        {plan.rationale.map((r) => (
          <View key={r} style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <View style={styles.dot} />
            <Text style={[type.small, { flex: 1, color: colors.text }]}>{r}</Text>
          </View>
        ))}
      </Card>

      {/* Week Plan Sessions List */}
      {plan.sessions.map((s, i) => {
        const isOpen = open === s.id;
        const isRescheduling = reschedulingId === s.id;

        if (s.rest) {
          return (
            <View
              key={s.id}
              style={[styles.rest, i === t && { borderColor: colors.primary, backgroundColor: 'rgba(99,102,241,0.05)' }]}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Tag color={colors.muted}>
                  {DAY_NAMES[i]}
                  {i === t ? ' • TODAY' : ''}
                </Tag>
                <Tag color={colors.border}>REST DAY</Tag>
              </View>
              <Text style={[type.small, { marginTop: 4 }]}>Recovery & mobility day. Rest is essential for progress.</Text>
            </View>
          );
        }

        const missed = !s.done && i < t;

        return (
          <View
            key={s.id}
            style={[
              styles.row,
              s.done && styles.rowDone,
              missed && { borderColor: colors.amber, borderWidth: 1.5 },
              i === t && !s.done && { borderColor: colors.primaryText, borderWidth: 1.5 },
            ]}
          >
            <View style={styles.top}>
              {/* Arrow controls for reordering */}
              <View style={styles.arrows}>
                <Pressable
                  accessibilityLabel={`Move ${s.title} earlier`}
                  hitSlop={8}
                  onPress={() => swapDays(i, i - 1)}
                  disabled={!canMove(i, -1)}
                >
                  <Ionicons name="chevron-up" size={20} color={canMove(i, -1) ? colors.muted : colors.border} />
                </Pressable>
                <Pressable
                  accessibilityLabel={`Move ${s.title} later`}
                  hitSlop={8}
                  onPress={() => swapDays(i, i + 1)}
                  disabled={!canMove(i, 1)}
                >
                  <Ionicons name="chevron-down" size={20} color={canMove(i, 1) ? colors.muted : colors.border} />
                </Pressable>
              </View>

              {/* Title & Info */}
              <Pressable
                style={{ flex: 1 }}
                onPress={() => setOpen(isOpen ? null : s.id)}
                accessibilityRole="button"
                accessibilityLabel={`${s.title}, show details`}
              >
                <Tag color={missed ? colors.amber : s.done || i === t ? colors.primaryText : colors.muted}>
                  {DAY_NAMES[i]}
                  {i === t ? ' • TODAY' : ''}
                  {missed ? ' • MISSED' : ''}
                  {s.done ? ' • COMPLETED' : ''}
                </Tag>
                <Text style={[styles.title, !s.done && i !== t && { color: colors.muted }]}>{s.title}</Text>
                <Text style={type.small}>
                  {s.minutes} min • {s.exercises.length} exercises • {s.focus.toUpperCase()}
                </Text>
              </Pressable>

              {/* Complete Checkbox */}
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

            {/* Discoverable Reschedule Bar (Lab Sheet 4 R3 / U4 Fix) */}
            {!s.done && (
              <View style={styles.rescheduleRow}>
                <Pressable
                  onPress={() => setReschedulingId(isRescheduling ? null : s.id)}
                  hitSlop={6}
                  style={styles.rescheduleBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Reschedule session to another day"
                >
                  <Ionicons name="calendar-outline" size={15} color={colors.primaryText} />
                  <Text style={styles.link}>
                    {isRescheduling ? 'Cancel Reschedule' : 'Reschedule to another day'}
                  </Text>
                </Pressable>

                {canMove(i, 1) && (
                  <Pressable
                    onPress={() => swapDays(i, i + 1)}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityLabel="Move to tomorrow"
                  >
                    <Text style={[styles.link, { color: colors.muted }]}>Move to tomorrow →</Text>
                  </Pressable>
                )}
              </View>
            )}

            {/* Inline Day Selector when Rescheduling is active */}
            {isRescheduling && !s.done && (
              <View style={styles.dayPicker}>
                <Text style={[type.small, { marginBottom: 8, fontWeight: '700', color: colors.text }]}>
                  Select day to move this workout:
                </Text>
                <View style={styles.dayGrid}>
                  {DAY_NAMES.map((d, targetIdx) => {
                    const targetSession = plan.sessions[targetIdx];
                    const isSelf = targetIdx === i;
                    const isTargetDone = targetSession.done;
                    const isRest = targetSession.rest;

                    return (
                      <Pressable
                        key={d}
                        disabled={isSelf || isTargetDone}
                        onPress={() => {
                          moveSessionToDay(s.id, targetIdx);
                          setReschedulingId(null);
                        }}
                        style={[
                          styles.dayChip,
                          isSelf && styles.dayChipSelf,
                          isRest && styles.dayChipFree,
                          isTargetDone && styles.dayChipDisabled,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayChipText,
                            isSelf && { color: colors.primaryText },
                            isRest && { color: colors.green },
                            isTargetDone && { color: colors.muted },
                          ]}
                        >
                          {d}
                        </Text>
                        <Text style={styles.dayChipSub}>
                          {isSelf ? 'Current' : isTargetDone ? 'Done' : isRest ? 'Free' : 'Swap'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Expanded Workout Breakdown */}
            {isOpen && (
              <View style={styles.details}>
                <Text style={[type.h2, { marginBottom: 10, fontSize: 15 }]}>Planned Exercises:</Text>
                {s.exercises.map((e, eIdx) => (
                  <View key={e.exerciseId} style={styles.exerciseItem}>
                    <View style={styles.exerciseNum}>
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>{eIdx + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontWeight: '700', fontSize: 14 }}>{e.name}</Text>
                      <Text style={type.small}>
                        {e.sets} sets × {e.kind === 'reps' ? `${e.reps} reps` : `${e.seconds} sec`}
                      </Text>
                      <Text style={[type.small, { color: colors.muted, fontStyle: 'italic', marginTop: 2 }]}>
                        💡 {e.tip}
                      </Text>
                    </View>
                  </View>
                ))}
                {!s.done && (
                  <Button
                    label="Start this workout now"
                    onPress={() => router.push({ pathname: '/workout', params: { sessionId: s.id } })}
                    style={{ marginTop: 8 }}
                  />
                )}
              </View>
            )}
          </View>
        );
      })}

      <Button
        label="Accept Plan"
        onPress={() => {
          showToast('Plan saved. Your week is set!');
          router.navigate('/');
        }}
        style={{ marginTop: 8 }}
      />
      <Button label="Recreate with AI" variant="ghost" onPress={recreate} style={{ marginTop: 10 }} />
    </Page>
  );
}

const styles = StyleSheet.create({
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primaryText, marginTop: 7 },
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowDone: { borderColor: colors.primary, backgroundColor: 'rgba(99,102,241,0.08)' },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rest: {
    borderRadius: radius.card,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  arrows: { alignItems: 'center', gap: 4 },
  title: { fontSize: 16, fontWeight: '700', color: colors.text, marginVertical: 2 },
  rescheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rescheduleBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  link: { color: colors.primaryText, fontWeight: '700', fontSize: 13 },
  dayPicker: {
    marginTop: 10,
    padding: 12,
    backgroundColor: colors.surface2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dayChip: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    minWidth: 42,
  },
  dayChipSelf: { borderColor: colors.primaryText, backgroundColor: 'rgba(99,102,241,0.15)' },
  dayChipFree: { borderColor: colors.green, backgroundColor: 'rgba(16,185,129,0.1)' },
  dayChipDisabled: { opacity: 0.4 },
  dayChipText: { fontSize: 11, fontWeight: '700', color: colors.text },
  dayChipSub: { fontSize: 9, color: colors.muted, marginTop: 2 },
  details: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  exerciseItem: { flexDirection: 'row', gap: 10, marginBottom: 12, alignItems: 'flex-start' },
  exerciseNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
});
