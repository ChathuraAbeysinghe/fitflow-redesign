import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Bar, Button, Card, Chip, Empty, inputStyle, Page, SectionTitle } from '../../components/ui';
import { useApp } from '../../data/AppState';
import { FOODS } from '../../data/foods';
import { Food, MealType } from '../../data/types';
import { toISO } from '../../logic/dates';
import { macroGoals, sumMeals } from '../../logic/stats';
import { recognizeMeal } from '../../services/recognition';
import { colors, type } from '../../theme/theme';

const TYPES: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
const PORTIONS = [{ v: 0.5, l: '1/2' }, { v: 1, l: '1x' }, { v: 1.5, l: '1.5x' }, { v: 2, l: '2x' }];

function defaultType(): MealType {
  const h = new Date().getHours();
  return h < 11 ? 'Breakfast' : h < 16 ? 'Lunch' : h < 21 ? 'Dinner' : 'Snack';
}

export default function Log() {
  const { data, addMeal, deleteMeal, showToast } = useApp();
  const [mealType, setMealType] = useState<MealType>(defaultType());
  const [portion, setPortion] = useState(1);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<{ uri: string; candidates: Food[]; pick: string } | null>(null);
  const [manual, setManual] = useState(false);
  const [query, setQuery] = useState('');
  const [customKcal, setCustomKcal] = useState('');

  const today = toISO(new Date());
  const totals = sumMeals(data.meals, today);
  const goals = macroGoals(data.profile.calorieGoal);
  const todays = data.meals.filter((m) => m.date === today);

  const save = (food: Food, source: 'scan' | 'manual', photoUri?: string) =>
    addMeal({
      type: mealType, name: food.name, portion, source, photoUri,
      kcal: Math.round(food.kcal * portion), protein: Math.round(food.protein * portion),
      carbs: Math.round(food.carbs * portion), fat: Math.round(food.fat * portion),
    });

  const scan = async (from: 'camera' | 'library') => {
    let res: ImagePicker.ImagePickerResult;
    if (from === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        showToast('Camera access is off. Choose a photo or enter the meal manually.');
        setManual(true);
        return;
      }
      res = await ImagePicker.launchCameraAsync({ quality: 0.5 });
    } else {
      res = await ImagePicker.launchImageLibraryAsync({ quality: 0.5 });
    }
    if (res.canceled) return;
    setBusy(true);
    const uri = res.assets[0].uri;
    const candidates = await recognizeMeal(uri);
    setPending({ uri, candidates, pick: candidates[0].id });
    setBusy(false);
  };

  const confirm = () => {
    if (!pending) return;
    const food = pending.candidates.find((f) => f.id === pending.pick) ?? pending.candidates[0];
    save(food, 'scan', pending.uri);
    setPending(null);
  };

  const q = query.trim().toLowerCase();
  const matches = q ? FOODS.filter((f) => f.name.toLowerCase().includes(q)).slice(0, 6) : FOODS.slice(0, 6);

  const addCustom = () => {
    const k = parseInt(customKcal, 10);
    if (!q || Number.isNaN(k) || k <= 0) { showToast('Enter a name and calories.'); return; }
    save({ id: 'custom', name: query.trim(), serving: '1 serving', kcal: k, protein: 0, carbs: 0, fat: 0 }, 'manual');
    setQuery(''); setCustomKcal('');
  };

  const macros = [
    { l: 'Protein', v: totals.protein, g: goals.protein, c: colors.primary },
    { l: 'Carbohydrates', v: totals.carbs, g: goals.carbs, c: colors.amber },
    { l: 'Fats', v: totals.fat, g: goals.fat, c: colors.rose },
  ];

  return (
    <Page title="Nutrition Logger" sub="Analyze your dietary intake instantly" tabbed>
      <View style={styles.wrap}>{TYPES.map((t) => <Chip key={t} label={t} on={mealType === t} onPress={() => setMealType(t)} />)}</View>
      <View style={[styles.wrap, { marginTop: 8, alignItems: 'center' }]}>
        <Text style={type.small}>Portion</Text>
        {PORTIONS.map((p) => <Chip key={p.v} label={p.l} on={portion === p.v} onPress={() => setPortion(p.v)} />)}
      </View>

      {pending ? (
        <Card style={{ marginTop: 14 }}>
          <Image source={{ uri: pending.uri }} style={styles.photo} />
          <Text style={[type.h2, { marginTop: 12 }]}>Is this your meal?</Text>
          <Text style={[type.small, { marginBottom: 8 }]}>Demo recognition. The on-device model replaces this later.</Text>
          <View style={styles.wrap}>
            {pending.candidates.map((f) => (
              <Chip key={f.id} label={f.name} on={pending.pick === f.id} onPress={() => setPending({ ...pending, pick: f.id })} />
            ))}
          </View>
          <Button label="Save meal" onPress={confirm} style={{ marginTop: 14 }} />
          <Button label="Retake" variant="ghost" onPress={() => setPending(null)} style={{ marginTop: 8 }} />
        </Card>
      ) : (
        <Pressable accessibilityRole="button" accessibilityLabel="Scan meal" onPress={() => scan('camera')} disabled={busy} style={styles.scan}>
          <View style={styles.scanRing}>
            <View style={styles.scanCircle}><Ionicons name={busy ? 'hourglass-outline' : 'add'} size={30} color={colors.primaryText} /></View>
          </View>
          <Text style={styles.scanText}>{busy ? 'Recognising your meal...' : 'Tap to scan meal'}</Text>
          <Text style={type.small}>Point your camera at food for instant analysis</Text>
        </Pressable>
      )}

      {!pending && (
        <View style={styles.links}>
          <Pressable onPress={() => scan('library')} hitSlop={8}><Text style={styles.link}>choose a photo</Text></Pressable>
          <Pressable onPress={() => setManual(!manual)} hitSlop={8}><Text style={styles.link}>{manual ? 'hide manual entry' : 'enter manually instead'}</Text></Pressable>
        </View>
      )}

      {manual && !pending && (
        <Card>
          <TextInput value={query} onChangeText={setQuery} placeholder="Search foods" placeholderTextColor={colors.muted} style={[inputStyle, { marginBottom: 10 }]} accessibilityLabel="Search foods" />
          {matches.map((f) => (
            <Pressable key={f.id} onPress={() => save(f, 'manual')} style={styles.foodRow} accessibilityRole="button" accessibilityLabel={`Add ${f.name}`}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '600' }}>{f.name}</Text>
                <Text style={type.small}>{f.serving}</Text>
              </View>
              <Text style={type.small}>{Math.round(f.kcal * portion)} kcal</Text>
              <Ionicons name="add-circle" size={24} color={colors.primary} />
            </Pressable>
          ))}
          {q && !FOODS.some((f) => f.name.toLowerCase() === q) && (
            <View style={{ marginTop: 10 }}>
              <Text style={type.small}>Not in the list? Add "{query.trim()}" as a custom food.</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
                <TextInput value={customKcal} onChangeText={setCustomKcal} placeholder="Calories" keyboardType="number-pad" placeholderTextColor={colors.muted} style={[inputStyle, { flex: 1 }]} accessibilityLabel="Calories" />
                <Button label="Add" onPress={addCustom} />
              </View>
            </View>
          )}
        </Card>
      )}

      <SectionTitle>Daily Macro Status</SectionTitle>
      <Card>
        <View style={styles.macroHead}>
          <Text style={styles.kcal}>{totals.kcal} <Text style={type.small}>of {data.profile.calorieGoal} kcal</Text></Text>
        </View>
        <Bar value={totals.kcal} max={data.profile.calorieGoal} color={totals.kcal > data.profile.calorieGoal ? colors.amber : colors.primary} />
        {macros.map((m) => (
          <View key={m.l} style={{ marginTop: 14 }}>
            <View style={styles.macroHead}>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>{m.l}</Text>
              <Text style={type.small}>{m.v}g / {m.g}g</Text>
            </View>
            <Bar value={m.v} max={m.g} color={m.c} />
          </View>
        ))}
      </Card>

      <SectionTitle>Today</SectionTitle>
      {todays.length === 0 ? <Empty text="No meals yet. Tap Scan meal after your next one." /> : todays.map((m) => (
        <Card key={m.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {m.photoUri ? <Image source={{ uri: m.photoUri }} style={styles.thumb} /> : <View style={[styles.thumb, { backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' }]}><Ionicons name="restaurant" size={22} color={colors.muted} /></View>}
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '700', color: colors.text }}>{m.name}</Text>
            <Text style={type.small}>{m.type}, {m.kcal} kcal{m.portion !== 1 ? `, ${m.portion}x` : ''}</Text>
          </View>
          <Pressable accessibilityLabel={`Delete ${m.name}`} onPress={() => deleteMeal(m.id)} hitSlop={10}>
            <Ionicons name="trash-outline" size={22} color={colors.muted} />
          </Pressable>
        </Card>
      ))}
    </Page>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  scan: { alignItems: 'center', paddingVertical: 30, backgroundColor: colors.surface, borderRadius: 24, borderWidth: 1, borderColor: colors.border, marginTop: 14, gap: 4 },
  scanRing: { width: 168, height: 168, borderRadius: 84, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  scanCircle: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  scanText: { fontSize: 17, fontWeight: '800', color: colors.text },
  links: { flexDirection: 'row', justifyContent: 'center', gap: 22, marginVertical: 14 },
  link: { color: colors.primaryText, textDecorationLine: 'underline', fontSize: 14 },
  foodRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border },
  macroHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  kcal: { fontSize: 22, fontWeight: '800', color: colors.text },
  photo: { width: '100%', height: 180, borderRadius: 14 },
  thumb: { width: 52, height: 52, borderRadius: 12 },
});
