import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Avatar,
  Badge,
  ActivityIndicator,
  Searchbar,
  Card,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import api from '../config/api';
import theme from '../theme';

const MessagesScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchConversations = async () => {
    try {
      const response = await api.get('/chat/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      // Update conversation list with new message
      setConversations((prev) => {
        const updated = prev.map((conv) => {
          if (
            (conv.user1_id === message.sender_id &&
              conv.user2_id === message.receiver_id) ||
            (conv.user1_id === message.receiver_id &&
              conv.user2_id === message.sender_id)
          ) {
            return {
              ...conv,
              last_message: message.message,
              last_message_time: message.created_at,
              unread_count:
                message.sender_id !== user?.id
                  ? (conv.unread_count || 0) + 1
                  : conv.unread_count,
            };
          }
          return conv;
        });

        // Sort by most recent
        return updated.sort(
          (a, b) =>
            new Date(b.last_message_time) - new Date(a.last_message_time)
        );
      });
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.other_user_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderConversation = ({ item }) => {
    const hasUnread = item.unread_count > 0;

    return (
      <TouchableOpacity
        onPress={() =>
          navigation.navigate('Chat', {
            userId: item.other_user_id,
            userName: item.other_user_name,
          })
        }
      >
        <Card style={[styles.card, hasUnread && styles.cardUnread]}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.avatarContainer}>
              <Avatar.Text
                size={50}
                label={item.other_user_name?.charAt(0) || 'U'}
                style={styles.avatar}
              />
              {hasUnread && (
                <Badge style={styles.badge} size={20}>
                  {item.unread_count}
                </Badge>
              )}
            </View>

            <View style={styles.messageContent}>
              <View style={styles.header}>
                <Text
                  style={[styles.name, hasUnread && styles.nameUnread]}
                  numberOfLines={1}
                >
                  {item.other_user_name || 'Unknown User'}
                </Text>
                <Text style={styles.time}>
                  {formatTime(item.last_message_time)}
                </Text>
              </View>

              <Text
                style={[styles.lastMessage, hasUnread && styles.lastMessageUnread]}
                numberOfLines={2}
              >
                {item.last_message || 'No messages yet'}
              </Text>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

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
        placeholder="Search conversations..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <FlatList
        data={filteredConversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.conversation_id?.toString() || item.other_user_id?.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No conversations yet</Text>
            <Text style={styles.emptySubtext}>
              Start browsing tasks and gigs to connect with others
            </Text>
          </View>
        }
      />
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
  listContent: {
    padding: 16,
  },
  card: {
    marginBottom: 8,
    elevation: 1,
  },
  cardUnread: {
    backgroundColor: theme.colors.primaryLight,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    backgroundColor: theme.colors.primary,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: theme.colors.error,
  },
  messageContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    color: theme.colors.text,
    flex: 1,
    marginRight: 8,
  },
  nameUnread: {
    fontWeight: 'bold',
  },
  time: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  lastMessage: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  lastMessageUnread: {
    fontWeight: '600',
    color: theme.colors.text,
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
    paddingHorizontal: 32,
  },
});

export default MessagesScreen;
