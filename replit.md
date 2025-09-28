# VerdantFlow

## Overview

VerdantFlow is a comprehensive business management application designed to streamline various organizational operations. Built with Next.js and React, it provides an integrated platform for customer management, employee tracking, stock control, and task oversight. The application features an AI-powered workflow optimizer that helps users optimize their business processes and includes dynamic theming with Light, Dark, and Cyberpunk themes.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: Next.js 15 with React 18 and TypeScript for type safety and modern React features including server components and app router.

**Styling**: Tailwind CSS with a comprehensive design system using CSS custom properties for theming. The application supports three themes (Light, Dark, Cyberpunk) with manual DOM manipulation replacing next-themes library to resolve hydration issues.

**UI Components**: Built on Radix UI primitives with custom shadcn/ui components, providing accessible and consistent interface elements throughout the application.

**State Management**: Client-side state managed through React hooks with real-time Firebase data synchronization.

### Backend Architecture

**Database**: Firebase Firestore as the primary NoSQL database for storing employees, tasks, inventory products, and user data.

**Authentication**: Firebase Auth handling user authentication with email/password login and signup flows.

**AI Integration**: Google AI (Genkit) integration for workflow optimization features, providing intelligent suggestions for business process improvements.

### Data Structure

**Collections**:
- `employees`: Staff management with roles, status tracking, and profile information
- `tasks`: Project management with assignees, priorities, due dates, and kanban-style sections
- `products`: Inventory management with stock levels, categories, and status tracking
- User authentication data managed by Firebase Auth

### Theme Management

**Custom Implementation**: Manual theme switching using direct DOM manipulation instead of next-themes to prevent hydration mismatches. Themes are persisted in localStorage and applied via CSS classes on the document element.

**Theme Options**: Light (default), Dark, and Cyberpunk themes with CSS custom properties for consistent color management.

### Performance Optimizations

**Image Optimization**: Next.js Image component with placeholder.co integration for development.

**Font Loading**: Inter font loaded via next/font/google for optimal performance and preventing layout shift.

**Build Configuration**: TypeScript and ESLint errors ignored during builds for development flexibility.

## External Dependencies

### Core Services

**Firebase**: Complete backend-as-a-service providing Firestore database, Authentication, and hosting infrastructure.

**Google AI (Genkit)**: AI service integration for workflow optimization features and intelligent business process suggestions.

### UI and Styling

**Radix UI**: Comprehensive set of accessible, unstyled UI primitives for building the component library.

**Tailwind CSS**: Utility-first CSS framework for styling with custom design tokens and theme support.

**Lucide React**: Icon library providing consistent iconography throughout the application.

### Development Tools

**Faker.js**: Test data generation for development and seeding database collections.

**React Hook Form**: Form state management with Zod schema validation for type-safe form handling.

**Date-fns**: Date manipulation and formatting utilities for handling due dates and timestamps.

### Additional Libraries

**Embla Carousel**: Carousel component for enhanced UI interactions.

**Class Variance Authority**: Type-safe component variant management for consistent styling patterns.

**React Day Picker**: Calendar component for date selection in forms.