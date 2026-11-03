import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Chip,
  ActivityIndicator,
  Divider,
  Avatar,
} from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/api';
import theme from '../theme';

const TaskDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { taskId } = route.params;

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingBid, setSubmittingBid] = useState(false);

  const fetchTask = async () => {
    try {
      const response = await api.get(`/tasks/${taskId}`);
      setTask(response.data);
    } catch (error) {
      console.error('Error fetching task:', error);
      Alert.alert('Error', 'Failed to load task details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTask();
  };

  const handlePlaceBid = () => {
    navigation.navigate('PlaceBid', { taskId });
  };

  const handleContact = () => {
    if (!task.buyer_id) return;
    navigation.navigate('Messages', { userId: task.buyer_id });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return theme.colors.success;
      case 'in_progress':
        return theme.colors.warning;
      case 'completed':
        return theme.colors.info;
      case 'cancelled':
        return theme.colors.error;
      default:
        return theme.colors.neutral;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.centerContainer}>
        <Text>Task not found</Text>
      </View>
    );
  }

  const canPlaceBid = user && user.id !== task.buyer_id && task.status === 'open';
  const isOwner = user && user.id === task.buyer_id;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Text style={styles.title}>{task.title}</Text>
            <Chip
              mode="flat"
              style={[styles.statusChip, { backgroundColor: getStatusColor(task.status) }]}
              textStyle={styles.chipText}
            >
              {task.status}
            </Chip>
          </View>

          {task.category && (
            <Chip mode="outlined" style={styles.categoryChip} compact>
              {task.category}
            </Chip>
          )}

          <Divider style={styles.divider} />

          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Budget</Text>
            <Text style={styles.price}>KSh {task.budget?.toLocaleString()}</Text>
          </View>

          <Divider style={styles.divider} />

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{task.description}</Text>

          {task.location && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>📍 Location:</Text>
                <Text style={styles.infoValue}>{task.location}</Text>
              </View>
            </>
          )}

          {task.deadline && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>📅 Deadline:</Text>
              <Text style={styles.infoValue}>{formatDate(task.deadline)}</Text>
            </View>
          )}

          {task.images && task.images.length > 0 && (
            <>
              <Divider style={styles.divider} />
              <Text style={styles.sectionTitle}>Images</Text>
              <View style={styles.imagesContainer}>
                {task.images.map((image, index) => (
                  <Image
                    key={index}
                    source={{ uri: image }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                ))}
              </View>
            </>
          )}

          <Divider style={styles.divider} />

          <View style={styles.buyerContainer}>
            <Avatar.Text
              size={40}
              label={task.buyer_name?.charAt(0) || 'B'}
              style={styles.avatar}
            />
            <View style={styles.buyerInfo}>
              <Text style={styles.buyerName}>{task.buyer_name || 'Anonymous'}</Text>
              <Text style={styles.buyerLabel}>Posted by</Text>
            </View>
          </View>

          {task.bid_count > 0 && (
            <View style={styles.bidCount}>
              <Text style={styles.bidCountText}>
                💼 {task.bid_count} {task.bid_count === 1 ? 'bid' : 'bids'} received
              </Text>
            </View>
          )}
        </Card.Content>

        <Card.Actions style={styles.actions}>
          {canPlaceBid && (
            <Button
              mode="contained"
              onPress={handlePlaceBid}
              style={styles.actionButton}
              loading={submittingBid}
            >
              Place Bid
            </Button>
          )}
          {isOwner && (
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('BidsTracking', { taskId })}
              style={styles.actionButton}
            >
              View Bids
            </Button>
          )}
          {user && user.id !== task.buyer_id && (
            <Button
              mode="outlined"
              onPress={handleContact}
              style={styles.actionButton}
            >
              Contact Buyer
            </Button>
          )}
        </Card.Actions>
      </Card>

      <View style={styles.metaInfo}>
        <Text style={styles.metaText}>
          Posted on {formatDate(task.created_at)}
        </Text>
        <Text style={styles.metaText}>Task ID: #{task.id}</Text>
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
  },
  card: {
    margin: 16,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
    color: theme.colors.text,
  },
  statusChip: {
    height: 28,
  },
  chipText: {
    fontSize: 12,
    color: '#fff',
  },
  categoryChip: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  divider: {
    marginVertical: 16,
  },
  priceContainer: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: theme.colors.text,
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginRight: 8,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 14,
    color: theme.colors.text,
    flex: 1,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  image: {
    width: '48%',
    height: 150,
    borderRadius: 8,
  },
  buyerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: theme.colors.primary,
  },
  buyerInfo: {
    marginLeft: 12,
  },
  buyerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  buyerLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  bidCount: {
    marginTop: 16,
    padding: 12,
    backgroundColor: theme.colors.infoLight,
    borderRadius: 8,
  },
  bidCountText: {
    fontSize: 14,
    color: theme.colors.text,
    textAlign: 'center',
  },
  actions: {
    padding: 16,
    flexDirection: 'column',
    gap: 8,
  },
  actionButton: {
    width: '100%',
  },
  metaInfo: {
    padding: 16,
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
});

export default TaskDetailScreen;
