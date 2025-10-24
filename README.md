# Full Stack TypeScript Project Management App

A modern full-stack project management application built with TypeScript, featuring a NestJS GraphQL backend and React frontend with real-time collaboration capabilities.

## 🚀 Technology Stack

### Backend
- **Framework**: NestJS (Node.js framework)
- **API**: GraphQL with Apollo Server
- **Database**: SQLite with Prisma ORM
- **Authentication**: bcrypt for password hashing
- **Language**: TypeScript
- **Testing**: Jest

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **State Management**: React Context
- **GraphQL Client**: Apollo Client
- **Routing**: React Router DOM
- **Forms**: React Hook Form
- **Icons**: Lucide React
- **UI Components**: Headless UI

## 📋 Features

- **User Management**: User registration, authentication, and profile management
- **Project Management**: Create, update, and track projects with status management
- **Task Management**: Assign tasks to users, track progress with Kanban-style boards
- **Time Tracking**: Log time spent on projects and tasks
- **Comments System**: Collaborative commenting on projects and tasks
- **Role-based Access**: Admin, Manager, and User roles
- **Real-time Updates**: GraphQL subscriptions for live updates

## 🛠️ Development Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd full-stack-typescript
```

2. **Install root dependencies**
```bash
npm install
```

3. **Backend Setup**
```bash
cd backend
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start the backend server (development mode)
npm run start:dev
```

4. **Frontend Setup**
```bash
cd frontend
npm install

# Start the frontend development server
npm run dev
```

### Database Setup

The application uses SQLite with Prisma ORM. The database file (`dev.db`) will be created automatically when you run the migrations.

```bash
# Navigate to backend directory
cd backend

# Generate Prisma client
npx prisma generate

# Apply migrations
npx prisma migrate dev

# (Optional) Seed the database with sample data
npx prisma db seed
```

## 🚀 Running the Application

### Development Mode

1. **Start Backend** (Terminal 1)
```bash
cd backend
npm run start:dev
```
Backend will be available at: `http://localhost:3000`
GraphQL Playground: `http://localhost:3000/graphql`

2. **Start Frontend** (Terminal 2)
```bash
cd frontend
npm run dev
```
Frontend will be available at: `http://localhost:5173`

### Production Mode

1. **Build and start backend**
```bash
cd backend
npm run build
npm run start:prod
```

2. **Build and preview frontend**
```bash
cd frontend
npm run build
npm run preview
```

## 📁 Project Structure

```
full-stack-typescript/
├── backend/                 # NestJS GraphQL API
│   ├── src/
│   │   ├── user/           # User management module
│   │   ├── project/        # Project management module
│   │   ├── task/           # Task management module
│   │   ├── timesheet/      # Time tracking module
│   │   ├── comment/        # Comments system module
│   │   └── prisma/         # Database service
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── migrations/     # Database migrations
│   └── dev.db             # SQLite database
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── features/       # Feature-based modules
│   │   │   ├── projects/   # Project management
│   │   │   ├── tasks/      # Task management
│   │   │   └── users/      # User management
│   │   ├── context/        # React context providers
│   │   ├── hooks/          # Custom React hooks
│   │   └── types/          # TypeScript type definitions
│   └── public/             # Static assets
└── README.md
```

## 🔧 Available Scripts

### Backend Scripts
```bash
npm run start:dev      # Start development server with hot reload
npm run start:debug    # Start with debugging enabled
npm run build          # Build for production
npm run start:prod     # Start production server
npm run test           # Run unit tests
npm run test:e2e       # Run end-to-end tests
npm run lint           # Run ESLint
npm run format         # Format code with Prettier
```

### Frontend Scripts
```bash
npm run dev            # Start development server
npm run build          # Build for production
npm run preview        # Preview production build
npm run lint           # Run ESLint
npm run format         # Format code with Prettier
```

## 🗄️ Database Schema

The application includes the following main entities:

- **User**: User accounts with roles (Admin, Manager, User)
- **Project**: Projects with status tracking
- **Task**: Tasks assigned to users and projects
- **Timesheet**: Time tracking entries
- **Comment**: Collaborative commenting system

## 🔐 Authentication & Authorization

- Password hashing with bcrypt
- Role-based access control (Admin, Manager, User)
- JWT tokens for session management
- Protected routes and API endpoints

## 🧪 Testing

```bash
# Backend tests
cd backend
npm run test           # Unit tests
npm run test:e2e       # End-to-end tests
npm run test:cov       # Coverage report

# Frontend tests
cd frontend
npm run test           # Component tests
```

## 📝 API Documentation

The GraphQL API is automatically documented and available at:
- **Development**: `http://localhost:3000/graphql`
- **GraphQL Playground**: Interactive API explorer

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

1. **Database connection issues**
   - Ensure SQLite database file exists
   - Run `npx prisma migrate dev` to apply migrations

2. **GraphQL connection issues**
   - Verify backend is running on port 3000
   - Check CORS settings in `main.ts`

3. **Frontend build issues**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check TypeScript configuration

### Getting Help

- Check the [Issues](https://github.com/dimastriann/full-stack-typescript/issues) page
- Review the GraphQL Playground for API documentation
- Ensure all dependencies are properly installed

---

**Happy Coding! 🚀**