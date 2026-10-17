import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Visibility } from '../data/types';
import { colors, radius, type } from '../theme/theme';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

/** Ambient cyan athletic glow at the top, inspired by reference image 1 */
function Backdrop() {
  return (
    <View pointerEvents="none" style={styles.backdrop}>
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="glow" cx="20%" cy="0%" rx="90%" ry="90%" fx="20%" fy="0%">
            <Stop offset="0" stopColor={colors.primary} stopOpacity="0.22" />
            <Stop offset="0.6" stopColor={colors.primaryDark} stopOpacity="0.06" />
            <Stop offset="1" stopColor={colors.bg} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#glow)" />
      </Svg>
    </View>
  );
}

/** Standard screen wrapper with ambient glow, safe area, and smooth scrolling */
export function Page({
  title,
  sub,
  back,
  right,
  bare,
  tabbed,
  children,
}: {
  title?: string;
  sub?: string;
  back?: boolean;
  right?: React.ReactNode;
  bare?: boolean;
  tabbed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.screen}>
      <Backdrop />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={{ padding: 20, paddingBottom: tabbed ? 115 : 45 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {back && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
                hitSlop={10}
                style={styles.backPill}
              >
                <Ionicons name="arrow-back" size={18} color={colors.text} />
                <Text style={styles.backText}>Back</Text>
              </Pressable>
            )}
            {!bare && (title || right) && (
              <View style={styles.headRow}>
                <View style={{ flex: 1 }}>
                  {title ? <Text style={type.title}>{title}</Text> : null}
                  {sub ? <Text style={[type.small, { marginTop: 4 }]}>{sub}</Text> : null}
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

/** Sleek athletic card container with soft border and elevation */
export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={type.h2}>{children}</Text>
      {right}
    </View>
  );
}

/** Pill badge tag with tinted background */
export function Tag({
  children,
  color = colors.primary,
  style,
}: {
  children: React.ReactNode;
  color?: string;
  style?: TextStyle;
}) {
  return (
    <View style={[styles.tagPill, { backgroundColor: `${color}1A`, borderColor: `${color}33` }]}>
      <Text style={[{ fontSize: 10, fontWeight: '800', letterSpacing: 0.8, color }, style]}>
        {String(children).toUpperCase()}
      </Text>
    </View>
  );
}

/** Modern action button with electric cyan / volt lime high-impact presets (Image 1 & 2 inspired) */
export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  style,
  disabled,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'volt' | 'ghost' | 'light' | 'danger';
  icon?: IconName;
  style?: ViewStyle;
  disabled?: boolean;
}) {
  const isPrimary = variant === 'primary';
  const isVolt = variant === 'volt';
  const isGhost = variant === 'ghost';
  const isLight = variant === 'light';
  const isDanger = variant === 'danger';

  const bg = isPrimary
    ? colors.primary
    : isVolt
    ? colors.lime
    : isLight
    ? colors.surface2
    : 'transparent';

  const fg = isPrimary || isVolt ? '#080C16' : isDanger ? colors.rose : isGhost ? colors.primaryText : colors.text;

  const border = isGhost
    ? colors.borderLight
    : isDanger
    ? colors.rose
    : isLight
    ? colors.border
    : 'transparent';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: bg,
          borderColor: border,
          borderWidth: border === 'transparent' ? 0 : 1.5,
          opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
        {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
        <Text style={[styles.btnText, { color: fg, fontWeight: isPrimary || isVolt ? '800' : '700' }]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

/** Pill choice chip */
export function Chip({
  label,
  on,
  onPress,
  icon,
}: {
  label: string;
  on: boolean;
  onPress: () => void;
  icon?: IconName;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={[styles.chip, on && styles.chipOn]}
    >
      {icon ? <Ionicons name={icon} size={15} color={on ? '#080C16' : colors.muted} /> : null}
      <Text style={{ color: on ? '#080C16' : colors.muted, fontWeight: on ? '800' : '600', fontSize: 13 }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Segmented tab switch */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.seg}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.value)}
            style={[styles.segItem, on && styles.segOn]}
          >
            <Text style={{ color: on ? '#080C16' : colors.muted, fontWeight: on ? '800' : '600', fontSize: 13 }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Stepper increment / decrement control */
export function Stepper({
  value,
  onChange,
  min,
  max,
  step = 1,
  format,
}: {
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  step?: number;
  format?: (n: number) => string;
}) {
  return (
    <View style={styles.stepper}>
      <Pressable
        accessibilityLabel="Decrease"
        onPress={() => onChange(Math.max(min, value - step))}
        hitSlop={8}
        style={styles.stepBtn}
        disabled={value <= min}
      >
        <Ionicons name="remove" size={18} color={value <= min ? colors.borderLight : colors.text} />
      </Pressable>
      <Text style={styles.stepVal}>{format ? format(value) : String(value)}</Text>
      <Pressable
        accessibilityLabel="Increase"
        onPress={() => onChange(Math.min(max, value + step))}
        hitSlop={8}
        style={styles.stepBtn}
        disabled={value >= max}
      >
        <Ionicons name="add" size={18} color={value >= max ? colors.borderLight : colors.text} />
      </Pressable>
    </View>
  );
}

/** Smooth progress bar */
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
      {on ? <Ionicons name="checkmark" size={15} color="#080C16" /> : null}
    </View>
  );
}

export function Avatar({
  letter,
  size = 40,
  color = colors.primary,
}: {
  letter: string;
  size?: number;
  color?: string;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#080C16', fontWeight: '800', fontSize: size * 0.42 }}>{letter.toUpperCase()}</Text>
    </View>
  );
}

export function Empty({ text }: { text: string }) {
  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="information-circle-outline" size={24} color={colors.muted} />
      <Text style={[type.small, { textAlign: 'center' }]}>{text}</Text>
    </View>
  );
}

export const inputStyle: TextStyle = {
  backgroundColor: colors.surface2,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: radius.button,
  padding: 14,
  fontSize: 15,
  color: colors.text,
};

const VIS: Record<Visibility, { label: string; icon: IconName; bg: string; fg: string }> = {
  private: { label: 'Private', icon: 'lock-closed', bg: 'rgba(148, 163, 184, 0.15)', fg: colors.muted },
  circle: { label: 'Circle Only', icon: 'shield-checkmark', bg: 'rgba(0, 229, 255, 0.12)', fg: colors.primary },
  public: { label: 'Everyone', icon: 'globe', bg: 'rgba(255, 184, 0, 0.15)', fg: colors.amber },
};

/** Visible privacy state tag (Lab 4 fix R1) */
export function PrivacyBadge({ visibility }: { visibility: Visibility }) {
  const v = VIS[visibility] ?? VIS.circle;
  return (
    <View style={[styles.privacyBadge, { backgroundColor: v.bg, borderColor: `${v.fg}40` }]}>
      <Ionicons name={v.icon} size={12} color={v.fg} />
      <Text style={[styles.privacyBadgeText, { color: v.fg }]}>{v.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, height: 420 },
  backPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
    alignSelf: 'flex-start',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backText: { color: colors.text, fontWeight: '700', fontSize: 13 },
  headRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18, gap: 10 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 10,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  btnText: { fontSize: 15, letterSpacing: 0.2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.chip,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  seg: {
    flexDirection: 'row',
    backgroundColor: colors.surface2,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
  },
  segItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: radius.button - 4,
  },
  segOn: {
    backgroundColor: colors.primary,
  },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepVal: {
    minWidth: 50,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  barTrack: { height: 8, backgroundColor: colors.surface3, borderRadius: 6, overflow: 'hidden' },
  check: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface2,
  },
  checkOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tagPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  privacyBadgeText: { fontSize: 11, fontWeight: '700' },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 20,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
});
