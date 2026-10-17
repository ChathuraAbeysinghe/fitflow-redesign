import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Bar, Button, Card, PrivacyBadge, Tag } from '../components/ui';
import { useApp } from '../data/AppState';
import { colors, radius, type } from '../theme/theme';
import { focusSession } from '../logic/stats';

const REST_SECONDS = 30;
const pad = (n: number) => String(n).padStart(2, '0');
type Phase = 'ready' | 'work' | 'rest' | 'done';

export default function Workout() {
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const { data, completeSession } = useApp();
  const now = new Date();
  const focus = focusSession(data.plan, now);
  const session = (sessionId ? data.plan.sessions.find((s) => s.id === sessionId) : undefined) ?? focus?.session;

  const goBackHome = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const [ex, setEx] = useState(0);
  const [set, setSet] = useState(1);
  const [phase, setPhase] = useState<Phase>('ready');
  const [secs, setSecs] = useState(0);
  const [paused, setPaused] = useState(false);

  const list = session?.exercises ?? [];
  const current = list[ex];
  const timed = phase === 'work' && current?.kind === 'time';
  const ticking = (phase === 'rest' || timed) && !paused;

  useEffect(() => {
    if (!ticking) return;
    const id = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [ticking]);

  useEffect(() => {
    if (!ticking || secs > 0) return;
    if (phase === 'rest') {
      setPhase('ready');
    } else {
      finishSet();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secs, ticking]);

  function finishSet() {
    if (!current) return;
    if (set < current.sets) {
      setSet(set + 1);
      setPhase('rest');
      setSecs(REST_SECONDS);
    } else if (ex < list.length - 1) {
      setEx(ex + 1);
      setSet(1);
      setPhase('rest');
      setSecs(REST_SECONDS);
    } else {
      setPhase('done');
    }
  }

  const prevEx = () => {
    if (ex > 0) {
      setEx(ex - 1);
      setSet(1);
      setPhase('ready');
    }
  };

  const nextEx = () => {
    if (ex < list.length - 1) {
      setEx(ex + 1);
      setSet(1);
      setPhase('ready');
    } else {
      setPhase('done');
    }
  };

  const begin = () => {
    if (current.kind === 'time') {
      setPhase('work');
      setSecs(current.seconds ?? 30);
    } else {
      setPhase('work');
    }
  };

  if (!session || session.rest) {
    return (
      <View style={styles.screen}>
        <SafeAreaView style={styles.center}>
          <Text style={styles.title}>No workout selected</Text>
          <Button label="Back to Home" onPress={goBackHome} style={{ alignSelf: 'stretch' }} />
        </SafeAreaView>
      </View>
    );
  }

  // Already completed screen
  if (session.done && phase !== 'done') {
    return (
      <View style={styles.screen}>
        <SafeAreaView style={styles.center}>
          <View style={{ alignItems: 'center', marginVertical: 20 }}>
            <Ionicons name="checkmark-done-circle" size={64} color={colors.green} />
            <Text style={[styles.title, { marginTop: 12 }]}>Already Completed!</Text>
            <Text style={[type.small, { textAlign: 'center', marginTop: 4 }]}>
              You finished {session.title} ({session.minutes} minutes). Great consistency!
            </Text>
          </View>

          <Card style={{ alignSelf: 'stretch' }}>
            <Text style={[type.h2, { marginBottom: 8 }]}>Completed Moves</Text>
            {list.map((e, i) => (
              <View key={e.exerciseId} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                <Text style={{ color: colors.text }}>{e.name}</Text>
                <Text style={type.small}>{e.sets} sets</Text>
              </View>
            ))}
          </Card>

          <View style={{ alignSelf: 'stretch', gap: 10 }}>
            <Button
              label="Restart Workout Anyway"
              variant="light"
              onPress={() => {
                setEx(0);
                setSet(1);
                setPhase('ready');
              }}
            />
            <Button label="Back to Home" onPress={goBackHome} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Workout finished celebratory screen
  if (phase === 'done') {
    const estimatedKcal = Math.round(session.minutes * 7.5);
    return (
      <View style={styles.screen}>
        <SafeAreaView style={styles.center}>
          <View style={{ alignItems: 'center', gap: 8, marginTop: 16 }}>
            <View style={styles.trophy}>
              <Ionicons name="trophy" size={44} color={colors.amber} />
            </View>
            <Text style={styles.title}>Workout Complete!</Text>
            <Text style={[type.small, { textAlign: 'center' }]}>
              Outstanding effort on {session.title}!
            </Text>
          </View>

          <Card style={{ alignSelf: 'stretch' }}>
            <View style={styles.statGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statVal}>{session.minutes}m</Text>
                <Tag color={colors.muted}>DURATION</Tag>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statVal}>{list.length}</Text>
                <Tag color={colors.muted}>EXERCISES</Tag>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statVal}>~{estimatedKcal}</Text>
                <Tag color={colors.muted}>EST. KCAL</Tag>
              </View>
            </View>

            {/* Lab Sheet 4 R1 Fix: Privacy indicator before saving workout */}
            <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 14 }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>Sharing to:</Text>
                <Text style={type.small}>
                  {data.visibility === 'private'
                    ? 'Private (only logged in your history)'
                    : data.visibility === 'circle'
                    ? 'Your private accountability circle'
                    : 'FitFlow community feed'}
                </Text>
              </View>
              <PrivacyBadge visibility={data.visibility} />
            </View>
          </Card>

          <Button
            label="Save & Log Workout"
            onPress={() => {
              completeSession(session.id);
              router.replace('/(tabs)');
            }}
            style={{ alignSelf: 'stretch', marginTop: 16 }}
          />
        </SafeAreaView>
      </View>
    );
  }

  // Active workout execution screen
  const totalSets = list.reduce((n, e) => n + e.sets, 0);
  const doneSets = list.slice(0, ex).reduce((n, e) => n + e.sets, 0) + (set - 1);
  const nextUp = set < current.sets ? `${current.name} (Set ${set + 1})` : list[ex + 1]?.name ?? 'Completion!';

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.center}>
        {/* Top Progress bar and controls */}
        <View style={{ alignSelf: 'stretch' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Tag color={colors.primaryText}>
              EXERCISE {ex + 1} OF {list.length}
            </Tag>
            <Text style={type.small}>
              Total Sets: {doneSets}/{totalSets}
            </Text>
          </View>
          <Bar value={doneSets} max={totalSets} />
        </View>

        {/* Exercise or Rest Phase */}
        {phase === 'rest' ? (
          <View style={{ alignItems: 'center', gap: 12 }}>
            <Tag color={colors.amber}>RECOVERY REST</Tag>
            <Text style={styles.timer}>
              {pad(Math.floor(Math.max(secs, 0) / 60))}:{pad(Math.max(secs, 0) % 60)}
            </Text>

            {/* Adjust rest time */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable
                onPress={() => setSecs((s) => Math.max(5, s - 15))}
                style={styles.timeAdj}
                hitSlop={6}
              >
                <Text style={{ color: colors.muted, fontWeight: '700' }}>-15s</Text>
              </Pressable>
              <Pressable
                onPress={() => setPaused(!paused)}
                style={styles.timeAdj}
                hitSlop={6}
              >
                <Ionicons name={paused ? 'play' : 'pause'} size={18} color={colors.text} />
              </Pressable>
              <Pressable
                onPress={() => setSecs((s) => s + 15)}
                style={styles.timeAdj}
                hitSlop={6}
              >
                <Text style={{ color: colors.muted, fontWeight: '700' }}>+15s</Text>
              </Pressable>
            </View>

            <View style={styles.nextUpCard}>
              <Text style={[type.small, { textAlign: 'center' }]}>Next up:</Text>
              <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16, textAlign: 'center' }}>
                {nextUp}
              </Text>
            </View>

            <Button
              label="Skip rest"
              variant="light"
              onPress={() => setPhase('ready')}
              style={{ minWidth: 200 }}
            />
          </View>
        ) : (
          <View style={{ alignItems: 'center', gap: 10, alignSelf: 'stretch' }}>
            <Tag color={colors.primary}>SET {set} OF {current.sets}</Tag>
            <Text style={styles.title}>{current.name}</Text>
            <Text style={styles.target}>
              {current.kind === 'reps' ? `${current.reps} reps` : `${current.seconds} sec`}
            </Text>

            {timed && (
              <View style={{ alignItems: 'center', gap: 6, marginVertical: 6 }}>
                <Text style={styles.timer}>
                  {pad(Math.floor(Math.max(secs, 0) / 60))}:{pad(Math.max(secs, 0) % 60)}
                </Text>
                <Pressable
                  onPress={() => setPaused(!paused)}
                  style={styles.pausePill}
                  hitSlop={8}
                >
                  <Ionicons name={paused ? 'play' : 'pause'} size={16} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>
                    {paused ? 'Resume' : 'Pause'}
                  </Text>
                </Pressable>
              </View>
            )}

            <Card style={{ backgroundColor: colors.surface2, borderColor: colors.border, padding: 12 }}>
              <Text style={[type.small, { textAlign: 'center', color: colors.text }]}>
                💡 {current.tip}
              </Text>
            </Card>

            <View style={{ alignSelf: 'stretch', gap: 10, marginTop: 10 }}>
              {phase === 'ready' && (
                <Button
                  label={current.kind === 'time' ? 'Start countdown' : 'Start set'}
                  onPress={begin}
                />
              )}
              {phase === 'work' && current.kind === 'reps' && (
                <Button label="Set completed ✓" onPress={finishSet} />
              )}
              {phase === 'work' && current.kind === 'time' && (
                <Button label="Finish set early" variant="light" onPress={finishSet} />
              )}
            </View>

            {/* Quick skip/jump navigation */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'stretch', marginTop: 6 }}>
              <Pressable
                onPress={prevEx}
                disabled={ex === 0}
                hitSlop={8}
                style={[styles.navBtn, ex === 0 && { opacity: 0.3 }]}
              >
                <Ionicons name="play-skip-back" size={16} color={colors.muted} />
                <Text style={[type.small, { color: colors.muted }]}>Previous Move</Text>
              </Pressable>
              <Pressable
                onPress={nextEx}
                hitSlop={8}
                style={styles.navBtn}
              >
                <Text style={[type.small, { color: colors.muted }]}>Skip Move</Text>
                <Ionicons name="play-skip-forward" size={16} color={colors.muted} />
              </Pressable>
            </View>
          </View>
        )}

        <Button
          label="Quit workout"
          variant="ghost"
          onPress={goBackHome}
          style={{ alignSelf: 'stretch' }}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, padding: 22, alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, textAlign: 'center' },
  target: { fontSize: 40, fontWeight: '800', color: colors.text },
  timer: { fontSize: 62, fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'] },
  trophy: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(245,158,11,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statGrid: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 6 },
  statItem: { alignItems: 'center', gap: 4 },
  statVal: { fontSize: 24, fontWeight: '800', color: colors.text },
  timeAdj: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.chip,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextUpCard: {
    backgroundColor: colors.surface,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pausePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radius.chip,
  },
  navBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8 },
});
