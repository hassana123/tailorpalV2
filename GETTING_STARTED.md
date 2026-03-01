# Getting Started with TailorPal

Welcome to your upgraded TailorPal platform! This guide will help you get up and running quickly.

## What You Have

A complete, production-ready fashion shop management platform with:
- Multi-tenant architecture (multiple shops)
- AI-powered voice assistant
- Marketplace for discovering shops
- Staff collaboration system
- Customer and order management
- All secured with Supabase Row Level Security

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Supabase

You already have Supabase connected via the v0 integration. The database schema is ready to use.

### 3. Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Create Your First Shop

1. Click "Get Started" on the home page
2. Sign up with email and password
3. Choose "Shop Owner" as your role
4. Fill in shop details on the setup page
5. Your shop dashboard is ready!

## Key User Flows

### For Shop Owners

**First Time Setup:**
1. Sign up → Choose "Shop Owner" → Create Shop → Start using!

**Daily Operations:**
1. Go to `/dashboard/shop`
2. Add customers in "Customers" section
3. Create orders in "Orders" section
4. Record measurements using Voice Assistant or manual entry
5. Invite staff members

**Using Voice Assistant:**
1. Navigate to `/dashboard/shop/[shopId]/voice-assistant`
2. Click "Start Listening"
3. Say commands like "Add customer John Smith"
4. Wait for confirmation

### For Staff Members

**Getting Started:**
1. Shop owner sends invitation via email
2. You create account with same email
3. Click "Accept Invitation" on dashboard
4. You now have access to the shop

**Daily Work:**
1. Go to `/dashboard/staff`
2. Select your shop
3. View customers, orders, measurements
4. Use voice assistant to record measurements

### For Customers

**Discovering Shops:**
1. Visit `/marketplace`
2. Search for shops by name
3. View shop profiles and reviews
4. Leave your own review

## File Structure Overview

```
tailorpal/
├── app/
│   ├── page.tsx              ← Home page starts here
│   ├── auth/login            ← Login flow
│   ├── auth/sign-up          ← Registration flow
│   ├── auth/choose-role      ← Role selection
│   ├── dashboard/shop        ← Shop owner interface
│   ├── dashboard/staff       ← Staff interface
│   └── marketplace/          ← Public marketplace
├── components/
│   └── voice-assistant.tsx   ← Voice AI component
├── lib/
│   ├── supabase/client.ts    ← Browser Supabase client
│   └── utils/                ← Business logic helpers
└── .env.local               ← Your environment variables
```

## Common Tasks

### Add a New Page

1. Create file in `app/your-page/page.tsx`
2. Export default React component
3. Next.js automatically routes it

Example:
```tsx
export default function YourPage() {
  return <div>Hello World</div>
}
```

### Add an API Endpoint

1. Create file in `app/api/your-endpoint/route.ts`
2. Export `GET` or `POST` function
3. Use Supabase client to access database

Example:
```tsx
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data } = await supabase.from('shops').select('*')
  return Response.json(data)
}
```

### Add a Component

1. Create file in `components/my-component.tsx`
2. Build reusable React component
3. Import and use in pages

Example:
```tsx
export function MyComponent() {
  return <div>My Component</div>
}
```

### Use Voice Assistant

The voice assistant is already integrated. To use it:

1. Import the component:
```tsx
import { VoiceAssistant } from '@/components/voice-assistant'

export default function MyPage() {
  return <VoiceAssistant shopId="shop-123" />
}
```

## Database Schema

Key tables you'll work with:

**profiles** - User information
```sql
id (uuid)
email (string)
user_type ('shop_owner' | 'staff' | 'customer')
```

**shops** - Business information
```sql
id (uuid)
name (string)
description (string)
owner_id (uuid) - references profiles.id
```

**customers** - Customer information
```sql
id (uuid)
shop_id (uuid)
name (string)
email (string)
phone (string)
```

**orders** - Orders
```sql
id (uuid)
shop_id (uuid)
customer_id (uuid)
description (string)
status ('pending' | 'in-progress' | 'completed')
```

**measurements** - Customer measurements
```sql
id (uuid)
shop_id (uuid)
customer_id (uuid)
chest (number)
waist (number)
hips (number)
status ('pending' | 'completed')
```

## Accessing Data from Supabase

### Server Component (recommended for data)

```tsx
import { createClient } from '@/lib/supabase/server'

export default async function MyPage() {
  const supabase = await createClient()
  
  const { data: shops } = await supabase
    .from('shops')
    .select('*')
  
  return <div>{/* Use shops data */}</div>
}
```

### Client Component (for interactivity)

```tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function MyComponent() {
  const [data, setData] = useState(null)
  const supabase = createClient()
  
  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('shops').select('*')
      setData(data)
    }
    fetchData()
  }, [])
  
  return <div>{/* Use data */}</div>
}
```

## Styling

Use Tailwind CSS classes:

```tsx
<div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
  <h1 className="text-2xl font-bold">Hello</h1>
  <p className="text-muted-foreground">Subtitle</p>
</div>
```

Or use shadcn/ui components:

```tsx
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function MyPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Card</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Click me</Button>
      </CardContent>
    </Card>
  )
}
```

## Environment Variables

Already configured in v0. But if deploying elsewhere, add:

```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

Never commit `.env.local` - it's in `.gitignore`.

## Debugging

### Console Logs

```tsx
'use client'

export default function MyComponent() {
  console.log('This appears in browser console')
  return <div>Hello</div>
}
```

### Check Supabase Data

1. Go to Supabase Dashboard
2. Click "SQL Editor"
3. Run queries to inspect data
4. Check Row Level Security policies

### Check API Routes

Test with curl:
```bash
curl http://localhost:3000/api/shops/create \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"name":"My Shop"}'
```

## Common Issues

### "Cannot find module '@/lib/supabase/client'"

Make sure the file exists at `lib/supabase/client.ts`. If not, you may need to set up Supabase clients.

### "Row Level Security (RLS) violation"

This means the user doesn't have permission to access that data. Check:
1. User is authenticated
2. User is part of the shop
3. RLS policy allows the operation

### Voice Assistant not working

Check:
1. Browser supports Web Speech API (Chrome, Edge, Safari)
2. Microphone permissions granted
3. Network request to `/api/voice/process` succeeds

### Styles not applying

Make sure Tailwind CSS is imported:
- `app/globals.css` is in your layout
- Layout imports `globals.css`
- Tailwind config includes your `app` directory

## Next Steps

1. **Explore the existing code** - Read through the pages and components
2. **Make your first change** - Edit a color, text, or component
3. **Commit to GitHub** - Push your changes
4. **Deploy to Vercel** - One-click deployment
5. **Share with users** - Get feedback and iterate

## Useful Commands

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linter
pnpm lint

# Format code
pnpm format

# Type check
pnpm type-check
```

## Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [shadcn/ui Components](https://ui.shadcn.com)

## Getting Help

When stuck:

1. **Check the code** - Read similar implementations
2. **Check browser console** - Look for error messages
3. **Check Supabase logs** - See if database is accessible
4. **Read documentation** - Official docs have most answers
5. **Ask for help** - Reach out to support

## You're Ready!

Your TailorPal platform is fully functional and ready for development. Start by exploring the application, then begin customizing it for your needs.

**Happy building!**
