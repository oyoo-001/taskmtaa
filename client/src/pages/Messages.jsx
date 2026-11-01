import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { formatDistanceToNow } from 'date-fns';
import TextareaAutosize from 'react-textarea-autosize';
import { 
  Send, 
  Search, 
  MoreVertical, 
  ArrowLeft, 
  Check, 
  CheckCheck,
  Smile,
  Paperclip,
  Phone,
  Video,
  Circle
} from 'lucide-react';
import VerifiedBadge from '../components/VerifiedBadge';

export default function Messages() {
  const { user } = useAuth();
  const { socket, isConnected, onlineUsers } = useSocket();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messageContainerRef = useRef(null);

  // Fetch conversations
  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await api.get('/chat/conversations');
      const convs = response.data.data.conversations;
      setConversations(convs);
      
      // Auto-select conversation if user parameter is present
      const targetUserId = searchParams.get('user');
      const taskId = searchParams.get('task');
      
      if (targetUserId && taskId) {
        // Try to find existing conversation
        let targetConv = convs.find(conv => 
          conv.other_user_id === parseInt(targetUserId) &&
          conv.task_id === parseInt(taskId)
        );
        
        // If conversation doesn't exist in list, create a temporary one
        // This happens when bidder placed bid but no messages sent yet
        if (!targetConv) {
          // Fetch user and task details to create conversation object
          try {
            const [userResponse, taskResponse] = await Promise.all([
              api.get(`/users/${targetUserId}`),
              api.get(`/tasks/${taskId}`)
            ]);
            
            const userData = userResponse.data.data.user;
            const taskData = taskResponse.data.data.task;
            
            // Create temporary conversation object
            targetConv = {
              task_id: parseInt(taskId),
              task_title: taskData.title,
              other_user_id: parseInt(targetUserId),
              other_user_name: userData.full_name,
              other_user_avatar: userData.avatar_url,
              other_user_verified: userData.is_verified,
              last_message: 'Start conversation with bidder',
              last_message_at: new Date().toISOString(),
              unread_count: 0
            };
            
            // Add to conversations list
            setConversations([targetConv, ...convs]);
          } catch (userError) {
            console.error('Error fetching details:', userError);
          }
        }
        
        if (targetConv) {
          setSelectedConversation(targetConv);
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for selected conversation
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages();
      
      // Join socket room
      if (socket && isConnected) {
        socket.emit('join_task_room', { taskId: selectedConversation.task_id });
      }

      return () => {
        // Leave socket room on cleanup
        if (socket && isConnected) {
          socket.emit('leave_task_room', { taskId: selectedConversation.task_id });
        }
      };
    }
  }, [selectedConversation, socket, isConnected]);

  const fetchMessages = async () => {
    try {
      const response = await api.get(
        `/chat/task/${selectedConversation.task_id}/messages`,
        {
          params: { other_user_id: selectedConversation.other_user_id }
        }
      );
      setMessages(response.data.data.messages);
      scrollToBottom();
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Socket listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    // New message received
    const handleNewMessage = (message) => {
      if (selectedConversation && message.task_id === selectedConversation.task_id) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      }
      
      // Update conversation list
      fetchConversations();
    };

    // Typing indicators
    const handleUserTyping = ({ taskId, userId }) => {
      if (selectedConversation && taskId === selectedConversation.task_id && userId === selectedConversation.other_user_id) {
        setTypingUsers(prev => new Set(prev).add(userId));
      }
    };

    const handleUserStoppedTyping = ({ taskId, userId }) => {
      if (selectedConversation && taskId === selectedConversation.task_id) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      }
    };

    // Messages read
    const handleMessagesRead = ({ taskId }) => {
      if (selectedConversation && taskId === selectedConversation.task_id) {
        setMessages(prev => prev.map(msg => ({
          ...msg,
          is_read: msg.sender_id === user.id ? true : msg.is_read
        })));
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stopped_typing', handleUserStoppedTyping);
    socket.on('messages_read', handleMessagesRead);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stopped_typing', handleUserStoppedTyping);
      socket.off('messages_read', handleMessagesRead);
    };
  }, [socket, isConnected, selectedConversation, user]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || sending || !selectedConversation) return;

    const messageText = messageInput.trim();
    setMessageInput('');
    setSending(true);

    // Stop typing indicator
    if (socket && isConnected) {
      socket.emit('typing_stop', {
        taskId: selectedConversation.task_id,
        receiverId: selectedConversation.other_user_id
      });
    }

    try {
      // Send via Socket.io for instant delivery
      if (socket && isConnected) {
        socket.emit('send_message', {
          taskId: selectedConversation.task_id,
          receiverId: selectedConversation.other_user_id,
          messageText
        });
      } else {
        // Fallback to HTTP if socket not connected
        await api.post(`/chat/task/${selectedConversation.task_id}/message`, {
          receiver_id: selectedConversation.other_user_id,
          message_text: messageText
        });
        
        // Refresh messages
        fetchMessages();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessageInput(messageText); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (e) => {
    setMessageInput(e.target.value);

    if (!socket || !isConnected || !selectedConversation) return;

    // Emit typing indicator
    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true);
      socket.emit('typing_start', {
        taskId: selectedConversation.task_id,
        receiverId: selectedConversation.other_user_id
      });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing_stop', {
        taskId: selectedConversation.task_id,
        receiverId: selectedConversation.other_user_id
      });
    }, 2000);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const isUserOnline = (userId) => {
    return onlineUsers.includes(userId);
  };

  const filteredConversations = conversations.filter(conv =>
    conv.other_user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.task_title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatMessageTime = (timestamp) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-gray-50">
        {/* Conversations Sidebar */}
        <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} w-full md:w-96 flex-col border-r border-gray-200 bg-white`}>
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold mb-4">Messages</h1>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No conversations yet</p>
                <p className="text-sm mt-2">Start bidding on tasks to chat with posters!</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={`${conv.task_id}-${conv.other_user_id}`}
                  onClick={() => setSelectedConversation(conv)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedConversation?.task_id === conv.task_id && 
                    selectedConversation?.other_user_id === conv.other_user_id
                      ? 'bg-blue-50'
                      : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Avatar with online indicator */}
                    <div className="relative flex-shrink-0">
                      <img
                        src={conv.other_user_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.other_user_name)}&background=random`}
                        alt={conv.other_user_name}
                        className="w-12 h-12 rounded-full"
                      />
                      {isUserOnline(conv.other_user_id) && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 truncate flex items-center gap-1">
                          {conv.other_user_name}
                          <VerifiedBadge verified={conv.other_user_verified} size={14} />
                        </h3>
                        {conv.last_message_at && (
                          <span className="text-xs text-gray-500">
                            {formatMessageTime(conv.last_message_at)}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs text-blue-600 mb-1 truncate">
                        {conv.task_title}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 truncate">
                          {conv.last_message && 
                           (conv.last_message.includes('Start conversation') || 
                            conv.last_message.includes('Message the poster')) ? (
                            <span className="text-gray-400 italic">{conv.last_message}</span>
                          ) : (
                            conv.last_message || 'No messages yet'
                          )}
                        </p>
                        {conv.unread_count > 0 && (
                          <span className="ml-2 bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        {selectedConversation ? (
          <div className="flex-1 flex flex-col bg-white">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="md:hidden text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                
                <div className="relative">
                  <img
                    src={selectedConversation.other_user_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedConversation.other_user_name)}&background=random`}
                    alt={selectedConversation.other_user_name}
                    className="w-10 h-10 rounded-full"
                  />
                  {isUserOnline(selectedConversation.other_user_id) && (
                    <Circle className="absolute bottom-0 right-0 w-3 h-3 fill-green-500 text-green-500" />
                  )}
                </div>

                <div>
                  <h2 className="font-semibold text-gray-900 flex items-center gap-1">
                    {selectedConversation.other_user_name}
                    <VerifiedBadge verified={selectedConversation.other_user_verified} size={15} />
                  </h2>
                  <p className="text-xs text-gray-500">
                    {isUserOnline(selectedConversation.other_user_id) ? (
                      <span className="text-green-600 font-medium">● Online</span>
                    ) : (
                      'Offline'
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                  <Phone className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                  <Video className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Task Info Banner */}
            <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
              <p className="text-sm text-blue-900">
                <span className="font-medium">Task:</span> {selectedConversation.task_title}
              </p>
            </div>

            {/* Messages */}
            <div 
              ref={messageContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
            >
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isOwnMessage = message.sender_id === user.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-end space-x-2 max-w-md ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        {!isOwnMessage && (
                          <img
                            src={message.sender_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender_name)}&background=random`}
                            alt={message.sender_name}
                            className="w-8 h-8 rounded-full flex-shrink-0"
                          />
                        )}
                        
                        <div className={`group relative ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                          <div
                            className={`px-4 py-2 rounded-2xl ${
                              isOwnMessage
                                ? 'bg-blue-500 text-white rounded-br-none'
                                : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {message.message_text}
                            </p>
                          </div>
                          
                          <div className={`flex items-center space-x-1 mt-1 px-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-xs text-gray-500">
                              {formatMessageTime(message.created_at)}
                            </span>
                            {isOwnMessage && (
                              message.is_read ? (
                                <CheckCheck className="w-4 h-4 text-blue-500" />
                              ) : (
                                <Check className="w-4 h-4 text-gray-400" />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              
              {/* Typing indicator */}
              {typingUsers.size > 0 && (
                <div className="flex items-center space-x-2 text-gray-500">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-sm">{selectedConversation.other_user_name} is typing...</span>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
                <button
                  type="button"
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                
                <button
                  type="button"
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                >
                  <Smile className="w-5 h-5" />
                </button>

                <div className="flex-1 relative">
                  <TextareaAutosize
                    value={messageInput}
                    onChange={handleInputChange}
                    onKeyDown={handleInputKeyDown}
                    placeholder="Type a message..."
                    minRows={1}
                    maxRows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!messageInput.trim() || sending}
                  className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
              
              {!isConnected && (
                <p className="text-xs text-amber-600 mt-2 text-center">
                  ⚠️ Connecting to chat server...
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Send className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
              <p>Choose a conversation from the list to start messaging</p>
            </div>
          </div>
        )}
    </div>
  );
}
