# TaskMtaa - Hyperlocal Micro-Task Marketplace

A production-grade, nationwide hyperlocal micro-task marketplace connecting local task posters with nearby taskers for physical, real-world tasks.

## 🚀 Features

### Core Functionality
- **Geospatial Task Discovery**: Find tasks within customizable radius (1-50 km) using PostgreSQL PostGIS
- **Dual-Role System**: Seamlessly switch between posting tasks and bidding on tasks
- **Real-Time Communication**: Socket.io-powered live chat and notifications
- **Competitive Bidding**: Taskers submit bids with pitch notes
- **Location-Based Alerts**: Get notified of new tasks in your area
- **Interactive Map View**: Visualize nearby tasks on an interactive Leaflet map

### Technical Highlights
- JWT authentication with refresh token rotation
- PostGIS spatial indexing for high-performance distance queries
- Rate limiting and security headers (Helmet.js)
- Input validation with Zod schemas
- Real-time WebSocket connections with authentication
- Responsive Tailwind CSS design
- React Query for efficient server state management

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** 14+ with PostGIS extension
- Modern web browser with geolocation support

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd TaskMtaa
```

### 2. Install Dependencies

**Backend:**
```bash
npm install
```

**Frontend:**
```bash
cd client
npm install
cd ..
```

### 3. Database Setup

**Install PostgreSQL and PostGIS:**
```bash
# On Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib postgis

# On macOS with Homebrew
brew install postgresql postgis

# On Windows, download from postgresql.org
```

**Create Database:**
```bash
psql -U postgres
CREATE DATABASE taskmtaa;
\c taskmtaa
CREATE EXTENSION postgis;
\q
```

### 4. Environment Configuration

Create `.env` file in the root directory:
```env
NODE_ENV=development
PORT=5000

# PostgreSQL with PostGIS
DATABASE_URL=postgresql://username:password@localhost:5432/taskmtaa

# JWT Secrets (generate strong random strings)
JWT_SECRET=your-super-secure-random-secret-key-change-this
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key-change-this
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Cloudinary image storage (avatars and gig galleries)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_FOLDER=taskmtaa

# Optional: Redis for Socket.io scaling
# REDIS_URL=redis://localhost:6379
```

### 5. Run Database Migrations

```bash
npm run migrate
```

This will:
- Enable PostGIS extension
- Create all tables (users, tasks, task_bids, chat_messages, etc.)
- Set up spatial indices for optimal geospatial queries

### 6. Seed Sample Data (Optional)

```bash
npm run seed
```

Creates sample users and tasks in Nairobi area for testing.

## 🎯 Running the Application

### Development Mode

**Option 1: Run Both (Recommended)**
```bash
npm run dev
```
This starts both backend (port 5000) and frontend (port 5173) concurrently.

**Option 2: Run Separately**
```bash
# Terminal 1 - Backend
npm run dev:server

# Terminal 2 - Frontend
npm run dev:client
```

### Production Mode

**Build Frontend:**
```bash
npm run build
```

**Start Production Server:**
```bash
npm start
```

Access the application at `http://localhost:5173` (dev) or `http://localhost:5000` (prod)

## 📁 Project Structure

```
TaskMtaa/
├── server/
│   ├── config/
│   │   └── database.js          # PostgreSQL connection pool
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── taskController.js    # Task CRUD with geospatial queries
│   │   ├── bidController.js     # Bidding system
│   │   └── chatController.js    # Messaging system
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   ├── errorHandler.js      # Global error handling
│   │   └── validation.js        # Zod validation schemas
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── taskRoutes.js
│   │   ├── bidRoutes.js
│   │   └── chatRoutes.js
│   ├── socket/
│   │   └── socketHandler.js     # Socket.io real-time handlers
│   ├── database/
│   │   ├── migrate.js           # Database schema creation
│   │   └── seed.js              # Sample data seeding
│   └── index.js                 # Express server entry point
├── client/
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── Layout.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── TaskCard.jsx
│   │   │   ├── TaskMap.jsx
│   │   │   └── NotificationToast.jsx
│   │   ├── contexts/            # React contexts
│   │   │   ├── AuthContext.jsx
│   │   │   └── SocketContext.jsx
│   │   ├── pages/               # Route pages
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── TaskDetail.jsx
│   │   │   ├── CreateTask.jsx
│   │   │   ├── MyTasks.jsx
│   │   │   ├── MyBids.jsx
│   │   │   ├── Profile.jsx
│   │   │   └── Messages.jsx
│   │   ├── lib/
│   │   │   └── api.js           # Axios instance with interceptors
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── tailwind.config.js
├── package.json
└── README.md
```

## 🔑 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/logout` - Logout
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/profile` - Get user profile

### Tasks
- `GET /api/v1/tasks/nearby` - Get tasks near location (with radius filter)
- `GET /api/v1/tasks/:id` - Get task details
- `POST /api/v1/tasks` - Create new task
- `GET /api/v1/tasks/my-posted` - Get user's posted tasks
- `GET /api/v1/tasks/my-bidded` - Get tasks user has bid on
- `PATCH /api/v1/tasks/:id/status` - Update task status
- `DELETE /api/v1/tasks/:id` - Delete task

### Bids
- `POST /api/v1/bids/task/:id` - Place bid on task
- `GET /api/v1/bids/task/:id` - Get all bids for task
- `PATCH /api/v1/bids/:id/accept` - Accept bid
- `PATCH /api/v1/bids/:id/reject` - Reject bid
- `GET /api/v1/bids/my-bids` - Get user's bids

### Chat
- `POST /api/v1/chat/task/:id/message` - Send message
- `GET /api/v1/chat/task/:id/messages` - Get task messages
- `GET /api/v1/chat/conversations` - Get all conversations
- `GET /api/v1/chat/unread-count` - Get unread count

### Health Check
- `GET /api/v1/health` - Server health status

## 🔌 Socket.io Events

### Client → Server
- `join_task_room` - Join task chat room
- `leave_task_room` - Leave task chat room
- `send_message` - Send chat message
- `register_location` - Register for nearby task alerts
- `typing_start` / `typing_stop` - Typing indicators

### Server → Client
- `nearby_task_alert` - New task posted nearby
- `new_message` - New chat message
- `message_notification` - Message notification
- `user_typing` / `user_stopped_typing` - Typing status

## 🔐 Security Features

- **JWT Authentication**: HttpOnly cookies with refresh token rotation
- **Rate Limiting**: Prevents brute-force attacks
- **Helmet.js**: Security headers (CSP, XSS protection, etc.)
- **Input Validation**: Zod schemas on all endpoints
- **SQL Injection Protection**: Parameterized queries
- **CORS**: Configured origin whitelist
- **Password Hashing**: bcryptjs with salt rounds

## 🗄️ Database Schema

### Key Tables
- **users**: User profiles with ratings and verification status
- **tasks**: Tasks with PostGIS GEOGRAPHY(Point, 4326) for location
- **task_bids**: Competitive bids on tasks
- **chat_messages**: Real-time messaging
- **task_reviews**: Rating system
- **notifications**: User notifications

### Spatial Indexing
```sql
CREATE INDEX idx_tasks_spatial ON tasks USING GIST(location);
```

Enables fast radius queries:
```sql
SELECT * FROM tasks
WHERE ST_DWithin(
  location,
  ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
  10000  -- 10 km radius
);
```

## 🧪 Testing

Sample test credentials (after running seed):
```
Email: john@example.com
Password: password123
```

## 📦 Production Deployment

1. Set `NODE_ENV=production`
2. Use strong JWT secrets
3. Enable HTTPS
4. Set up PostgreSQL backups
5. Configure Redis for Socket.io (multi-server scaling)
6. Use PM2 or similar for process management
7. Set up monitoring (logs, errors, performance)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Developer Notes

- All geospatial queries use PostGIS ST_Distance for accurate calculations
- Socket.io rooms are scoped per task: `task_{taskId}`
- User location registration enables proximity-based push notifications
- Frontend uses TanStack Query for intelligent caching and real-time updates

## 🐛 Troubleshooting

**PostGIS extension error:**
```bash
psql -U postgres -d taskmtaa -c "CREATE EXTENSION postgis;"
```

**Port already in use:**
Change `PORT` in `.env` or kill existing process.

**Database connection failed:**
Verify `DATABASE_URL` and PostgreSQL is running.

**Socket.io not connecting:**
Check CORS_ORIGIN matches frontend URL.

---

Built with ❤️ for local task collaboration
