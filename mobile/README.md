# TaskMtaa Mobile App

React Native mobile application for TaskMtaa - A hyperlocal micro-task marketplace.

## Features

- **Authentication**: Login, Register, 2FA, Password Reset
- **Task Management**: Browse, Create, Bid on tasks
- **Gig Marketplace**: Create and browse service offerings
- **Real-time Chat**: Socket.io powered messaging
- **Location Services**: GPS-based task discovery
- **Push Notifications**: Real-time updates
- **Profile Management**: User profiles with ratings
- **Image Upload**: Camera and gallery integration

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation
- **UI Library**: React Native Paper
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Real-time**: Socket.io Client
- **Storage**: AsyncStorage
- **Maps**: React Native Maps
- **Location**: Expo Location

## Setup

### Prerequisites

- Node.js 18+ and npm
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your mobile device (for testing)

### Installation

```bash
# Navigate to mobile directory
cd mobile

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update API_URL and SOCKET_URL in .env with your server URLs
```

### Configuration

Update `.env` file with your server URLs:

```env
# For local development (use your computer's local IP)
API_URL=http://192.168.1.100:5000/api/v1
SOCKET_URL=http://192.168.1.100:5000

# For production
API_URL=https://your-api-url.com/api/v1
SOCKET_URL=https://your-api-url.com
```

**Finding your local IP:**
- Windows: Run `ipconfig` and look for IPv4 Address
- Mac/Linux: Run `ifconfig` or `ip addr`
- Use the local network IP (usually 192.168.x.x or 10.0.x.x)

## Development

```bash
# Start Expo development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on web
npm run web
```

### Testing on Physical Device

1. Install **Expo Go** app from App Store (iOS) or Play Store (Android)
2. Run `npm start` in the mobile directory
3. Scan the QR code with Expo Go (Android) or Camera app (iOS)
4. Make sure your phone and computer are on the same WiFi network

### Testing on Emulator

**Android:**
1. Install Android Studio
2. Set up Android emulator
3. Run `npm run android`

**iOS (Mac only):**
1. Install Xcode
2. Run `npm run ios`

## Project Structure

```
mobile/
├── src/
│   ├── components/        # Reusable components
│   │   ├── Button.js
│   │   ├── Input.js
│   │   ├── TaskCard.js
│   │   └── ...
│   ├── screens/          # Screen components
│   │   ├── auth/
│   │   │   ├── LoginScreen.js
│   │   │   ├── RegisterScreen.js
│   │   │   └── ...
│   │   ├── tasks/
│   │   │   ├── TaskListScreen.js
│   │   │   ├── TaskDetailScreen.js
│   │   │   └── CreateTaskScreen.js
│   │   ├── gigs/
│   │   ├── messages/
│   │   └── profile/
│   ├── navigation/       # Navigation configuration
│   │   ├── AppNavigator.js
│   │   ├── AuthNavigator.js
│   │   └── MainNavigator.js
│   ├── contexts/        # React contexts
│   │   ├── AuthContext.js
│   │   └── SocketContext.js
│   ├── config/          # Configuration files
│   │   ├── api.js
│   │   └── socket.js
│   ├── utils/           # Utility functions
│   │   ├── dateUtils.js
│   │   ├── locationUtils.js
│   │   └── ...
│   └── theme/           # Theme configuration
│       └── index.js
├── assets/              # Images, fonts, etc.
├── App.js              # Root component
├── app.json            # Expo configuration
├── package.json
└── README.md
```

## Key Files Created

### Configuration
- `app.json` - Expo app configuration
- `babel.config.js` - Babel configuration
- `package.json` - Dependencies and scripts
- `.env.example` - Environment variables template

### Core Setup
- `App.js` - Root component with providers
- `src/config/api.js` - Axios instance with interceptors
- `src/config/socket.js` - Socket.io client setup
- `src/theme/index.js` - Theme colors and styles

### Contexts
- `src/contexts/AuthContext.js` - Authentication state management
- `src/contexts/SocketContext.js` - Socket.io real-time connections

## Next Steps

1. **Install Dependencies**
   ```bash
   cd mobile && npm install
   ```

2. **Create Screens** (Coming next):
   - Login/Register screens
   - Task list and detail screens
   - Create task screen
   - Profile screen
   - Messages screen
   - Gig screens

3. **Create Components**:
   - TaskCard
   - GigCard
   - Button
   - Input
   - LoadingSpinner
   - etc.

4. **Add Navigation**:
   - Auth stack (Login, Register)
   - Main tab navigation (Tasks, Gigs, Messages, Profile)
   - Stack navigators for each section

5. **Test on Device**:
   - Update .env with your server URLs
   - Run `npm start`
   - Scan QR code with Expo Go

## Troubleshooting

### Cannot connect to server
- Make sure your phone and computer are on the same WiFi
- Use your computer's local IP address, not `localhost`
- Check if server is running and accessible
- Disable firewall temporarily to test

### Expo Go not connecting
- Make sure both devices are on same network
- Try restarting Expo dev server
- Clear Expo Go cache

### Module not found errors
- Run `npm install`
- Clear cache: `npm start -- --clear`

## Building for Production

```bash
# Build for Android
expo build:android

# Build for iOS (requires Mac)
expo build:ios
```

## Environment Variables

Required environment variables in `.env`:

```env
API_URL=your_api_url
SOCKET_URL=your_socket_url
```

## Support

For issues and questions, please contact the development team or create an issue in the repository.
