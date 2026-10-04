// Local, rule-based stand-in for the AI plan engine (FR1, FR5, FR6).
// Later this file can call the on-device TensorFlow Lite model / cloud AI service instead.
import { EXERCISES } from '../data/exercises';
import { Exercise, Focus, Goal, Level, Plan, PlannedExercise, Profile, Session } from '../data/types';
import { DAY_LONG, toISO, todayIndex, weekStart } from './dates';

const LEVEL_INDEX: Record<Level, number> = { beginner: 0, intermediate: 1, advanced: 2 };
const SETS: Record<Level, number> = { beginner: 2, intermediate: 3, advanced: 4 };
const REPS: Record<Level, number> = { beginner: 8, intermediate: 12, advanced: 15 };
const SECONDS: Record<Level, number> = { beginner: 30, intermediate: 40, advanced: 45 };

const GOAL_FOCI: Record<Goal, Focus[]> = {
  strength: ['push', 'legs', 'pull', 'core', 'legs', 'push'],
  weight: ['cardio', 'legs', 'cardio', 'core', 'cardio', 'push'],
  consistency: ['full', 'cardio', 'full', 'mobility', 'full', 'cardio'],
  energy: ['mobility', 'cardio', 'full', 'mobility', 'cardio', 'mobility'],
};

const GOAL_TEXT: Record<Goal, string> = {
  strength: 'Strength goal: rotating push, legs, pull and core.',
  weight: 'Weight goal: cardio-heavy days with strength in between.',
  consistency: 'Consistency goal: balanced full-body days that are easy to repeat.',
  energy: 'Energy goal: mobility and light cardio to keep you moving.',
};

export const FOCUS_TITLE: Record<Focus, string> = {
  push: 'Upper-body push',
  pull: 'Back and pull',
  legs: 'Legs and glutes',
  core: 'Core and stability',
  cardio: 'Cardio intervals',
  mobility: 'Mobility and stretch',
  full: 'Full-body circuit',
};

const INJURY_TEXT = { knee: 'knees', shoulder: 'shoulders', back: 'lower back', wrist: 'wrists' } as const;

function pool(focus: Focus, profile: Profile): Exercise[] {
  const lvl = LEVEL_INDEX[profile.level];
  return EXERCISES.filter(
    (x) => x.focus === focus && x.minLevel <= lvl && !x.stress.some((s) => profile.injuries.includes(s)),
  );
}

function pickMany<T>(list: T[], n: number, offset: number): T[] {
  const out: T[] = [];
  for (let i = 0; i < Math.min(n, list.length); i++) out.push(list[(offset + i) % list.length]);
  return out;
}

function planned(x: Exercise, profile: Profile, sets?: number): PlannedExercise {
  return {
    exerciseId: x.id,
    name: x.name,
    sets: sets ?? SETS[profile.level],
    kind: x.kind,
    reps: x.kind === 'reps' ? REPS[profile.level] : undefined,
    seconds: x.kind === 'time' ? SECONDS[profile.level] : undefined,
    tip: x.tip,
  };
}

function buildSession(focus: Focus, profile: Profile, dayIndex: number, slot: number, version: number): Session {
  const offset = slot + version;
  const sets = SETS[profile.level];
  const perExercise = sets * 1.1 + 0.5;
  const warm = profile.minutes >= 20 ? pickMany(pool('mobility', profile), 1, offset) : [];
  const warmMinutes = warm.length ? 2 : 0;
  const n = Math.max(2, Math.min(7, Math.round((profile.minutes - warmMinutes) / perExercise)));

  let main: Exercise[];
  if (focus === 'full') {
    const parts: Focus[] = ['legs', 'push', 'core', 'cardio', 'pull'];
    main = parts.flatMap((f, i) => pickMany(pool(f, profile), 1, offset + i)).slice(0, n);
  } else {
    main = pickMany(pool(focus, profile), n, offset);
  }
  if (main.length < 2) main = [...main, ...pickMany(pool('mobility', profile), 2 - main.length, offset)];

  return {
    id: `s${version}-${dayIndex}`,
    dayIndex,
    rest: false,
    title: FOCUS_TITLE[focus],
    focus,
    minutes: profile.minutes,
    exercises: [...warm.map((x) => planned(x, profile, 1)), ...main.map((x) => planned(x, profile))],
    done: false,
  };
}

function restDay(dayIndex: number, version: number): Session {
  return { id: `r${version}-${dayIndex}`, dayIndex, rest: true, title: 'Rest day', focus: 'mobility', minutes: 0, exercises: [], done: false };
}

export function generatePlan(
  profile: Profile,
  opts: { version?: number; daysDelta?: number; note?: string; now?: Date } = {},
): Plan {
  const now = opts.now ?? new Date();
  const version = opts.version ?? 1;
  const today = todayIndex(now);
  const remaining: number[] = [];
  for (let i = today; i < 7; i++) remaining.push(i);

  const wanted = Math.max(2, Math.min(6, profile.daysPerWeek + (opts.daysDelta ?? 0)));
  const days = Math.min(wanted, remaining.length);
  const trainingDays = Array.from(new Set(Array.from({ length: days }, (_, k) => remaining[Math.floor((k * remaining.length) / days)])));

  const foci = GOAL_FOCI[profile.goal];
  const sessions: Session[] = Array.from({ length: 7 }, (_, i) => {
    const slot = trainingDays.indexOf(i);
    return slot === -1 ? restDay(i, version) : buildSession(foci[slot % foci.length], profile, i, slot, version);
  });

  const rationale: string[] = [
    `${trainingDays.length} training ${trainingDays.length === 1 ? 'day' : 'days'} this week, spread out so you can recover.`,
    `Sessions are sized to ${profile.minutes} minutes to fit your schedule.`,
    GOAL_TEXT[profile.goal],
    `Exercise difficulty is set for ${profile.level} level.`,
  ];
  if (profile.injuries.length) {
    rationale.push(`Skipped moves that load your ${profile.injuries.map((i) => INJURY_TEXT[i]).join(' and ')}.`);
  }
  if (days < wanted) rationale.push(`Only ${days} days are left this week, so the plan starts on ${DAY_LONG[today]}.`);
  if (opts.note) rationale.push(opts.note);

  return { weekStart: toISO(weekStart(now)), version, sessions, rationale };
}
