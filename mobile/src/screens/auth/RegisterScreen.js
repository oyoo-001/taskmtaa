import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { TextInput, Button, Checkbox } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, fontSize } from '../../theme';

export default function RegisterScreen({ navigation }) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    password: '',
    confirmPassword: '',
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const { register } = useAuth();

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleRegister = async () => {
    setError('');

    if (!acceptedTerms) {
      setError('You must accept the Terms & Conditions');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await register(formData);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join TaskMtaa today</Text>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TextInput
          label="Full Name"
          value={formData.full_name}
          onChangeText={(value) => handleChange('full_name', value)}
          mode="outlined"
          style={styles.input}
          disabled={loading}
        />

        <TextInput
          label="Email"
          value={formData.email}
          onChangeText={(value) => handleChange('email', value)}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
          disabled={loading}
        />

        <TextInput
          label="Phone Number"
          value={formData.phone_number}
          onChangeText={(value) => handleChange('phone_number', value)}
          mode="outlined"
          keyboardType="phone-pad"
          style={styles.input}
          disabled={loading}
        />

        <TextInput
          label="Password"
          value={formData.password}
          onChangeText={(value) => handleChange('password', value)}
          mode="outlined"
          secureTextEntry={!showPassword}
          right={
            <TextInput.Icon
              icon={showPassword ? 'eye-off' : 'eye'}
              onPress={() => setShowPassword(!showPassword)}
            />
          }
          style={styles.input}
          disabled={loading}
        />

        <TextInput
          label="Confirm Password"
          value={formData.confirmPassword}
          onChangeText={(value) => handleChange('confirmPassword', value)}
          mode="outlined"
          secureTextEntry={!showPassword}
          style={styles.input}
          disabled={loading}
        />

        <View style={styles.checkboxContainer}>
          <Checkbox
            status={acceptedTerms ? 'checked' : 'unchecked'}
            onPress={() => setAcceptedTerms(!acceptedTerms)}
            color={colors.primary}
          />
          <Text style={styles.checkboxLabel}>
            I accept the Terms & Conditions
          </Text>
        </View>

        <Button
          mode="contained"
          onPress={handleRegister}
          loading={loading}
          disabled={loading}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          Create Account
        </Button>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Button
            mode="text"
            onPress={() => navigation.navigate('Login')}
            compact
          >
            Sign In
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  header: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.gray600,
  },
  input: {
    marginBottom: spacing.md,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  checkboxLabel: {
    fontSize: fontSize.sm,
    color: colors.gray700,
    marginLeft: spacing.xs,
  },
  button: {
    marginTop: spacing.md,
  },
  buttonContent: {
    paddingVertical: spacing.xs,
  },
  errorContainer: {
    backgroundColor: colors.dangerLight,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
  },
  errorText: {
    color: colors.danger,
    fontSize: fontSize.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  footerText: {
    fontSize: fontSize.base,
    color: colors.gray600,
  },
});
