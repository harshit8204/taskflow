# TaskFlow — Team Task Manager

> A full-stack web application for managing team projects, assigning tasks, and tracking progress with role-based access control (Admin/Member).

**Live URL:** [https://your-app.railway.app](https://your-app.railway.app)  
**GitHub Repo:** [https://github.com/your-username/taskflow](https://github.com/your-username/taskflow)

---

## Features

### Authentication
- JWT-based signup & login
- Persistent sessions via localStorage
- Auto-logout on token expiry

### Role-Based Access Control
| Feature | Admin | Member |
|---|---|---|
| Create projects | ✅ | ❌ |
| Delete projects | ✅ | ❌ |
| Create/edit tasks | ✅ | ❌ |
| Update task status | ✅ | ✅ |
| Manage team roles | ✅ | ❌ |
| View all tasks | ✅ | ✅ |

### Project Management
- Create, view, and delete projects
- Color-coded project cards with progress tracking
- Deadlines and status (Active / On Hold / Completed / Archived)
- Add/remove team members per project

### Task Management
- Create tasks with title, description, priority, status, due date, tags
- Assign tasks to team members
- Kanban board view per project (Todo → In Progress → In Review → Done)
- Auto-detect overdue tasks

### Dashboard
- Real-time stats: total tasks, in-progress, overdue, project count
- Completion rate indicator
- Recent tasks + project progress overview

### Team Page
- View all users with roles
- Admins can promote/demote members

---

## Tech Stack

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- bcryptjs for password hashing

**Frontend**
- React 18 + Vite
- Tailwind CSS (dark theme)
- React Router v6
- Axios
- react-hot-toast
- lucide-react icons
- date-fns

**Deployment**
- Railway (backend + frontend)
- MongoDB Atlas (database)

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)
- Railway account

### Local Setup

**1. Clone the repo**
```bash
git clone https://github.com/your-username/taskflow.git
cd taskflow
```

**2. Backend setup**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm run dev
```

**3. Frontend setup**
```bash
cd frontend
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api
npm run dev
```

---

## Deployment on Railway

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/taskflow.git
git push -u origin main
```

### Step 2 — Set up MongoDB Atlas

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a free cluster
3. Create a database user (username + password)
4. Allow network access from `0.0.0.0/0`
5. Copy the connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/taskmanager
   ```

### Step 3 — Deploy Backend on Railway

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select your repo, choose the **backend** folder as root
3. Add environment variables:
   ```
   PORT=5000
   MONGO_URI=mongodb+srv://...
   JWT_SECRET=your_random_secret_here_make_it_long
   FRONTEND_URL=https://your-frontend.railway.app
   ```
4. Deploy. Railway gives you a URL like `https://taskflow-backend.railway.app`

### Step 4 — Deploy Frontend on Railway

1. Add a second service in same Railway project → deploy from same repo
2. Set root directory to `frontend`
3. Add environment variable:
   ```
   VITE_API_URL=https://taskflow-backend.railway.app/api
   ```
4. Build command: `npm run build`
5. Start command: `npm run preview -- --host --port $PORT`

### Step 5 — Update CORS

Back in backend environment variables, update:
```
FRONTEND_URL=https://your-frontend-url.railway.app
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Projects
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects` | Get all user's projects |
| POST | `/api/projects` | Create project (Admin) |
| GET | `/api/projects/:id` | Get project by ID |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project + tasks |
| POST | `/api/projects/:id/members` | Add member |
| DELETE | `/api/projects/:id/members/:userId` | Remove member |

### Tasks
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tasks` | Get all tasks (with filters) |
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks/:id` | Get task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| POST | `/api/tasks/:id/comments` | Add comment |
| GET | `/api/tasks/stats/dashboard` | Dashboard stats |

### Users
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users` | List all users |
| PUT | `/api/users/:id/role` | Update role (Admin only) |
| PUT | `/api/users/profile` | Update own profile |

---

## Project Structure

```
taskflow/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Project.js
│   │   └── Task.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── projects.js
│   │   ├── tasks.js
│   │   └── users.js
│   ├── middleware/
│   │   └── auth.js
│   ├── server.js
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Layout.jsx
    │   │   └── TaskModal.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Signup.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Projects.jsx
    │   │   ├── ProjectDetail.jsx
    │   │   ├── Tasks.jsx
    │   │   └── Team.jsx
    │   ├── utils/
    │   │   └── api.js
    │   ├── App.jsx
    │   └── main.jsx
    └── package.json
```

---

## Screenshots

> Add your screenshots here after deployment.

---

## License

MIT

---

Made with ❤️ using React + Node.js + MongoDB
