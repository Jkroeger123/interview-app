# Quick Setup Guide

Follow these steps to get your app running:

## 1. Set Up Clerk (5 minutes)

1. Visit [https://dashboard.clerk.com/](https://dashboard.clerk.com/)
2. Create a new application (select Next.js)
3. Copy your keys:
   - **Publishable Key** (starts with `pk_test_`)
   - **Secret Key** (starts with `sk_test_`)

## 2. Update Environment Variables

Open `.env.local` and add your Clerk keys:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_[your_key_here]
CLERK_SECRET_KEY=sk_test_[your_key_here]
```

## 3. Set Up Neon Database (Optional for now)

You can skip this initially and come back to it later. The app will work with Clerk auth only.

If you want to set up the database now:

1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project (free tier works great!)
3. Copy your connection string
4. Update `DATABASE_URL` in `.env.local`
5. Run migrations:

```bash
npm run db:migrate
```

**Why Neon?**

- Serverless Postgres (perfect for Next.js)
- Auto-scaling and hibernation
- Free tier with 3 projects
- Built-in connection pooling
- Database branching for development

## 4. Run the App

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 5. Test Authentication

1. Click "Get Started" or "Sign In"
2. Create an account
3. You'll be redirected to the dashboard
4. Try signing out and back in

## 🎉 That's it!

You now have a fully functional authenticated Next.js app!

## Next Steps

- **Add Database**: Follow step 3 above to enable database functionality
- **Set Up Webhook**: Configure Clerk webhook to sync users to database
  - Go to Clerk Dashboard > Webhooks
  - Add endpoint: `http://localhost:3000/api/webhooks/clerk` (for local testing with ngrok)
  - Subscribe to: `user.created`, `user.updated`, `user.deleted`
  - Copy the webhook secret to `.env.local`
- **Customize**:
  - Modify the landing page in `app/page.tsx`
  - Update the dashboard in `app/dashboard/page.tsx`
  - Add new pages and components
  - Extend the Prisma schema with your models

## Troubleshooting

### Clerk Not Working

- Make sure your keys are correct in `.env.local`
- Restart the dev server after changing environment variables

### Database Errors

- Verify your Neon connection string is correct
- Check DATABASE_URL format: `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`
- Run `npm run db:generate` after schema changes
- Make sure your Neon project is active (it auto-hibernates when idle)

### Build Errors

- Run `npm run lint` to check for issues
- Make sure all dependencies are installed: `npm install`

## Resources

- [Full README](./README.md) - Complete documentation
- [Clerk Docs](https://clerk.com/docs/quickstarts/nextjs)
- [Prisma Docs](https://www.prisma.io/docs/getting-started)
- [shadcn/ui Docs](https://ui.shadcn.com/)
