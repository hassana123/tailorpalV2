# TailorPal Quick Reference Card

## 🚀 Start Here

```bash
npm install
npm run dev
# Visit http://localhost:3000
```

## 📍 Key URLs

| URL | Purpose |
|-----|---------|
| `/` | Home landing page |
| `/auth/login` | User login |
| `/auth/sign-up` | New user registration |
| `/auth/choose-role` | Select user type |
| `/dashboard/shop` | Shop owner dashboard |
| `/dashboard/shop/[shopId]/customers` | Customer management |
| `/dashboard/shop/[shopId]/orders` | Order management |
| `/dashboard/shop/[shopId]/measurements` | Measurements |
| `/dashboard/shop/[shopId]/staff` | Staff management |
| `/dashboard/shop/[shopId]/voice-assistant` | Voice AI |
| `/dashboard/staff` | Staff dashboard |
| `/marketplace` | Public shop marketplace |
| `/marketplace/shop/[shopId]` | Shop profile |

## 🔑 Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

## 📁 Directory Structure

```
app/                    Main application
├── auth/              Auth pages
├── dashboard/         Protected dashboards
├── marketplace/       Public marketplace
└── api/               Backend routes

components/           React components
lib/                  Utilities & config
  ├── supabase/       DB clients
  └── utils/          Business logic

scripts/              Database scripts
proxy.ts            Auth/session proxy
```

## 🗄️ Database Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User info & roles |
| `shops` | Business info |
| `shop_staff` | Staff assignments |
| `customers` | Customer data |
| `orders` | Order records |
| `measurements` | Measurement data |
| `shop_ratings` | Reviews & ratings |

## 🔒 User Roles

| Role | Access |
|------|--------|
| **shop_owner** | Full shop control |
| **staff** | Assigned shop only |
| **customer** | Marketplace only |

## 💡 Common Code Patterns

### Fetch Data (Server Component)
```tsx
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()
  const { data } = await supabase.from('shops').select('*')
  return <div>{data?.length} shops</div>
}
```

### Fetch Data (Client Component)
```tsx
'use client'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function Component() {
  const [data, setData] = useState(null)
  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('shops').select('*')
      setData(data)
    }
    fetch()
  }, [])
  return <div>{data?.length}</div>
}
```

### API Route
```tsx
// app/api/shops/route.ts
export async function POST(req: Request) {
  const { name } = await req.json()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('shops')
    .insert([{ name }])
  return Response.json(data)
}
```

### Add UI Component
```tsx
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function MyComponent() {
  return (
    <Card>
      <CardHeader>Title</CardHeader>
      <CardContent>
        <Button>Click me</Button>
      </CardContent>
    </Card>
  )
}
```

## 🎨 Tailwind Classes Cheatsheet

```tsx
// Spacing
p-4 m-2 mb-8 gap-4

// Text
text-lg font-bold text-muted-foreground

// Colors
bg-primary bg-muted border-border

// Layout
flex items-center justify-between
grid grid-cols-3 gap-4

// Responsive
md:text-xl lg:flex-row

// Effects
shadow-lg rounded-lg hover:shadow-xl
```

## 🔐 RLS Policies

All data is protected by Row Level Security:
- Users can only see their own data
- Staff can only see their assigned shop
- Customers can only see public marketplace

## 🧪 Test User Flows

### Create Shop Owner
1. Sign up: `owner@test.com`
2. Choose: Shop Owner
3. Create shop: Fill details
4. Go to: `/dashboard/shop`

### Create Staff
1. Sign up: `staff@test.com`
2. Shop owner invites: `staff@test.com`
3. Staff accepts invitation
4. Go to: `/dashboard/staff`

### Browse Marketplace
1. Sign out or new browser
2. Visit: `/marketplace`
3. Browse shops
4. Click shop name to see profile

### Use Voice Assistant
1. Go to: `/dashboard/shop/[id]/voice-assistant`
2. Click: "Start Listening"
3. Say: "Add customer John Smith"
4. Listen for confirmation

## 📊 Common Queries

### Get All Shops
```sql
SELECT * FROM shops;
```

### Get Shop Customers
```sql
SELECT * FROM customers WHERE shop_id = 'xyz';
```

### Get Shop Orders
```sql
SELECT * FROM orders WHERE shop_id = 'xyz';
```

### Get Shop Staff
```sql
SELECT * FROM shop_staff WHERE shop_id = 'xyz';
```

### Get Reviews for Shop
```sql
SELECT * FROM shop_ratings WHERE shop_id = 'xyz';
```

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| Module not found | Check file paths use `@/` |
| RLS error | Check user is authenticated |
| Voice not working | Check browser supports Web Speech API |
| Env vars not loading | Restart dev server |
| Style not applying | Check Tailwind config includes file |
| Database error | Check Row Level Security policies |

## 📝 File Naming

- Pages: `page.tsx` (in `app/` structure)
- Components: `my-component.tsx` (kebab-case)
- Utilities: `my-utility.ts` (kebab-case)
- API routes: `route.ts` (not `api.ts`)

## 🔄 Git Workflow

```bash
# Create branch
git checkout -b feature/my-feature

# Make changes
# ... edit files ...

# Commit
git add .
git commit -m "Add my feature"

# Push
git push origin feature/my-feature

# Create Pull Request on GitHub
```

## 🚀 Deploy Commands

```bash
# Build
npm run build

# Start production
npm run start

# Check lint
npm run lint

# Type check
npm run typecheck
```

## 📚 Documentation Files

- **README.md** - Project overview
- **GETTING_STARTED.md** - Setup guide
- **DEPLOYMENT.md** - Deploy to production
- **BUILD_SUMMARY.md** - Feature details
- **PROJECT_COMPLETE.md** - Full summary
- **QUICK_REFERENCE.md** - This file!

## 🎯 Next Features to Add

- [ ] Payment processing
- [ ] Email notifications
- [ ] Advanced analytics
- [ ] Mobile app
- [ ] Video consultations
- [ ] Inventory system
- [ ] Delivery tracking

## 💻 Useful VS Code Extensions

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Thunder Client (API testing)
- PostgreSQL

## 🔗 Important Links

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [TypeScript](https://www.typescriptlang.org)

## 📞 Support Resources

1. Check GETTING_STARTED.md
2. Read inline code comments
3. Check browser console for errors
4. Review Supabase dashboard
5. Read official documentation

## ✅ Pre-Deployment Checklist

- [ ] All features tested locally
- [ ] Environment variables configured
- [ ] Database schema migrated
- [ ] No console errors
- [ ] TypeScript strict mode passes
- [ ] README updated with your info
- [ ] GitHub repository created
- [ ] Vercel account ready
- [ ] Custom domain ready (optional)
- [ ] Email setup configured (optional)

## 🎉 You're Ready!

Start with:
```bash
npm run dev
```

Then visit:
```
http://localhost:3000
```

**Enjoy building!** 🚀
