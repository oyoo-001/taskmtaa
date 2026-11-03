import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Image,
  ScrollView,
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

const GigListScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    'all',
    'writing',
    'design',
    'programming',
    'marketing',
    'video',
    'other',
  ];

  const fetchGigs = useCallback(async () => {
    try {
      const response = await api.get('/gigs', {
        params: {
          search: searchQuery,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
        },
      });
      setGigs(response.data);
    } catch (error) {
      console.error('Error fetching gigs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    fetchGigs();
  }, [fetchGigs]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchGigs();
  };

  const renderGig = ({ item }) => (
    <Card
      style={styles.card}
      onPress={() => navigation.navigate('GigDetail', { gigId: item.id })}
    >
      {item.images && item.images.length > 0 && (
        <Card.Cover
          source={{ uri: item.images[0] }}
          style={styles.coverImage}
          resizeMode="cover"
        />
      )}
      <Card.Content style={styles.cardContent}>
        <View style={styles.gigHeader}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
        </View>

        <Text style={styles.description} numberOfLines={3}>
          {item.description}
        </Text>

        <View style={styles.gigFooter}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Starting at</Text>
            <Text style={styles.price}>KSh {item.price?.toLocaleString()}</Text>
          </View>

          <View style={styles.statsContainer}>
            {item.rating > 0 && (
              <View style={styles.rating}>
                <Text style={styles.ratingText}>⭐ {item.rating.toFixed(1)}</Text>
                {item.review_count > 0 && (
                  <Text style={styles.reviewCount}>({item.review_count})</Text>
                )}
              </View>
            )}
            {item.order_count > 0 && (
              <Text style={styles.orderCount}>
                {item.order_count} {item.order_count === 1 ? 'order' : 'orders'}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.sellerInfo}>
          <Text style={styles.sellerName} numberOfLines={1}>
            by {item.seller_name || 'Anonymous'}
          </Text>
          {item.category && (
            <Chip mode="outlined" style={styles.categoryChip} compact>
              {item.category}
            </Chip>
          )}
        </View>
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
        placeholder="Search gigs..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}
      >
        {categories.map((category) => (
          <Chip
            key={category}
            mode={selectedCategory === category ? 'flat' : 'outlined'}
            selected={selectedCategory === category}
            onPress={() => setSelectedCategory(category)}
            style={styles.categoryFilter}
            textStyle={
              selectedCategory === category
                ? styles.categoryTextSelected
                : styles.categoryText
            }
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </Chip>
        ))}
      </ScrollView>

      <FlatList
        data={gigs}
        renderItem={renderGig}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No gigs found</Text>
            <Text style={styles.emptySubtext}>
              Try adjusting your search or filters
            </Text>
          </View>
        }
      />

      {user && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => navigation.navigate('CreateGig')}
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
  categoryScroll: {
    maxHeight: 50,
    marginBottom: 8,
  },
  categoryContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryFilter: {
    marginRight: 8,
  },
  categoryText: {
    color: theme.colors.text,
  },
  categoryTextSelected: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  coverImage: {
    height: 180,
  },
  cardContent: {
    paddingTop: 12,
  },
  gigHeader: {
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  description: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  gigFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'column',
  },
  priceLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statsContainer: {
    alignItems: 'flex-end',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginRight: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  orderCount: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  sellerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sellerName: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  categoryChip: {
    height: 24,
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

export default GigListScreen;
