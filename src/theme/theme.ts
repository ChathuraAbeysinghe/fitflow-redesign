// Dark theme taken from the Figma screens: near-black navy, indigo primary,
// amber / rose / green as supporting accents, and a soft purple glow at the top of each screen.
export const colors = {
  bg: '#06080F',
  surface: '#0F121C',
  surface2: '#171B2A',
  border: '#1F2438',
  text: '#FFFFFF',
  muted: '#8B91A7',
  primary: '#6366F1',
  primaryText: '#8B8DF8', // lighter indigo for text and links (readable on dark)
  primarySoft: 'rgba(99,102,241,0.18)',
  amber: '#F59E0B',
  rose: '#F43F5E',
  green: '#10B981',
  sky: '#38BDF8',
  glow: '#6D4AFF',
};

export const radius = { card: 20, button: 14, chip: 999 };

export const type = {
  title: { fontSize: 26, fontWeight: '800' as const, color: colors.text, letterSpacing: -0.3 },
  h2: { fontSize: 17, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 15, color: colors.text },
  small: { fontSize: 13, color: colors.muted },
};
