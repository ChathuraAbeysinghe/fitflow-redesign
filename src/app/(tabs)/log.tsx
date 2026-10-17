import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Bar, Button, Card, Chip, Empty, inputStyle, Page, SectionTitle, Tag } from '../../components/ui';
import { useApp } from '../../data/AppState';
import { FOODS } from '../../data/foods';
import { Food, Meal, MealType } from '../../data/types';
import { toISO } from '../../logic/dates';
import { macroGoals, sumMeals } from '../../logic/stats';
import { recognizeMeal } from '../../services/recognition';
import { colors, radius, type } from '../../theme/theme';

const TYPES: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
const PORTIONS = [
  { v: 0.5, l: '1/2 portion' },
  { v: 1, l: '1x standard' },
  { v: 1.5, l: '1.5x large' },
  { v: 2, l: '2x double' },
];

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
  const [customProtein, setCustomProtein] = useState('');
  const [customCarbs, setCustomCarbs] = useState('');
  const [customFat, setCustomFat] = useState('');
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);

  const today = toISO(new Date());
  const totals = sumMeals(data.meals, today);
  const goals = macroGoals(data.profile.calorieGoal);
  const todays = data.meals.filter((m) => m.date === today);

  const save = (food: Food, source: 'scan' | 'manual', photoUri?: string) =>
    addMeal({
      type: mealType,
      name: food.name,
      portion,
      source,
      photoUri,
      kcal: Math.round(food.kcal * portion),
      protein: Math.round(food.protein * portion),
      carbs: Math.round(food.carbs * portion),
      fat: Math.round(food.fat * portion),
    });

  const scan = async (from: 'camera' | 'library') => {
    let res: ImagePicker.ImagePickerResult;
    if (from === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        showToast('Camera permission needed. Choose a photo from gallery or enter manually.');
        setManual(true);
        return;
      }
      res = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true, aspect: [4, 3] });
    } else {
      res = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsEditing: true, aspect: [4, 3] });
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
    if (!query.trim() || Number.isNaN(k) || k <= 0) {
      showToast('Please enter a meal name and calories.');
      return;
    }
    const p = parseInt(customProtein, 10) || 0;
    const c = parseInt(customCarbs, 10) || 0;
    const f = parseInt(customFat, 10) || 0;

    save(
      {
        id: `custom-${Date.now()}`,
        name: query.trim(),
        serving: '1 serving',
        kcal: k,
        protein: p,
        carbs: c,
        fat: f,
      },
      'manual'
    );
    setQuery('');
    setCustomKcal('');
    setCustomProtein('');
    setCustomCarbs('');
    setCustomFat('');
  };

  const macros = [
    { l: 'Protein', v: totals.protein, g: goals.protein, c: colors.primary },
    { l: 'Carbohydrates', v: totals.carbs, g: goals.carbs, c: colors.amber },
    { l: 'Fats', v: totals.fat, g: goals.fat, c: colors.rose },
  ];

  return (
    <Page title="Nutrition Logger" sub="Fast camera recognition & macro tracking" tabbed>
      {/* Meal Category Selector */}
      <View style={styles.wrap}>
        {TYPES.map((t) => (
          <Chip key={t} label={t} on={mealType === t} onPress={() => setMealType(t)} />
        ))}
      </View>

      {/* Portion Size Selector */}
      <View style={[styles.wrap, { marginTop: 10, alignItems: 'center' }]}>
        <Text style={[type.small, { marginRight: 4, fontWeight: '700' }]}>Portion:</Text>
        {PORTIONS.map((p) => (
          <Chip key={p.v} label={p.l} on={portion === p.v} onPress={() => setPortion(p.v)} />
        ))}
      </View>

      {/* Camera / AI Recognition Stage */}
      {pending ? (
        <Card style={{ marginTop: 14 }}>
          <Image source={{ uri: pending.uri }} style={styles.photo} />
          <Text style={[type.h2, { marginTop: 12 }]}>AI Food Recognition</Text>
          <Text style={[type.small, { marginBottom: 10 }]}>
            Select the closest match detected in your photo:
          </Text>

          <View style={{ gap: 8 }}>
            {pending.candidates.map((f) => {
              const on = pending.pick === f.id;
              return (
                <Pressable
                  key={f.id}
                  onPress={() => setPending({ ...pending, pick: f.id })}
                  style={[styles.candidateRow, on && styles.candidateRowOn]}
                >
                  <Ionicons
                    name={on ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={on ? colors.primary : colors.muted}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700', color: colors.text }}>{f.name}</Text>
                    <Text style={type.small}>
                      {f.serving} • {Math.round(f.kcal * portion)} kcal (P: {Math.round(f.protein * portion)}g, C: {Math.round(f.carbs * portion)}g, F: {Math.round(f.fat * portion)}g)
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Button label="Save this meal" onPress={confirm} style={{ marginTop: 14 }} />
          <Button label="Retake photo" variant="ghost" onPress={() => setPending(null)} style={{ marginTop: 8 }} />
        </Card>
      ) : (
        /* Lab Sheet 4 R6 Fix: Restyled camera button with food/camera icon & short 'Scan meal' label */
        <View style={styles.scanContainer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Scan meal with camera"
            onPress={() => scan('camera')}
            disabled={busy}
            style={styles.scan}
          >
            <View style={styles.scanRing}>
              <View style={styles.scanCircle}>
                <Ionicons
                  name={busy ? 'hourglass-outline' : 'camera'}
                  size={32}
                  color={colors.primaryText}
                />
              </View>
            </View>
            <Text style={styles.scanText}>{busy ? 'Analyzing meal...' : 'Scan meal'}</Text>
            <Text style={[type.small, { textAlign: 'center', marginTop: 2 }]}>
              Point camera at your meal for instant macro breakdown
            </Text>
          </Pressable>

          {/* Lab Sheet 4 U6 Fix: Shortcut to photo gallery alongside camera */}
          <View style={styles.quickOptions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Choose photo from gallery"
              onPress={() => scan('library')}
              hitSlop={8}
              style={styles.galleryShortcut}
            >
              <Ionicons name="images-outline" size={18} color={colors.primaryText} />
              <Text style={styles.shortcutText}>Choose from Gallery</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Toggle manual meal entry"
              onPress={() => setManual(!manual)}
              hitSlop={8}
              style={styles.galleryShortcut}
            >
              <Ionicons name="create-outline" size={18} color={colors.primaryText} />
              <Text style={styles.shortcutText}>
                {manual ? 'Hide manual entry' : 'Enter manually instead'}
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Manual Entry Drawer */}
      {manual && !pending && (
        <Card style={{ marginTop: 14 }}>
          <Text style={[type.h2, { marginBottom: 8 }]}>Search or Add Food</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search e.g. Rice, Chicken, Oats..."
            placeholderTextColor={colors.muted}
            style={[inputStyle, { marginBottom: 12 }]}
            accessibilityLabel="Search foods"
          />

          {matches.map((f) => (
            <Pressable
              key={f.id}
              onPress={() => save(f, 'manual')}
              style={styles.foodRow}
              accessibilityRole="button"
              accessibilityLabel={`Add ${f.name}`}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '700' }}>{f.name}</Text>
                <Text style={type.small}>
                  {f.serving} • P:{Math.round(f.protein * portion)}g C:{Math.round(f.carbs * portion)}g F:{Math.round(f.fat * portion)}g
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', marginRight: 10 }}>
                <Text style={{ color: colors.text, fontWeight: '700' }}>
                  {Math.round(f.kcal * portion)} kcal
                </Text>
                <Text style={type.small}>{portion}x</Text>
              </View>
              <Ionicons name="add-circle" size={26} color={colors.primary} />
            </Pressable>
          ))}

          {/* Custom Food Creation Form */}
          <View style={styles.customBox}>
            <Text style={[type.small, { fontWeight: '700', color: colors.text }]}>
              Custom Item Entry
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <TextInput
                value={customKcal}
                onChangeText={setCustomKcal}
                placeholder="Calories (kcal)"
                keyboardType="number-pad"
                placeholderTextColor={colors.muted}
                style={[inputStyle, { flex: 1 }]}
                accessibilityLabel="Calories"
              />
              <TextInput
                value={customProtein}
                onChangeText={setCustomProtein}
                placeholder="Protein (g)"
                keyboardType="number-pad"
                placeholderTextColor={colors.muted}
                style={[inputStyle, { flex: 1 }]}
                accessibilityLabel="Protein"
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <TextInput
                value={customCarbs}
                onChangeText={setCustomCarbs}
                placeholder="Carbs (g)"
                keyboardType="number-pad"
                placeholderTextColor={colors.muted}
                style={[inputStyle, { flex: 1 }]}
                accessibilityLabel="Carbs"
              />
              <TextInput
                value={customFat}
                onChangeText={setCustomFat}
                placeholder="Fat (g)"
                keyboardType="number-pad"
                placeholderTextColor={colors.muted}
                style={[inputStyle, { flex: 1 }]}
                accessibilityLabel="Fat"
              />
            </View>
            <Button label="Add Custom Meal" onPress={addCustom} style={{ marginTop: 10 }} />
          </View>
        </Card>
      )}

      {/* Daily Macro Progress Status */}
      <SectionTitle>Daily Macro Status</SectionTitle>
      <Card>
        <View style={styles.macroHead}>
          <Text style={styles.kcal}>
            {totals.kcal} <Text style={type.small}>of {data.profile.calorieGoal} kcal</Text>
          </Text>
          <Tag color={totals.kcal > data.profile.calorieGoal ? colors.amber : colors.green}>
            {Math.max(0, data.profile.calorieGoal - totals.kcal)} KCAL LEFT
          </Tag>
        </View>
        <Bar
          value={totals.kcal}
          max={data.profile.calorieGoal}
          color={totals.kcal > data.profile.calorieGoal ? colors.amber : colors.primary}
        />

        {macros.map((m) => (
          <View key={m.l} style={{ marginTop: 14 }}>
            <View style={styles.macroHead}>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>{m.l}</Text>
              <Text style={type.small}>
                {m.v}g / {m.g}g ({m.g > 0 ? Math.round((m.v / m.g) * 100) : 0}%)
              </Text>
            </View>
            <Bar value={m.v} max={m.g} color={m.c} />
          </View>
        ))}
      </Card>

      {/* Today's Logged Meals */}
      <SectionTitle>Today's Meals</SectionTitle>
      {todays.length === 0 ? (
        <Empty text="No meals logged yet today. Snap a photo or search above!" />
      ) : (
        todays.map((m) => (
          <Pressable
            key={m.id}
            onPress={() => setSelectedMeal(selectedMeal?.id === m.id ? null : m)}
            accessibilityRole="button"
            accessibilityLabel={`${m.name}, show details`}
          >
            <Card style={styles.mealCard}>
              {m.photoUri ? (
                <Image source={{ uri: m.photoUri }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.thumbPlaceholder]}>
                  <Ionicons name="restaurant" size={22} color={colors.muted} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontWeight: '700', color: colors.text, fontSize: 15 }}>{m.name}</Text>
                  <Tag color={m.source === 'scan' ? colors.primaryText : colors.muted}>
                    {m.source === 'scan' ? 'PHOTO' : 'MANUAL'}
                  </Tag>
                </View>
                <Text style={type.small}>
                  {m.type} • {m.kcal} kcal{m.portion !== 1 ? ` (${m.portion}x portion)` : ''}
                </Text>
              </View>
              <Pressable
                accessibilityLabel={`Delete ${m.name}`}
                onPress={() => deleteMeal(m.id)}
                hitSlop={10}
                style={{ padding: 6 }}
              >
                <Ionicons name="trash-outline" size={20} color={colors.muted} />
              </Pressable>
            </Card>

            {/* Expanded meal macro breakdown */}
            {selectedMeal?.id === m.id && (
              <View style={styles.mealDetailDrawer}>
                <View style={styles.macroPill}>
                  <Text style={[type.small, { color: colors.primaryText, fontWeight: '700' }]}>
                    Protein: {m.protein}g
                  </Text>
                </View>
                <View style={styles.macroPill}>
                  <Text style={[type.small, { color: colors.amber, fontWeight: '700' }]}>
                    Carbs: {m.carbs}g
                  </Text>
                </View>
                <View style={styles.macroPill}>
                  <Text style={[type.small, { color: colors.rose, fontWeight: '700' }]}>
                    Fats: {m.fat}g
                  </Text>
                </View>
              </View>
            )}
          </Pressable>
        ))
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  scanContainer: { marginTop: 14 },
  scan: {
    alignItems: 'center',
    paddingVertical: 26,
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  scanRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  scanCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(99,102,241,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanText: { fontSize: 18, fontWeight: '800', color: colors.text },
  quickOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
  },
  galleryShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.chip,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  shortcutText: { color: colors.primaryText, fontWeight: '700', fontSize: 13 },
  candidateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radius.button,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  candidateRowOn: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(99,102,241,0.12)',
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  customBox: {
    marginTop: 14,
    padding: 12,
    backgroundColor: colors.surface2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  macroHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  kcal: { fontSize: 22, fontWeight: '800', color: colors.text },
  photo: { width: '100%', height: 180, borderRadius: 14 },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    paddingVertical: 12,
  },
  thumb: { width: 50, height: 50, borderRadius: 12 },
  thumbPlaceholder: {
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  mealDetailDrawer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 10,
    marginTop: -4,
    marginBottom: 8,
  },
  macroPill: {
    backgroundColor: colors.surface2,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
