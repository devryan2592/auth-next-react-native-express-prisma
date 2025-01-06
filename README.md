# Full Stack Authentication System

A modern, secure authentication system built with Next.js 14, React Native, Express.js, and PostgreSQL.

## 🚀 Tech Stack

### Backend
- **Node.js & Express.js** - Server framework
- **TypeScript** - Type safety and better developer experience
- **PostgreSQL** - Primary database
- **Prisma** - Type-safe ORM
- **Zod** - Runtime type validation
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Express Rate Limit** - API rate limiting
- **Winston** - Logging
- **Cors** - Cross-origin resource sharing

### Frontend (Web)
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Shadcn UI** - UI components
- **React Hook Form** - Form handling
- **Zod** - Form validation
- **React Query** - Server state management
- **Zustand** - Client state management

### Frontend (Mobile)
- **React Native** - Mobile framework
- **Expo** - Development platform
- **TypeScript** - Type safety

## 🛠️ Setup & Installation

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL
- pnpm (recommended) or npm

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Update .env with your database credentials

# Run database migrations
pnpm prisma migrate dev

# Start development server
pnpm dev
```

### Web Frontend Setup
```bash
# Navigate to web directory
cd web

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env

# Start development server
pnpm dev
```

### Mobile Setup
```bash
# Navigate to mobile directory
cd mobile

# Install dependencies
pnpm install

# Start Expo development server
pnpm start
```

## 🔒 Features

### Authentication
- [x] User registration with email
- [ ] Email verification
- [ ] Login with email/password
- [ ] Social authentication (Google, GitHub)
- [ ] Password reset flow
- [ ] Session management
- [ ] Refresh token rotation

### Security
- [x] Password hashing with bcrypt
- [x] Rate limiting
- [x] CORS protection
- [x] Input validation with Zod
- [x] Type safety with TypeScript
- [ ] JWT token management
- [ ] XSS protection
- [ ] CSRF protection

### API Features
- [x] Error handling middleware
- [x] Request validation
- [x] Rate limiting
- [ ] API documentation with Swagger
- [ ] Request logging

## 📁 Project Structure

### Backend
```
backend/
├── src/
│   ├── config/         # Configuration files
│   ├── constants/      # Constants and enums
│   ├── controllers/    # Route controllers
│   ├── middlewares/    # Express middlewares
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   └── validators/     # Request validators
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 