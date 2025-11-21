# Vysa - AI Visa Interview Practice Platform

An AI-powered visa interview simulation platform that helps applicants prepare for U.S. visa interviews with realistic practice sessions.

## 🚀 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Authentication**: [Clerk](https://clerk.com/)
- **Database**: [Prisma](https://www.prisma.io/) + [Neon Postgres](https://neon.tech/)
- **Voice AI**: [LiveKit](https://livekit.io/) - Real-time voice agent calls
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)

## ✨ Features

- ✅ **Authentication** - Complete auth solution with Clerk
  - Email/password authentication
  - Social logins (Google, GitHub, etc.)
  - User management and session handling
  - Protected routes with middleware
- ✅ **Database** - Type-safe database access
  - Prisma ORM with Neon Postgres
  - User model synced with Clerk via webhooks
  - Database migrations
- ✅ **Voice AI** - Real-time voice interactions
  - LiveKit integration for voice calls
  - Real-time transcription and chat
  - Microphone controls and audio visualization
  - Secure connections with authenticated users
- ✅ **UI/UX** - Beautiful, responsive design
  - Pre-configured shadcn/ui components
  - Tailwind CSS with custom configuration
  - Dark mode ready
  - Fully responsive layouts
- ✅ **Best Practices**
  - TypeScript for type safety
  - ESLint configuration
  - Proper project structure
  - Environment variable management

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- A Neon Postgres account ([sign up here](https://neon.tech/) - Free tier available!)
- A Clerk account ([sign up here](https://clerk.com/))
- Optional: A LiveKit account for voice AI features ([sign up here](https://cloud.livekit.io/))

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Update `.env.local` with your credentials:

```env
# Database - Get from https://console.neon.tech/
DATABASE_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"

# Clerk - Get from https://dashboard.clerk.com/
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# LiveKit (optional - for voice AI features)
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret

# Ragie - RAG for document retrieval
RAGIE_API_KEY=your_ragie_api_key

# AWS S3 - For interview recordings
AWS_S3_BUCKET=your-interview-recordings-bucket
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key

# OpenAI - For AI report generation
OPENAI_API_KEY=sk-your_openai_api_key
```

### 3. Set Up Clerk

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Create a new application
3. Copy the **Publishable Key** and **Secret Key** to `.env.local`
4. Configure the webhook:
   - Go to **Webhooks** in the Clerk dashboard
   - Add endpoint: `https://yourdomain.com/api/webhooks/clerk`
   - Subscribe to events: `user.created`, `user.updated`, `user.deleted`
   - Copy the webhook secret to `.env.local`

### 4. Set Up Neon Database

1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project (or use existing)
3. Copy your connection string from the dashboard
4. Paste it into `.env.local` as `DATABASE_URL`

Run Prisma migrations:

```bash
npx prisma migrate dev --name init
```

Generate Prisma Client:

```bash
npx prisma generate
```

**Note**: Neon's free tier includes:

- 3 projects
- 0.5 GB storage per project
- Automatic backups and branching

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
interview-app/
├── app/
│   ├── api/
│   │   └── webhooks/
│   │       └── clerk/          # Webhook for user sync
│   ├── dashboard/              # Protected dashboard page
│   ├── sign-in/                # Sign-in page
│   ├── sign-up/                # Sign-up page
│   ├── layout.tsx              # Root layout with ClerkProvider
│   └── page.tsx                # Landing page
├── components/
│   ├── ui/                     # shadcn/ui components
│   └── navbar.tsx              # Navigation component
├── lib/
│   ├── prisma.ts               # Prisma client singleton
│   └── utils.ts                # Utility functions
├── prisma/
│   └── schema.prisma           # Database schema
├── middleware.ts               # Route protection
└── .env.local                  # Environment variables
```

## 🔐 Authentication Flow

1. Users sign up/sign in through Clerk
2. Clerk webhook triggers on user events
3. User data is synced to your database
4. Protected routes check authentication via middleware

## 🗄️ Database Schema

The starter includes a User model synced with Clerk:

```prisma
model User {
  id        String   @id @default(uuid())
  clerkId   String   @unique
  email     String   @unique
  firstName String?
  lastName  String?
  imageUrl  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Extend this schema with your own models and relations.

## 🎨 Adding Components

Add new shadcn/ui components:

```bash
npx shadcn@latest add [component-name]
```

Example:

```bash
npx shadcn@latest add dialog
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma studio` - Open Prisma Studio (database GUI)
- `npx prisma migrate dev` - Create a new migration

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🚢 Deployment

### Deploy to Vercel

The easiest way to deploy is with [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables
4. Deploy

Don't forget to:

- Set up a production database
- Update Clerk webhook URL to your production domain
- Add production environment variables

### Environment Variables for Production

Ensure these are set in your hosting platform:

- `DATABASE_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SECRET`

## 🤝 Contributing

Feel free to fork this project and customize it for your needs!

## 📝 License

MIT

---

**Built with ❤️ using Next.js, Clerk, Prisma, and shadcn/ui**
