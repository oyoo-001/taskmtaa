# TaskMtaa Mobile App Setup Guide

## Overview
The TaskMtaa mobile app is built with React Native and Expo, providing a native mobile experience for both iOS and Android devices.

## Prerequisites
- Node.js installed (v16 or higher)
- Expo Go app installed on your mobile device (available on App Store and Google Play)
- Your computer and phone must be on the same WiFi network

## Initial Setup

### 1. Install Dependencies
```bash
cd mobile
npm install
```

This will install all required packages:
- React Native & Expo SDK
- React Navigation (bottom tabs + stack navigation)
- React Native Paper (Material Design UI components)
- Socket.io client (real-time messaging)
- Axios (API requests with token refresh)
- Expo Location & Image Picker

### 2. Configure Environment Variables

Create a `.env` file in the `mobile` folder:

```bash
cd mobile
copy .env.example .env
```

Edit `.env` and add your local IP address:

```env
API_URL=http://YOUR_LOCAL_IP:5000
```

**Finding Your Local IP:**
- **Windows:** Run `ipconfig` and look for "IPv4 Address" (e.g., 192.168.1.100)
- **Mac/Linux:** Run `ifconfig` or `ip addr`

⚠️ **Important:** Use your computer's local IP address (192.168.x.x), NOT `localhost` or `127.0.0.1`, so your phone can connect to your development server.

### 3. Start the Development Server

```bash
npm start
```

This opens the Expo DevTools in your browser.

### 4. Run on Your Device

1. Open the **Expo Go** app on your phone
2. Scan the QR code from:
   - **iOS:** Use the Camera app
   - **Android:** Use the Expo Go app's built-in scanner

The app will download and run on your device!

## Features Implemented

### ✅ Authentication
- Login with email/password
- Registration with phone verification
- Password recovery
- Secure token storage and automatic refresh
- Session management

### ✅ Task Management
- Browse tasks with search and filters
- View task details (description, budget, location, images)
- Place bids on tasks
- View all bids for your tasks
- Real-time task updates

### ✅ Gig Marketplace
- Browse gigs by category
- Search gigs
- View gig details with ratings
- Order gigs
- Track gig orders

### ✅ Real-Time Messaging
- Socket.io integration for instant messaging
- Conversation list with unread counts
- One-on-one chat
- Message read receipts
- Real-time notifications

### ✅ User Profile
- View profile information
- User statistics (tasks, gigs, ratings)
- Account settings
- Logout functionality

## Project Structure

```
mobile/
├── src/
│   ├── config/
│   │   ├── api.js              # Axios configuration with token refresh
│   │   └── socket.js           # Socket.io client setup
│   ├── contexts/
│   │   ├── AuthContext.js      # Authentication state management
│   │   └── SocketContext.js    # Socket connection management
│   ├── navigation/
│   │   ├── AppNavigator.js     # Root navigator (auth vs main)
│   │   ├── AuthNavigator.js    # Authentication screens
│   │   └── MainNavigator.js    # Bottom tabs + stack navigation
│   ├── screens/
│   │   ├── LoginScreen.js
│   │   ├── RegisterScreen.js
│   │   ├── ForgotPasswordScreen.js
│   │   ├── TaskListScreen.js
│   │   ├── TaskDetailScreen.js
│   │   ├── GigListScreen.js
│   │   ├── MessagesScreen.js
│   │   ├── ChatScreen.js
│   │   └── ProfileScreen.js
│   └── theme/
│       └── index.js            # Theme colors matching web app
├── App.js                      # Root component
├── package.json
└── .env                        # Environment configuration
```

## Theme & Design

The mobile app uses the same color scheme as the web app:

- **Primary:** `#3B82F6` (Blue)
- **Success:** `#10B981` (Green)
- **Warning:** `#F59E0B` (Orange)
- **Error:** `#EF4444` (Red)
- **Info:** `#6366F1` (Indigo)

UI components from **React Native Paper** provide Material Design consistency.

## Navigation Structure

```
App
├── Auth Stack (when not logged in)
│   ├── Login
│   ├── Register
│   └── Forgot Password
└── Main Tabs (when logged in)
    ├── Tasks Tab
    │   ├── Task List
    │   └── Task Detail
    ├── Gigs Tab
    │   └── Gig List
    ├── Messages Tab
    │   ├── Conversation List
    │   └── Chat
    └── Profile Tab
        └── Profile
```

## API Integration

### Base Configuration
- All API calls use axios with automatic token refresh
- Tokens stored securely in AsyncStorage
- Automatic retry on 401 errors
- Error handling with user-friendly messages

### Socket.io Integration
- Connects on login, disconnects on logout
- Handles real-time messages
- Auto-reconnection on connection loss
- Room-based messaging

## Development Tips

### Hot Reload
- Press `r` in Expo DevTools to reload
- Shake your device to open developer menu
- Enable "Fast Refresh" for live updates

### Debugging
- Use `console.log()` - visible in Expo DevTools
- React Native Debugger available
- Expo DevTools shows errors and warnings

### Testing on Multiple Devices
- Start Expo and scan QR on each device
- All devices must be on same WiFi
- Changes appear on all connected devices

## Common Issues & Solutions

### Issue: "Network request failed"
- **Solution:** Check your API_URL in `.env`
- Ensure server is running on `http://YOUR_IP:5000`
- Verify phone and computer are on same WiFi

### Issue: "Unable to connect to server"
- **Solution:** Your IP address may have changed
- Run `ipconfig` again and update `.env`
- Restart Expo with `npm start`

### Issue: Socket.io not connecting
- **Solution:** Check server CORS configuration
- Verify socket.io server is running
- Check network firewall settings

### Issue: App crashes on start
- **Solution:** Clear cache and reinstall
```bash
npm start --clear
```

## Building for Production

### Android (APK)
```bash
expo build:android
```

### iOS (IPA - requires Apple Developer account)
```bash
expo build:ios
```

### Using EAS Build (Recommended)
```bash
npm install -g eas-cli
eas build:configure
eas build --platform android
```

## Next Steps

### Features to Implement
1. **Create Task Screen** - Post new tasks
2. **Create Gig Screen** - List new gigs
3. **Bid Management** - View and manage bids
4. **Push Notifications** - Expo Notifications
5. **Image Upload** - Camera and gallery integration
6. **Location Picker** - Map integration for task locations
7. **Payment Integration** - M-Pesa integration
8. **Reviews & Ratings** - Rate users and gigs
9. **Filters & Sorting** - Advanced search options
10. **User Profiles** - View other users' profiles

### Code Improvements
- Error boundary implementation
- Offline mode with local caching
- Analytics integration
- Performance optimization
- Unit and integration tests
- Accessibility improvements

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)
- [Socket.io Client](https://socket.io/docs/v4/client-api/)

## Support

For issues or questions:
1. Check the Expo documentation
2. Review the server API documentation
3. Check network and environment configuration
4. Verify all dependencies are installed

---

**Version:** 1.0.0  
**Last Updated:** November 2026
