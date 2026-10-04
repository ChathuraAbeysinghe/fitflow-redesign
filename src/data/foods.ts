import { Food } from './types';

const f = (id: string, name: string, serving: string, kcal: number, protein: number, carbs: number, fat: number): Food =>
  ({ id, name, serving, kcal, protein, carbs, fat });

export const FOODS: Food[] = [
  f('rice-curry', 'Rice and curry', '1 plate', 620, 22, 92, 18),
  f('dhal', 'Dhal curry with rice', '1 plate', 540, 20, 88, 11),
  f('egg-hoppers', 'Egg hoppers', '2 hoppers', 310, 14, 36, 12),
  f('string-hoppers', 'String hoppers with sambol', '8 pieces', 380, 8, 74, 5),
  f('kottu', 'Chicken kottu', '1 plate', 780, 35, 90, 28),
  f('fish-curry-rice', 'Fish curry with rice', '1 plate', 560, 30, 78, 12),
  f('fried-rice', 'Fried rice', '1 plate', 650, 18, 88, 24),
  f('oats', 'Oatmeal with banana', '1 bowl', 320, 10, 58, 6),
  f('eggs-toast', 'Eggs on toast', '2 eggs, 2 slices', 360, 20, 30, 17),
  f('banana', 'Banana', '1 medium', 105, 1, 27, 0),
  f('apple', 'Apple', '1 medium', 95, 0, 25, 0),
  f('yogurt', 'Plain yogurt with fruit', '1 cup', 190, 12, 28, 4),
  f('chicken-salad', 'Grilled chicken salad', '1 bowl', 380, 38, 14, 18),
  f('veg-salad', 'Mixed vegetable salad', '1 bowl', 140, 4, 18, 6),
  f('pasta', 'Pasta with tomato sauce', '1 plate', 520, 16, 90, 9),
  f('sandwich', 'Chicken sandwich', '1 sandwich', 430, 26, 44, 15),
  f('burger', 'Cheeseburger', '1 burger', 540, 28, 40, 28),
  f('pizza', 'Pizza slice', '1 slice', 285, 12, 36, 10),
  f('smoothie', 'Fruit smoothie', '1 glass', 220, 5, 46, 2),
  f('protein-shake', 'Protein shake', '1 shake', 180, 25, 8, 4),
  f('nuts', 'Mixed nuts', '30 g', 180, 5, 6, 16),
  f('milk-tea', 'Milk tea with sugar', '1 cup', 90, 2, 14, 3),
  f('roti', 'Roti with dhal', '2 rotis', 410, 14, 62, 11),
  f('noodles', 'Vegetable noodles', '1 bowl', 440, 12, 72, 12),
  f('soup', 'Chicken soup', '1 bowl', 150, 14, 10, 5),
  f('biscuits', 'Biscuits', '4 pieces', 160, 2, 24, 6),
  f('fruit-bowl', 'Fruit bowl', '1 bowl', 120, 2, 30, 1),
  f('rice-chicken', 'Chicken and rice', '1 plate', 590, 36, 72, 16),
];
