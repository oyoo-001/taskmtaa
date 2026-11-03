# TaskMtaa Mobile App - Advanced Features Guide

## 🎉 New Features Implemented

This document covers the advanced features added to the TaskMtaa mobile app.

---

## 1. 📝 Create Task Screen

### Features
- **Task Details Form**
  - Title (max 100 characters)
  - Description (max 1000 characters)
  - Budget input (numeric)
  - Location with GPS auto-detect
  - Optional deadline
  - Category selection

- **GPS Location Picker**
  - One-tap GPS button
  - Automatically detects current location
  - Reverse geocoding to get readable address
  - Manual entry option

- **Image Upload** (up to 5 images)
  - Take photo with camera
  - Choose from photo library
  - Preview with remove option
  - Multi-image selection

### User Flow
1. Tap FAB (+) button on Tasks screen
2. Fill in task details
3. Tap GPS button or enter location manually
4. Select category
5. Add images (optional)
6. Tap "Create Task"
7. Navigate to newly created task detail

### Screen: `CreateTaskScreen.js`
Location: `mobile/src/screens/CreateTaskScreen.js`

---

## 2. 💼 Create Gig Screen

### Features
- **Gig Details Form**
  - Title (max 100 characters)
  - Description (max 2000 characters)
  - Price input
  - Delivery time selection (1-30 days)
  - Category selection

- **Image Upload** (1-5 images, at least 1 required)
  - First image becomes cover image
  - Take photo or choose from library
  - Preview thumbnails with remove option
  - Cover badge on first image

### Delivery Time Options
- 1 Day
- 3 Days
- 5 Days
- 7 Days
- 14 Days
- 30 Days

### Categories
- Writing
- Design
- Programming
- Marketing
- Video
- Music
- Translation
- Other

### User Flow
1. Tap FAB (+) button on Gigs screen
2. Fill in gig details
3. Select delivery time
4. Choose category
5. Add at least 1 image (required)
6. Tap "Create Gig"
7. Navigate to newly created gig detail

### Screen: `CreateGigScreen.js`
Location: `mobile/src/screens/CreateGigScreen.js`

---

## 3. 🎯 Place Bid Screen

### Features
- **Task Summary Display**
  - Task title
  - Budget
  - Location

- **Bid Form**
  - Bid amount (pre-filled with task budget)
  - Estimated completion time (in days)
  - Proposal message (max 500 characters)

- **Helpful Tips**
  - Budget suggestion
  - Character counter
  - Bid summary preview

- **Validation**
  - Amount must be positive
  - Message required
  - Estimated time required

### User Flow
1. Navigate to task detail
2. Tap "Place Bid" button
3. Enter bid amount (adjust from suggested budget)
4. Enter estimated completion time
5. Write compelling proposal
6. Review bid summary
7. Tap "Submit Bid"
8. Return to task detail

### Screen: `PlaceBidScreen.js`
Location: `mobile/src/screens/PlaceBidScreen.js`

---

## 4. 📸 Image Upload System

### Features
- **Camera Integration**
  - Take photos directly in-app
  - Permission handling
  - Quality optimization (0.8)

- **Photo Library Access**
  - Single or multiple selection
  - Permission handling
  - Filter for images only

- **Image Management**
  - Preview thumbnails (100x100)
  - Remove unwanted images
  - Maximum 5 images per upload
  - Responsive grid layout

### Permissions Required
- **iOS:** `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`
- **Android:** `CAMERA`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`

### Implementation
Uses **Expo Image Picker** API:
```javascript
import * as ImagePicker from 'expo-image-picker';

// Camera
const result = await ImagePicker.launchCameraAsync({
  quality: 0.8,
  aspect: [4, 3],
});

// Photo Library
const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsMultipleSelection: true,
  quality: 0.8,
});
```

---

## 5. 📍 Location Picker with GPS

### Features
- **GPS Auto-Detection**
  - One-tap location detection
  - Accurate coordinates
  - Reverse geocoding
  - Readable address format

- **Manual Entry**
  - Text input fallback
  - User can override GPS
  - Edit detected location

- **Permission Handling**
  - Graceful permission requests
  - Clear error messages
  - Manual input option if denied

### Permissions Required
- **iOS:** `NSLocationWhenInUseUsageDescription`
- **Android:** `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`

### Implementation
Uses **Expo Location** API:
```javascript
import * as Location from 'expo-location';

// Get current position
const location = await Location.getCurrentPositionAsync({
  accuracy: Location.Accuracy.Balanced,
});

// Reverse geocode
const [address] = await Location.reverseGeocodeAsync({
  latitude: location.coords.latitude,
  longitude: location.coords.longitude,
});
```

### User Flow
1. Tap GPS button in location field
2. App requests location permission (first time)
3. Loading spinner while detecting
4. Address populated automatically
5. User can edit if needed

---

## 6. 🔔 Push Notifications

### Features
- **Registration**
  - Automatic on login
  - Expo Push Token generation
  - Server registration
  - Platform detection (iOS/Android)

- **Notification Types**
  - New message
  - New bid on task
  - Bid accepted/rejected
  - Task completed
  - Gig order
  - Custom notifications

- **Notification Channels** (Android)
  - Default channel configured
  - Sound enabled
  - Vibration pattern
  - Brand color (#3B82F6)

- **Badge Management**
  - Unread count on app icon
  - Auto-clear on open
  - Manual badge control

### Implementation

**Service:** `mobile/src/services/pushNotifications.js`

Key functions:
- `registerForPushNotificationsAsync()` - Get push token
- `savePushTokenToServer(token)` - Save token to backend
- `removePushTokenFromServer(token)` - Remove on logout
- `addNotificationReceivedListener(callback)` - Handle foreground
- `addNotificationResponseReceivedListener(callback)` - Handle tap
- `scheduleLocalNotification(title, body, data)` - Local notifications

### Integration with AuthContext

```javascript
// On Login
const pushToken = await registerForPushNotificationsAsync();
if (pushToken) {
  await savePushTokenToServer(pushToken);
}

// On Logout
const pushToken = await AsyncStorage.getItem('push_token');
if (pushToken) {
  await removePushTokenFromServer(pushToken);
}
```

### Notification Payload Format
```javascript
{
  title: "New Message",
  body: "John sent you a message",
  data: {
    type: "message",
    userId: 123,
    conversationId: 456
  }
}
```

### Handling Notification Taps

```javascript
// In App.js
responseListener.current = addNotificationResponseReceivedListener((response) => {
  const data = response.notification.request.content.data;
  
  if (data.type === 'message') {
    // Navigate to chat screen
    navigation.navigate('Chat', { 
      userId: data.userId,
      userName: data.userName 
    });
  } else if (data.type === 'bid') {
    // Navigate to bids tracking
    navigation.navigate('BidsTracking', { 
      taskId: data.taskId 
    });
  }
});
```

### Permissions

**iOS:** Automatic permission request on first call
**Android:** Notification channel setup required

### Testing Push Notifications

1. **Development Mode:**
   - Use Expo's push notification tool
   - Visit: https://expo.dev/notifications
   - Enter your Expo push token
   - Send test notification

2. **Production Mode:**
   - Backend sends notifications via Expo Push API
   - Token stored in database
   - Automatic sending on events

---

## 📦 Dependencies Added

```json
{
  "expo-location": "~17.0.1",
  "expo-image-picker": "~15.0.7",
  "expo-notifications": "~0.28.9",
  "expo-device": "~6.0.2"
}
```

---

## 🔧 Configuration Files Updated

### app.json
```json
{
  "plugins": [
    "expo-location",
    [
      "expo-image-picker",
      {
        "photosPermission": "TaskMtaa needs access to your photos.",
        "cameraPermission": "TaskMtaa needs access to your camera."
      }
    ],
    [
      "expo-notifications",
      {
        "icon": "./assets/icon.png",
        "color": "#3B82F6"
      }
    ]
  ],
  "ios": {
    "infoPlist": {
      "NSLocationWhenInUseUsageDescription": "TaskMtaa needs your location to find nearby tasks.",
      "NSCameraUsageDescription": "TaskMtaa needs camera access for task images.",
      "NSPhotoLibraryUsageDescription": "TaskMtaa needs photo access for uploads."
    }
  },
  "android": {
    "permissions": [
      "ACCESS_FINE_LOCATION",
      "ACCESS_COARSE_LOCATION",
      "CAMERA",
      "READ_EXTERNAL_STORAGE",
      "WRITE_EXTERNAL_STORAGE"
    ]
  }
}
```

---

## 🚀 Updated Navigation

### Main Navigator
```javascript
// Tasks Stack
- TasksList
- TaskDetail
- CreateTask (NEW)
- PlaceBid (NEW)

// Gigs Stack
- GigsList
- CreateGig (NEW)

// Messages Stack
- MessagesList
- Chat

// Profile Stack
- ProfileMain
```

---

## 💡 Usage Tips

### For Task Creation
1. **Be Specific:** Write clear, detailed descriptions
2. **Fair Budget:** Set realistic budgets to attract quality bids
3. **Location Accuracy:** Use GPS for exact location
4. **Add Images:** Visual references increase bid quality
5. **Set Deadlines:** Help taskers plan their schedule

### For Gig Creation
1. **Portfolio Quality:** First image is your cover - make it count
2. **Detailed Description:** Explain exactly what you deliver
3. **Realistic Delivery Time:** Don't over-promise
4. **Competitive Pricing:** Research similar gigs
5. **Multiple Images:** Showcase different aspects

### For Bidding
1. **Competitive Pricing:** Don't undervalue yourself
2. **Professional Proposal:** Explain your qualifications
3. **Realistic Timeline:** Account for unexpected delays
4. **Review Task Details:** Ensure you understand requirements
5. **Prompt Response:** Early bids get noticed

---

## 🐛 Troubleshooting

### Camera/Photos Not Working
- Check app permissions in device settings
- Reinstall app if permissions were denied
- Use physical device (camera doesn't work in simulator)

### Location Not Detecting
- Enable location services on device
- Check app permissions
- Ensure GPS/Wi-Fi is enabled
- Try manual entry if GPS fails

### Push Notifications Not Received
- Check notification permissions
- Verify device is not in Do Not Disturb mode
- Physical device required (push doesn't work in simulator)
- Check server logs for sending errors

### Images Not Uploading
- Check internet connection
- Verify image size (large images may timeout)
- Ensure server accepts multipart/form-data
- Check server file upload limits

---

## 🔒 Security & Privacy

### Location Data
- Only collected when user taps GPS button
- Never stored without user consent
- Used only for task/gig location
- Can be manually overridden

### Camera/Photos
- Permissions requested on first use
- Images processed locally before upload
- User controls which images to share
- Can be removed before submission

### Push Tokens
- Stored securely on server
- Removed on logout
- Used only for TaskMtaa notifications
- Never shared with third parties

---

## 📊 Performance Optimizations

### Image Handling
- Quality reduced to 0.8 (80%)
- Maximum 5 images per upload
- Thumbnails for preview
- Progressive upload

### Location Services
- Balanced accuracy (saves battery)
- Single request (not continuous)
- Timeout after 10 seconds
- Fallback to manual entry

### Push Notifications
- Lightweight token storage
- Efficient event handling
- Background handling
- Battery-friendly

---

## 🎯 Next Steps

### Potential Enhancements
1. **Map View:** Interactive map for location selection
2. **Image Cropping:** Built-in image editor
3. **Draft Saving:** Save incomplete tasks/gigs
4. **Templates:** Quick create with saved templates
5. **Bid History:** View past bids and success rate
6. **Smart Suggestions:** AI-powered bid amount suggestions
7. **Rich Notifications:** Images and actions in notifications
8. **Scheduled Notifications:** Reminder for bid deadlines

---

## 📝 API Endpoints Used

### Tasks
- `POST /tasks` - Create new task
- `GET /tasks/:id` - Get task details

### Gigs
- `POST /gigs` - Create new gig
- `GET /gigs/:id` - Get gig details

### Bids
- `POST /bids` - Place bid on task
- `GET /bids/task/:taskId` - Get all bids for task

### Push Notifications
- `POST /push/register` - Register push token
- `POST /push/unregister` - Remove push token

### File Uploads
All use `multipart/form-data` content type:
```javascript
const formData = new FormData();
formData.append('title', 'My Task');
formData.append('images', {
  uri: imageUri,
  type: 'image/jpeg',
  name: 'image.jpg',
});
```

---

## 🎨 UI/UX Highlights

### Consistent Design
- Material Design via React Native Paper
- Brand colors throughout
- Responsive layouts
- Loading states
- Error handling

### User Feedback
- Loading spinners
- Success/error alerts
- Character counters
- Field validation
- Helpful hints

### Accessibility
- Clear labels
- Sufficient contrast
- Touch-friendly buttons
- Readable fonts
- Logical tab order

---

**Version:** 1.0.0  
**Last Updated:** November 2026  
**Status:** ✅ All Features Implemented
