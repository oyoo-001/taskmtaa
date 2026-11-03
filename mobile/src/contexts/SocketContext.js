import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeSocket, getSocket, disconnectSocket } from '../config/socket';
import { useAuth } from './AuthContext';

const SocketContext = createContext({});

export const SocketProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      initSocket();
    } else {
      cleanup();
    }

    return () => cleanup();
  }, [isAuthenticated, user]);

  const initSocket = async () => {
    try {
      const socketInstance = await initializeSocket();
      setSocket(socketInstance);

      socketInstance.on('connect', () => {
        console.log('Socket connected');
        setConnected(true);
      });

      socketInstance.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnected(false);
      });

      // Join user's personal room
      if (user?.id) {
        socketInstance.emit('join_user_room', user.id);
      }
    } catch (error) {
      console.error('Socket initialization error:', error);
    }
  };

  const cleanup = () => {
    disconnectSocket();
    setSocket(null);
    setConnected(false);
  };

  const joinTaskRoom = (taskId) => {
    const socketInstance = getSocket();
    if (socketInstance && taskId) {
      socketInstance.emit('join_task_room', taskId);
    }
  };

  const leaveTaskRoom = (taskId) => {
    const socketInstance = getSocket();
    if (socketInstance && taskId) {
      socketInstance.emit('leave_task_room', taskId);
    }
  };

  const sendMessage = (data) => {
    const socketInstance = getSocket();
    if (socketInstance) {
      socketInstance.emit('send_message', data);
    }
  };

  const onNewMessage = (callback) => {
    const socketInstance = getSocket();
    if (socketInstance) {
      socketInstance.on('new_message', callback);
      return () => socketInstance.off('new_message', callback);
    }
  };

  const onBidNotification = (callback) => {
    const socketInstance = getSocket();
    if (socketInstance) {
      socketInstance.on('bid_notification', callback);
      return () => socketInstance.off('bid_notification', callback);
    }
  };

  const value = {
    socket,
    connected,
    joinTaskRoom,
    leaveTaskRoom,
    sendMessage,
    onNewMessage,
    onBidNotification,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};
