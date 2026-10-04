import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Empty, IconName, Page, SectionTitle, Tag } from '../../components/ui';
import { Ring } from '../../components/Ring';
import { useApp } from '../../data/AppState';
import { DAY_NAMES, niceDate } from '../../logic/dates';
import { badgesFor, computeStreak, insightsFor, weekStats } from '../../logic/stats';
import { colors, radius, type } from '../../theme/theme';

const BADGE_TINT: Record<string, string> = {
  first: colors.primaryText, streak3: colors.rose, five: colors.amber, week: colors.green,
  scanner: colors.sky, circle: colors.primaryText, challenger: colors.amber,
};

export default function Progress() {
  const { data } = useApp();
  const [picked, setPicked] = useState<string | null>(null);
  const now = new Date();
  const w = weekStats(data);
  const streak = computeStreak(data.history, now);
  const badges = badgesFor(data, now);
  const insights = insightsFor(data, now);
  const recent = [...data.history].reverse().slice(0, 8);
  const totalMinutes = data.history.reduce((n, h) => n + h.minutes, 0);
  const sel = badges.find((b) => b.id === picked);

  return (
    <Page title="Progress Tracking" sub="Realtime activity and metrics overview" tabbed>
      <Card style={styles.ringCard}>
        <Ring percent={w.percent} size={150} stroke={13} label="Goal" />
        <Text style={[type.body, { marginTop: 14, fontWeight: '600' }]}>{Math.round(w.percent)}% of weekly workouts completed</Text>
        <Text style={type.small}>{w.done} of {w.planned} sessions</Text>
      </Card>

      <View style={styles.stats}>
        <Mini value={String(data.history.length)} label="Workouts" />
        <Mini value={String(totalMinutes)} label="Minutes" />
        <Mini value={String(streak)} label="Streak" />
      </View>

      <SectionTitle>This Week</SectionTitle>
      <View style={styles.week}>
        {DAY_NAMES.map((d, i) => {
          const on = w.minutesByDay[i] > 0 || data.plan.sessions[i].done;
          return (
            <View key={d} style={{ alignItems: 'center', gap: 6 }} accessible accessibilityLabel={`${d}: ${on ? `${w.minutesByDay[i]} minutes` : 'no workout'}`}>
              <View style={[styles.day, on && styles.dayOn]}>
                <Text style={{ color: on ? '#fff' : colors.muted, fontWeight: '800' }}>{d[0]}</Text>
                <View style={[styles.dot, { backgroundColor: on ? '#fff' : colors.border }]} />
              </View>
              <Text style={type.small}>{w.minutesByDay[i] ? `${w.minutesByDay[i]}m` : ' '}</Text>
            </View>
          );
        })}
      </View>

      <SectionTitle>Weekly insights</SectionTitle>
      <Card>
        {insights.map((t, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 8, marginTop: i ? 10 : 0 }}>
            <Ionicons name="sparkles" size={16} color={colors.primaryText} style={{ marginTop: 2 }} />
            <Text style={[type.body, { flex: 1 }]}>{t}</Text>
          </View>
        ))}
      </Card>

      <SectionTitle>Streak & Badges</SectionTitle>
      <View style={styles.badges}>
        {badges.map((b) => {
          const tint = BADGE_TINT[b.id] ?? colors.primaryText;
          return (
            <Pressable
              key={b.id} onPress={() => setPicked(picked === b.id ? null : b.id)}
              accessibilityRole="button" accessibilityLabel={`${b.label}. ${b.earned ? 'Earned' : b.hint}`}
              style={[styles.badge, b.earned && { borderColor: `${tint}55` }, picked === b.id && { borderColor: colors.primaryText }]}
            >
              <View style={[styles.badgeIcon, { backgroundColor: `${tint}${b.earned ? '26' : '12'}`, opacity: b.earned ? 1 : 0.6 }]}>
                <Ionicons name={b.icon as IconName} size={22} color={tint} />
              </View>
              <Text style={[styles.badgeLabel, !b.earned && { color: colors.muted }]} numberOfLines={2}>{b.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={[type.small, { marginTop: 8 }]}>
        {sel ? `${sel.label}: ${sel.earned ? 'earned.' : sel.hint}` : 'Tap a badge to see how to earn it. One rest day between workouts keeps your streak.'}
      </Text>

      <SectionTitle>Workout history</SectionTitle>
      {recent.length === 0 ? <Empty text="Finished workouts show up here." /> : recent.map((h) => (
        <Card key={h.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 }}>
          <Text style={{ color: colors.text, fontWeight: '600' }}>{h.title}</Text>
          <Text style={type.small}>{niceDate(h.date)}, {h.minutes} min</Text>
        </Card>
      ))}
    </Page>
  );
}

function Mini({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.mini}>
      <Text style={styles.miniValue}>{value}</Text>
      <Tag color={colors.muted}>{label}</Tag>
    </View>
  );
}

const styles = StyleSheet.create({
  ringCard: { alignItems: 'center', paddingVertical: 24, borderRadius: 24 },
  stats: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  mini: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.card, padding: 12, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: colors.border },
  miniValue: { fontSize: 22, fontWeight: '800', color: colors.text },
  week: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { width: 44, height: 48, borderRadius: 12, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1, borderColor: colors.border },
  dayOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  dot: { width: 4, height: 4, borderRadius: 2 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badge: { width: '22.5%', aspectRatio: 0.85, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', gap: 6, padding: 4 },
  badgeIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  badgeLabel: { fontSize: 11, fontWeight: '700', color: colors.text, textAlign: 'center' },
});
