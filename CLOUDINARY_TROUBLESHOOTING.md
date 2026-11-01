# Cloudinary Upload Timeout Troubleshooting

## Issue
Avatar/image uploads are timing out with error:
```
Error: HttpException: Request Timeout
at file:///C:/Users/oyooo/TaskMtaa/server/config/cloudinary.js:53:27
```

## Possible Causes & Solutions

### 1. Network Connection Issues ⚠️

**Symptoms:**
- Uploads timeout after 60 seconds
- Intermittent connection failures

**Solutions:**
```powershell
# Test your connection to Cloudinary
npm run test-cloudinary
```

If the test passes but uploads still fail:
- Check if you're behind a corporate firewall
- Try using a different network (mobile hotspot)
- Disable VPN temporarily

### 2. Invalid Cloudinary Credentials ❌

**Symptoms:**
- 401 Unauthorized errors
- API ping fails

**Solutions:**

1. Verify your `.env` file has correct credentials:
```env
CLOUDINARY_CLOUD_NAME=q7xomch6
CLOUDINARY_API_KEY=919121549329222
CLOUDINARY_API_SECRET=CSeuesXOQMsKf6CgmXSivpyGdT8
CLOUDINARY_FOLDER=taskmtaa
```

2. Test credentials:
```powershell
npm run test-cloudinary
```

3. Get fresh credentials from Cloudinary Dashboard:
   - Go to https://cloudinary.com/console
   - Copy: Cloud Name, API Key, API Secret
   - Update `.env` file

### 3. Large Image Files 📦

**Symptoms:**
- Only large images timeout
- Small images upload fine

**Solutions:**

1. **Client-side compression** (recommended):
   Add to `Profile.jsx`:
```jsx
// Compress image before upload
const compressImage = async (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Resize if too large
        const maxSize = 1200;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else {
            width = (width / height) * maxSize;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(resolve, 'image/jpeg', 0.85);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

// Use before upload
const compressed = await compressImage(file);
formData.append('avatar', compressed, 'avatar.jpg');
```

2. **Inform users about size limits:**
```jsx
<p className="text-xs text-gray-500 mt-1">
  Max file size: 5MB. For best results, use images under 2MB.
</p>
```

### 4. Cloudinary Account Limits 💳

**Symptoms:**
- Uploads worked before, now timing out
- Error mentions credits or bandwidth

**Solutions:**

1. Check account usage:
```powershell
npm run test-cloudinary
```

2. Check your Cloudinary dashboard:
   - https://cloudinary.com/console
   - Look for usage warnings
   - Upgrade plan if needed

3. Delete old test images:
```javascript
// In Cloudinary console > Media Library
// Delete unused images to free up space
```

### 5. Server Configuration Issues ⚙️

**Symptoms:**
- All uploads fail
- Server logs show connection errors

**Solutions:**

1. **Increase timeout** in `server/config/cloudinary.js`:
```javascript
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
  timeout: 120000, // Increase to 120 seconds
});
```

2. **Check Node.js version:**
```powershell
node --version  # Should be v16 or higher
```

3. **Restart server after .env changes:**
```powershell
# Stop server (Ctrl+C)
npm run dev
```

### 6. Firewall/Antivirus Blocking 🛡️

**Symptoms:**
- Other uploads work fine
- Only Cloudinary times out

**Solutions:**

1. Temporarily disable firewall/antivirus
2. Add exception for Node.js
3. Whitelist Cloudinary domains:
   - `*.cloudinary.com`
   - `res.cloudinary.com`
   - `api.cloudinary.com`

## Quick Diagnostic Steps

Run these commands in order:

```powershell
# 1. Test Cloudinary connection
npm run test-cloudinary

# 2. Check server logs while uploading
# Look for specific error messages

# 3. Test with a tiny image (< 100KB)
# If this works, it's a size/network issue

# 4. Check .env file is loaded
# Add console.log in server/config/cloudinary.js to verify
```

## Current Configuration

The system is now configured with:
- ✅ 60-second timeout
- ✅ Better error messages
- ✅ Automatic retry logic
- ✅ Detailed error logging

## Recommended Settings

### For Development:
```env
# .env
CLOUDINARY_CLOUD_NAME=q7xomch6
CLOUDINARY_API_KEY=919121549329222
CLOUDINARY_API_SECRET=CSeuesXOQMsKf6CgmXSivpyGdT8
CLOUDINARY_FOLDER=taskmtaa
```

### Client-side validation:
```jsx
// Max file size: 2MB for faster uploads
const MAX_FILE_SIZE = 2 * 1024 * 1024;

if (file.size > MAX_FILE_SIZE) {
  alert('Please use an image under 2MB for faster uploads');
  return;
}
```

## Still Having Issues?

1. **Check Cloudinary Status:**
   - https://status.cloudinary.com/

2. **Test with curl:**
```bash
curl -X POST \
  -F "file=@test.jpg" \
  -F "upload_preset=unsigned" \
  https://api.cloudinary.com/v1_1/q7xomch6/image/upload
```

3. **Contact Cloudinary Support:**
   - https://support.cloudinary.com/
   - Provide your Cloud Name and error logs

4. **Alternative: Use Direct Base64 Upload**
   For small avatars only (not recommended for production):
```javascript
// Convert to base64 and store in database
// Only for images < 100KB
```

## Prevention

1. Compress images on client-side before upload
2. Show upload progress indicator
3. Set reasonable file size limits
4. Add retry logic with exponential backoff
5. Cache uploaded images on CDN

## Server Restart Required

After making any changes to:
- `.env` file
- `server/config/cloudinary.js`
- Cloudinary credentials

**Always restart your server:**
```powershell
# Stop server (Ctrl+C)
npm run dev
```
