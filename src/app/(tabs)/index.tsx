import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Bar, Button, Card, Page, SectionTitle, Tag } from '../../components/ui';
import { Ring } from '../../components/Ring';
import { useApp } from '../../data/AppState';
import { DAY_NAMES, toISO, todayIndex } from '../../logic/dates';
import { computeStreak, focusSession, freeDay, missedSessions, sumMeals, weekStats } from '../../logic/stats';
import { colors, radius, type } from '../../theme/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export default function Home() {
  const { data, rescheduleMissed, skipSession } = useApp();
  const now = new Date();
  const focus = focusSession(data.plan, now);
  const missed = missedSessions(data.plan, now);
  const free = freeDay(data.plan, now);
  const week = weekStats(data);
  const streak = computeStreak(data.history, now);
  const today = sumMeals(data.meals, toISO(now));
  const mealsToday = data.meals.filter((m) => m.date === toISO(now)).length;
  const challenge = data.challenges.find((c) => c.joined);
  const todaySession = data.plan.sessions[todayIndex(now)];

  const heroLabel = !focus
    ? 'This week'
    : focus.kind === 'today' ? "Today's session"
    : focus.kind === 'missed' ? 'Missed session'
    : todaySession.rest ? `Rest day. Up next: ${DAY_NAMES[focus.session.dayIndex]}` : `Up next: ${DAY_NAMES[focus.session.dayIndex]}`;

  const open = (id: string) => router.push({ pathname: '/workout', params: { sessionId: id } });
  const toProfile = () => router.push('/profile');

  return (
    <Page bare tabbed>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Profile and settings" onPress={toProfile} hitSlop={8} style={styles.avatar}>
          <Ionicons name="person" size={22} color={colors.primaryText} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={type.small}>Welcome back,</Text>
          <Text style={styles.name}>{data.profile.name}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Reminders and settings" onPress={toProfile} hitSlop={8} style={styles.bell}>
          <Ionicons name="notifications-outline" size={20} color={colors.text} />
        </Pressable>
      </View>

      {missed.length > 0 && (
        <Card style={styles.warn}>
          <Text style={type.h2}>You missed {DAY_NAMES[missed[0].dayIndex]}'s {missed[0].title.toLowerCase()}</Text>
          <Text style={[type.small, { marginVertical: 4 }]}>
            {free !== null ? `Move it to ${DAY_NAMES[free]} to keep your week on track.` : 'Your week is full. You can skip it.'}
            {missed.length > 1 ? ` (${missed.length} missed in total)` : ''}
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
            {free !== null && <Button label={`Move to ${DAY_NAMES[free]}`} onPress={() => rescheduleMissed(missed[0].id)} style={{ flex: 1 }} />}
            <Button label="Skip it" variant="ghost" onPress={() => skipSession(missed[0].id)} style={{ flex: 1 }} />
          </View>
        </Card>
      )}

      <Card style={styles.hero}>
        <View style={styles.heroRow}>
          <Ring percent={week.percent} size={92} stroke={9} label="Week" />
          <View style={{ flex: 1 }}>
            <Tag>{heroLabel}</Tag>
            <Text style={styles.heroTitle}>{focus ? focus.session.title : 'All sessions done'}</Text>
            <Text style={type.small}>{focus ? `${focus.session.minutes} min, matched to your schedule` : 'Rest up and check your progress'}</Text>
          </View>
        </View>
        <Button label="Start now" disabled={!focus} onPress={() => focus && open(focus.session.id)} style={{ marginTop: 16 }} />
        <Pressable onPress={() => router.navigate('/plan')} hitSlop={8} style={{ alignSelf: 'center', marginTop: 12 }}>
          <Text style={styles.link}>See full plan</Text>
        </Pressable>
      </Card>

      <SectionTitle>Daily Highlights</SectionTitle>
      <View style={styles.tiles}>
        <Tile icon="pulse" tint={colors.green} tag="Streak" value={`${streak} ${streak === 1 ? 'Day' : 'Days'}`} sub="Active consistency" />
        <Tile icon="time" tint={colors.amber} tag="Minutes" value={`${week.totalMinutes}m`} sub="Active this week" />
      </View>

      <Card>
        <Text style={type.h2}>Nutrition</Text>
        <Text style={[type.small, { marginVertical: 6 }]}>{mealsToday} {mealsToday === 1 ? 'meal' : 'meals'} logged, {today.kcal} of {data.profile.calorieGoal} kcal</Text>
        <Bar value={today.kcal} max={data.profile.calorieGoal} />
        <Button label="Log meal" variant="ghost" onPress={() => router.navigate('/log')} style={{ marginTop: 14 }} />
      </Card>

      <Card>
        <Text style={type.h2}>Community</Text>
        <Text style={[type.small, { marginVertical: 6 }]}>
          {challenge ? `${challenge.name}: keep going, check the leaderboard.` : 'Join a challenge or a circle to stay accountable.'}
        </Text>
        <Button label="View" variant="ghost" onPress={() => router.navigate('/community')} />
      </Card>
    </Page>
  );
}

function Tile({ icon, tint, tag, value, sub }: { icon: IconName; tint: string; tag: string; value: string; sub: string }) {
  return (
    <View style={styles.tile}>
      <View style={styles.tileTop}>
        <View style={[styles.tileIcon, { backgroundColor: `${tint}26` }]}><Ionicons name={icon} size={18} color={tint} /></View>
        <Tag color={tint}>{tag}</Tag>
      </View>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={type.small}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  avatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 20, fontWeight: '800', color: colors.text },
  bell: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  warn: { borderColor: colors.amber, borderWidth: 1.5 },
  hero: { padding: 18, borderRadius: 24 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: colors.text, marginVertical: 3 },
  link: { color: colors.primaryText, fontWeight: '700', fontSize: 14 },
  tiles: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  tile: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.card, padding: 14, borderWidth: 1, borderColor: colors.border },
  tileTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  tileIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  tileValue: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 2 },
});
