import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Bar, Button, Card, Page, PrivacyBadge, SectionTitle, Tag } from '../../components/ui';
import { Ring } from '../../components/Ring';
import { useApp } from '../../data/AppState';
import { DAY_NAMES, DAY_LONG, niceDate, toISO, todayIndex } from '../../logic/dates';
import { computeStreak, focusSession, freeDay, missedSessions, sumMeals, weekStats } from '../../logic/stats';
import { colors, radius, type } from '../../theme/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

// Muscle target group tags inspired by Image 2 reference
const FOCUS_TAGS: Record<string, string[]> = {
  push: ['Chest', 'Triceps', 'Shoulders'],
  pull: ['Back', 'Biceps', 'Forearms'],
  legs: ['Quads', 'Glutes', 'Calves'],
  core: ['Abs', 'Obliques', 'Core'],
  cardio: ['Heart Rate', 'Stamina', 'Full Body'],
  mobility: ['Flexibility', 'Joints', 'Recovery'],
  full: ['Full Body', 'Chest', 'Quads'],
};

export default function Home() {
  const { data, rescheduleMissed, skipSession } = useApp();
  const now = new Date();
  const currentTodayIdx = todayIndex(now);
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(currentTodayIdx);

  const focus = focusSession(data.plan, now);
  const missed = missedSessions(data.plan, now);
  const free = freeDay(data.plan, now);
  const week = weekStats(data);
  const streak = computeStreak(data.history, now);
  const today = sumMeals(data.meals, toISO(now));
  const mealsToday = data.meals.filter((m) => m.date === toISO(now)).length;
  const challenge = data.challenges.find((c) => c.joined);
  const todaySession = data.plan.sessions[currentTodayIdx];
  const latestWorkout = data.history[data.history.length - 1];

  const heroLabel = !focus
    ? 'This week'
    : focus.kind === 'today'
    ? "Today's Session"
    : focus.kind === 'missed'
    ? 'Missed Session'
    : todaySession.rest
    ? `Rest Day • Next: ${DAY_NAMES[focus.session.dayIndex]}`
    : `Up Next • ${DAY_NAMES[focus.session.dayIndex]}`;

  const openWorkout = (id: string) => router.push({ pathname: '/workout', params: { sessionId: id } });
  const toProfile = () => router.push('/profile');

  const selectedSession = data.plan.sessions[selectedDayIdx];

  return (
    <Page bare tabbed>
      {/* Sleek Top Header (Avatar, Greeting, Privacy Pill, Notifications) */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open profile and settings"
          onPress={toProfile}
          hitSlop={8}
          style={styles.avatarWrap}
        >
          <View style={styles.avatar}>
            <Text style={{ color: '#080C16', fontWeight: '900', fontSize: 16 }}>
              {data.profile.name[0]?.toUpperCase() || 'A'}
            </Text>
          </View>
        </Pressable>

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[type.small, { color: colors.muted, fontSize: 12 }]}>Welcome back</Text>
          <Text style={styles.userName}>{data.profile.name} 👋</Text>
        </View>

        {/* Persistent privacy indicator button (Lab 4 R1) */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Change sharing privacy"
          onPress={() => router.navigate('/community')}
          hitSlop={8}
          style={{ marginRight: 8 }}
        >
          <PrivacyBadge visibility={data.visibility} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reminders and settings"
          onPress={toProfile}
          hitSlop={8}
          style={styles.bellBtn}
        >
          <Ionicons name="notifications-outline" size={20} color={colors.text} />
          {data.reminders.workoutEnabled && <View style={styles.bellDot} />}
        </Pressable>
      </View>

      {/* Missed Workout Adaptive Alert (FR6) */}
      {missed.length > 0 && (
        <Card style={styles.warnCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Ionicons name="alert-circle" size={20} color={colors.amber} />
            <Text style={[type.h2, { color: colors.amber, fontSize: 16 }]}>
              Missed {DAY_NAMES[missed[0].dayIndex]}'s {missed[0].title}
            </Text>
          </View>
          <Text style={[type.small, { marginVertical: 4, color: colors.textSecondary }]}>
            {free !== null
              ? `FitFlow can move it to ${DAY_NAMES[free]} to maintain your weekly progression.`
              : 'All days are booked. You can skip it without losing your streak.'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            {free !== null && (
              <Button
                label={`Reschedule to ${DAY_NAMES[free]}`}
                onPress={() => rescheduleMissed(missed[0].id)}
                style={{ flex: 1.3 }}
              />
            )}
            <Button
              label="Skip Session"
              variant="ghost"
              onPress={() => skipSession(missed[0].id)}
              style={{ flex: 1 }}
            />
          </View>
        </Card>
      )}

      {/* Horizontal Weekly Calendar Strip (Image 3 inspired) */}
      <View style={styles.calendarStrip}>
        {DAY_NAMES.map((d, idx) => {
          const s = data.plan.sessions[idx];
          const isToday = idx === currentTodayIdx;
          const isSelected = idx === selectedDayIdx;
          const isDone = s.done;
          const isRest = s.rest;

          return (
            <Pressable
              key={d}
              accessibilityRole="button"
              accessibilityLabel={`${DAY_LONG[idx]}, ${isDone ? 'Done' : isRest ? 'Rest' : 'Workout'}`}
              onPress={() => setSelectedDayIdx(idx)}
              style={[
                styles.dayPill,
                isSelected && styles.dayPillSelected,
                isToday && !isSelected && styles.dayPillToday,
              ]}
            >
              <Text
                style={[
                  styles.dayLetter,
                  isSelected ? { color: '#080C16', fontWeight: '900' } : isToday ? { color: colors.primary } : null,
                ]}
              >
                {d}
              </Text>

              <View
                style={[
                  styles.dayStatusIndicator,
                  isDone
                    ? { backgroundColor: colors.green }
                    : isToday
                    ? { backgroundColor: colors.primary }
                    : isRest
                    ? { backgroundColor: 'transparent', borderColor: colors.borderLight, borderWidth: 1 }
                    : { backgroundColor: colors.surface3 },
                ]}
              >
                {isDone ? (
                  <Ionicons name="checkmark" size={10} color="#080C16" />
                ) : (
                  <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: isToday ? '#080C16' : colors.muted }} />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Main AI Daily Flow Hero Card (Electric Cyan / Athletic glow inspired by Image 1) */}
      <Card style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Tag color={colors.primary}>{heroLabel}</Tag>
              {focus && (
                <View style={styles.timeTag}>
                  <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary }}>
                    {focus.session.minutes} MIN
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.heroTitle}>{focus ? focus.session.title : 'All sessions completed'}</Text>

            {/* Target muscle group tags inspired by Image 2 */}
            {focus && (
              <View style={styles.muscleTagsRow}>
                {(FOCUS_TAGS[focus.session.focus] || ['Full Body']).map((tag) => (
                  <View key={tag} style={styles.muscleTagPill}>
                    <Text style={styles.muscleTagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            <Text style={[type.small, { marginTop: 6, color: colors.textSecondary }]}>
              {focus
                ? `${focus.session.exercises.length} moves • tailored for ${data.profile.level}`
                : 'Great job staying consistent! Recover and drink plenty of water.'}
            </Text>
          </View>

          <View style={styles.ringWrapper}>
            <Ring percent={week.percent} size={88} stroke={8} label="Goal" color={colors.primary} />
          </View>
        </View>

        <Button
          label="Start Workout Now →"
          disabled={!focus}
          onPress={() => focus && openWorkout(focus.session.id)}
          style={{ marginTop: 16 }}
        />

        <Pressable
          onPress={() => router.navigate('/plan')}
          hitSlop={8}
          style={styles.fullPlanLink}
          accessibilityRole="button"
          accessibilityLabel="View full week plan"
        >
          <Text style={styles.linkText}>View Complete Weekly Plan</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primaryText} />
        </Pressable>
      </Card>

      {/* 4 Compact Stat Highlights Grid (Inspired by Image 2 & 4) */}
      <View style={styles.metricGrid}>
        <MetricBox
          icon="flame"
          tint={colors.lime}
          tag="STREAK"
          value={`${streak} ${streak === 1 ? 'Day' : 'Days'}`}
          sub="Consistency streak"
        />
        <MetricBox
          icon="time"
          tint={colors.primary}
          tag="ACTIVE"
          value={`${week.totalMinutes}m`}
          sub="Trained this week"
        />
        <MetricBox
          icon="flash"
          tint={colors.amber}
          tag="BURN"
          value={`~${Math.round(week.totalMinutes * 7.5)}`}
          sub="Est. active kcal"
        />
        <MetricBox
          icon="restaurant"
          tint={colors.rose}
          tag="DIET"
          value={`${today.kcal} k`}
          sub={`Goal ${data.profile.calorieGoal}`}
        />
      </View>

      {/* Quick Action Dock: Scan Meal, History, Social */}
      <View style={styles.quickDock}>
        <Pressable
          style={styles.quickDockItem}
          onPress={() => router.navigate('/log')}
          accessibilityRole="button"
          accessibilityLabel="Quick meal photo scanner"
        >
          <View style={[styles.quickDockIcon, { backgroundColor: 'rgba(0, 229, 255, 0.12)' }]}>
            <Ionicons name="camera" size={20} color={colors.primary} />
          </View>
          <Text style={styles.quickDockLabel}>Scan Meal</Text>
        </Pressable>

        <Pressable
          style={styles.quickDockItem}
          onPress={() => router.navigate('/progress')}
          accessibilityRole="button"
          accessibilityLabel="Workout history shortcut"
        >
          <View style={[styles.quickDockIcon, { backgroundColor: 'rgba(212, 255, 0, 0.12)' }]}>
            <Ionicons name="barbell" size={20} color={colors.lime} />
          </View>
          <Text style={styles.quickDockLabel}>History</Text>
        </Pressable>

        <Pressable
          style={styles.quickDockItem}
          onPress={() => router.navigate('/community')}
          accessibilityRole="button"
          accessibilityLabel="Community circle"
        >
          <View style={[styles.quickDockIcon, { backgroundColor: 'rgba(255, 184, 0, 0.12)' }]}>
            <Ionicons name="people" size={20} color={colors.amber} />
          </View>
          <Text style={styles.quickDockLabel}>Circle</Text>
        </Pressable>

        <Pressable
          style={styles.quickDockItem}
          onPress={() => router.navigate('/plan')}
          accessibilityRole="button"
          accessibilityLabel="Full schedule"
        >
          <View style={[styles.quickDockIcon, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
            <Ionicons name="calendar" size={20} color={colors.green} />
          </View>
          <Text style={styles.quickDockLabel}>Schedule</Text>
        </Pressable>
      </View>

      {/* Lab 4 R4 Fix (Addresses U5): Recent Workouts Shortcut */}
      <Card style={styles.recentCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={type.h2}>Recent Activity</Text>
          <Pressable
            onPress={() => router.navigate('/progress')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="View full workout history"
          >
            <Text style={styles.linkText}>See all ({data.history.length})</Text>
          </Pressable>
        </View>

        {latestWorkout ? (
          <View style={styles.recentItem}>
            <View style={styles.recentIcon}>
              <Ionicons name="checkmark-circle" size={22} color={colors.green} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: colors.text, fontSize: 15 }}>{latestWorkout.title}</Text>
              <Text style={type.small}>
                {niceDate(latestWorkout.date)} • {latestWorkout.minutes} mins • {latestWorkout.focus.toUpperCase()}
              </Text>
            </View>
            <Tag color={colors.green}>DONE</Tag>
          </View>
        ) : (
          <View style={{ paddingVertical: 4 }}>
            <Text style={type.small}>
              No workouts logged yet this week. Complete your first session to light up your streak!
            </Text>
          </View>
        )}
      </Card>

      {/* Nutrition Summary Card (Macro breakdown inspired by Image 2 right screen) */}
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="nutrition-outline" size={20} color={colors.primary} />
            <Text style={type.h2}>Today's Nutrition</Text>
          </View>
          <Tag color={today.kcal > data.profile.calorieGoal ? colors.amber : colors.primary}>
            {today.kcal} / {data.profile.calorieGoal} KCAL
          </Tag>
        </View>

        <Text style={[type.small, { marginVertical: 6, color: colors.textSecondary }]}>
          {mealsToday} {mealsToday === 1 ? 'meal' : 'meals'} logged •{' '}
          {Math.max(0, data.profile.calorieGoal - today.kcal)} kcal remaining
        </Text>

        <Bar
          value={today.kcal}
          max={data.profile.calorieGoal}
          color={today.kcal > data.profile.calorieGoal ? colors.amber : colors.primary}
        />

        <View style={styles.macroPillRow}>
          <View style={styles.macroMiniPill}>
            <View style={[styles.macroDot, { backgroundColor: colors.primary }]} />
            <Text style={type.caption}>Protein {today.protein}g</Text>
          </View>
          <View style={styles.macroMiniPill}>
            <View style={[styles.macroDot, { backgroundColor: colors.amber }]} />
            <Text style={type.caption}>Carbs {today.carbs}g</Text>
          </View>
          <View style={styles.macroMiniPill}>
            <View style={[styles.macroDot, { backgroundColor: colors.rose }]} />
            <Text style={type.caption}>Fats {today.fat}g</Text>
          </View>
        </View>

        <Button
          label="Log Meal / Scan Photo"
          variant="ghost"
          onPress={() => router.navigate('/log')}
          style={{ marginTop: 14 }}
        />
      </Card>

      {/* Community Accountability Card */}
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="trophy-outline" size={20} color={colors.amber} />
            <Text style={type.h2}>Community Challenges</Text>
          </View>
          {challenge?.joined && <Tag color={colors.green}>ACTIVE</Tag>}
        </View>
        <Text style={[type.small, { marginVertical: 6, color: colors.textSecondary }]}>
          {challenge
            ? `${challenge.name}: Finish ${challenge.target} workouts with your circle.`
            : 'Join private challenges with friends for mutual accountability.'}
        </Text>
        <Button
          label={challenge ? 'View Challenge Leaderboard' : 'Browse Challenges'}
          variant="ghost"
          onPress={() => router.navigate('/community')}
          style={{ marginTop: 8 }}
        />
      </Card>
    </Page>
  );
}

function MetricBox({
  icon,
  tint,
  tag,
  value,
  sub,
}: {
  icon: IconName;
  tint: string;
  tag: string;
  value: string;
  sub: string;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <View style={[styles.metricIconWrap, { backgroundColor: `${tint}1A` }]}>
          <Ionicons name={icon} size={16} color={tint} />
        </View>
        <Tag color={tint}>{tag}</Tag>
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricSub}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: { fontSize: 20, fontWeight: '800', color: colors.text },
  bellBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.primary,
  },
  warnCard: {
    borderColor: colors.amber,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255, 184, 0, 0.06)',
  },
  calendarStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    backgroundColor: colors.surface,
    padding: 8,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 14,
    gap: 6,
  },
  dayPillToday: {
    borderColor: colors.primary,
    borderWidth: 1,
  },
  dayPillSelected: {
    backgroundColor: colors.primary,
  },
  dayLetter: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
  },
  dayStatusIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    padding: 20,
    borderRadius: 24,
    borderColor: colors.borderLight,
    backgroundColor: '#0D1322',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginVertical: 4,
    letterSpacing: -0.3,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface2,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
  },
  muscleTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  muscleTagPill: {
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    borderColor: 'rgba(0, 229, 255, 0.25)',
    borderWidth: 1,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
  },
  muscleTagText: {
    color: colors.primaryText,
    fontSize: 11,
    fontWeight: '700',
  },
  ringWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullPlanLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 14,
  },
  linkText: {
    color: colors.primaryText,
    fontWeight: '700',
    fontSize: 13,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginVertical: 12,
  },
  metricCard: {
    width: '48.5%',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  metricIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  metricSub: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  quickDock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickDockItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  quickDockIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickDockLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  recentCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 16,
    marginBottom: 12,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  recentIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  macroPillRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  macroMiniPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  macroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
