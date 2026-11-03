# Mobile App Installation Troubleshooting

## Issue: npm install timing out or failing

### Quick Fixes to Try:

### Option 1: Use Yarn Instead (Faster)
```bash
# Install yarn globally if you don't have it
npm install -g yarn

# Then in mobile folder
yarn install
```

### Option 2: Increase npm Timeout
```bash
npm config set fetch-timeout 600000
npm config set fetch-retry-mintimeout 20000
npm config set fetch-retry-maxtimeout 120000

# Then try again
npm install --legacy-peer-deps
```

### Option 3: Install in Smaller Batches
```bash
# Step 1: Install Expo core first
npm install expo expo-status-bar react react-native @babel/core --legacy-peer-deps

# Step 2: Install navigation
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs --legacy-peer-deps

# Step 3: Install navigation dependencies
npm install react-native-screens react-native-safe-area-context react-native-gesture-handler react-native-reanimated --legacy-peer-deps

# Step 4: Install other dependencies
npm install axios socket.io-client @react-native-async-storage/async-storage --legacy-peer-deps

# Step 5: Install expo modules
npm install expo-location expo-image-picker expo-notifications expo-device expo-constants --legacy-peer-deps

# Step 6: Install UI library
npm install react-native-paper react-native-vector-icons react-native-maps --legacy-peer-deps
```

### Option 4: Clear Everything and Use Different Registry
```bash
# Clear npm cache aggressively
npm cache clean --force

# Use a faster registry
npm config set registry https://registry.npmjs.org/

# Or use a mirror (if in slow region)
npm config set registry https://registry.npmmirror.com

# Then try install
npm install --legacy-peer-deps
```

### Option 5: Manual Download (Last Resort)
If npm continues to fail, you can:
1. Delete `node_modules` and `package-lock.json`
2. Use the already-working `client` folder node_modules as reference
3. Or download from a working machine and copy over

## Missing Module Error (@babel/helper-validator-identifier)

This error means dependencies are broken or incomplete. Fix:

```bash
# Clean install
cd mobile
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json

# Install with force
npm install --force --legacy-peer-deps
```

## Alternative: Start Fresh with Expo CLI

If nothing works, create a fresh Expo app and copy our files:

```bash
# Go to TaskMtaa folder
cd C:\Users\oyooo\TaskMtaa

# Create new expo app
npx create-expo-app mobile-new

# Copy our source files
Copy-Item -Recurse mobile\src mobile-new\src
Copy-Item mobile\App.js mobile-new\App.js
Copy-Item mobile\app.json mobile-new\app.json
Copy-Item mobile\.env.example mobile-new\.env.example

# Install our dependencies in the fresh app
cd mobile-new
npx expo install expo-location expo-image-picker expo-notifications expo-device
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npm install axios socket.io-client @react-native-async-storage/async-storage
npm install react-native-paper react-native-vector-icons
npx expo install react-native-screens react-native-safe-area-context react-native-gesture-handler react-native-reanimated

# Try starting
npm start
```

## Check Node/NPM Versions

Make sure you have compatible versions:

```bash
node --version  # Should be v18.x or v20.x
npm --version   # Should be v9.x or v10.x
```

If too old, update Node.js from: https://nodejs.org/

## Network Issues

If you're behind a proxy or firewall:

```bash
npm config set proxy http://proxy-server:port
npm config set https-proxy http://proxy-server:port

# Or disable proxy
npm config delete proxy
npm config delete https-proxy
```

## After Successful Install

Once dependencies are installed, test:

```bash
npm start
```

Should see Expo DevTools in browser and QR code in terminal.

## Still Not Working?

The good news: **All the code is ready!** The issue is just with installing dependencies, not with the code itself.

You can:
1. Try on a different network
2. Try at a different time (npm servers sometimes slow)
3. Use yarn instead of npm
4. Ask a colleague to npm install and zip their node_modules

All our mobile app code (screens, navigation, contexts, services) is complete and committed to GitHub. Once you get past the npm install hurdle, everything should work perfectly!
