# Frontend: Project Management Dashboard

This is the frontend application for the Full Stack TypeScript Project Management App. It is a modern, responsive **React** application built with **Vite** and **TypeScript**, focused on delivering a premium user experience with granular permission control.

## 🚀 Key Features

### 1. Advanced ACL Integration
- **Permission-Aware UI**: Components automatically show/hide actions (Edit, Delete, Invite) based on the user's project-specific role (Owner, Admin, Member, Viewer).
- **Kanban Board**: Interactive task management with drag-and-drop functionality restricted by user permissions.

### 2. Global Role-Based Navigation
- **Admin Dashboard**: System-wide administrative features like User Management are only visible and accessible to authorized admins.
- **Protective Routing**: Client-side route guards prevent unauthorized access to restricted views.

### 3. Real-Time Interaction
- **Live Statistics**: The overview dashboard features dynamic, real-time aggregate stats for high-level project tracking.
- **Integrated Comments & Files**: Rich collaboration tools for projects and tasks with support for nested comments and multi-file attachments.

### 4. Seamless Onboarding
- **User Registration**: Integrated signup flow that automatically authenticates and redirects new users to their dashboard.
- **Profile Management**: Personal profile editing with context-aware field rendering (e.g., hiding role management from the owner).

## 🛠️ Technology Stack

- **Framework**: React 19
- **Build Tool**: Vite
- **GraphQL Client**: Apollo Client
- **Styling**: Vanilla CSS (Custom Design System) & TailwindCSS
- **State Management**: React Context & Zustand
- **Icons**: Lucide React
- **Icons**: Lucide React

## 🏁 Getting Started

1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Build for production: `npm run build`
