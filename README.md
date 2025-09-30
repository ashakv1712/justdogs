# Just Dogs Training App 🐕

A comprehensive dog training management application for Just Dogs, a Cape Town-based dog training company. This app helps trainers, parents, and administrators manage training sessions, dog profiles, scheduling, billing, and communication.

## Features

### 🏠 **Role-Based Access**
- **Admin**: Full system access, revenue tracking, user management
- **Trainer**: Session management, dog feedback, scheduling
- **Parent**: Dog profiles, booking sessions, viewing feedback

### 🐾 **Dog & Owner Management**
- Complete dog profiles with medical/behavioral notes
- Vaccine records and emergency contacts
- Photo uploads and preferences

### 📅 **Scheduling & Bookings**
- Recurring weekly schedules
- Session booking with special instructions
- Calendar views for all roles
- Double-booking prevention

### 📝 **Session Feedback**
- Trainer notes with categories and prompts
- Progress tracking and photo uploads
- Voice-to-text support (future enhancement)

### 💰 **Billing & Invoicing**
- South African Rands (ZAR) support
- Invoice generation and payment tracking
- Payment proof submission
- Revenue reports for admins

### 💬 **Communication**
- Internal messaging system
- Role-based announcements
- Email notifications

### 📊 **Dashboards**
- Role-specific dashboards with key metrics
- Quick actions and overviews
- Mobile-responsive design

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4, Headless UI
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React, Heroicons
- **Date Handling**: date-fns

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd jsdog
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your Supabase credentials in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Protected dashboard routes
│   ├── api/               # API routes
│   └── globals.css        # Global styles
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   ├── forms/            # Form components
│   └── dashboard/        # Dashboard-specific components
├── lib/                  # Utility functions
│   ├── supabase/         # Supabase client & helpers
│   ├── auth/             # Authentication utilities
│   └── utils/            # General utilities
├── types/                # TypeScript type definitions
└── hooks/                # Custom React hooks
```

## Database Schema

The app uses Supabase with the following main tables:
- `users` - User accounts with role-based access
- `dogs` - Dog profiles and information
- `bookings` - Training session bookings
- `sessions` - Session feedback and notes
- `invoices` - Billing and payment tracking
- `messages` - Internal communication

## Deployment

The app is designed to be deployed on Vercel with Supabase as the backend. Environment variables should be configured in the deployment platform.

## Contributing

This is a real-world project for Just Dogs. Please follow the established coding standards and ensure all features are mobile-responsive and optimized for low data usage in South Africa.

## License

This project is proprietary to Just Dogs and Strive.
