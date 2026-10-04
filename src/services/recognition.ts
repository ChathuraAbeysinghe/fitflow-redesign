// Demo stand-in for ML Kit / TensorFlow Lite food recognition (FR3).
// It returns plausible candidates so the full scan -> confirm -> log flow can be tested.
// Replace recognizeMeal() with the real model call in the AI phase.
import { FOODS } from '../data/foods';
import { Food } from '../data/types';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export async function recognizeMeal(uri: string): Promise<Food[]> {
  await sleep(900);
  const start = hash(uri) % FOODS.length;
  const picks: Food[] = [];
  for (let i = 0; i < FOODS.length && picks.length < 4; i++) {
    const food = FOODS[(start + i * 5) % FOODS.length];
    if (!picks.includes(food)) picks.push(food);
  }
  return picks;
}
