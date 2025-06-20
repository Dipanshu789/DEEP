# Smart Attendance System

## Overview

This is a full-stack attendance management system built with React, Express, and PostgreSQL. The application provides secure face-based authentication for attendance tracking with role-based access (user/admin) and company management features. It uses a modern tech stack with TypeScript, Drizzle ORM, and shadcn/ui components.

## System Architecture

The application follows a monorepo structure with clear separation between client, server, and shared code:

- **Frontend**: React SPA with TypeScript, Vite bundler, and shadcn/ui components
- **Backend**: Express.js REST API with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Shared**: Common schemas and types shared between client and server

## Key Components

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state, local storage for auth
- **UI Components**: shadcn/ui based on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **Build Tool**: Vite with hot module replacement

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM for type-safe database queries
- **Authentication**: Password hashing with bcrypt
- **Session Management**: In-memory storage (ready for database persistence)
- **API Pattern**: RESTful endpoints with consistent error handling

### Database Schema
Three main entities:
- **Users**: Authentication, role management, face data storage
- **Companies**: Company registration and management
- **Attendance Records**: Time tracking with face verification

### Authentication Flow
1. User registration with email/password
2. Role selection (user/admin)
3. Face data capture and registration
4. Company association (join existing or create new)
5. Attendance tracking with face verification

## Data Flow

1. **Registration Flow**: Email/password → Role selection → Face capture → Company setup
2. **Authentication**: Login with credentials → Face verification for attendance
3. **Attendance**: Face capture → Verification → Record creation
4. **Company Management**: Admin creates company → Generates code → Users join with code

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL adapter for serverless environments
- **drizzle-orm**: Type-safe ORM for database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Headless UI components for accessibility
- **react-hook-form**: Form state management with validation
- **zod**: Runtime type validation and schema definition
- **bcrypt**: Password hashing for security

### Development Tools
- **TypeScript**: Type safety across the stack
- **Vite**: Fast development server and bundler
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: Fast JavaScript bundler for production

## Deployment Strategy

The application is configured for deployment on Replit with:

- **Development**: `npm run dev` - Runs Vite dev server with Express backend
- **Production Build**: `npm run build` - Builds React app and bundles server
- **Production**: `npm run start` - Serves built application
- **Database**: PostgreSQL module enabled in Replit environment
- **Port Configuration**: Server runs on port 5000, proxied to port 80

### Build Process
1. Vite builds the React frontend to `dist/public`
2. ESBuild bundles the Express server to `dist/index.js`
3. Static files served from the dist directory in production

## Changelog

```
Changelog:
- June 20, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```