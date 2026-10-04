import { AppData, HistoryItem, Meal, Plan, Session } from '../data/types';
import { daysBetween, todayIndex, toISO } from './dates';

export const plannedSessions = (plan: Plan) => plan.sessions.filter((s) => !s.rest);

export function missedSessions(plan: Plan, now = new Date()): Session[] {
  const t = todayIndex(now);
  return plannedSessions(plan).filter((s) => !s.done && s.dayIndex < t);
}

/** First rest day from today onwards, used to suggest where a missed workout can go (FR6). */
export function freeDay(plan: Plan, now = new Date()): number | null {
  const t = todayIndex(now);
  for (let i = t; i < 7; i++) if (plan.sessions[i].rest) return i;
  return null;
}

export function focusSession(plan: Plan, now = new Date()): { session: Session; kind: 'today' | 'missed' | 'upcoming' } | null {
  const t = todayIndex(now);
  const today = plan.sessions[t];
  if (!today.rest && !today.done) return { session: today, kind: 'today' };
  const missed = missedSessions(plan, now)[0];
  if (missed) return { session: missed, kind: 'missed' };
  const next = plannedSessions(plan).find((s) => !s.done && s.dayIndex > t);
  return next ? { session: next, kind: 'upcoming' } : null;
}

/** Consecutive workout days, allowing one rest day between sessions. */
export function computeStreak(history: HistoryItem[], now = new Date()): number {
  const dates = Array.from(new Set(history.map((h) => h.date))).sort().reverse();
  if (!dates.length) return 0;
  if (daysBetween(dates[0], toISO(now)) > 2) return 0;
  let n = 1;
  for (let i = 1; i < dates.length; i++) {
    if (daysBetween(dates[i], dates[i - 1]) <= 2) n += 1;
    else break;
  }
  return n;
}

export function weekStats(data: AppData) {
  const planned = plannedSessions(data.plan);
  const done = planned.filter((s) => s.done).length;
  const minutesByDay = [0, 0, 0, 0, 0, 0, 0];
  for (const h of data.history) {
    const idx = daysBetween(data.plan.weekStart, h.date);
    if (idx >= 0 && idx < 7) minutesByDay[idx] += h.minutes;
  }
  return {
    planned: planned.length,
    done,
    percent: planned.length ? (done / planned.length) * 100 : 0,
    minutesByDay,
    totalMinutes: minutesByDay.reduce((a, b) => a + b, 0),
  };
}

export function sumMeals(meals: Meal[], date: string) {
  const list = meals.filter((m) => m.date === date);
  return list.reduce(
    (t, m) => ({ kcal: t.kcal + m.kcal, protein: t.protein + m.protein, carbs: t.carbs + m.carbs, fat: t.fat + m.fat }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

export const macroGoals = (kcal: number) => ({
  protein: Math.round((kcal * 0.25) / 4),
  carbs: Math.round((kcal * 0.5) / 4),
  fat: Math.round((kcal * 0.25) / 9),
});

export type BadgeInfo = { id: string; icon: string; label: string; hint: string; earned: boolean };

export function badgesFor(data: AppData, now = new Date()): BadgeInfo[] {
  const streak = computeStreak(data.history, now);
  const fullWeek = plannedSessions(data.plan).length > 0 && plannedSessions(data.plan).every((s) => s.done);
  return [
    { id: 'first', icon: 'flag', label: 'First workout', hint: 'Finish any workout', earned: data.history.length >= 1 },
    { id: 'streak3', icon: 'flame', label: '3-day streak', hint: 'Work out 3 days in a row (one rest day allowed)', earned: streak >= 3 },
    { id: 'five', icon: 'barbell', label: '5 workouts', hint: 'Finish 5 workouts', earned: data.history.length >= 5 },
    { id: 'week', icon: 'trophy', label: 'Perfect week', hint: 'Finish every planned session in a week', earned: fullWeek },
    { id: 'scanner', icon: 'camera', label: 'Meal scanner', hint: 'Log a meal with the camera', earned: data.meals.some((m) => m.source === 'scan') },
    { id: 'circle', icon: 'people', label: 'Circle member', hint: 'Join or create a circle', earned: data.flags.joinedCircle },
    { id: 'challenger', icon: 'medal', label: 'Challenger', hint: 'Join a challenge', earned: data.flags.joinedChallenge },
  ];
}

/** Rule-based "weekly AI insights" shown on the Progress tab. */
export function insightsFor(data: AppData, now = new Date()): string[] {
  const out: string[] = [];
  const w = weekStats(data);
  const streak = computeStreak(data.history, now);
  const missed = missedSessions(data.plan, now);

  if (w.planned > 0 && w.done === w.planned) out.push('You finished every planned session this week. Keep the same plan next week.');
  else if (w.done > 0) out.push(`${w.done} of ${w.planned} sessions done, ${w.totalMinutes} active minutes so far.`);
  else out.push('No workouts yet this week. A short session today starts your streak.');

  if (missed.length) out.push(`You have ${missed.length} missed ${missed.length === 1 ? 'session' : 'sessions'}. Move it to a free day or skip it to keep your plan honest.`);
  if (streak >= 3) out.push(`${streak} workout days in a row. Rest days are fine, they do not break this streak.`);

  const today = toISO(now);
  const last7 = data.meals.filter((m) => daysBetween(m.date, today) >= 0 && daysBetween(m.date, today) < 7);
  if (last7.length) {
    const days = new Set(last7.map((m) => m.date)).size;
    const avg = Math.round(last7.reduce((n, m) => n + m.kcal, 0) / days);
    const diff = avg - data.profile.calorieGoal;
    out.push(
      Math.abs(diff) <= 150
        ? `Your daily calories average ${avg}, right on target.`
        : `Your daily calories average ${avg}, about ${Math.abs(diff)} ${diff > 0 ? 'over' : 'under'} your goal.`,
    );
  } else {
    out.push('Log a meal with the camera to see calorie trends here.');
  }
  return out.slice(0, 4);
}
