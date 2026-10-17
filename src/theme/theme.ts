// Modern high-performance athletic dark theme inspired by premium fitness references:
// Deep sleek midnight slate, high-voltage electric cyan (#00E5FF), electric lime (#D4FF00),
// vibrant emerald (#10B981), warm amber (#FFB800), and crisp typography.
export const colors = {
  bg: '#080C16',
  surface: '#111625',
  surface2: '#182035',
  surface3: '#202A44',
  border: '#222D47',
  borderLight: '#2C3A5A',
  text: '#FFFFFF',
  textSecondary: '#E2E8F0',
  muted: '#94A3B8',
  primary: '#00E5FF', // Electric Cyan
  primaryDark: '#00B4D8',
  primaryText: '#38BDF8', // High-contrast link / text cyan
  primarySoft: 'rgba(0, 229, 255, 0.12)',
  lime: '#D4FF00', // Electric Volt (Image 2)
  limeSoft: 'rgba(212, 255, 0, 0.14)',
  amber: '#FFB800',
  amberSoft: 'rgba(255, 184, 0, 0.14)',
  rose: '#FF4D6D',
  roseSoft: 'rgba(255, 77, 109, 0.14)',
  green: '#10B981', // Emerald
  greenSoft: 'rgba(16, 185, 129, 0.14)',
  sky: '#38BDF8',
  glow: '#00E5FF',
};

export const radius = {
  sm: 10,
  card: 20,
  button: 16,
  chip: 999,
  pill: 999,
};

export const type = {
  title: { fontSize: 26, fontWeight: '800' as const, color: colors.text, letterSpacing: -0.4 },
  h2: { fontSize: 18, fontWeight: '700' as const, color: colors.text, letterSpacing: -0.2 },
  h3: { fontSize: 15, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 15, color: colors.text, lineHeight: 22 },
  small: { fontSize: 13, color: colors.muted, lineHeight: 18 },
  caption: { fontSize: 11, color: colors.muted, fontWeight: '600' as const },
};
