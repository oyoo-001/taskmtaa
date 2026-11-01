# Testing Guide: Chat and Notifications System

## Server Status ✅
- Backend running on: `http://localhost:5000`
- Frontend running on: `http://localhost:5174`
- Database pool: 3 connections (3 idle, 0 waiting)
- Cloudinary: Configured
- Socket.io: Initialized

## Quick Test Scenarios

### Test 1: Chat Without Prior Messages ✅
**Purpose**: Verify conversation appears even when no messages exist yet

1. Open two browser windows:
   - Window A: Login as User A (task poster)
   - Window B: Login as User B (tasker)

2. In Window A:
   - Create a new task (any category, any location)
   - Note the task ID from the URL

3. In Window B:
   - Browse tasks and find the task created by User A
   - Place a bid on the task
   - Click the "Message" button

4. **Expected Result**:
   - Chat interface opens with conversation selected
   - Shows "No messages yet. Start the conversation!"
   - User B can immediately send a message
   
5. **Old Behavior** (BUG):
   - Showed "No conversations yet" 
   - Had to refresh page after sending first message

### Test 2: New Task Notifications ✅
**Purpose**: Verify users receive notifications when new tasks are posted nearby

1. Open browser as User A (tasker)
2. Allow browser location access when prompted
3. Keep browser window open and visible
4. In another window, login as User B (poster)
5. Create a new task near your location

6. **Expected Result**:
   - User A sees a blue notification toast in top-right corner
   - Title: "New Task Nearby!"
   - Message: "[Task Title] - KSh [Budget]"
   - Click notification → navigates to task detail page
   - Auto-dismisses after 5 seconds

7. **Old Behavior** (BUG):
   - No notification appeared

### Test 3: Bid Notifications ✅
**Purpose**: Verify task posters receive notifications when bids are placed

1. Open browser as User A (poster)
2. Create a new task
3. Keep browser window open
4. In another window, login as User B (tasker)
5. Place a bid on User A's task

6. **Expected Result**:
   - User A sees a purple notification toast in top-right corner
   - Title: "New Bid Received"
   - Message: "[Bidder Name] bid KSh [Amount] on [Task Title]"
   - Click notification → navigates to "Bids Tracking" page
   - Auto-dismisses after 5 seconds

7. **Old Behavior** (BUG):
   - No notification appeared

### Test 4: Message Notifications ✅
**Purpose**: Verify users receive notifications for new messages

1. Open browser as User A
2. Keep messages page open (or any other page)
3. In another window, login as User B
4. Open an existing conversation with User A
5. Send a message

6. **Expected Result**:
   - User A sees a green notification toast in top-right corner
   - Title: "New Message"
   - Message: "[Sender Name]: [Message Preview]"
   - Click notification → navigates to messages page with conversation selected
   - Auto-dismisses after 5 seconds

7. **Old Behavior** (BUG):
   - Message notifications were not working

### Test 5: Real-time Messaging ✅
**Purpose**: Verify messages appear instantly without refresh

1. Open two browser windows with different users
2. Both users open the same conversation
3. User A types and sends a message
4. **Expected**: Message appears instantly in User B's window
5. User B types a message (watch for typing indicator)
6. **Expected**: User A sees "User B is typing..." indicator
7. User B sends message
8. **Expected**: Message appears instantly in User A's window
9. **Expected**: User A sees blue checkmark (sent), then double checkmark (read)

## Browser Console Checks

### Expected Socket.io Logs
```javascript
// When socket connects
✓ Socket connected

// When task is created nearby
✓ New nearby task: {task: {...}}

// When bid is received
✓ New bid received: {bidId: 1, taskId: 2, ...}

// When message is received
✓ New message notification: {taskId: 1, senderId: 2, ...}

// When joining chat room
✓ User 5 joined DM room: 2_5
```

### Check Network Tab
1. Open DevTools → Network → WS (WebSocket)
2. Look for Socket.io connection
3. Should see: `ws://localhost:5000/socket.io/...`
4. Status should be: `101 Switching Protocols` (active)

## Troubleshooting

### No Notifications Appearing
1. Check if Socket.io is connected:
   ```javascript
   // In browser console
   window.socket?.connected  // Should return true
   ```

2. Check if notification listeners are registered:
   ```javascript
   // In React DevTools → Components → SocketProvider
   // Look for notifications array in state
   ```

3. Check server logs for Socket.io connections:
   ```
   ✓ User connected: 5
   ✓ User registered location: -1.286389, 36.817223
   ```

### Chat Not Opening
1. Check URL parameters: `/messages?user=6&task=7`
2. Check browser console for API errors
3. Verify conversations endpoint: `GET /api/v1/chat/conversations`
4. Check if bid exists between the two users on that task

### Messages Not Sending
1. Check Socket.io connection status (top of page should not show warning)
2. Check browser console for Socket.io errors
3. Verify task room was joined: Look for "joined_room" event
4. Check server logs for message insertion errors

## API Endpoints to Verify

### Get Conversations
```bash
curl http://localhost:5000/api/v1/chat/conversations \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: Array of conversations including those with bids but no messages

### Get Messages
```bash
curl http://localhost:5000/api/v1/chat/task/1/messages?other_user_id=2 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: Array of messages for that conversation

### Health Check
```bash
curl http://localhost:5000/api/v1/health
```

Expected:
```json
{
  "success": true,
  "message": "TaskMtaa API is running",
  "database": { "pool": { "total": 3, "idle": 3, "waiting": 0 } }
}
```

## Code Changes Reference

### Backend Files Modified
- `server/controllers/taskController.js` - Added nearby task notification emission
- `server/controllers/bidController.js` - Added bid notification emission
- `server/controllers/chatController.js` - Modified getConversations to include bid-based conversations

### Frontend Files Modified
- `client/src/contexts/SocketContext.jsx` - Added bid notification listener
- `client/src/components/NotificationToast.jsx` - Complete rewrite with navigation
- `client/src/index.css` - Added notification animation

### Key Socket Events
- **Server → Client**: `nearby_task_alert`, `bid_notification`, `message_notification`
- **Client → Server**: `register_location`, `join_task_room`, `send_message`

## Success Criteria ✅

All tests pass when:
- [x] Chat opens immediately when clicking message button (even without prior messages)
- [x] New task notifications appear for nearby users
- [x] Bid notifications appear for task posters
- [x] Message notifications appear for recipients
- [x] Notifications auto-dismiss after 5 seconds
- [x] Clicking notifications navigates to correct page
- [x] Real-time messaging works without refresh
- [x] Typing indicators work
- [x] Read receipts work (single/double checkmark)
- [x] Socket.io connection stays stable
- [x] No console errors during normal operation

## Next Steps

After testing, consider:
1. **Push Notifications**: Implement browser push for offline notifications
2. **Notification History**: Store in database for persistent history
3. **Sound Alerts**: Add audio for incoming notifications
4. **Unread Badges**: Show count on navbar icons
5. **Notification Settings**: Let users customize which notifications they receive
