import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, AppState as RNAppState, StyleSheet, Text } from 'react-native';
import { addDays, DAY_NAMES, toISO, todayIndex, weekStart } from '../logic/dates';
import { generatePlan } from '../logic/planner';
import { freeDay, plannedSessions } from '../logic/stats';
import { repository } from '../services/repository';
import { applyReminders } from '../services/reminders';
import { colors, radius } from '../theme/theme';
import {
  AppData, Challenge, Circle, Client, FeedItem, Injury, Meal, Plan, Profile, Reminders, Visibility,
} from './types';

const DEFAULT_PROFILE: Profile = {
  name: 'Chathura', level: 'beginner', goal: 'consistency', daysPerWeek: 3, minutes: 25,
  injuries: [], calorieGoal: 2000, onboarded: false,
};

const ago = (mins: number) => new Date(Date.now() - mins * 60000).toISOString();

function createSeed(): AppData {
  const now = new Date();
  const mk = (id: string, name: string, p: Partial<Profile>): Client => {
    const profile = { ...DEFAULT_PROFILE, name, onboarded: true, ...p };
    return { id, name, profile, plan: generatePlan(profile, { now: weekStart(now) }), notes: '' };
  };
  return {
    profile: DEFAULT_PROFILE,
    plan: generatePlan(DEFAULT_PROFILE),
    history: [],
    meals: [],
    visibility: 'circle',
    reminders: { workoutEnabled: false, workoutHour: 18, workoutMinute: 0, mealEnabled: false },
    circles: [
      { id: 'c1', name: 'Morning Movers', code: 'FLOW24', joined: true, createdByMe: false, members: ['Nimali', 'Kasun', 'Dilini'] },
      { id: 'c2', name: 'Weekend Walkers', code: 'WALK77', joined: false, createdByMe: false, members: ['Sanduni', 'Ruwan'] },
    ],
    feed: [
      { id: 'f1', circleId: 'c1', author: 'Nimali', mine: false, text: 'finished Cardio intervals', ts: ago(95), cheers: 2, cheered: false },
      { id: 'f2', circleId: 'c1', author: 'Kasun', mine: false, text: 'hit a 4-day streak', ts: ago(300), cheers: 4, cheered: false },
      { id: 'f3', circleId: 'c1', author: 'Dilini', mine: false, text: 'logged all meals today', ts: ago(900), cheers: 1, cheered: false },
      { id: 'f4', circleId: 'c2', author: 'Sanduni', mine: false, text: 'finished a long walk', ts: ago(1200), cheers: 3, cheered: false },
    ],
    challenges: [
      { id: 'ch1', name: '7-Day Challenge', target: 5, days: 7, joined: false, demo: [{ name: 'Kasun', progress: 4 }, { name: 'Nimali', progress: 3 }, { name: 'Dilini', progress: 2 }] },
      { id: 'ch2', name: 'Three in a row', target: 3, days: 4, joined: false, demo: [{ name: 'Ruwan', progress: 2 }, { name: 'Sanduni', progress: 1 }] },
    ],
    clients: [
      mk('cl1', 'Amal P.', { level: 'beginner', goal: 'weight', daysPerWeek: 3, minutes: 30, injuries: ['knee'] }),
      mk('cl2', 'Shehani R.', { level: 'intermediate', goal: 'strength', daysPerWeek: 4, minutes: 35, injuries: ['shoulder'] }),
      mk('cl3', 'Ravindu D.', { level: 'advanced', goal: 'energy', daysPerWeek: 5, minutes: 20, injuries: [] }),
    ],
    flags: { joinedCircle: false, joinedChallenge: false },
  };
}

type Ctx = {
  ready: boolean;
  data: AppData;
  showToast: (msg: string) => void;
  completeOnboarding: (p: Omit<Profile, 'onboarded' | 'calorieGoal'>) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  rebuildPlan: () => void;
  swapDays: (a: number, b: number) => void;
  rescheduleMissed: (id: string) => void;
  skipSession: (id: string) => void;
  completeSession: (id: string) => void;
  undoSession: (id: string) => void;
  addMeal: (m: Omit<Meal, 'id' | 'date'>) => void;
  deleteMeal: (id: string) => void;
  setVisibility: (v: Visibility) => void;
  setReminders: (r: Reminders) => Promise<void>;
  createCircle: (name: string) => void;
  joinCircleByCode: (code: string) => boolean;
  leaveCircle: (id: string) => void;
  postToCircle: (circleId: string, text: string) => void;
  cheer: (feedId: string) => void;
  createChallenge: (name: string, target: number) => void;
  toggleChallenge: (id: string) => void;
  challengeProgress: (c: Challenge) => number;
  setClientInjuries: (id: string, injuries: Injury[]) => void;
  setClientSessionMinutes: (id: string, dayIndex: number, minutes: number) => void;
  setClientNotes: (id: string, notes: string) => void;
  resetAll: () => Promise<void>;
};

const AppCtx = createContext<Ctx | null>(null);

export function useApp() {
  const v = useContext(AppCtx);
  if (!v) throw new Error('useApp must be used inside AppProvider');
  return v;
}

const codeFor = () => Math.random().toString(36).slice(2, 8).toUpperCase();

/** New week -> new plan, lighter if last week went badly (FR1 adaptive behaviour). */
function rolloverIfNeeded(d: AppData, now = new Date()): AppData {
  const current = toISO(weekStart(now));
  if (!d.profile.onboarded || d.plan.weekStart === current) return d;
  const planned = plannedSessions(d.plan);
  const ratio = planned.length ? planned.filter((s) => s.done).length / planned.length : 1;
  const lighter = ratio < 0.5;
  return {
    ...d,
    plan: generatePlan(d.profile, {
      version: d.plan.version + 1,
      daysDelta: lighter ? -1 : 0,
      note: lighter ? 'Last week was busy, so this week is one day lighter.' : 'New week, fresh exercises.',
      now,
    }),
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(createSeed);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState('');
  const opacity = useRef(new Animated.Value(0)).current;

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [opacity]);

  // Load saved data once, then keep saving every change.
  useEffect(() => {
    let alive = true;
    repository.load().then((saved) => {
      if (!alive) return;
      const seed = createSeed();
      const merged: AppData = saved
        ? { ...seed, ...saved, profile: { ...seed.profile, ...saved.profile }, flags: { ...seed.flags, ...saved.flags } }
        : seed;
      setData(rolloverIfNeeded(merged));
      setReady(true);
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (ready) repository.save(data);
  }, [data, ready]);

  useEffect(() => {
    const sub = RNAppState.addEventListener('change', (s) => {
      if (s === 'active') setData((d) => rolloverIfNeeded(d));
    });
    return () => sub.remove();
  }, []);

  const swapSessions = (plan: Plan, a: number, b: number): Plan => {
    const sessions = plan.sessions.map((s) => ({ ...s }));
    [sessions[a], sessions[b]] = [sessions[b], sessions[a]];
    sessions[a].dayIndex = a;
    sessions[b].dayIndex = b;
    return { ...plan, sessions };
  };

  const completeOnboarding: Ctx['completeOnboarding'] = (p) => {
    const profile: Profile = { ...p, name: p.name.trim() || 'Athlete', calorieGoal: data.profile.calorieGoal, onboarded: true };
    setData((d) => ({ ...d, profile, plan: generatePlan(profile) }));
    showToast('Your first plan is ready');
  };

  const updateProfile: Ctx['updateProfile'] = (patch) => setData((d) => ({ ...d, profile: { ...d.profile, ...patch } }));

  const rebuildPlan = () => {
    setData((d) => {
      const fresh = generatePlan(d.profile, { version: d.plan.version + 1, note: 'Rebuilt from your latest profile.' });
      const sessions = fresh.sessions.map((s, i) => (d.plan.sessions[i].done ? d.plan.sessions[i] : s));
      return { ...d, plan: { ...fresh, sessions } };
    });
    showToast('Plan rebuilt');
  };

  const swapDays: Ctx['swapDays'] = (a, b) => setData((d) => ({ ...d, plan: swapSessions(d.plan, a, b) }));

  const rescheduleMissed: Ctx['rescheduleMissed'] = (id) => {
    const target = freeDay(data.plan);
    const s = data.plan.sessions.find((x) => x.id === id);
    if (target === null || !s) {
      showToast('No free day left this week. Skip it instead.');
      return;
    }
    setData((d) => ({ ...d, plan: swapSessions(d.plan, s.dayIndex, target) }));
    showToast(`Moved to ${DAY_NAMES[target]}`);
  };

  const skipSession: Ctx['skipSession'] = (id) => {
    setData((d) => ({
      ...d,
      plan: {
        ...d.plan,
        sessions: d.plan.sessions.map((s) =>
          s.id === id ? { ...s, rest: true, title: 'Rest day', exercises: [], minutes: 0, done: false } : s),
      },
    }));
    showToast('Session skipped');
  };

  const completeSession: Ctx['completeSession'] = (id) => {
    setData((d) => {
      const s = d.plan.sessions.find((x) => x.id === id);
      if (!s || s.done || s.rest) return d;
      const now = new Date();
      const sessions = d.plan.sessions.map((x) => (x.id === id ? { ...x, done: true, completedAt: now.toISOString() } : x));
      const history = [...d.history, { id: `h${Date.now()}`, sessionId: id, date: toISO(now), title: s.title, minutes: s.minutes, focus: s.focus }];
      const feed: FeedItem[] = d.visibility === 'private'
        ? d.feed
        : [
            ...d.circles.filter((c) => c.joined).map((c) => ({
              id: `f${Date.now()}${c.id}`, circleId: c.id, author: d.profile.name, mine: true,
              text: `finished ${s.title}`, ts: now.toISOString(), cheers: 0, cheered: false,
            })),
            ...d.feed,
          ];
      return { ...d, plan: { ...d.plan, sessions }, history, feed };
    });
    showToast('Workout saved. Nice work.');
  };

  const undoSession: Ctx['undoSession'] = (id) =>
    setData((d) => ({
      ...d,
      plan: { ...d.plan, sessions: d.plan.sessions.map((s) => (s.id === id ? { ...s, done: false, completedAt: undefined } : s)) },
      history: d.history.filter((h) => h.sessionId !== id),
    }));

  const addMeal: Ctx['addMeal'] = (m) => {
    setData((d) => ({ ...d, meals: [...d.meals, { ...m, id: `m${Date.now()}`, date: toISO(new Date()) }] }));
    showToast(`Logged ${m.name}`);
  };
  const deleteMeal: Ctx['deleteMeal'] = (id) => setData((d) => ({ ...d, meals: d.meals.filter((m) => m.id !== id) }));

  const setVisibility: Ctx['setVisibility'] = (v) => {
    setData((d) => ({ ...d, visibility: v }));
    showToast(v === 'private' ? 'Only you can see your activity' : v === 'circle' ? 'Only your circles can see your activity' : 'Everyone can see your activity');
  };

  const setReminders: Ctx['setReminders'] = async (r) => {
    setData((d) => ({ ...d, reminders: r }));
    const res = await applyReminders(r);
    if (!res.ok && res.message) showToast(res.message);
    else if (res.ok) showToast('Reminders updated');
  };

  const createCircle: Ctx['createCircle'] = (name) => {
    const circle: Circle = { id: `c${Date.now()}`, name: name.trim(), code: codeFor(), joined: true, createdByMe: true, members: [] };
    setData((d) => ({ ...d, circles: [...d.circles, circle], flags: { ...d.flags, joinedCircle: true } }));
    showToast(`Created ${circle.name}. Share its code to invite friends.`);
  };

  const joinCircleByCode: Ctx['joinCircleByCode'] = (code) => {
    const c = data.circles.find((x) => x.code === code.trim().toUpperCase());
    if (!c) { showToast('No circle matches that code.'); return false; }
    if (c.joined) { showToast(`You are already in ${c.name}.`); return true; }
    setData((d) => ({
      ...d,
      circles: d.circles.map((x) => (x.id === c.id ? { ...x, joined: true } : x)),
      flags: { ...d.flags, joinedCircle: true },
    }));
    showToast(`You joined ${c.name}`);
    return true;
  };

  const leaveCircle: Ctx['leaveCircle'] = (id) => {
    setData((d) => ({
      ...d,
      circles: d.circles.flatMap((c) => (c.id !== id ? [c] : c.createdByMe ? [] : [{ ...c, joined: false }])),
      feed: d.feed.filter((f) => f.circleId !== id || !f.mine),
    }));
    showToast('You left the circle');
  };

  const postToCircle: Ctx['postToCircle'] = (circleId, text) => {
    if (!text.trim()) return;
    setData((d) => ({
      ...d,
      feed: [{ id: `f${Date.now()}`, circleId, author: d.profile.name, mine: true, text: text.trim(), ts: new Date().toISOString(), cheers: 0, cheered: false }, ...d.feed],
    }));
  };

  const cheer: Ctx['cheer'] = (feedId) =>
    setData((d) => ({
      ...d,
      feed: d.feed.map((f) => (f.id === feedId ? { ...f, cheered: !f.cheered, cheers: f.cheers + (f.cheered ? -1 : 1) } : f)),
    }));

  const createChallenge: Ctx['createChallenge'] = (name, target) => {
    const ch: Challenge = { id: `ch${Date.now()}`, name: name.trim(), target, days: 7, joined: true, joinedAt: toISO(new Date()), demo: [] };
    setData((d) => ({ ...d, challenges: [...d.challenges, ch], flags: { ...d.flags, joinedChallenge: true } }));
    showToast(`You joined ${ch.name}`);
  };

  const toggleChallenge: Ctx['toggleChallenge'] = (id) => {
    const c = data.challenges.find((x) => x.id === id);
    if (!c) return;
    setData((d) => ({
      ...d,
      challenges: d.challenges.map((x) => (x.id === id ? { ...x, joined: !x.joined, joinedAt: x.joined ? undefined : toISO(new Date()) } : x)),
      flags: { ...d.flags, joinedChallenge: d.flags.joinedChallenge || !c.joined },
    }));
    showToast(c.joined ? `You left ${c.name}` : `You joined ${c.name}`);
  };

  const challengeProgress: Ctx['challengeProgress'] = (c) => {
    if (!c.joined || !c.joinedAt) return 0;
    const since = c.joinedAt;
    return Math.min(c.target, data.history.filter((h) => h.date >= since).length);
  };

  const patchClient = (id: string, fn: (c: Client) => Client) =>
    setData((d) => ({ ...d, clients: d.clients.map((c) => (c.id === id ? fn(c) : c)) }));

  const setClientInjuries: Ctx['setClientInjuries'] = (id, injuries) => {
    patchClient(id, (c) => {
      const profile = { ...c.profile, injuries };
      return { ...c, profile, plan: generatePlan(profile, { version: c.plan.version + 1, note: 'Adjusted by your trainer.', now: weekStart(new Date()) }) };
    });
    showToast('Plan updated for this client');
  };

  const setClientSessionMinutes: Ctx['setClientSessionMinutes'] = (id, dayIndex, minutes) =>
    patchClient(id, (c) => ({
      ...c,
      plan: { ...c.plan, sessions: c.plan.sessions.map((s) => (s.dayIndex === dayIndex ? { ...s, minutes } : s)) },
    }));

  const setClientNotes: Ctx['setClientNotes'] = (id, notes) => {
    patchClient(id, (c) => ({ ...c, notes }));
    showToast('Note saved');
  };

  const resetAll = async () => {
    await applyReminders({ workoutEnabled: false, workoutHour: 18, workoutMinute: 0, mealEnabled: false });
    await repository.clear();
    setData(createSeed());
    showToast('All data cleared');
  };

  const value: Ctx = {
    ready, data, showToast, completeOnboarding, updateProfile, rebuildPlan, swapDays, rescheduleMissed, skipSession,
    completeSession, undoSession, addMeal, deleteMeal, setVisibility, setReminders, createCircle, joinCircleByCode,
    leaveCircle, postToCircle, cheer, createChallenge, toggleChallenge, challengeProgress, setClientInjuries,
    setClientSessionMinutes, setClientNotes, resetAll,
  };

  return (
    <AppCtx.Provider value={value}>
      {children}
      <Animated.View pointerEvents="none" style={[styles.toast, { opacity }]}>
        <Text style={styles.toastText}>{toast}</Text>
      </Animated.View>
    </AppCtx.Provider>
  );
}

const styles = StyleSheet.create({
  toast: { position: 'absolute', bottom: 110, left: 24, right: 24, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.primary, paddingVertical: 12, paddingHorizontal: 16, borderRadius: radius.button },
  toastText: { color: '#fff', fontSize: 14, fontWeight: '600', textAlign: 'center' },
});

export { addDays, todayIndex };
