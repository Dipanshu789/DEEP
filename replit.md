# Smart Attendance System - Enterprise Edition

## Overview

This is a comprehensive enterprise-level attendance management system built with React, Express, and PostgreSQL. The application provides secure face-based authentication for attendance tracking with advanced role-based access (user/admin/super_admin) and extensive company management features. The system is designed to handle thousands of employees across multiple departments with full audit trails, analytics, and compliance features.

## System Architecture

The application follows a monorepo structure with clear separation between client, server, and shared code:

- **Frontend**: React SPA with TypeScript, Vite bundler, and shadcn/ui components
- **Backend**: Express.js REST API with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Shared**: Common schemas and types shared between client and server

## Enterprise Features

### Advanced User Management
- **Multi-Role System**: user/admin/super_admin with granular permissions
- **Department Structure**: Hierarchical organization with department managers
- **Employee Profiles**: Extended user data including position, department, contact info
- **Activity Tracking**: Last login, registration status, account activation controls

### Comprehensive Attendance System
- **Real-time Check-in/Check-out**: GPS location tracking and device fingerprinting
- **Face Verification**: Secure biometric authentication with liveness detection
- **Flexible Scheduling**: Configurable working hours, time zones, and holiday management
- **Status Management**: Present, late, absent, half-day with automated calculations
- **Manual Override**: Admin approval system for attendance corrections

### Enterprise Analytics & Reporting
- **Dashboard Analytics**: Real-time attendance rates, department performance metrics
- **Trend Analysis**: Weekly, monthly attendance patterns and productivity insights
- **Custom Reports**: Exportable data with date range filtering and department breakdowns
- **Audit Trails**: Complete activity logging for compliance and security monitoring

### Security & Compliance
- **Audit Logging**: Complete user activity tracking with IP addresses and device info
- **Data Encryption**: Secure storage of biometric data and sensitive information
- **Role-based Access**: Granular permission system for different organizational levels
- **Session Management**: Secure authentication with token-based sessions

### Company Configuration
- **Working Hours Management**: Flexible schedule configuration per company
- **Policy Settings**: Late thresholds, face verification requirements, manual entry controls
- **Geo-fencing**: Location-based attendance verification
- **Subscription Tiers**: Basic, premium, enterprise with different feature sets

### Key Components

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter with role-based dashboard routing
- **State Management**: TanStack Query for server state, local storage for auth
- **UI Components**: shadcn/ui based on Radix UI primitives with enterprise themes
- **Styling**: Tailwind CSS with glassmorphic and neumorphic design system
- **Build Tool**: Vite with hot module replacement

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM for type-safe database queries
- **Authentication**: bcrypt password hashing with secure session management
- **Session Management**: In-memory storage with enterprise-grade persistence ready
- **API Pattern**: RESTful endpoints with comprehensive error handling and logging

### Enterprise Database Schema
- **Users**: Extended profiles with department, position, activity tracking
- **Companies**: Full company management with settings, subscription tiers
- **Departments**: Hierarchical organization structure with managers
- **Attendance Records**: Comprehensive tracking with location, device, and status data
- **Audit Logs**: Complete activity trail for security and compliance
- **Company Settings**: Configurable policies, working hours, and preferences

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