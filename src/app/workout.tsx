import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Bar, Button } from '../components/ui';
import { useApp } from '../data/AppState';
import { colors, type } from '../theme/theme';

const REST_SECONDS = 30;
const pad = (n: number) => String(n).padStart(2, '0');
type Phase = 'ready' | 'work' | 'rest' | 'done';

export default function Workout() {
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const { data, completeSession } = useApp();
  const session = data.plan.sessions.find((s) => s.id === sessionId);

  const [ex, setEx] = useState(0);
  const [set, setSet] = useState(1);
  const [phase, setPhase] = useState<Phase>('ready');
  const [secs, setSecs] = useState(0);

  const list = session?.exercises ?? [];
  const current = list[ex];
  const timed = phase === 'work' && current?.kind === 'time';
  const ticking = phase === 'rest' || timed;

  useEffect(() => {
    if (!ticking) return;
    const id = setInterval(() => setSecs((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [ticking]);

  useEffect(() => {
    if (!ticking || secs > 0) return;
    if (phase === 'rest') setPhase('ready');
    else finishSet();
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

  const begin = () => {
    if (current.kind === 'time') { setPhase('work'); setSecs(current.seconds ?? 30); }
    else setPhase('work');
  };

  if (!session || session.rest) {
    return (
      <View style={styles.screen}>
        <SafeAreaView style={styles.center}>
          <Text style={styles.title}>No workout selected</Text>
          <Button label="Back" onPress={() => router.back()} style={{ alignSelf: 'stretch' }} />
        </SafeAreaView>
      </View>
    );
  }

  if (session.done && phase !== 'done') {
    return (
      <View style={styles.screen}>
        <SafeAreaView style={styles.center}>
          <Text style={styles.label}>Already completed</Text>
          <Text style={styles.title}>{session.title}</Text>
          <Button label="Back" onPress={() => router.back()} style={{ alignSelf: 'stretch' }} />
        </SafeAreaView>
      </View>
    );
  }

  if (phase === 'done') {
    return (
      <View style={styles.screen}>
        <SafeAreaView style={styles.center}>
          <Text style={styles.label}>Workout complete</Text>
          <Text style={styles.title}>{session.title}</Text>
          <Text style={type.small}>{list.length} exercises, about {session.minutes} minutes</Text>
          <Button
            label="Save workout"
            onPress={() => { completeSession(session.id); router.dismissTo('/(tabs)'); }}
            style={{ alignSelf: 'stretch', marginTop: 24 }}
          />
        </SafeAreaView>
      </View>
    );
  }

  const totalSets = list.reduce((n, e) => n + e.sets, 0);
  const doneSets = list.slice(0, ex).reduce((n, e) => n + e.sets, 0) + (set - 1);

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.center}>
        <View style={{ alignSelf: 'stretch' }}>
          <Bar value={doneSets} max={totalSets} />
          <Text style={[type.small, { marginTop: 6 }]}>Exercise {ex + 1} of {list.length}</Text>
        </View>

        {phase === 'rest' ? (
          <>
            <Text style={styles.label}>Rest</Text>
            <Text style={styles.timer}>{pad(Math.floor(Math.max(secs, 0) / 60))}:{pad(Math.max(secs, 0) % 60)}</Text>
            <Text style={type.small}>Next: {current.name}, set {set} of {current.sets}</Text>
            <Button label="Skip rest" variant="light" onPress={() => setPhase('ready')} style={{ alignSelf: 'stretch' }} />
          </>
        ) : (
          <>
            <Text style={styles.label}>Set {set} of {current.sets}</Text>
            <Text style={styles.title}>{current.name}</Text>
            <Text style={styles.target}>{current.kind === 'reps' ? `${current.reps} reps` : `${current.seconds} sec`}</Text>
            <Text style={[type.small, { textAlign: 'center' }]}>{current.tip}</Text>
            {timed && <Text style={styles.timer}>{pad(Math.floor(Math.max(secs, 0) / 60))}:{pad(Math.max(secs, 0) % 60)}</Text>}
            <View style={{ alignSelf: 'stretch', gap: 10 }}>
              {phase === 'ready' && <Button label={current.kind === 'time' ? 'Start timer' : 'Start set'} onPress={begin} />}
              {phase === 'work' && current.kind === 'reps' && <Button label="Set done" onPress={finishSet} />}
              {phase === 'work' && current.kind === 'time' && <Button label="Finish early" variant="light" onPress={finishSet} />}
            </View>
          </>
        )}
        <Button label="Quit workout" variant="ghost" onPress={() => router.back()} style={{ alignSelf: 'stretch' }} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  label: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, textAlign: 'center' },
  target: { fontSize: 44, fontWeight: '800', color: colors.text },
  timer: { fontSize: 64, fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'] },
});
