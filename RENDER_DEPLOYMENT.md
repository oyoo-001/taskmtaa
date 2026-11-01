# Render Deployment Guide

## 🚀 Deploy to Render

Your app is deployed at: https://taskmtaa.onrender.com

---

## Build Configuration

### Build Command (Updated!)
```bash
npm run build
```

This will:
1. Install root dependencies (`npm install`)
2. Navigate to client folder (`cd client`)
3. Install client dependencies (`npm install`)
4. Build the React app (`npm run build`)

**Important**: Use `npm run build` in Render, not `npm install; npm run build`

### Start Command
```bash
npm start
```

Starts the Node.js server which also serves the built client files.

---

## Environment Variables

Set these in Render Dashboard → Environment:

### Required Variables

```bash
# Database (Render PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/database

# JWT Secrets (generate secure random strings)
JWT_SECRET=your-super-secure-secret-key-here
JWT_REFRESH_SECRET=your-super-secure-refresh-key-here

# CORS (your Render URL)
CORS_ORIGIN=https://taskmtaa.onrender.com

# Node Environment
NODE_ENV=production

# Port (Render sets this automatically)
PORT=10000
```

### Optional Variables

```bash
# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Africa's Talking SMS
AT_API_KEY=your-at-api-key
AT_USERNAME=your-at-username

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Web Push (for notifications)
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_EMAIL=your-email@example.com
```

---

## Database Setup

### 1. Create PostgreSQL Database

In Render Dashboard:
1. Click "New +" → "PostgreSQL"
2. Name: `taskmtaa-db`
3. Database: `taskmtaa`
4. User: `taskmtaa_user`
5. Click "Create Database"

### 2. Connect to Your Web Service

1. Copy the **Internal Database URL**
2. Go to your Web Service
3. Environment → Add `DATABASE_URL`
4. Paste the Internal Database URL
5. Save Changes

### 3. Run Migrations

**Option A: Via Render Shell**
```bash
# In Render Dashboard → Shell tab
npm run migrate
```

**Option B: Via Local Connection**
```bash
# Set DATABASE_URL to Render's External URL
export DATABASE_URL="postgresql://..."
npm run migrate
```

### 4. (Optional) Seed Data
```bash
npm run seed
```

### 5. Create Admin User
```bash
npm run create-admin
```

---

## Serving Built Files

The server is configured to serve the built React app from `client/dist`:

```javascript
// server/index.js
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../client/dist')));

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});
```

---

## Deployment Checklist

### Before First Deploy

- [ ] Push code to GitHub
- [ ] Create Render Web Service
- [ ] Set all environment variables
- [ ] Create and link PostgreSQL database
- [ ] Set build command: `npm install; npm run build`
- [ ] Set start command: `npm start`

### After First Deploy

- [ ] Check deployment logs for errors
- [ ] Run database migrations
- [ ] Create admin user
- [ ] Test app at your Render URL
- [ ] Verify API endpoints work
- [ ] Test authentication
- [ ] Test Socket.io connection

### For Each Update

- [ ] Commit and push changes to GitHub
- [ ] Render auto-deploys on push
- [ ] Check deployment logs
- [ ] Test functionality

---

## Troubleshooting

### Build Fails: "vite: not found"

**Problem**: Client dependencies not installed

**Fix**: Update build command to:
```bash
npm install; npm run build
```

This installs client deps before building.

### Database Connection Error

**Problem**: DATABASE_URL not set or incorrect

**Fix**:
1. Check Environment tab in Render
2. Verify DATABASE_URL is set
3. Use **Internal** URL (not External)
4. Format: `postgresql://user:pass@host:5432/db`

### 502 Bad Gateway

**Problem**: Server not starting or crashed

**Fix**:
1. Check Logs tab in Render
2. Look for error messages
3. Verify all required env vars are set
4. Check PORT is set (Render does this automatically)

### CORS Errors

**Problem**: CORS_ORIGIN doesn't match

**Fix**:
```bash
CORS_ORIGIN=https://taskmtaa.onrender.com
```

No trailing slash!

### Socket.io Not Connecting

**Problem**: WebSocket protocol issues

**Fix**: Update Socket.io client in `SocketContext.jsx`:
```javascript
const API_URL = import.meta.env.VITE_API_URL || window.location.origin;

const newSocket = io(API_URL, {
  auth: { token },
  transports: ['websocket', 'polling'], // Try websocket first
  secure: true, // Use WSS in production
});
```

### Static Files 404

**Problem**: React routes return 404

**Fix**: Verify server has catch-all route:
```javascript
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});
```

This must be **after** all API routes.

---

## Performance Optimization

### Free Tier Limitations

Render free tier:
- ✅ 750 hours/month
- ❌ Spins down after 15 min inactivity
- ❌ 512 MB RAM
- ❌ Shared CPU

### Keep Alive (Optional)

To prevent spin-down:

1. Use a service like UptimeRobot
2. Ping your URL every 14 minutes
3. Costs: Free tier available

**Note**: This uses your 750 hours faster!

### Upgrade to Paid

For production:
- Upgrade to paid tier ($7/mo)
- Benefits:
  - No spin-down
  - More RAM
  - Faster response
  - Better reliability

---

## Monitoring

### Render Dashboard

- **Logs**: Real-time server logs
- **Metrics**: CPU, Memory, Request count
- **Shell**: SSH-like access to container
- **Events**: Deployment history

### Health Check Endpoint

```bash
curl https://taskmtaa.onrender.com/api/v1/health
```

Should return:
```json
{
  "success": true,
  "message": "TaskMtaa API is running",
  "environment": "production"
}
```

---

## Custom Domain (Optional)

### Add Custom Domain

1. Render Dashboard → Settings → Custom Domain
2. Enter your domain: `www.taskmtaa.com`
3. Add DNS records from Render
4. Wait for SSL certificate (automatic)

### Update Environment

```bash
CORS_ORIGIN=https://www.taskmtaa.com
```

---

## CI/CD Pipeline

Render automatically deploys when you push to GitHub:

```
Local Changes → Git Push → GitHub → Render Auto-Deploy
```

### Disable Auto-Deploy

If you want manual control:
1. Settings → Auto-Deploy
2. Toggle off
3. Click "Manual Deploy" when ready

---

## Rollback

If deployment breaks:

1. Events tab → Find working deployment
2. Click "Rollback"
3. Confirm rollback

---

## Logs & Debugging

### View Logs

```bash
# In Render Dashboard
Logs tab → See real-time logs

# Filter by level
[INFO] Server started
[ERROR] Database connection failed
```

### Shell Access

```bash
# In Render Dashboard
Shell tab → Opens terminal in container

# Run commands
npm run migrate
node server/scripts/createAdmin.js
```

---

## Security

### Environment Variables

- ✅ Never commit .env to Git
- ✅ Use Render's Environment tab
- ✅ Generate strong JWT secrets
- ✅ Use HTTPS only (Render provides free SSL)

### Database

- ✅ Use Internal URL (not exposed to internet)
- ✅ Strong password (Render generates one)
- ✅ Regular backups (Render handles this)

### API

- ✅ Rate limiting enabled (Express rate limit)
- ✅ Helmet.js for security headers
- ✅ CORS restricted to your domain
- ✅ JWT authentication on all protected routes

---

## Backup & Recovery

### Database Backups

Render automatically backs up PostgreSQL:
- Daily backups for 7 days
- Can restore from any backup
- Settings → Backups

### Code Backups

- ✅ Git repository is your backup
- ✅ Render stores deployment history
- ✅ Can rollback to any previous deploy

---

## Costs

### Free Tier

- Web Service: 750 hours/month (free)
- PostgreSQL: 90 days free, then $7/mo
- Total: **Free for 90 days**, then $7/mo

### Paid Tier

- Starter: $7/mo (web service)
- PostgreSQL: $7/mo
- Total: **$14/mo**

Benefits:
- No spin-down
- More resources
- Better performance
- Priority support

---

## Support

### Documentation

- Render Docs: https://render.com/docs
- Node.js: https://render.com/docs/deploy-node-express-app
- PostgreSQL: https://render.com/docs/databases

### Community

- Render Community: https://community.render.com
- Discord: https://render.com/discord

---

## Summary

### Deployment Steps

1. ✅ Update package.json build script
2. ✅ Push to GitHub
3. ✅ Create Render Web Service
4. ✅ Link PostgreSQL database
5. ✅ Set environment variables
6. ✅ Deploy
7. ✅ Run migrations
8. ✅ Test app

### URLs

- **App**: https://taskmtaa.onrender.com
- **API Health**: https://taskmtaa.onrender.com/api/v1/health
- **Dashboard**: https://dashboard.render.com

### Next Deploy

Just push to GitHub - Render auto-deploys! 🚀

---

**Status**: Ready for deployment  
**Build Command**: `npm install; npm run build`  
**Start Command**: `npm start`  
**Success**: Your app will be live! 🎉
