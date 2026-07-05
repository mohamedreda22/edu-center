# Rakan Institute Management System

Next.js-based comprehensive institute management system with role-based authentication, student/teacher management, payment processing, and activity logging.

## ⚠️ Security Warning
Do NOT run this system on a public domain without HTTPS. The application uses JWT tokens and authentication APIs that should be protected in production.

## Getting Started

First, install dependencies:
11
```bash
npm install
```

Then run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

This project uses:
- **Next.js 16.2.9** with App Router
- **TypeScript** with ESLint
- **Prisma** with PostgreSQL
- **Tailwind CSS** for styling
- **Zod** for input validation
- **bcrypt** for password hashing
- **jsonwebtoken** for JWT authentication
- **@tanstack/react-query** for data fetching
- **@upstash/ratelimit** for rate limiting

The system is organized into:
- `app/` - Next.js application routes (authentication, dashboard, student management)
- `components/` - UI components (forms, tables, modals)
- `lib/` - Core services (database, validation, logging, utilities)
- `prisma/` - Database schema and migrations
- `hooks/` - Custom React hooks
- `automation/` - Automation scripts
- `cron/` - Cron job management

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
