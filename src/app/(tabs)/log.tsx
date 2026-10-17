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
        <Card style={styles.pendingCard}>
          <Image source={{ uri: pending.uri }} style={styles.photo} />
          <View style={styles.pendingHeader}>
            <View>
              <Text style={type.h2}>AI Food Recognition</Text>
              <Text style={type.small}>Select closest match detected:</Text>
            </View>
            <Tag color={colors.primary}>AI DETECTED</Tag>
          </View>

          <View style={{ gap: 8, marginTop: 8 }}>
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
                    size={22}
                    color={on ? colors.primary : colors.muted}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700', color: colors.text, fontSize: 15 }}>{f.name}</Text>
                    <Text style={type.small}>
                      {f.serving} • {Math.round(f.kcal * portion)} kcal
                    </Text>
                  </View>
                  <View style={styles.macroMiniRow}>
                    <Text style={[styles.macroMiniText, { color: colors.primary }]}>P:{Math.round(f.protein * portion)}g</Text>
                    <Text style={[styles.macroMiniText, { color: colors.amber }]}>C:{Math.round(f.carbs * portion)}g</Text>
                    <Text style={[styles.macroMiniText, { color: colors.rose }]}>F:{Math.round(f.fat * portion)}g</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Button label="Save to Nutrition Diary" onPress={confirm} style={{ marginTop: 16 }} />
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
                  size={34}
                  color={colors.bg}
                />
              </View>
            </View>
            <Text style={styles.scanText}>{busy ? 'Analyzing meal...' : 'Scan Meal with AI'}</Text>
            <Text style={[type.small, { textAlign: 'center', marginTop: 2, color: colors.muted }]}>
              Point camera at your plate for instant calorie & macro breakdown
            </Text>
          </Pressable>

          {/* Quick Shortcuts */}
          <View style={styles.quickOptions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Choose photo from gallery"
              onPress={() => scan('library')}
              hitSlop={8}
              style={styles.galleryShortcut}
            >
              <Ionicons name="images-outline" size={18} color={colors.primary} />
              <Text style={styles.shortcutText}>Photo Gallery</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Toggle manual meal entry"
              onPress={() => setManual(!manual)}
              hitSlop={8}
              style={[styles.galleryShortcut, manual && styles.galleryShortcutActive]}
            >
              <Ionicons name="search-outline" size={18} color={manual ? colors.lime : colors.text} />
              <Text style={[styles.shortcutText, manual && { color: colors.lime }]}>
                {manual ? 'Close Search' : 'Search / Manual'}
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Manual Entry Drawer */}
      {manual && !pending && (
        <Card style={{ marginTop: 14, borderColor: colors.borderLight }}>
          <Text style={[type.h2, { marginBottom: 8 }]}>Search Food Database</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Type e.g. Oatmeal, Chicken Breast, Eggs..."
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
                <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15 }}>{f.name}</Text>
                <Text style={type.small}>
                  {f.serving} • P:{Math.round(f.protein * portion)}g C:{Math.round(f.carbs * portion)}g F:{Math.round(f.fat * portion)}g
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', marginRight: 10 }}>
                <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 16 }}>
                  {Math.round(f.kcal * portion)} kcal
                </Text>
                <Text style={type.small}>{portion}x</Text>
              </View>
              <Ionicons name="add-circle" size={28} color={colors.primary} />
            </Pressable>
          ))}

          {/* Custom Food Creation Form */}
          <View style={styles.customBox}>
            <Text style={[type.small, { fontWeight: '700', color: colors.text }]}>
              Custom Quick Entry
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
      <SectionTitle>Daily Nutrition Targets</SectionTitle>
      <Card style={styles.nutritionCard}>
        <View style={styles.macroHead}>
          <View>
            <Text style={styles.kcal}>{totals.kcal} <Text style={[type.small, { color: colors.muted }]}>/ {data.profile.calorieGoal} kcal</Text></Text>
            <Text style={[type.small, { color: colors.muted }]}>Total Calories Consumed</Text>
          </View>
          <Tag color={totals.kcal > data.profile.calorieGoal ? colors.amber : colors.lime}>
            {Math.max(0, data.profile.calorieGoal - totals.kcal)} KCAL LEFT
          </Tag>
        </View>
        <Bar
          value={totals.kcal}
          max={data.profile.calorieGoal}
          color={totals.kcal > data.profile.calorieGoal ? colors.amber : colors.primary}
        />

        <View style={styles.macroGrid}>
          {macros.map((m) => (
            <View key={m.l} style={styles.macroStatBox}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>{m.l}</Text>
                <Text style={[type.small, { color: m.c, fontWeight: '800' }]}>
                  {m.v}g
                </Text>
              </View>
              <Bar value={m.v} max={m.g} color={m.c} />
              <Text style={[type.caption, { marginTop: 4 }]}>Target: {m.g}g</Text>
            </View>
          ))}
        </View>
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
                  <Ionicons name="restaurant" size={22} color={colors.primary} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontWeight: '700', color: colors.text, fontSize: 15 }}>{m.name}</Text>
                  <Tag color={m.source === 'scan' ? colors.primary : colors.muted}>
                    {m.source === 'scan' ? 'AI SCAN' : 'MANUAL'}
                  </Tag>
                </View>
                <Text style={[type.small, { marginTop: 2 }]}>
                  {m.type} • <Text style={{ color: colors.primary, fontWeight: '700' }}>{m.kcal} kcal</Text>{m.portion !== 1 ? ` (${m.portion}x)` : ''}
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
                <View style={[styles.macroPill, { borderColor: colors.primary }]}>
                  <Text style={[type.caption, { color: colors.primary }]}>
                    PROTEIN: {m.protein}g
                  </Text>
                </View>
                <View style={[styles.macroPill, { borderColor: colors.amber }]}>
                  <Text style={[type.caption, { color: colors.amber }]}>
                    CARBS: {m.carbs}g
                  </Text>
                </View>
                <View style={[styles.macroPill, { borderColor: colors.rose }]}>
                  <Text style={[type.caption, { color: colors.rose }]}>
                    FATS: {m.fat}g
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
    paddingVertical: 28,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    gap: 4,
  },
  scanRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  scanCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanText: { fontSize: 18, fontWeight: '800', color: colors.text, letterSpacing: -0.2 },
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
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.chip,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  galleryShortcutActive: {
    borderColor: colors.lime,
    backgroundColor: colors.surface2,
  },
  shortcutText: { color: colors.text, fontWeight: '700', fontSize: 13 },
  pendingCard: { marginTop: 14, borderColor: colors.primary },
  pendingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 8 },
  candidateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: radius.button,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  candidateRowOn: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  macroMiniRow: { flexDirection: 'row', gap: 6 },
  macroMiniText: { fontSize: 11, fontWeight: '800' },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  customBox: {
    marginTop: 14,
    padding: 14,
    backgroundColor: colors.surface2,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nutritionCard: {
    borderRadius: radius.card,
    borderColor: colors.borderLight,
  },
  macroHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  macroGrid: {
    marginTop: 16,
    gap: 12,
  },
  macroStatBox: {
    backgroundColor: colors.surface2,
    padding: 10,
    borderRadius: 12,
  },
  kcal: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  photo: { width: '100%', height: 200, borderRadius: 16 },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    paddingVertical: 12,
  },
  thumb: { width: 54, height: 54, borderRadius: 14 },
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
  },
});
