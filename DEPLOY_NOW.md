# 🚀 Deploy to Render - Quick Guide

## What Was Fixed

### 1. Build Script ✅
```json
// package.json
"build": "cd client && npm install && npm run build"
```
Now installs client dependencies before building (fixes "vite: not found" error)

### 2. Server Static Files ✅
```javascript
// server/index.js
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}
```
Serves built React app in production

---

## Deploy Now! (3 Steps)

### Step 1: Commit & Push
```bash
git add .
git commit -m "Fix Render deployment: proper client dependency installation"
git push origin main
```

### Step 2: Configure Render

**Build Command:**
```
npm run build
```

**Start Command:**
```
npm start
```

**Environment Variables** (add in Render Dashboard):
```bash
DATABASE_URL=postgresql://... (from your Render PostgreSQL)
JWT_SECRET=generate-a-secure-random-string
JWT_REFRESH_SECRET=generate-another-secure-string
CORS_ORIGIN=https://taskmtaa.onrender.com
NODE_ENV=production
```

### Step 3: Deploy!

Render will automatically deploy when you push to GitHub.

**Watch the build**: Render Dashboard → Logs

---

## After First Deploy

### Run Migrations

In Render Shell:
```bash
npm run migrate
```

### Create Admin
```bash
npm run create-admin
```

### Test
```bash
curl https://taskmtaa.onrender.com/api/v1/health
```

---

## That's It!

Your app will be live at: **https://taskmtaa.onrender.com** 🎉

---

## Troubleshooting

### Build Fails
- Check logs in Render Dashboard
- Verify build command is correct
- Ensure all env vars are set

### 502 Error
- Check if DATABASE_URL is set
- Verify all required env vars exist
- Check logs for errors

### CORS Errors
- Ensure CORS_ORIGIN matches your Render URL
- No trailing slash: `https://taskmtaa.onrender.com`

---

## Files Changed

1. ✅ `package.json` - Fixed build script
2. ✅ `server/index.js` - Added production static file serving
3. ✅ `RENDER_DEPLOYMENT.md` - Full documentation

---

**Ready?** Run the commands above and deploy! 🚀
