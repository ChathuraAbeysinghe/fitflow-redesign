import { Exercise } from './types';

const e = (
  id: string, name: string, focus: Exercise['focus'], minLevel: 0 | 1 | 2,
  kind: 'reps' | 'time', stress: Exercise['stress'], tip: string,
): Exercise => ({ id, name, focus, minLevel, kind, stress, tip });

export const EXERCISES: Exercise[] = [
  // push
  e('wall-pushup', 'Wall push-up', 'push', 0, 'reps', [], 'Keep your body in one straight line.'),
  e('incline-pushup', 'Incline push-up', 'push', 0, 'reps', ['wrist'], 'Hands on a sturdy table or bench.'),
  e('ohp-bottles', 'Overhead press (water bottles)', 'push', 0, 'reps', ['shoulder'], 'Press up without arching your back.'),
  e('pushup', 'Push-up', 'push', 1, 'reps', ['wrist', 'shoulder'], 'Lower until your chest is a fist from the floor.'),
  e('chair-dips', 'Chair dips', 'push', 1, 'reps', ['shoulder', 'wrist'], 'Keep your hips close to the chair.'),
  e('pike-pushup', 'Pike push-up', 'push', 2, 'reps', ['shoulder', 'wrist'], 'Hips high, head moves between your hands.'),
  e('diamond-pushup', 'Diamond push-up', 'push', 2, 'reps', ['wrist', 'shoulder'], 'Hands form a diamond under your chest.'),
  // pull
  e('snow-angels', 'Reverse snow angels', 'pull', 0, 'reps', [], 'Lie face down and sweep your arms slowly.'),
  e('doorframe-row', 'Doorframe row', 'pull', 0, 'reps', [], 'Lean back and pull your chest to the frame.'),
  e('bag-curl', 'Backpack bicep curl', 'pull', 0, 'reps', ['wrist'], 'Elbows stay pinned to your sides.'),
  e('superman', 'Superman hold', 'pull', 0, 'time', ['back'], 'Lift arms and legs a little, breathe steadily.'),
  e('towel-row', 'Towel row', 'pull', 1, 'reps', [], 'Loop a towel around a post and pull.'),
  e('prone-y', 'Prone Y raise', 'pull', 1, 'reps', ['shoulder'], 'Thumbs up, lift arms into a Y shape.'),
  e('inverted-row', 'Inverted row (sturdy table)', 'pull', 2, 'reps', ['shoulder'], 'Body straight, pull chest to the edge.'),
  // legs
  e('glute-bridge', 'Glute bridge', 'legs', 0, 'reps', [], 'Squeeze at the top for one second.'),
  e('calf-raise', 'Calf raise', 'legs', 0, 'reps', [], 'Rise slowly, lower slowly.'),
  e('side-leg-raise', 'Side-lying leg raise', 'legs', 0, 'reps', [], 'Toes forward, move from the hip.'),
  e('chair-squat', 'Chair squat', 'legs', 0, 'reps', ['knee'], 'Tap the chair and stand back up.'),
  e('wall-sit', 'Wall sit', 'legs', 0, 'time', ['knee'], 'Thighs parallel to the floor if you can.'),
  e('reverse-lunge', 'Reverse lunge', 'legs', 1, 'reps', ['knee'], 'Step back, keep your front heel planted.'),
  e('step-up', 'Step-up', 'legs', 1, 'reps', ['knee'], 'Drive through the heel of the top foot.'),
  e('single-bridge', 'Single-leg glute bridge', 'legs', 1, 'reps', [], 'Keep hips level throughout.'),
  e('split-squat', 'Bulgarian split squat', 'legs', 2, 'reps', ['knee'], 'Rear foot on a chair, torso tall.'),
  e('jump-squat', 'Jump squat', 'legs', 2, 'reps', ['knee'], 'Land softly with bent knees.'),
  // core
  e('dead-bug', 'Dead bug', 'core', 0, 'reps', [], 'Lower back stays pressed into the floor.'),
  e('bird-dog', 'Bird dog', 'core', 0, 'reps', [], 'Reach long, hips stay square.'),
  e('bicycle', 'Bicycle crunch', 'core', 0, 'reps', ['back'], 'Slow and controlled beats fast.'),
  e('plank', 'Plank', 'core', 0, 'time', ['shoulder', 'wrist'], 'Squeeze glutes, ribs down.'),
  e('leg-raise', 'Lying leg raise', 'core', 1, 'reps', ['back'], 'Lower only as far as your back allows.'),
  e('side-plank', 'Side plank', 'core', 1, 'time', ['shoulder'], 'Stack your feet and lift your hips.'),
  e('mountain-climber', 'Mountain climber', 'core', 1, 'time', ['wrist', 'shoulder', 'knee'], 'Drive knees toward your chest.'),
  e('hollow-hold', 'Hollow hold', 'core', 2, 'time', ['back'], 'Low back flat, arms overhead.'),
  // cardio
  e('march', 'March in place', 'cardio', 0, 'time', [], 'Lift knees to hip height.'),
  e('brisk-walk', 'Brisk walk', 'cardio', 0, 'time', [], 'Swing your arms and keep a steady pace.'),
  e('step-jacks', 'Step jacks', 'cardio', 0, 'time', [], 'Low-impact jumping jacks.'),
  e('shadow-box', 'Shadow boxing', 'cardio', 0, 'time', ['shoulder'], 'Light on your feet, quick hands.'),
  e('jumping-jacks', 'Jumping jacks', 'cardio', 1, 'time', ['knee'], 'Land softly on the balls of your feet.'),
  e('easy-jog', 'Easy jog', 'cardio', 1, 'time', ['knee'], 'You should be able to talk.'),
  e('high-knees', 'High knees', 'cardio', 2, 'time', ['knee'], 'Pump your arms, stay tall.'),
  e('skater-hops', 'Skater hops', 'cardio', 2, 'time', ['knee'], 'Hop side to side, balance on each landing.'),
  e('burpee', 'Burpees', 'cardio', 2, 'reps', ['knee', 'wrist', 'shoulder', 'back'], 'Keep your pace even.'),
  // mobility
  e('thoracic', 'Thoracic rotation', 'mobility', 0, 'reps', [], 'Rotate from your upper back.'),
  e('hip-circles', 'Hip circles', 'mobility', 0, 'reps', [], 'Make big, slow circles.'),
  e('shoulder-circles', 'Shoulder circles', 'mobility', 0, 'reps', [], 'Roll back, then forward.'),
  e('hamstring', 'Hamstring stretch', 'mobility', 0, 'time', [], 'Hinge forward with a flat back.'),
  e('neck-wrist', 'Neck and wrist rolls', 'mobility', 0, 'time', [], 'Gentle, no forcing.'),
  e('quad-stretch', 'Standing quad stretch', 'mobility', 0, 'time', ['knee'], 'Knees together, hips tucked.'),
  e('childs-pose', "Child's pose", 'mobility', 0, 'time', ['knee'], 'Sink your hips toward your heels.'),
  e('cat-cow', 'Cat-cow', 'mobility', 0, 'reps', ['wrist'], 'Move with your breathing.'),
];
