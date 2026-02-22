// Brand colors — single source of truth
export const Colors = {
  primary: '#1E40AF',
  primaryDark: '#1E3A8A',
  primaryLight: '#3B82F6',
  accent: '#F59E0B',
  success: '#10B981',
  danger: '#EF4444',
  background: '#0F172A',
  surface: '#1E293B',
  border: '#334155',
  textPrimary: '#F1F5F9',
  textMuted: '#94A3B8',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

// Spacing scale (dp)
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 48,
} as const;

// Radius
export const Radius = {
  card: 12,
  button: 8,
  pill: 999,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
} as const;

// Font sizes
export const FontSize = {
  caption: 12,
  body: 14,
  cardTitle: 16,
  sectionTitle: 18,
  screenTitle: 24,
  hero: 32,
} as const;

// Min touch target
export const MIN_TOUCH_TARGET = 48;

// Supabase
export const SUPABASE_URL = 'https://wwhbdgwfodumognpkgrf.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3aGJkZ3dmb2R1bW9nbnBrZ3JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMzYyOTgsImV4cCI6MjA4NTcxMjI5OH0.Iw5KYmIP_OHalA2tyHAiKSI6xQa-EE5urL_4aEygzg0';

// Session
export const SESSION_EXPIRY_HOURS = 8;
export const GEOFENCE_RADIUS_METERS = 50;
export const INACTIVITY_THRESHOLD_MINUTES = 30;
export const GPS_INTERVAL_SECONDS = 60;
