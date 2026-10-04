import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Visibility } from '../data/types';
import { colors, radius, type } from '../theme/theme';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

/** Soft purple glow at the top-left of every screen, as in the Figma design. */
function Backdrop() {
  return (
    <View pointerEvents="none" style={styles.backdrop}>
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="glow" cx="15%" cy="0%" rx="80%" ry="85%" fx="15%" fy="0%">
            <Stop offset="0" stopColor={colors.glow} stopOpacity="0.4" />
            <Stop offset="1" stopColor={colors.glow} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#glow)" />
      </Svg>
    </View>
  );
}

/** Standard screen: glow background, safe area, scroll, optional back button and title block. */
export function Page({
  title, sub, back, right, bare, tabbed, children,
}: { title?: string; sub?: string; back?: boolean; right?: React.ReactNode; bare?: boolean; tabbed?: boolean; children: React.ReactNode }) {
  return (
    <View style={styles.screen}>
      <Backdrop />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: tabbed ? 120 : 40 }} keyboardShouldPersistTaps="handled">
            {back && (
              <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} hitSlop={10} style={styles.back}>
                <Ionicons name="chevron-back" size={22} color={colors.primaryText} />
                <Text style={{ color: colors.primaryText, fontWeight: '700' }}>Back</Text>
              </Pressable>
            )}
            {!bare && (title || right) && (
              <View style={styles.headRow}>
                <View style={{ flex: 1 }}>
                  {title ? <Text style={type.title}>{title}</Text> : null}
                  {sub ? <Text style={[type.small, { marginTop: 2 }]}>{sub}</Text> : null}
                </View>
                {right}
              </View>
            )}
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={[type.h2, { marginTop: 10, marginBottom: 10 }]}>{children}</Text>;
}

/** Small uppercase label, e.g. "CURRENT SESSION". */
export function Tag({ children, color = colors.primaryText, style }: { children: React.ReactNode; color?: string; style?: TextStyle }) {
  return <Text style={[{ fontSize: 11, fontWeight: '800', letterSpacing: 0.8, color }, style]}>{String(children).toUpperCase()}</Text>;
}

export function Button({
  label, onPress, variant = 'primary', style, disabled,
}: { label: string; onPress: () => void; variant?: 'primary' | 'ghost' | 'light' | 'danger'; style?: ViewStyle; disabled?: boolean }) {
  const bg = variant === 'primary' ? colors.primary : variant === 'light' ? colors.surface2 : 'transparent';
  const fg = variant === 'primary' || variant === 'light' ? '#fff' : variant === 'danger' ? colors.rose : colors.primaryText;
  const border = variant === 'ghost' ? colors.primary : variant === 'danger' ? colors.rose : 'transparent';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, borderColor: border, borderWidth: border === 'transparent' ? 0 : 1.5, opacity: disabled ? 0.4 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      <Text style={[styles.btnText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function Chip({ label, on, onPress, icon }: { label: string; on: boolean; onPress: () => void; icon?: IconName }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: on }} onPress={onPress} style={[styles.chip, on && styles.chipOn]}>
      {icon ? <Ionicons name={icon} size={15} color="#fff" /> : null}
      <Text style={{ color: on ? '#fff' : colors.muted, fontWeight: '600', fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}

export function Segmented<T extends string>({
  options, value, onChange,
}: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={styles.seg}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable key={o.value} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => onChange(o.value)} style={[styles.segItem, on && styles.segOn]}>
            <Text style={{ color: on ? '#fff' : colors.muted, fontWeight: '700', fontSize: 13 }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Stepper({
  value, onChange, min, max, step = 1, format,
}: { value: number; onChange: (n: number) => void; min: number; max: number; step?: number; format?: (n: number) => string }) {
  return (
    <View style={styles.stepper}>
      <Pressable accessibilityLabel="Decrease" onPress={() => onChange(Math.max(min, value - step))} hitSlop={8} style={styles.stepBtn} disabled={value <= min}>
        <Ionicons name="remove" size={20} color={value <= min ? colors.border : '#fff'} />
      </Pressable>
      <Text style={styles.stepVal}>{format ? format(value) : String(value)}</Text>
      <Pressable accessibilityLabel="Increase" onPress={() => onChange(Math.min(max, value + step))} hitSlop={8} style={styles.stepBtn} disabled={value >= max}>
        <Ionicons name="add" size={20} color={value >= max ? colors.border : '#fff'} />
      </Pressable>
    </View>
  );
}

export function Bar({ value, max, color = colors.primary }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <View style={styles.barTrack}>
      <View style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: 6 }} />
    </View>
  );
}

export function Check({ on }: { on: boolean }) {
  return (
    <View style={[styles.check, on && styles.checkOn]}>
      {on ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
    </View>
  );
}

export function Avatar({ letter, size = 40, color = colors.primary }: { letter: string; size?: number; color?: string }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.4 }}>{letter.toUpperCase()}</Text>
    </View>
  );
}

export function Empty({ text }: { text: string }) {
  return <Text style={[type.small, { paddingVertical: 8 }]}>{text}</Text>;
}

export const inputStyle: TextStyle = {
  backgroundColor: colors.surface2,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 12,
  padding: 12,
  fontSize: 15,
  color: colors.text,
};

const VIS: Record<Visibility, { label: string; icon: IconName; bg: string }> = {
  private: { label: 'Only me', icon: 'lock-closed', bg: '#3A4056' },
  circle: { label: 'Circle only', icon: 'lock-closed', bg: colors.primary },
  public: { label: 'Visible to everyone', icon: 'lock-open', bg: '#B45309' },
};

// Lab 4 fix R1: the privacy state is visible wherever activity can be shared.
export function PrivacyBadge({ visibility }: { visibility: Visibility }) {
  const v = VIS[visibility];
  return (
    <View style={[styles.badge, { backgroundColor: v.bg }]}>
      <Ionicons name={v.icon} size={13} color="#fff" />
      <Text style={styles.badgeText}>{v.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, height: 380 },
  back: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginLeft: -4 },
  headRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, gap: 10 },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  btn: { paddingVertical: 13, paddingHorizontal: 18, borderRadius: radius.button, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  btnText: { fontSize: 15, fontWeight: '700' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 9, paddingHorizontal: 14, borderRadius: radius.chip, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  seg: { flexDirection: 'row', backgroundColor: colors.surface2, borderRadius: radius.button, borderWidth: 1, borderColor: colors.border, padding: 3 },
  segItem: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: radius.button - 3 },
  segOn: { backgroundColor: colors.primary },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stepBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  stepVal: { minWidth: 56, textAlign: 'center', fontSize: 16, fontWeight: '700', color: colors.text },
  barTrack: { height: 8, backgroundColor: colors.border, borderRadius: 6, overflow: 'hidden' },
  check: { width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, borderColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 5, paddingHorizontal: 10, borderRadius: radius.chip, alignSelf: 'flex-start' },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
