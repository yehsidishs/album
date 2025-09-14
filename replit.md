# Overview

Endlessalbum is a couple-oriented memory sharing application built for creating and managing shared memories between partners. The application features a role-based system where one user creates an account as the main administrator and can invite a second user through an invitation code system. The platform combines social media elements with personal relationship tools, including memory feeds, private chat, counters/timers, wishlists, and comprehensive account management.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is built with React and TypeScript using a modern component-based architecture. The UI leverages Radix UI primitives with shadcn/ui components for consistent design patterns. The application uses Wouter for client-side routing and TanStack Query for state management and API communication. The design system implements a glassmorphism aesthetic with dark/light theme support and custom CSS variables for theming.

## Backend Architecture
The backend uses Express.js with TypeScript in an ESM environment. The server implements RESTful APIs with WebSocket support for real-time features like chat. Authentication is handled through traditional sessions with Passport.js, supporting both local authentication and Google OAuth integration. The API follows RESTful conventions with proper error handling and request validation using Zod schemas.

## Database Design
The application uses PostgreSQL with Drizzle ORM for type-safe database operations. The schema is centered around a multi-tenant architecture where accounts contain multiple users with different roles (main_admin, co_admin, guest). Key entities include users, accounts, memories, chat messages, counters, wishlists, and invitations. The database supports complex relationships for memory sharing permissions and role-based access control.

## Authentication & Authorization
The system implements a dual-layer authentication approach: session-based authentication for the web application and role-based authorization within accounts. Users can authenticate via email/password or Google OAuth. The invitation system allows controlled account access through unique codes. Roles determine feature access levels, with main administrators having full control over invitations and permissions.

## Real-time Features
WebSocket integration provides real-time chat functionality with support for different message types including ephemeral content. The WebSocket connection manages user presence, message delivery, and live updates across the application. Connection management includes automatic reconnection logic for robust real-time experiences.

## File Storage & Media
The application supports various content types for memories including photos, videos, and text-based content. Memory objects use flexible JSON storage for different content types while maintaining type safety through TypeScript interfaces.

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL database using the `@neondatabase/serverless` driver for connection pooling and edge compatibility
- **Drizzle ORM**: Type-safe database toolkit with PostgreSQL dialect for schema management and migrations

## Authentication Services
- **Google OAuth 2.0**: Social authentication integration using `passport-google-oauth20` strategy for seamless user onboarding
- **Session Management**: Express sessions with PostgreSQL storage via `connect-pg-simple` for persistent authentication

## Email Services
- **MailerSend**: Transactional email service for user verification, password resets, and notification delivery

## Development & Build Tools
- **Vite**: Frontend build tool with React plugin for fast development and optimized production builds
- **Replit Integration**: Development environment integration with runtime error overlay and cartographer plugins
- **esbuild**: Backend bundling for Node.js deployment with ESM support

## UI & Design Dependencies
- **Radix UI**: Unstyled, accessible UI primitives for building the component system
- **Tailwind CSS**: Utility-first CSS framework with custom design system configuration
- **Lucide Icons**: Consistent icon library for UI elements and navigation

## Real-time & State Management
- **WebSocket (ws)**: Native WebSocket implementation for real-time chat and live features
- **TanStack Query**: Server state management with caching, synchronization, and optimistic updates
- **React Hook Form**: Form state management with Zod validation integration

## Date & Utility Libraries
- **date-fns**: Date manipulation and formatting with internationalization support (Russian locale)
- **bcrypt**: Password hashing for secure authentication storage
- **nanoid**: URL-safe unique ID generation for various entities