import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  TextInput,
  IconButton,
  ActivityIndicator,
  Avatar,
} from 'react-native-paper';
import { useRoute } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import api from '../config/api';
import theme from '../theme';

const ChatScreen = () => {
  const route = useRoute();
  const { user } = useAuth();
  const { socket } = useSocket();
  const { userId, userName } = route.params;

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const response = await api.get(`/chat/messages/${userId}`);
      setMessages(response.data.reverse());
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [userId]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      if (
        (newMessage.sender_id === userId &&
          newMessage.receiver_id === user?.id) ||
        (newMessage.sender_id === user?.id &&
          newMessage.receiver_id === userId)
      ) {
        setMessages((prev) => [...prev, newMessage]);
        
        // Mark as read if it's from the other user
        if (newMessage.sender_id === userId) {
          api.put(`/chat/messages/${newMessage.id}/read`).catch(console.error);
        }
      }
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, user, userId]);

  useEffect(() => {
    // Mark messages as read when entering chat
    const markAsRead = async () => {
      try {
        await api.put(`/chat/messages/read/${userId}`);
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    };
    markAsRead();
  }, [userId]);

  const handleSend = async () => {
    if (!message.trim() || sending) return;

    const messageText = message.trim();
    setMessage('');
    setSending(true);

    try {
      const response = await api.post('/chat/send', {
        receiver_id: userId,
        message: messageText,
      });

      // Message will be added via socket event
      // But add optimistically for immediate feedback
      const optimisticMessage = {
        id: Date.now(),
        sender_id: user.id,
        receiver_id: userId,
        message: messageText,
        created_at: new Date().toISOString(),
        is_read: false,
      };
      setMessages((prev) => [...prev, optimisticMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      // Revert on error
      setMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const renderMessage = ({ item, index }) => {
    const isOwnMessage = item.sender_id === user?.id;
    const showDate =
      index === 0 ||
      new Date(item.created_at).toDateString() !==
        new Date(messages[index - 1].created_at).toDateString();

    return (
      <View>
        {showDate && (
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>
              {new Date(item.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year:
                  new Date(item.created_at).getFullYear() !==
                  new Date().getFullYear()
                    ? 'numeric'
                    : undefined,
              })}
            </Text>
          </View>
        )}
        <View
          style={[
            styles.messageContainer,
            isOwnMessage
              ? styles.ownMessageContainer
              : styles.otherMessageContainer,
          ]}
        >
          {!isOwnMessage && (
            <Avatar.Text
              size={32}
              label={userName?.charAt(0) || 'U'}
              style={styles.avatar}
            />
          )}
          <View
            style={[
              styles.messageBubble,
              isOwnMessage ? styles.ownMessage : styles.otherMessage,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
              ]}
            >
              {item.message}
            </Text>
            <View style={styles.messageFooter}>
              <Text
                style={[
                  styles.timeText,
                  isOwnMessage ? styles.ownTimeText : styles.otherTimeText,
                ]}
              >
                {formatTime(item.created_at)}
              </Text>
              {isOwnMessage && (
                <Text style={styles.readStatus}>
                  {item.is_read ? '✓✓' : '✓'}
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>
              Start the conversation by sending a message
            </Text>
          </View>
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Type a message..."
          mode="outlined"
          multiline
          maxLength={1000}
          disabled={sending}
        />
        <IconButton
          icon="send"
          mode="contained"
          size={24}
          onPress={handleSend}
          disabled={!message.trim() || sending}
          style={[
            styles.sendButton,
            (!message.trim() || sending) && styles.sendButtonDisabled,
          ]}
          iconColor="#fff"
        />
      </View>
    </KeyboardAvoidingView>
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
  listContent: {
    padding: 16,
  },
  dateContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    maxWidth: '80%',
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  avatar: {
    backgroundColor: theme.colors.primary,
    marginRight: 8,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '100%',
  },
  ownMessage: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: theme.colors.text,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    justifyContent: 'flex-end',
  },
  timeText: {
    fontSize: 11,
  },
  ownTimeText: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherTimeText: {
    color: theme.colors.textSecondary,
  },
  readStatus: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
    margin: 0,
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.neutral,
    opacity: 0.5,
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

export default ChatScreen;
