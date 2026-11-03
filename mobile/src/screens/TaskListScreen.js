import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Text,
  Chip,
  ActivityIndicator,
  Searchbar,
  FAB,
  Button,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/api';
import theme from '../theme';

const TaskListScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, open, in_progress, completed

  const fetchTasks = useCallback(async () => {
    try {
      const response = await api.get('/tasks', {
        params: {
          search: searchQuery,
          status: filter !== 'all' ? filter : undefined,
        },
      });
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, filter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
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

  const renderTask = ({ item }) => (
    <Card
      style={styles.card}
      onPress={() => navigation.navigate('TaskDetail', { taskId: item.id })}
    >
      <Card.Content>
        <View style={styles.taskHeader}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <Chip
            mode="flat"
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
            textStyle={styles.chipText}
          >
            {item.status}
          </Chip>
        </View>

        <Text style={styles.description} numberOfLines={3}>
          {item.description}
        </Text>

        <View style={styles.taskFooter}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Budget:</Text>
            <Text style={styles.price}>KSh {item.budget?.toLocaleString()}</Text>
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>📍 {item.location}</Text>
            {item.bid_count > 0 && (
              <Text style={styles.infoText}>💼 {item.bid_count} bids</Text>
            )}
          </View>
        </View>

        {item.category && (
          <Chip mode="outlined" style={styles.categoryChip} compact>
            {item.category}
          </Chip>
        )}
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search tasks..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <View style={styles.filterContainer}>
        <Button
          mode={filter === 'all' ? 'contained' : 'outlined'}
          onPress={() => setFilter('all')}
          style={styles.filterButton}
          compact
        >
          All
        </Button>
        <Button
          mode={filter === 'open' ? 'contained' : 'outlined'}
          onPress={() => setFilter('open')}
          style={styles.filterButton}
          compact
        >
          Open
        </Button>
        <Button
          mode={filter === 'in_progress' ? 'contained' : 'outlined'}
          onPress={() => setFilter('in_progress')}
          style={styles.filterButton}
          compact
        >
          In Progress
        </Button>
        <Button
          mode={filter === 'completed' ? 'contained' : 'outlined'}
          onPress={() => setFilter('completed')}
          style={styles.filterButton}
          compact
        >
          Completed
        </Button>
      </View>

      <FlatList
        data={tasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tasks found</Text>
            <Text style={styles.emptySubtext}>
              Try adjusting your filters or create a new task
            </Text>
          </View>
        }
      />

      {user && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => navigation.navigate('CreateTask')}
          color="#fff"
        />
      )}
    </View>
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
  searchbar: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  filterButton: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
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
  description: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginRight: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  infoContainer: {
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  categoryChip: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});

export default TaskListScreen;
