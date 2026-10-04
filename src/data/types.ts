export type Level = 'beginner' | 'intermediate' | 'advanced';
export type Goal = 'strength' | 'weight' | 'consistency' | 'energy';
export type Focus = 'push' | 'pull' | 'legs' | 'core' | 'cardio' | 'mobility' | 'full';
export type Injury = 'knee' | 'shoulder' | 'back' | 'wrist';
export type Visibility = 'private' | 'circle' | 'public';
export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';

export interface Profile {
  name: string;
  level: Level;
  goal: Goal;
  daysPerWeek: number;
  minutes: number;
  injuries: Injury[];
  calorieGoal: number;
  onboarded: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  focus: Focus;
  minLevel: 0 | 1 | 2;
  kind: 'reps' | 'time';
  stress: Injury[];
  tip: string;
}

export interface PlannedExercise {
  exerciseId: string;
  name: string;
  sets: number;
  kind: 'reps' | 'time';
  reps?: number;
  seconds?: number;
  tip: string;
}

export interface Session {
  id: string;
  dayIndex: number; // 0 = Monday
  rest: boolean;
  title: string;
  focus: Focus;
  minutes: number;
  exercises: PlannedExercise[];
  done: boolean;
  completedAt?: string;
  note?: string;
}

export interface Plan {
  weekStart: string; // ISO date of Monday
  version: number;
  sessions: Session[]; // always 7, sessions[i].dayIndex === i
  rationale: string[];
}

export interface HistoryItem {
  id: string;
  sessionId: string;
  date: string; // ISO date
  title: string;
  minutes: number;
  focus: Focus;
}

export interface Food {
  id: string;
  name: string;
  serving: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Meal {
  id: string;
  date: string;
  type: MealType;
  name: string;
  portion: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  source: 'scan' | 'manual';
  photoUri?: string;
}

export interface Reminders {
  workoutEnabled: boolean;
  workoutHour: number;
  workoutMinute: number;
  mealEnabled: boolean;
}

export interface Circle {
  id: string;
  name: string;
  code: string;
  joined: boolean;
  createdByMe: boolean;
  members: string[]; // demo member names (the user is added when joined)
}

export interface FeedItem {
  id: string;
  circleId: string;
  author: string;
  mine: boolean;
  text: string;
  ts: string;
  cheers: number;
  cheered: boolean;
}

export interface Challenge {
  id: string;
  name: string;
  target: number; // workouts
  days: number;
  joined: boolean;
  joinedAt?: string; // ISO date
  demo: { name: string; progress: number }[];
}

export interface Client {
  id: string;
  name: string;
  profile: Profile;
  plan: Plan;
  notes: string;
}

export interface AppData {
  profile: Profile;
  plan: Plan;
  history: HistoryItem[];
  meals: Meal[];
  visibility: Visibility;
  reminders: Reminders;
  circles: Circle[];
  feed: FeedItem[];
  challenges: Challenge[];
  clients: Client[];
  flags: { joinedCircle: boolean; joinedChallenge: boolean };
}
