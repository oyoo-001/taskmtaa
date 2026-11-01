# Concurrent Development Setup

## Quick Start 🚀

Run both client and server with a single command:

```bash
npm run dev
```

That's it! Both will start automatically with colored output.

---

## Available Commands

### Development

```bash
# Run both server and client concurrently (RECOMMENDED)
npm run dev

# Run server only
npm run server

# Run client only
npm run client

# Run client with host access (for mobile testing)
npm run dev:client
```

### Production

```bash
# Build client for production
npm run build

# Start production server
npm start
```

### Database

```bash
# Run database migrations
npm run migrate

# Seed database with sample data
npm run seed

# Create admin user
npm run create-admin
```

### Testing

```bash
# Test Cloudinary configuration
npm run test-cloudinary

# Verify environment setup
npm run verify
```

---

## What `npm run dev` Does

The `dev` command uses `concurrently` to run:

1. **Backend Server** (Blue prefix)
   - Starts Express server on port 5000
   - Initializes Socket.io
   - Connects to PostgreSQL database
   - Sets up API routes

2. **Frontend Client** (Green prefix)
   - Starts Vite dev server on port 5173
   - Enables hot module replacement (HMR)
   - Watches for file changes
   - Auto-reloads on changes

### Output Format

```bash
[SERVER] ╔════════════════════════════════════════════╗
[SERVER] ║         TaskMtaa API Server                ║
[SERVER] ╚════════════════════════════════════════════╝
[SERVER] ✓ Server running on port 5000
[CLIENT] 
[CLIENT]   VITE v5.4.21  ready in 985 ms
[CLIENT]   ➜  Local:   http://localhost:5173/
```

---

## Color-Coded Output

- 🔵 **SERVER** (Blue) - Backend logs
- 🟢 **CLIENT** (Green) - Frontend logs

Makes it easy to distinguish which service is logging what!

---

## Stopping the Services

Press `Ctrl+C` once to stop both services gracefully.

If one service crashes, the other will continue running. Press `Ctrl+C` to stop the remaining service.

---

## Benefits

### Before
```bash
# Terminal 1
cd server
npm run dev

# Terminal 2
cd client
npm run dev
```
**Problem**: Need 2 terminals, switch between them, manage separately

### After ✅
```bash
npm run dev
```
**Benefits**:
- ✅ One command starts everything
- ✅ One terminal window
- ✅ Color-coded output
- ✅ Easy to read logs
- ✅ Stop everything with one Ctrl+C
- ✅ Professional development workflow

---

## Configuration

### package.json Scripts

```json
{
  "scripts": {
    "server": "node server/index.js",
    "client": "cd client && npm run dev",
    "dev": "concurrently \"npm run server\" \"npm run client\" --names \"SERVER,CLIENT\" --prefix-colors \"blue,green\""
  }
}
```

### Customization

You can customize the concurrent setup:

**Different colors:**
```json
"dev": "concurrently \"npm run server\" \"npm run client\" --names \"API,WEB\" --prefix-colors \"magenta,cyan\""
```

**Add more services:**
```json
"dev": "concurrently \"npm run server\" \"npm run client\" \"npm run worker\" --names \"SERVER,CLIENT,WORKER\" --prefix-colors \"blue,green,yellow\""
```

**Different prefix format:**
```json
"dev": "concurrently \"npm run server\" \"npm run client\" --prefix \"[{time}] {name}\""
```

---

## Troubleshooting

### Port Already in Use

**Problem**: Server or client port already occupied

**Solution**:
```bash
# Windows: Kill process on port 5000 (server)
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Kill process on port 5173 (client)
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### One Service Fails to Start

**Problem**: Server starts but client fails (or vice versa)

**Solution**:
1. Check error messages in colored output
2. Run services individually to debug:
   ```bash
   npm run server  # Test server alone
   npm run client  # Test client alone
   ```

### Environment Variables Not Loading

**Problem**: `.env` file not being read

**Solution**:
1. Ensure `.env` file exists in root directory
2. Check file permissions
3. Verify `dotenv` is installed
4. Restart the dev server

### Concurrently Not Found

**Problem**: `'concurrently' is not recognized`

**Solution**:
```bash
npm install concurrently --save-dev
```

---

## Development Workflow

### Typical Day

1. **Start Development**
   ```bash
   npm run dev
   ```

2. **Make Changes**
   - Edit frontend files → Auto-reload in browser
   - Edit backend files → May need manual restart (add nodemon for auto-restart)

3. **Test Changes**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5000/api/v1/health

4. **Stop When Done**
   ```bash
   Ctrl+C
   ```

### Hot Reloading

- **Client**: ✅ Automatic (Vite HMR)
- **Server**: ❌ Manual restart (unless using nodemon)

**To add server auto-restart:**

1. Update server script:
   ```json
   "server": "nodemon server/index.js"
   ```

2. Already have nodemon installed ✅

3. Server will now auto-restart on file changes!

---

## Advanced: Production-Like Testing

### Build and Serve

```bash
# Build client
npm run build

# Start production server (serves built client)
npm start
```

### Environment-Specific Commands

```bash
# Development
NODE_ENV=development npm run dev

# Production
NODE_ENV=production npm start
```

---

## File Structure

```
TaskMtaa/
├── server/
│   └── index.js          # Server entry point
├── client/
│   ├── vite.config.js    # Vite config
│   └── package.json      # Client dependencies
├── package.json          # Root package.json (concurrently scripts)
└── .env                  # Environment variables
```

---

## Performance Tips

### Faster Startup

1. **Use nodemon for server** (auto-restart on changes)
2. **Enable Vite caching** (already configured)
3. **Reduce console logging** in development
4. **Close unused terminals** (frees up resources)

### Memory Usage

Running both services uses approximately:
- Server: ~100-200 MB
- Client (Vite): ~200-300 MB
- **Total**: ~300-500 MB RAM

---

## CI/CD Integration

### Docker Compose

Can replicate concurrent setup in Docker:

```yaml
version: '3'
services:
  server:
    build: ./server
    ports:
      - "5000:5000"
  
  client:
    build: ./client
    ports:
      - "5173:5173"
```

### GitHub Actions

```yaml
- name: Start dev servers
  run: npm run dev &
  
- name: Wait for servers
  run: npx wait-on http://localhost:5000 http://localhost:5173
```

---

## Summary

### Single Command Development

| Command | Description | Terminals Needed |
|---------|-------------|------------------|
| `npm run dev` | Both server + client | 1 ✅ |
| `npm run server` | Server only | 1 |
| `npm run client` | Client only | 1 |

### Benefits
- ✅ **Faster setup** (one command)
- ✅ **Easier management** (one window)
- ✅ **Better visibility** (color-coded logs)
- ✅ **Professional workflow** (industry standard)

### Next Steps
1. Run `npm run dev`
2. Open http://localhost:5173
3. Start coding!

---

**Status**: ✅ Ready to use  
**Command**: `npm run dev`  
**Time saved**: ~30 seconds every startup  
**Quality of life**: 📈 Much better!
