# Overview

This is a comprehensive employee attendance management system designed specifically for tablet interfaces. The application serves as a check-in/check-out system that allows employees to register their attendance by scanning barcodes from their ID cards using either a device camera or physical barcode scanner. The system provides complete employee management, schedule configuration, attendance tracking, and reporting capabilities with a modern React frontend and Express backend architecture.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **UI Components**: Radix UI primitives with shadcn/ui component library for consistent, accessible design
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design optimized for tablet interfaces
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized production builds
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

## Backend Architecture
- **Runtime**: Node.js with Express.js framework for REST API endpoints
- **Database**: SQLite with Drizzle ORM for type-safe database operations and schema management
- **File Processing**: Multer for handling file uploads (employee photos, company logos)
- **Barcode Generation**: Canvas and JsBarcode for generating employee ID barcodes
- **Excel Export**: ExcelJS for generating attendance reports in spreadsheet format
- **Development**: TSX for TypeScript execution and hot reloading

## Data Layer
- **ORM**: Drizzle ORM with SQLite dialect for type-safe database queries
- **Schema Management**: Drizzle Kit for database migrations and schema synchronization
- **Database Structure**: Four main tables (companies, schedules, employees, attendances) with proper foreign key relationships
- **File Storage**: Binary data stored directly in database (photos, logos) with memory-based file uploads

## Key Features Architecture
- **Barcode Scanning**: Browser camera API integration with fallback to manual input
- **Tablet Optimization**: Touch-friendly interface with responsive design and gesture support
- **Real-time Updates**: Polling-based data refresh for attendance status updates
- **Photo Management**: Image upload, processing, and display with preview functionality
- **Schedule Management**: Flexible work schedule configuration with break times and overtime settings
- **Reporting System**: Dynamic date range filtering with Excel export capabilities

## Authentication & Security
- **Session Management**: Express sessions with PostgreSQL session store configuration
- **File Upload Security**: Size limits and type validation for uploaded files
- **Input Validation**: Zod schemas for both client and server-side validation
- **Error Handling**: Comprehensive error boundaries and API error responses

# External Dependencies

## Database Services
- **SQLite**: Local file-based database for data persistence
- **Better SQLite3**: High-performance SQLite driver for Node.js
- **Neon Database**: PostgreSQL serverless database service (configured but not actively used in current SQLite implementation)

## UI & Design Libraries
- **Radix UI**: Comprehensive set of accessible, unstyled UI primitives
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Lucide React**: Consistent icon library for UI elements
- **Class Variance Authority**: Type-safe utility for component variants
- **SweetAlert2**: Enhanced modal dialogs for user feedback

## Development & Build Tools
- **Vite**: Modern build tool with HMR and optimized bundling
- **TypeScript**: Static type checking and enhanced developer experience
- **Replit Integration**: Development environment plugins and runtime error overlay

## File Processing Libraries
- **Canvas**: Server-side canvas implementation for barcode generation
- **ExcelJS**: Excel file generation and manipulation
- **JsBarcode**: Barcode generation library for employee ID cards

## Validation & Forms
- **Zod**: TypeScript-first schema validation library
- **React Hook Form**: Performant forms library with minimal re-renders
- **Hookform Resolvers**: Integration between React Hook Form and Zod validation