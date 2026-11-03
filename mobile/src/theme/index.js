import { MD3LightTheme as DefaultTheme } from 'react-native-paper';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#3B82F6', // Blue-600
    primaryContainer: '#DBEAFE', // Blue-100
    secondary: '#10B981', // Green-500
    secondaryContainer: '#D1FAE5', // Green-100
    error: '#EF4444', // Red-500
    errorContainer: '#FEE2E2', // Red-100
    background: '#F9FAFB', // Gray-50
    surface: '#FFFFFF',
    surfaceVariant: '#F3F4F6', // Gray-100
    onSurface: '#111827', // Gray-900
    onSurfaceVariant: '#6B7280', // Gray-500
    outline: '#D1D5DB', // Gray-300
  },
  roundness: 8,
};

export const colors = {
  primary: '#3B82F6',
  primaryLight: '#DBEAFE',
  primaryDark: '#1E40AF',
  secondary: '#10B981',
  secondaryLight: '#D1FAE5',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  success: '#10B981',
  successLight: '#D1FAE5',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  white: '#FFFFFF',
  black: '#000000',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 30,
};

export default theme;
