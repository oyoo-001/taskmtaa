import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Avatar,
  List,
  Divider,
  ActivityIndicator,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/api';
import theme from '../theme';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    tasksPosted: 0,
    tasksCompleted: 0,
    gigsCreated: 0,
    gigsCompleted: 0,
    rating: 0,
    totalEarnings: 0,
  });

  const fetchProfile = async () => {
    try {
      const [profileResponse, statsResponse] = await Promise.all([
        api.get('/auth/profile'),
        api.get('/analytics/user-stats'),
      ]);
      
      setProfile(profileResponse.data);
      setStats(statsResponse.data || stats);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!user || !profile) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Unable to load profile</Text>
        <Button mode="contained" onPress={() => navigation.navigate('Login')}>
          Login
        </Button>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Card style={styles.profileCard}>
        <Card.Content style={styles.profileHeader}>
          <Avatar.Text
            size={80}
            label={profile.full_name?.charAt(0) || 'U'}
            style={styles.avatar}
          />
          <Text style={styles.name}>{profile.full_name}</Text>
          <Text style={styles.email}>{profile.email}</Text>
          {profile.phone_number && (
            <Text style={styles.phone}>📱 {profile.phone_number}</Text>
          )}
          {profile.location && (
            <Text style={styles.location}>📍 {profile.location}</Text>
          )}
          {profile.is_verified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓ Verified</Text>
            </View>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.tasksPosted}</Text>
              <Text style={styles.statLabel}>Tasks Posted</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.tasksCompleted}</Text>
              <Text style={styles.statLabel}>Tasks Done</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.gigsCreated}</Text>
              <Text style={styles.statLabel}>Gigs Created</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.gigsCompleted}</Text>
              <Text style={styles.statLabel}>Gigs Done</Text>
            </View>
          </View>

          {stats.rating > 0 && (
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingText}>
                ⭐ {stats.rating.toFixed(1)} Rating
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <List.Section>
          <List.Subheader style={styles.listSubheader}>Account</List.Subheader>
          <List.Item
            title="Edit Profile"
            left={(props) => <List.Icon {...props} icon="account-edit" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Alert.alert('Coming Soon', 'Edit profile feature coming soon')}
          />
          <Divider />
          <List.Item
            title="My Tasks"
            left={(props) => <List.Icon {...props} icon="clipboard-text" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Alert.alert('Coming Soon', 'My tasks feature coming soon')}
          />
          <Divider />
          <List.Item
            title="My Gigs"
            left={(props) => <List.Icon {...props} icon="briefcase" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Alert.alert('Coming Soon', 'My gigs feature coming soon')}
          />
          <Divider />
          <List.Item
            title="My Bids"
            left={(props) => <List.Icon {...props} icon="gavel" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Alert.alert('Coming Soon', 'My bids feature coming soon')}
          />
        </List.Section>
      </Card>

      <Card style={styles.card}>
        <List.Section>
          <List.Subheader style={styles.listSubheader}>Settings</List.Subheader>
          <List.Item
            title="Notifications"
            left={(props) => <List.Icon {...props} icon="bell" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Alert.alert('Coming Soon', 'Notification settings coming soon')}
          />
          <Divider />
          <List.Item
            title="Privacy & Security"
            left={(props) => <List.Icon {...props} icon="shield" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Alert.alert('Coming Soon', 'Privacy settings coming soon')}
          />
          <Divider />
          <List.Item
            title="Help & Support"
            left={(props) => <List.Icon {...props} icon="help-circle" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Alert.alert('Coming Soon', 'Help & support coming soon')}
          />
        </List.Section>
      </Card>

      <Card style={[styles.card, styles.logoutCard]}>
        <Card.Content>
          <Button
            mode="contained"
            onPress={handleLogout}
            style={styles.logoutButton}
            buttonColor={theme.colors.error}
            icon="logout"
          >
            Logout
          </Button>
        </Card.Content>
      </Card>

      <View style={styles.footer}>
        <Text style={styles.footerText}>TaskMtaa v1.0.0</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 16,
  },
  profileCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatar: {
    backgroundColor: theme.colors.primary,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  phone: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  verifiedBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: theme.colors.successLight,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 12,
    color: theme.colors.success,
    fontWeight: '600',
  },
  card: {
    margin: 16,
    marginTop: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: 8,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  ratingContainer: {
    alignItems: 'center',
    marginTop: 8,
    padding: 12,
    backgroundColor: theme.colors.warningLight,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.warning,
  },
  listSubheader: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  logoutCard: {
    marginBottom: 8,
  },
  logoutButton: {
    paddingVertical: 4,
  },
  footer: {
    alignItems: 'center',
    padding: 20,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
});

export default ProfileScreen;
