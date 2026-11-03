# TaskMtaa Mobile - Quick Start Guide

## 🚀 Setup in 5 Minutes

### Step 1: Install Dependencies
```bash
cd mobile
npm install
```

### Step 2: Find Your Local IP
**Windows:**
```bash
.\get-local-ip.ps1
```

**Manual (if script doesn't work):**
```bash
ipconfig
```
Look for "IPv4 Address" (example: 192.168.1.100)

### Step 3: Configure Environment
```bash
copy .env.example .env
```

Edit `.env`:
```env
API_URL=http://YOUR_IP_HERE:5000
```
Replace `YOUR_IP_HERE` with your actual local IP (e.g., `192.168.1.100`)

### Step 4: Start the Server (Backend)
Open a new terminal:
```bash
cd ..
npm start
```
Server should run on `http://YOUR_IP:5000`

### Step 5: Start Mobile App
```bash
cd mobile
npm start
```

### Step 6: Run on Your Phone
1. Install **Expo Go** from:
   - iOS: App Store
   - Android: Google Play Store

2. Scan QR code:
   - iOS: Use Camera app
   - Android: Use Expo Go scanner

3. Wait for app to load

## ✅ Verify Everything Works

### Test Authentication
- [ ] Register new account
- [ ] Login
- [ ] Logout

### Test Tasks
- [ ] Browse tasks
- [ ] View task details
- [ ] Create new task with images
- [ ] Place bid on a task

### Test Gigs
- [ ] Browse gigs
- [ ] View gig details
- [ ] Create new gig with images

### Test Messaging
- [ ] View conversations
- [ ] Send message
- [ ] Receive message (real-time)

### Test Location
- [ ] Tap GPS button on Create Task
- [ ] Grant location permission
- [ ] See location auto-filled

### Test Images
- [ ] Take photo with camera
- [ ] Select from photo library
- [ ] Upload multiple images

## 🐛 Common Issues

### "Network request failed"
**Solution:**
1. Check `.env` API_URL is correct
2. Verify server is running
3. Ensure phone and computer on same WiFi
4. Try pinging your IP from phone's browser: `http://YOUR_IP:5000`

### "Unable to resolve module"
**Solution:**
```bash
rm -rf node_modules
npm install
npm start --clear
```

### Camera/Location not working
**Solution:**
1. Use physical device (doesn't work in simulator)
2. Grant permissions when prompted
3. Check device settings if permission denied

### Push notifications not working
**Solution:**
1. Use physical device
2. Check notification settings
3. Verify backend is sending correctly

## 📱 Features Available

### ✅ Implemented
- [x] User Authentication (Login/Register/Logout)
- [x] Browse Tasks with Search & Filters
- [x] View Task Details
- [x] Create Task with GPS & Images
- [x] Place Bid on Tasks
- [x] Browse Gigs with Categories
- [x] Create Gig with Images
- [x] Real-time Messaging
- [x] User Profile
- [x] Push Notifications
- [x] Image Upload (Camera/Library)
- [x] GPS Location Picker

### 🚧 Coming Soon
- [ ] Payment Integration (M-Pesa)
- [ ] Rating & Reviews
- [ ] Advanced Map View
- [ ] Bid Management Dashboard
- [ ] Order Tracking
- [ ] In-app Notifications
- [ ] Dark Mode

## 📚 Documentation

- **Setup Guide:** [MOBILE_APP_SETUP.md](../MOBILE_APP_SETUP.md)
- **Advanced Features:** [MOBILE_ADVANCED_FEATURES.md](../MOBILE_ADVANCED_FEATURES.md)
- **Project README:** [README.md](../README.md)

## 🆘 Need Help?

1. Check the documentation above
2. Review error messages in Expo DevTools
3. Check server logs for API errors
4. Verify all dependencies are installed
5. Ensure permissions are granted

## 🎯 Development Workflow

### Making Changes
1. Edit code in `src/` directory
2. Save file
3. App automatically reloads (Fast Refresh)
4. Check Expo DevTools for errors

### Testing on Multiple Devices
1. Start Expo once
2. Scan QR on multiple devices
3. All devices update simultaneously

### Debugging
- **Console Logs:** Visible in Expo DevTools
- **React DevTools:** Install browser extension
- **Network:** Use Chrome DevTools via remote debugging

## 🔥 Pro Tips

1. **Keep server and mobile app running together**
2. **Use your local IP, never localhost**
3. **Phone and computer must be on same WiFi**
4. **Shake phone to open developer menu**
5. **Press 'r' in terminal to reload app**
6. **Clear cache if issues: `npm start --clear`**

## 📦 Build for Production

### Android APK
```bash
npm install -g eas-cli
eas build --platform android
```

### iOS IPA (requires Apple Developer account)
```bash
eas build --platform ios
```

---

**Happy Coding! 🚀**

For detailed feature documentation, see [MOBILE_ADVANCED_FEATURES.md](../MOBILE_ADVANCED_FEATURES.md)
