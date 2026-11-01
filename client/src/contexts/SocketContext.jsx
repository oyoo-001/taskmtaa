import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext({});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
        setOnlineUsers([]);
      }
      return;
    }

    // Initialize socket connection
    const token = localStorage.getItem('access_token');
    
    // Use environment variable or fallback to localhost
    // For mobile testing, set VITE_API_URL in .env.local to http://YOUR_IP:5000
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
    const newSocket = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);
      
      // Request online users list
      newSocket.emit('get_online_users');
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    // Online users tracking
    newSocket.on('online_users', ({ userIds }) => {
      setOnlineUsers(userIds);
    });

    newSocket.on('user_online', ({ userId }) => {
      setOnlineUsers(prev => [...new Set([...prev, userId])]);
    });

    newSocket.on('user_offline', ({ userId }) => {
      setOnlineUsers(prev => prev.filter(id => id !== userId));
    });

    // Handle nearby task alerts
    newSocket.on('nearby_task_alert', (data) => {
      console.log('New nearby task:', data);
      setNotifications((prev) => [...prev, {
        id: Date.now(),
        type: 'nearby_task',
        title: 'New Task Nearby!',
        message: `${data.task.title} - KSh ${data.task.budget}`,
        data: data.task,
        timestamp: new Date()
      }]);
    });

    // Handle bid notifications
    newSocket.on('bid_notification', (data) => {
      console.log('New bid received:', data);
      setNotifications((prev) => [...prev, {
        id: Date.now(),
        type: 'bid',
        title: 'New Bid Received',
        message: `${data.bidderName} bid KSh ${data.bidAmount} on ${data.taskTitle}`,
        data,
        timestamp: new Date()
      }]);
    });

    // Handle message notifications
    newSocket.on('message_notification', (data) => {
      console.log('New message notification:', data);
      setNotifications((prev) => [...prev, {
        id: Date.now(),
        type: 'message',
        title: 'New Message',
        message: `${data.senderName}: ${data.messagePreview}`,
        data,
        timestamp: new Date()
      }]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const joinTaskRoom = (taskId) => {
    if (socket) {
      socket.emit('join_task_room', { taskId });
    }
  };

  const leaveTaskRoom = (taskId) => {
    if (socket) {
      socket.emit('leave_task_room', { taskId });
    }
  };

  const sendMessage = (taskId, receiverId, messageText) => {
    if (socket) {
      socket.emit('send_message', { taskId, receiverId, messageText });
    }
  };

  const registerLocation = (latitude, longitude, radius = 10000) => {
    if (socket) {
      socket.emit('register_location', { latitude, longitude, radius });
    }
  };

  const clearNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const value = {
    socket,
    connected,
    isConnected: connected,
    onlineUsers,
    notifications,
    joinTaskRoom,
    leaveTaskRoom,
    sendMessage,
    registerLocation,
    clearNotification,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
