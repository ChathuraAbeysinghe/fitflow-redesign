import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Chip, Empty, IconName, Page, SectionTitle, Tag } from '../../components/ui';
import { Ring } from '../../components/Ring';
import { useApp } from '../../data/AppState';
import { DAY_NAMES, DAY_LONG, niceDate } from '../../logic/dates';
import { badgesFor, computeStreak, insightsFor, weekStats } from '../../logic/stats';
import { colors, radius, type } from '../../theme/theme';

const BADGE_TINT: Record<string, string> = {
  first: colors.primaryText,
  streak3: colors.rose,
  five: colors.amber,
  week: colors.green,
  scanner: colors.sky,
  circle: colors.primaryText,
  challenger: colors.amber,
};

export default function Progress() {
  const { data } = useApp();
  const [pickedBadge, setPickedBadge] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [filterFocus, setFilterFocus] = useState<string>('all');

  const now = new Date();
  const w = weekStats(data);
  const streak = computeStreak(data.history, now);
  const badges = badgesFor(data, now);
  const insights = insightsFor(data, now);
  const totalMinutes = data.history.reduce((n, h) => n + h.minutes, 0);
  const totalCaloriesEst = Math.round(totalMinutes * 7.5);

  const sel = badges.find((b) => b.id === pickedBadge);

  const filteredHistory = [...data.history]
    .reverse()
    .filter((h) => filterFocus === 'all' || h.focus === filterFocus);

  return (
    <Page title="Progress Tracking" sub="Realtime metrics, streaks & achievements" tabbed>
      {/* Weekly Goal Ring Card */}
      <Card style={styles.ringCard}>
        <Ring percent={w.percent} size={150} stroke={13} label="Weekly Goal" />
        <Text style={[type.body, { marginTop: 14, fontWeight: '700' }]}>
          {Math.round(w.percent)}% of weekly workouts completed
        </Text>
        <Text style={type.small}>
          {w.done} of {w.planned} sessions finished this week
        </Text>
      </Card>

      {/* Mini Stats Metrics */}
      <View style={styles.stats}>
        <Mini value={String(data.history.length)} label="WORKOUTS" />
        <Mini value={`${totalMinutes}m`} label="MINUTES" />
        <Mini value={String(streak)} label="STREAK" />
        <Mini value={`~${totalCaloriesEst}`} label="EST KCAL" />
      </View>

      {/* Weekly Activity Calendar Bar */}
      <SectionTitle>This Week's Activity</SectionTitle>
      <View style={styles.week}>
        {DAY_NAMES.map((d, i) => {
          const s = data.plan.sessions[i];
          const hasWorkout = w.minutesByDay[i] > 0 || s.done;
          const isSelected = selectedDay === i;

          return (
            <Pressable
              key={d}
              onPress={() => setSelectedDay(isSelected ? null : i)}
              style={{ alignItems: 'center', gap: 6 }}
              accessible
              accessibilityLabel={`${DAY_LONG[i]}: ${hasWorkout ? `${w.minutesByDay[i] || s.minutes} minutes` : s.rest ? 'Rest day' : 'Planned workout'}`}
            >
              <View
                style={[
                  styles.day,
                  hasWorkout && styles.dayOn,
                  isSelected && { borderColor: colors.primary, borderWidth: 2 },
                  s.rest && !hasWorkout && { borderStyle: 'dashed' },
                ]}
              >
                <Text style={{ color: hasWorkout ? colors.bg : colors.muted, fontWeight: '800' }}>{d[0]}</Text>
                <View style={[styles.dot, { backgroundColor: hasWorkout ? colors.bg : colors.border }]} />
              </View>
              <Text style={type.small}>{w.minutesByDay[i] ? `${w.minutesByDay[i]}m` : s.rest ? 'rest' : ' '}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Selected Day Info Popup */}
      {selectedDay !== null && (
        <Card style={{ backgroundColor: colors.surface2, marginTop: 4, borderColor: colors.primary }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15 }}>
              {DAY_LONG[selectedDay]}
            </Text>
            <Tag color={data.plan.sessions[selectedDay].done ? colors.lime : colors.primary}>
              {data.plan.sessions[selectedDay].done ? 'COMPLETED' : data.plan.sessions[selectedDay].rest ? 'REST DAY' : 'PLANNED'}
            </Tag>
          </View>
          <Text style={[type.small, { marginTop: 4 }]}>
            {data.plan.sessions[selectedDay].title} • {data.plan.sessions[selectedDay].minutes} mins
          </Text>
        </Card>
      )}

      {/* Weekly AI Insights */}
      <SectionTitle>Weekly AI Insights</SectionTitle>
      <Card>
        {insights.map((t, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 8, marginTop: i ? 10 : 0 }}>
            <Ionicons name="sparkles" size={16} color={colors.primary} style={{ marginTop: 2 }} />
            <Text style={[type.body, { flex: 1, fontSize: 14 }]}>{t}</Text>
          </View>
        ))}
      </Card>

      {/* Streaks & Achievement Badges */}
      <SectionTitle>Streaks & Badges</SectionTitle>
      <View style={styles.badges}>
        {badges.map((b) => {
          const tint = BADGE_TINT[b.id] ?? colors.primary;
          const isSelected = pickedBadge === b.id;

          return (
            <Pressable
              key={b.id}
              onPress={() => setPickedBadge(isSelected ? null : b.id)}
              accessibilityRole="button"
              accessibilityLabel={`${b.label}. ${b.earned ? 'Earned' : b.hint}`}
              style={[
                styles.badge,
                b.earned && { borderColor: `${tint}80`, backgroundColor: `${tint}10` },
                isSelected && { borderColor: colors.primary, borderWidth: 2 },
              ]}
            >
              <View
                style={[
                  styles.badgeIcon,
                  { backgroundColor: `${tint}${b.earned ? '30' : '12'}`, opacity: b.earned ? 1 : 0.45 },
                ]}
              >
                <Ionicons name={b.icon as IconName} size={22} color={tint} />
              </View>
              <Text style={[styles.badgeLabel, !b.earned && { color: colors.muted }]} numberOfLines={2}>
                {b.label}
              </Text>
              {b.earned && (
                <View style={styles.earnedDot}>
                  <Ionicons name="checkmark" size={10} color={colors.bg} />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Selected Badge Detailed Card */}
      {sel && (
        <Card style={{ marginTop: 10, borderColor: BADGE_TINT[sel.id] ?? colors.primary }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={[
                styles.badgeIcon,
                { backgroundColor: `${BADGE_TINT[sel.id] ?? colors.primary}26` },
              ]}
            >
              <Ionicons name={sel.icon as IconName} size={24} color={BADGE_TINT[sel.id] ?? colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16 }}>{sel.label}</Text>
              <Tag color={sel.earned ? colors.green : colors.amber}>
                {sel.earned ? 'EARNED' : 'IN PROGRESS'}
              </Tag>
            </View>
          </View>
          <Text style={[type.small, { marginTop: 8, color: colors.text }]}>
            {sel.earned ? 'Congratulations! You unlocked this achievement badge.' : sel.hint}
          </Text>
        </Card>
      )}

      {/* Workout History with Focus Filter */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 8 }}>
        <Text style={type.h2}>Workout History</Text>
        <Text style={type.small}>{filteredHistory.length} logged</Text>
      </View>

      {/* Filter Chips */}
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
        {['all', 'push', 'pull', 'legs', 'cardio'].map((cat) => (
          <Chip
            key={cat}
            label={cat === 'all' ? 'All' : cat.toUpperCase()}
            on={filterFocus === cat}
            onPress={() => setFilterFocus(cat)}
          />
        ))}
      </View>

      {filteredHistory.length === 0 ? (
        <Empty text="No finished workouts matching this category." />
      ) : (
        filteredHistory.map((h) => (
          <Card key={h.id} style={styles.historyCard}>
            <View style={styles.historyIcon}>
              <Ionicons name="checkmark-circle" size={20} color={colors.green} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15 }}>{h.title}</Text>
              <Text style={type.small}>
                {niceDate(h.date)} • {h.minutes} mins • {h.focus.toUpperCase()}
              </Text>
            </View>
            <Tag color={colors.primaryText}>{h.minutes} MIN</Tag>
          </Card>
        ))
      )}
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
  stats: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  mini: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 10,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  miniValue: { fontSize: 20, fontWeight: '800', color: colors.text },
  week: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  day: {
    width: 44,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  dot: { width: 4, height: 4, borderRadius: 2 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badge: {
    width: '22.5%',
    aspectRatio: 0.85,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: 4,
    position: 'relative',
  },
  badgeIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  badgeLabel: { fontSize: 10, fontWeight: '700', color: colors.text, textAlign: 'center' },
  earnedDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyCard: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, marginBottom: 8 },
  historyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(16,185,129,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
