# AI Visibility Tracker

A Next.js application for tracking AI visibility across platforms with Better Auth authentication.

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- **Next.js 15** with App Router
- **Better Auth** for authentication (email/password + social providers)
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Radix UI** components
- **Framer Motion** for animations
- **Recharts** for data visualization

## Authentication Setup

This project uses Better Auth for authentication. To enable social providers:

1. Create OAuth apps for GitHub and Google
2. Add the credentials to `.env.local`:

```env
BETTER_AUTH_SECRET=your-secret-key-change-this-in-production
BETTER_AUTH_URL=http://localhost:3000

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth routes (login, signup)
│   ├── api/               # API routes
│   ├── category/          # Category pages
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── charts/           # Chart components
│   ├── layout/           # Layout components
│   ├── ui/               # UI components (Radix)
│   └── ui-custom/        # Custom UI components
├── data/                 # Mock data
├── lib/                  # Utilities and auth
└── types/                # TypeScript types
```

## Build

To create a production build:

```bash
npm run build
npm start
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Better Auth Documentation](https://better-auth.com)
- [Tailwind CSS](https://tailwindcss.com)
