import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, fontSize } from '../../theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.text}>Welcome, {user?.full_name}!</Text>
      <Text style={styles.email}>{user?.email}</Text>
      
      <Button
        mode="contained"
        onPress={logout}
        style={styles.logoutButton}
        contentStyle={styles.buttonContent}
      >
        Logout
      </Button>
      
      <Text style={styles.comingSoon}>Full Profile Coming Soon!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.gray900,
    marginBottom: spacing.sm,
  },
  text: {
    fontSize: fontSize.base,
    color: colors.gray600,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  email: {
    fontSize: fontSize.sm,
    color: colors.gray500,
    marginBottom: spacing.xl,
  },
  logoutButton: {
    marginTop: spacing.lg,
    minWidth: 200,
  },
  buttonContent: {
    paddingVertical: spacing.xs,
  },
  comingSoon: {
    marginTop: spacing.xl,
    fontSize: fontSize.lg,
    color: colors.primary,
    fontWeight: '600',
  },
});
