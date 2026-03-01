# TailorPal - Fashion Shop Management Platform & Marketplace

Professional fashion shop management platform with AI-powered voice assistance, multi-tenant architecture, and marketplace for discovering top designers and tailors.

## Overview

TailorPal is a comprehensive, scalable platform designed for fashion designers, tailors, and fashion entrepreneurs. It provides powerful tools for shop management, team collaboration, customer engagement, and business analytics - all enhanced with AI voice assistance.

### Key Features

**For Shop Owners:**
- **Shop Management** - Create and customize your shop profile
- **Staff Management** - Invite team members with email-based invitations
- **Customer Management** - Organize customer profiles with contact information
- **Order Management** - Create, track, and manage customer orders
- **Measurement Tracking** - Record and store accurate customer measurements
- **Voice AI Assistant** - Use voice commands to perform tasks hands-free
- **Analytics Dashboard** - Track business metrics and performance

**For Customers:**
- **Marketplace Discovery** - Browse featured shops and designers
- **Shop Search** - Find shops by name, style, or specialty
- **Ratings & Reviews** - Leave reviews and see ratings from other customers
- **Shop Profiles** - View detailed shop information

## Technology Stack

### Frontend
- **Next.js 16** - React framework with server/client components
- **React 19** - Latest React with improved features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality UI components
- **Recharts** - Data visualization

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Server Actions** - Type-safe server mutations

### Database & Auth
- **Supabase (PostgreSQL)** - Relational database
- **Row Level Security (RLS)** - Data isolation and security
- **Supabase Auth** - Authentication & authorization

### AI & Voice
- **Groq LLM** - Fast AI inference
- **Vercel AI Gateway** - Model abstraction
- **Web Speech API** - Voice input/output
- **AI SDK 6** - Unified AI interface

## Installation & Setup

### Prerequisites
- Node.js 20+ and npm
- Supabase account
- Git

### Quick Start

1. **Clone and Install**
```bash
git clone <repository-url>
cd tailorpal
npm install
```

2. **Environment Setup**
```bash
cp .env.example .env.local
```

Update `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. **Database Setup**
The database schema is automatically configured in Supabase with:
- User authentication via Supabase Auth
- Multi-tenant shop isolation
- Staff and customer management
- Orders and measurements tracking
- Reviews and ratings system
- Row Level Security for data protection

4. **Run Development Server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

5. **Build for Production**
```bash
npm run build
npm run start
```

## Project Structure

```
tailorpal/
├── app/
│   ├── auth/                      # Authentication pages
│   │   ├── login/
│   │   ├── sign-up/
│   │   ├── choose-role/          # User type selection
│   │   └── layout.tsx            # Auth layout
│   ├── dashboard/
│   │   ├── shop/                 # Shop owner dashboard
│   │   │   ├── setup/            # Shop creation
│   │   │   ├── [shopId]/
│   │   │   │   ├── customers/
│   │   │   │   ├── orders/
│   │   │   │   ├── measurements/
│   │   │   │   ├── staff/
│   │   │   │   └── voice-assistant/
│   │   │   └── layout.tsx
│   │   └── staff/                # Staff dashboard
│   │       ├── onboarding/       # Invitation acceptance
│   │       └── layout.tsx
│   ├── marketplace/              # Public marketplace
│   │   ├── page.tsx             # Search & browse
│   │   └── shop/[shopId]/       # Shop profile
│   ├── api/
│   │   ├── auth/                # Auth endpoints
│   │   ├── shops/               # Shop operations
│   │   ├── staff/               # Staff management
│   │   ├── chat/                # Chat API
│   │   └── voice/               # Voice processing
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   └── globals.css              # Global styles
├── components/
│   ├── ui/                      # shadcn/ui components
│   └── voice-assistant.tsx      # Voice assistant component
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Browser client
│   │   ├── server.ts            # Server client
│   │   └── proxy.ts             # Session management
│   └── utils/
│       ├── auth.ts
│       ├── shop.ts
│       ├── customer.ts
│       ├── order.ts
│       ├── measurement.ts
│       └── staff.ts
├── scripts/
│   ├── 001_create_schema.sql
│   ├── 002_create_profile_trigger.sql
│   └── setup-database.js
├── proxy.ts                     # Next.js auth/session proxy
├── next.config.mjs             # Next.js configuration
├── tailwind.config.ts          # Tailwind configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies
```

## Database Schema

Key tables:
- `profiles` - User profiles with role information
- `shops` - Shop/business information
- `shop_staff` - Staff members assigned to shops
- `staff_invitations` - Email-based staff invitations
- `customers` - Customer information per shop
- `orders` - Order tracking and management
- `measurements` - Customer measurements
- `shop_ratings` - Reviews and ratings

All tables include Row Level Security policies for data isolation.

## User Roles

### Shop Owner
- Full shop management access
- Can invite staff members
- Manages all customers and orders
- Accesses voice assistant

### Staff
- Access to assigned shop only
- Can manage customers and orders
- Can record measurements
- Limited to shop data

### Customer
- View public marketplace
- Browse shop profiles
- Leave reviews and ratings

## Voice Assistant

The voice assistant enables hands-free shop management:

**Available Commands:**
- "Add customer [name]" - Create new customer
- "Record measurements chest [cm] waist [cm]" - Record measurements
- "Create order for [customer name]" - Create new order
- "Show shop statistics" - Get shop overview

**Technology:**
- Web Speech API for voice input
- Groq LLM for understanding
- Tool calling for operations
- Optional text-to-speech feedback

## Multi-Tenancy

Secure multi-tenant architecture:
- Each shop has isolated data
- Staff access restricted to assigned shop
- Row Level Security enforces policies
- Database-level data protection

## Deployment

### Vercel (Recommended)

1. Connect GitHub repository to Vercel
2. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy automatically on push

```bash
vercel --prod
```

### Self-Hosted

```bash
npm run build
npm run start
```

## API Routes

### Authentication
- `POST /api/auth/set-user-type` - Set user role

### Shops
- `POST /api/shops` - Create new shop

### Staff
- `POST /api/staff/invitations` - Invite staff member (email token)
- `POST /api/staff/invitations/accept` - Accept invite token
- `DELETE /api/staff/[staffId]` - Revoke staff member access

### Voice
- `POST /api/voice/process` - Process voice commands

### Chat
- `POST /api/chat` - Chat with AI

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create feature branch
3. Make your changes
4. Submit pull request

## Roadmap

- [ ] Payment processing integration
- [ ] Email notifications
- [ ] Advanced analytics
- [ ] Mobile app
- [ ] Video consultations
- [ ] Inventory management
- [ ] Delivery tracking
- [ ] Custom branding per shop

## Support

- Documentation: See inline code comments
- Issues: GitHub Issues
- Contact: support@tailorpal.com

## License

MIT License - see LICENSE file

---

**Built with modern tech for fashion professionals. Scalable, modular, and production-ready.**
