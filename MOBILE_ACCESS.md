# Access App from Your Phone 📱

## Quick Setup

### 1. Find Your Computer's IP Address

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your active network (WiFi/Ethernet)
Example: `192.168.0.106`

**Mac/Linux:**
```bash
ifconfig
# or
ip addr show
```

### 2. Start the Dev Server

```bash
npm run dev
```

You should see:
```
➜  Local:   http://localhost:5173/
➜  Network: http://192.168.0.106:5173/  ← Use this on your phone
```

### 3. Open on Your Phone

Make sure your phone is on **the same WiFi network** as your computer, then:

1. Open browser on your phone
2. Type: `http://192.168.0.106:5173`
3. Replace `192.168.0.106` with YOUR computer's IP

---

## Troubleshooting

### Issue: "Can't reach site" or "Takes too long"

#### Solution 1: Check Firewall
**Windows Firewall:**
```powershell
# Run as Administrator
New-NetFirewallRule -DisplayName "Vite Dev Server" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Node Backend" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
```

Or manually:
1. Open Windows Defender Firewall
2. Advanced Settings → Inbound Rules
3. New Rule → Port → TCP → 5173, 5000
4. Allow the connection
5. Apply to all profiles

#### Solution 2: Check Same Network
- Computer and phone MUST be on same WiFi
- Not on mobile data
- Not on guest WiFi (if separate from main network)

#### Solution 3: Disable VPN
- Turn off VPN on computer
- Turn off VPN on phone

#### Solution 4: Use IP Address (not localhost)
```
✅ Correct:  http://192.168.0.106:5173
❌ Wrong:    http://localhost:5173
```

#### Solution 5: Check Vite Config
Ensure `vite.config.js` has:
```js
server: {
  host: '0.0.0.0',  // ← This is important!
  port: 5173,
}
```

---

## Backend Access

Your phone also needs to reach the backend API.

### Option 1: Update SocketContext (Recommended)

Edit `client/src/contexts/SocketContext.jsx`:

```jsx
// Change from:
const newSocket = io('http://localhost:5000', {

// To (use your computer's IP):
const newSocket = io('http://192.168.0.106:5000', {
```

### Option 2: Environment Variable

Create `.env.local` in `client/` folder:
```
VITE_API_URL=http://192.168.0.106:5000
```

Then update SocketContext:
```jsx
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const newSocket = io(API_URL, {
```

---

## Complete Testing Setup

### 1. Start Backend
```bash
# Terminal 1
npm run dev:server
```

Should show:
```
✓ Server running on port 5000
✓ Socket.io initialized
```

### 2. Start Frontend
```bash
# Terminal 2
npm run dev:client
```

Should show:
```
➜  Network: http://192.168.0.106:5173/
```

### 3. Test from Phone

Open: `http://192.168.0.106:5173`

---

## Network Requirements

### Same WiFi Network
```
[Router]
   ├── Computer (192.168.0.106)
   └── Phone    (192.168.0.XXX)
```

### Check Connection
**From Computer:**
```bash
ping <phone-ip>
```

**From Phone:**
Install "Network Analyzer" app and ping your computer's IP

---

## Common Issues

### 1. "ERR_CONNECTION_REFUSED"
- ✅ Check server is running (`npm run dev`)
- ✅ Check firewall allows port 5173
- ✅ Verify IP address is correct

### 2. "ERR_CONNECTION_TIMED_OUT"
- ✅ Disable Windows Firewall temporarily to test
- ✅ Check same WiFi network
- ✅ Disable VPN/proxy

### 3. "This site can't be reached"
- ✅ Verify vite.config.js has `host: '0.0.0.0'`
- ✅ Restart dev server after config change
- ✅ Check IP address hasn't changed (use `ipconfig`)

### 4. Page loads but API calls fail
- ✅ Update SocketContext with your IP
- ✅ Check backend is running on port 5000
- ✅ Open firewall for port 5000

### 5. Socket.io not connecting
- ✅ Update socket URL in SocketContext.jsx
- ✅ Check WebSocket ports (5000) in firewall
- ✅ Verify CORS settings in server

---

## Quick Commands

### Get Your IP
```bash
# Windows
ipconfig | findstr IPv4

# Mac/Linux
ifconfig | grep "inet "
```

### Allow Firewall (Windows - Run as Admin)
```powershell
netsh advfirewall firewall add rule name="Vite Dev" dir=in action=allow protocol=TCP localport=5173
netsh advfirewall firewall add rule name="Node API" dir=in action=allow protocol=TCP localport=5000
```

### Test Ports
```bash
# Check if port is listening
netstat -an | findstr :5173
netstat -an | findstr :5000
```

---

## Security Note

⚠️ **Development Only**

- `host: '0.0.0.0'` is for development only
- Don't use in production
- Only devices on your local network can access
- Firewall rules allow local network only

---

## Best Practice for Team

### Use Environment Variables

**Client `.env`:**
```env
VITE_API_URL=http://192.168.0.106:5000
```

**Access in code:**
```jsx
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

Benefits:
- Each developer uses their own IP
- No need to commit IP changes
- Easy to switch environments

---

## Success Checklist

- [ ] Vite config has `host: '0.0.0.0'`
- [ ] Dev server shows Network URL
- [ ] Firewall allows ports 5173 and 5000
- [ ] Computer and phone on same WiFi
- [ ] SocketContext uses correct IP
- [ ] Backend running on port 5000
- [ ] Can access from phone browser

---

## Alternative: ngrok (Internet Access)

If same network doesn't work, use ngrok for internet-accessible URL:

```bash
# Install ngrok
npm install -g ngrok

# Expose port 5173
ngrok http 5173

# Use the provided URL (works from anywhere)
https://abcd1234.ngrok.io
```

Benefits:
- Works over internet
- No firewall config needed
- Can share with anyone
- Free tier available

---

## Quick Start (TL;DR)

1. **Get IP:** `ipconfig` → find IPv4 (e.g., 192.168.0.106)
2. **Config:** Vite has `host: '0.0.0.0'` ✅ (already done)
3. **Firewall:** Allow ports 5173 & 5000
4. **Update Socket:** Change `localhost` to your IP in SocketContext.jsx
5. **Start:** `npm run dev`
6. **Phone:** Same WiFi, open `http://192.168.0.106:5173`

Done! 🎉
