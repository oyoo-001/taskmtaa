# TaskMtaa - Quick Start Guide

## 🚀 One Command to Rule Them All

```bash
npm run dev
```

This starts **both** server and client with color-coded output!

---

## What You'll See

```bash
[SERVER] ✓ Server running on port 5000        (Blue)
[CLIENT] ➜  Local:   http://localhost:5173/   (Green)
```

---

## Access Points

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000/api/v1/health

---

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | 🎯 **Start both** (recommended) |
| `npm run server` | Server only |
| `npm run client` | Client only |
| `npm run migrate` | Database migrations |
| `npm run build` | Build for production |

---

## Stop Services

Press **Ctrl+C** once to stop both.

---

## Troubleshooting

### Port in Use
```bash
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Database Error
```bash
npm run migrate
```

---

That's it! Happy coding! 🎉
