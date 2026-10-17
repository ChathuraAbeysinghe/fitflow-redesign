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
type TabMode = 'execution' | 'muscles' | 'tips';

const FOCUS_MUSCLES: Record<string, string[]> = {
  push: ['Chest', 'Triceps', 'Front Delts', 'Core'],
  pull: ['Lats', 'Biceps', 'Rhomboids', 'Forearms'],
  legs: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
  core: ['Upper Abs', 'Lower Abs', 'Obliques'],
  cardio: ['Cardiovascular', 'Full Body', 'Legs'],
  mobility: ['Hip Flexors', 'Thoracic Spine', 'Hamstrings'],
  full: ['Chest', 'Back', 'Quads', 'Core'],
};

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
  const [activeTab, setActiveTab] = useState<TabMode>('execution');

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
            <Ionicons name="checkmark-done-circle" size={68} color={colors.green} />
            <Text style={[styles.title, { marginTop: 14 }]}>Already Completed!</Text>
            <Text style={[type.small, { textAlign: 'center', marginTop: 4 }]}>
              You finished {session.title} ({session.minutes} minutes). Great consistency!
            </Text>
          </View>

          <Card style={{ alignSelf: 'stretch' }}>
            <Text style={[type.h2, { marginBottom: 8 }]}>Completed Moves</Text>
            {list.map((e) => (
              <View key={e.exerciseId} style={styles.completedMoveRow}>
                <Ionicons name="checkmark-circle" size={16} color={colors.green} />
                <Text style={{ color: colors.text, flex: 1, fontWeight: '600' }}>{e.name}</Text>
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
          <View style={{ alignItems: 'center', gap: 8, marginTop: 20 }}>
            <View style={styles.trophy}>
              <Ionicons name="trophy" size={48} color={colors.amber} />
            </View>
            <Text style={styles.title}>Workout Complete!</Text>
            <Text style={[type.small, { textAlign: 'center', color: colors.textSecondary }]}>
              Outstanding effort on {session.title}!
            </Text>
          </View>

          <Card style={{ alignSelf: 'stretch', borderColor: colors.primary }}>
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
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>Sharing destination:</Text>
                <Text style={type.small}>
                  {data.visibility === 'private'
                    ? 'Saved to private history only'
                    : data.visibility === 'circle'
                    ? 'Shared with your private circle'
                    : 'Shared with FitFlow community'}
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

  // Active workout execution screen (Design inspired by Image 2)
  const totalSets = list.reduce((n, e) => n + e.sets, 0);
  const doneSets = list.slice(0, ex).reduce((n, e) => n + e.sets, 0) + (set - 1);
  const nextUp = set < current.sets ? `${current.name} (Set ${set + 1})` : list[ex + 1]?.name ?? 'Completion!';
  const muscles = FOCUS_MUSCLES[session.focus] || ['Full Body'];

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.center}>
        {/* Top Header bar */}
        <View style={{ alignSelf: 'stretch' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Pressable
              onPress={goBackHome}
              hitSlop={8}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Ionicons name="close" size={22} color={colors.muted} />
              <Text style={{ color: colors.muted, fontSize: 13, fontWeight: '600' }}>Quit</Text>
            </Pressable>
            <Tag color={colors.primary}>
              EXERCISE {ex + 1} OF {list.length}
            </Tag>
            <Text style={[type.small, { fontWeight: '700' }]}>
              {doneSets}/{totalSets} Sets
            </Text>
          </View>
          <Bar value={doneSets} max={totalSets} color={colors.primary} />
        </View>

        {/* REST PHASE vs ACTIVE EXERCISE PHASE */}
        {phase === 'rest' ? (
          <View style={styles.restContainer}>
            <Tag color={colors.amber}>RECOVERY REST</Tag>
            <Text style={styles.timerLarge}>
              {pad(Math.floor(Math.max(secs, 0) / 60))}:{pad(Math.max(secs, 0) % 60)}
            </Text>

            {/* Rest adjustments */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable onPress={() => setSecs((s) => Math.max(5, s - 15))} style={styles.timeAdj} hitSlop={6}>
                <Text style={styles.timeAdjText}>-15s</Text>
              </Pressable>
              <Pressable onPress={() => setPaused(!paused)} style={styles.pauseBtn} hitSlop={6}>
                <Ionicons name={paused ? 'play' : 'pause'} size={18} color="#080C16" />
                <Text style={{ color: '#080C16', fontWeight: '800', fontSize: 13 }}>
                  {paused ? 'Resume' : 'Pause'}
                </Text>
              </Pressable>
              <Pressable onPress={() => setSecs((s) => s + 15)} style={styles.timeAdj} hitSlop={6}>
                <Text style={styles.timeAdjText}>+15s</Text>
              </Pressable>
            </View>

            <View style={styles.nextUpCard}>
              <Text style={[type.caption, { textAlign: 'center', letterSpacing: 0.8 }]}>NEXT UP</Text>
              <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16, textAlign: 'center', marginTop: 2 }}>
                {nextUp}
              </Text>
            </View>

            <Button
              label="Skip Rest →"
              variant="light"
              onPress={() => setPhase('ready')}
              style={{ minWidth: 200, marginTop: 10 }}
            />
          </View>
        ) : (
          <View style={{ alignSelf: 'stretch', gap: 10 }}>
            {/* Exercise Hero Card (Inspired by Image 2) */}
            <Card style={styles.exerciseCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Tag color={colors.lime}>EXERCISE</Tag>
                <Tag color={colors.primary}>{data.profile.level.toUpperCase()}</Tag>
              </View>

              <Text style={styles.exerciseTitle}>{current.name}</Text>
              <Text style={[type.small, { color: colors.muted, marginBottom: 8 }]}>
                {session.title} • {session.focus.toUpperCase()}
              </Text>

              {/* Pill Segmented Tabs (Image 2 inspired: Execution | Muscles | Tips) */}
              <View style={styles.exerciseTabs}>
                <Pressable
                  onPress={() => setActiveTab('execution')}
                  style={[styles.exTabItem, activeTab === 'execution' && styles.exTabItemActive]}
                >
                  <Text style={[styles.exTabText, activeTab === 'execution' && styles.exTabTextActive]}>
                    Execution
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setActiveTab('muscles')}
                  style={[styles.exTabItem, activeTab === 'muscles' && styles.exTabItemActive]}
                >
                  <Text style={[styles.exTabText, activeTab === 'muscles' && styles.exTabTextActive]}>
                    Target Muscles
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setActiveTab('tips')}
                  style={[styles.exTabItem, activeTab === 'tips' && styles.exTabItemActive]}
                >
                  <Text style={[styles.exTabText, activeTab === 'tips' && styles.exTabTextActive]}>
                    Coach Tip
                  </Text>
                </Pressable>
              </View>

              {/* Tab Content */}
              <View style={styles.tabContentBox}>
                {activeTab === 'execution' && (
                  <Text style={styles.tabBodyText}>
                    Perform {current.kind === 'reps' ? `${current.reps} controlled repetitions` : `${current.seconds} seconds duration`}. Focus on smooth cadence without momentum.
                  </Text>
                )}
                {activeTab === 'muscles' && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {muscles.map((m) => (
                      <View key={m} style={styles.musclePill}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.lime }} />
                        <Text style={{ color: colors.lime, fontSize: 12, fontWeight: '700' }}>{m}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {activeTab === 'tips' && (
                  <Text style={[styles.tabBodyText, { fontStyle: 'italic' }]}>
                    💡 {current.tip}
                  </Text>
                )}
              </View>
            </Card>

            {/* 4 Bottom Metric Blocks (Image 2 bottom bar: Rest, Reps/Time, Sets, Intensity) */}
            <View style={styles.bottomStatRow}>
              <View style={styles.bottomStatBlock}>
                <View style={styles.statIconWrap}>
                  <Ionicons name="time-outline" size={16} color={colors.primary} />
                </View>
                <Text style={styles.statHeader}>REST</Text>
                <Text style={styles.statContent}>{REST_SECONDS}s</Text>
              </View>

              <View style={styles.bottomStatBlock}>
                <View style={styles.statIconWrap}>
                  <Ionicons name="repeat-outline" size={16} color={colors.lime} />
                </View>
                <Text style={styles.statHeader}>{current.kind === 'reps' ? 'REPS' : 'TIME'}</Text>
                <Text style={styles.statContent}>
                  {current.kind === 'reps' ? `${current.reps} reps` : `${current.seconds}s`}
                </Text>
              </View>

              <View style={styles.bottomStatBlock}>
                <View style={styles.statIconWrap}>
                  <Ionicons name="layers-outline" size={16} color={colors.amber} />
                </View>
                <Text style={styles.statHeader}>SET</Text>
                <Text style={styles.statContent}>{set} of {current.sets}</Text>
              </View>

              <View style={styles.bottomStatBlock}>
                <View style={styles.statIconWrap}>
                  <Ionicons name="flash-outline" size={16} color={colors.rose} />
                </View>
                <Text style={styles.statHeader}>EFFORT</Text>
                <Text style={styles.statContent}>Optimal</Text>
              </View>
            </View>

            {/* Timed countdown if exercise is time-based */}
            {timed && (
              <View style={{ alignItems: 'center', gap: 6, marginVertical: 6 }}>
                <Text style={styles.timerLarge}>
                  {pad(Math.floor(Math.max(secs, 0) / 60))}:{pad(Math.max(secs, 0) % 60)}
                </Text>
                <Pressable onPress={() => setPaused(!paused)} style={styles.pausePill} hitSlop={8}>
                  <Ionicons name={paused ? 'play' : 'pause'} size={16} color="#080C16" />
                  <Text style={{ color: '#080C16', fontWeight: '800', fontSize: 13 }}>
                    {paused ? 'Resume Timer' : 'Pause'}
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Action Buttons */}
            <View style={{ gap: 10, marginTop: 4 }}>
              {phase === 'ready' && (
                <Button
                  label={current.kind === 'time' ? 'Start Countdown Timer →' : 'Start Set Now →'}
                  variant="primary"
                  onPress={begin}
                />
              )}
              {phase === 'work' && current.kind === 'reps' && (
                <Button label="Set Complete ✓" variant="volt" onPress={finishSet} />
              )}
              {phase === 'work' && current.kind === 'time' && (
                <Button label="Finish Set Early" variant="light" onPress={finishSet} />
              )}
            </View>

            {/* Navigation skip controls */}
            <View style={styles.navRow}>
              <Pressable
                onPress={prevEx}
                disabled={ex === 0}
                hitSlop={8}
                style={[styles.navBtn, ex === 0 && { opacity: 0.3 }]}
              >
                <Ionicons name="play-skip-back" size={16} color={colors.muted} />
                <Text style={[type.small, { color: colors.muted, fontWeight: '700' }]}>Previous Move</Text>
              </Pressable>

              <Pressable onPress={nextEx} hitSlop={8} style={styles.navBtn}>
                <Text style={[type.small, { color: colors.muted, fontWeight: '700' }]}>Skip to Next</Text>
                <Ionicons name="play-skip-forward" size={16} color={colors.muted} />
              </Pressable>
            </View>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, textAlign: 'center' },
  timerLarge: {
    fontSize: 68,
    fontWeight: '900',
    color: colors.text,
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  trophy: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255, 184, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statGrid: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8 },
  statItem: { alignItems: 'center', gap: 4 },
  statVal: { fontSize: 26, fontWeight: '900', color: colors.text },
  completedMoveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  restContainer: { alignItems: 'center', gap: 14, marginVertical: 'auto' },
  timeAdj: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radius.chip,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeAdjText: { color: colors.muted, fontWeight: '700', fontSize: 13 },
  pauseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radius.chip,
  },
  nextUpCard: {
    backgroundColor: colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pausePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: radius.chip,
  },
  exerciseCard: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
  },
  exerciseTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginTop: 8,
    letterSpacing: -0.3,
  },
  exerciseTabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface2,
    borderRadius: radius.button,
    padding: 3,
    marginVertical: 10,
  },
  exTabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radius.button - 3,
  },
  exTabItemActive: {
    backgroundColor: colors.primary,
  },
  exTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
  },
  exTabTextActive: {
    color: '#080C16',
    fontWeight: '800',
  },
  tabContentBox: {
    minHeight: 52,
    justifyContent: 'center',
  },
  tabBodyText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  musclePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(212, 255, 0, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderColor: 'rgba(212, 255, 0, 0.25)',
    borderWidth: 1,
  },
  bottomStatRow: {
    flexDirection: 'row',
    gap: 8,
  },
  bottomStatBlock: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statHeader: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.muted,
    letterSpacing: 0.6,
  },
  statContent: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginTop: 2,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
});
