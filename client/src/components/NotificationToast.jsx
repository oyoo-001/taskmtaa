import { useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { X, Bell, MessageCircle, Briefcase, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NotificationToast() {
  const { notifications, clearNotification } = useSocket();
  const navigate = useNavigate();

  const handleNotificationClick = (notification) => {
    // Navigate based on notification type
    switch (notification.type) {
      case 'nearby_task':
        navigate(`/task/${notification.data.id}`);
        break;
      case 'message':
        navigate(`/messages?user=${notification.data.senderId}&task=${notification.data.taskId}`);
        break;
      case 'bid':
        navigate(`/buyer/bids-tracking`);
        break;
      default:
        break;
    }
    clearNotification(notification.id);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'nearby_task':
        return <Briefcase className="w-5 h-5" />;
      case 'message':
        return <MessageCircle className="w-5 h-5" />;
      case 'bid':
        return <Bell className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getColor = (type) => {
    switch (type) {
      case 'nearby_task':
        return 'bg-blue-500';
      case 'message':
        return 'bg-green-500';
      case 'bid':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    if (notifications.length === 0) return;

    const timer = setTimeout(() => {
      const oldestNotification = notifications[0];
      if (oldestNotification) {
        clearNotification(oldestNotification.id);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [notifications, clearNotification]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="bg-white shadow-lg rounded-lg p-4 border border-gray-200 animate-slide-in-right cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => handleNotificationClick(notification)}
        >
          <div className="flex items-start space-x-3">
            <div className={`${getColor(notification.type)} text-white p-2 rounded-full flex-shrink-0`}>
              {getIcon(notification.type)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 text-sm">
                {notification.title}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {notification.message}
              </p>
              {notification.timestamp && (
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(notification.timestamp).toLocaleTimeString()}
                </p>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearNotification(notification.id);
              }}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
