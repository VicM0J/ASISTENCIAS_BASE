# Overview

TimeCheck Pro is a tablet-optimized attendance management system for employee check-in/check-out tracking. The application enables automatic barcode scanning via camera or physical USB/Bluetooth scanners to record employee attendance instantly, manage work schedules, generate employee credentials, and export attendance reports. It's designed as a full-stack web application with a React frontend and Express backend, optimized for real-world deployment scenarios.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite for build tooling
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: React Query (TanStack Query) for server state and caching
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod schema validation

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Schema Validation**: Zod schemas shared between frontend and backend
- **File Handling**: Multer for image uploads (employee photos)
- **Development**: Hot reload with Vite integration in development mode

## Data Storage
- **Database**: PostgreSQL with Neon serverless connection
- **Schema Design**: 
  - Employees table with barcode data and work schedule references
  - Work schedules with configurable time slots (entry, breaks, lunch, exit)
  - Attendance records with timestamp tracking for all events
  - Credential and system settings for customization
- **Migrations**: Drizzle Kit for database schema management

## Key Features
- **Barcode Scanning**: Camera-based and physical scanner support for employee identification
- **Automatic Attendance Registration**: Physical scanners automatically register attendance without user interaction
- **Attendance Tracking**: Complete check-in/check-out flow with break and lunch time tracking
- **Employee Management**: CRUD operations with photo upload and department organization
- **Department Management**: Full CRUD operations for organizational departments
- **Work Schedule Management**: Configurable schedules with overtime support
- **Credential Generation**: Customizable employee ID card creation with branding
- **Reporting**: Excel export functionality with filtering options
- **Tablet Optimization**: Responsive design optimized for tablet interfaces

## Authentication & Security
- **Session Management**: Express sessions with PostgreSQL storage
- **File Upload Security**: Multer with file type validation and size limits
- **Input Validation**: Zod schemas for all data inputs
- **CORS**: Configured for cross-origin requests in development

# External Dependencies

## Core Framework Dependencies
- **React & TypeScript**: Frontend framework with type safety
- **Express.js**: Backend web framework
- **Vite**: Frontend build tool and development server

## Database & ORM
- **@neondatabase/serverless**: PostgreSQL serverless database connection
- **drizzle-orm**: Type-safe ORM for database operations
- **drizzle-kit**: Database migration and schema management
- **connect-pg-simple**: PostgreSQL session store for Express

## UI Components & Styling
- **@radix-ui/***: Headless UI components for accessibility
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library

## Form Handling & Validation
- **react-hook-form**: Form state management
- **@hookform/resolvers**: Form validation resolvers
- **zod**: Schema validation library
- **drizzle-zod**: Integration between Drizzle and Zod

## State Management & Data Fetching
- **@tanstack/react-query**: Server state management and caching
- **wouter**: Lightweight client-side routing

## File Handling
- **multer**: File upload middleware for Express
- **@types/multer**: TypeScript definitions for Multer

## Development Tools
- **tsx**: TypeScript execution for Node.js
- **esbuild**: Fast JavaScript bundler for production builds
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay
- **@replit/vite-plugin-cartographer**: Replit development integration

## Date & Time
- **date-fns**: Modern date utility library for JavaScript

## Additional Utilities
- **ws**: WebSocket library for Neon database connections
- **clsx**: Utility for constructing className strings
- **cmdk**: Command menu component