# TailorPal Application Functional Documentation

Generated: 2026-03-04
Codebase root: `c:\Users\NEW USER\Desktop\tailorpalv2`

## 1. Scope
This document is an implementation-level guide for the current TailorPal app.
It covers:
- all major pages and layouts
- all API routes
- permission and access model
- end-to-end process flows
- deep dives for customer, measurement, order, inventory, staff, and catalog management

This is based on the code in `app/`, `components/`, `lib/`, and `supabase/migrations/`.

## 2. System Overview
TailorPal is a multi-role Next.js app with Supabase Auth + Postgres + RLS.

Core runtime model:
- Frontend: Next.js App Router pages, mostly client components for dashboard modules.
- Backend: Next.js route handlers in `app/api/*`.
- Auth/session: Supabase session cookies refreshed by `proxy.ts` + `lib/supabase/proxy.ts`.
- Data protection: Row Level Security policies plus server-side guard checks (`hasShopAccess`, `hasStaffPermission`).
- Public data paths: marketplace endpoints use admin client where needed.

## 3. Roles and Access Model
User types in `profiles.user_type`:
- `shop_owner`
- `staff`
- `customer`

Primary authorization layers:
- UI role redirects in dashboard and layouts.
- Route-handler checks with `lib/server/authz.ts`.
- Supabase RLS policies and grants from migrations.

Staff operational permissions (`shop_staff_permissions`):
- `can_manage_customers`
- `can_manage_orders`
- `can_manage_measurements`
- `can_manage_catalog`
- `can_manage_inventory`

Permission interpretation:
- Shop owner always has full access.
- Staff access is shop-scoped and permission-scoped.
- Some UI operations use direct Supabase client writes, so RLS must be correct.

## 4. Route and Page Inventory

### 4.1 Global and Public Routes
| Route | File | Purpose |
|---|---|---|
| `/` | `app/page.tsx` | Marketing home. If already authenticated, redirects by role. Handles OAuth callback params pass-through to `/auth/callback`. |
| `/chat` | `app/chat/page.tsx` | AI SDK chat demo using `/api/chat`. |
| `/marketplace` | `app/marketplace/page.tsx` | Public shop discovery/search UI. |
| `/marketplace/shop/[shopId]` | `app/marketplace/shop/[shopId]/page.tsx` | Public shop profile, catalog browsing, review and order-request actions. |
| `/protected` | `app/protected/page.tsx` | Basic protected test route. |

### 4.2 Auth Routes
| Route | File | Purpose |
|---|---|---|
| `/auth/login` | `app/auth/login/page.tsx` | Email/password + Google login. Redirect by role or `next`. |
| `/auth/sign-up` | `app/auth/sign-up/page.tsx` | Email/password + Google signup. Supports staff invite code in query. |
| `/auth/sign-up-success` | `app/auth/sign-up-success/page.tsx` | Post-signup instruction screen. |
| `/auth/choose-role` | `app/auth/choose-role/page.tsx` | Role selection, calls `/api/auth/set-user-type`, then routes to role workspace. |
| `/auth/error` | `app/auth/error/page.tsx` | OAuth/auth error view. |
| `/auth/callback` | `app/auth/callback/route.ts` | Exchanges OAuth code for session and routes user by role/next path. |

### 4.3 Dashboard Resolver and Role Shells
| Route | File | Purpose |
|---|---|---|
| `/dashboard` | `app/dashboard/page.tsx` | Server resolver route that redirects to shop/staff/customer dashboards based on `profiles.user_type`. |
| `/dashboard/shop/layout` | `app/dashboard/shop/layout.tsx` | Shop dashboard shell, dynamic nav, permission gating, floating voice assistant, desktop sidebar + mobile bottom nav. |
| `/dashboard/staff/layout` | `app/dashboard/staff/layout.tsx` | Staff shell with sidebar/header/mobile bottom nav, role safety redirects. |
| `/dashboard/customer/layout` | `app/dashboard/customer/layout.tsx` | Customer shell with sidebar/header/mobile bottom nav, role safety redirects. |

### 4.4 Shop Owner/Shop Context Routes
| Route | File | Purpose |
|---|---|---|
| `/dashboard/shop` | `app/dashboard/shop/page.tsx` | Finds owner shop and redirects to first shop or setup. |
| `/dashboard/shop/setup` | `app/dashboard/shop/setup/page.tsx` | 3-step shop creation flow; image uploads + location + final submit to `/api/shops`. |
| `/dashboard/shop/[shopId]` | `app/dashboard/shop/[shopId]/page.tsx` | Shop summary dashboard with permission-aware shortcuts and stats. |
| `/dashboard/shop/[shopId]/customers` | `app/dashboard/shop/[shopId]/customers/page.tsx` | Customer management page with add/edit/delete/details and measurements modal access. |
| `/dashboard/shop/[shopId]/measurements` | `app/dashboard/shop/[shopId]/measurements/page.tsx` | Measurement records management; standard + custom measurements; edit/delete/view. |
| `/dashboard/shop/[shopId]/orders` | `app/dashboard/shop/[shopId]/orders/page.tsx` | Order CRUD + catalog order request visibility. |
| `/dashboard/shop/[shopId]/catalog` | `app/dashboard/shop/[shopId]/catalog/page.tsx` | Catalog item CRUD, item activation toggle, image upload support. |
| `/dashboard/shop/[shopId]/inventory` | `app/dashboard/shop/[shopId]/inventory/page.tsx` | Inventory CRUD, stock and low-stock visibility, activation toggle. |
| `/dashboard/shop/[shopId]/staff` | `app/dashboard/shop/[shopId]/staff/page.tsx` | Staff/invitation management and permission assignment UI. |
| `/dashboard/shop/[shopId]/settings` | `app/dashboard/shop/[shopId]/settings/page.tsx` | Shop profile update, location hierarchy + autocomplete, logo/banner upload. |
| `/dashboard/shop/[shopId]/voice-assistant` | `app/dashboard/shop/[shopId]/voice-assistant/page.tsx` | Full voice assistant workspace + command reference. |

### 4.5 Staff Routes
| Route | File | Purpose |
|---|---|---|
| `/dashboard/staff` | `app/dashboard/staff/page.tsx` | Staff multi-shop access summary, permission badges, stats, links to allowed shop modules. |
| `/dashboard/staff/onboarding` | `app/dashboard/staff/onboarding/page.tsx` | Accept invitation by token or code; also lists pending invites by email. |

### 4.6 Customer Routes
| Route | File | Purpose |
|---|---|---|
| `/dashboard/customer` | `app/dashboard/customer/page.tsx` | Customer dashboard with quick marketplace/review activity snapshot. |
| `/dashboard/customer/marketplace` | `app/dashboard/customer/marketplace/page.tsx` | Customer marketplace listing/search page. |
| `/dashboard/customer/marketplace/shop/[shopId]` | `app/dashboard/customer/marketplace/shop/[shopId]/page.tsx` | Customer shop detail page wrapper. |

## 5. API Route Inventory

### 5.1 Auth APIs

#### `GET|POST /api/auth/google`
File: `app/api/auth/google/route.ts`
- Starts Google OAuth with safe origin validation.
- Writes `tp_auth_next` cookie for post-callback destination.
- `GET`: redirects browser to provider URL.
- `POST`: returns `{ url }` JSON for client-driven redirect.

#### `POST /api/auth/set-user-type`
File: `app/api/auth/set-user-type/route.ts`
- Body: `{ userType: 'shop_owner' | 'staff' | 'customer' }`
- Requires authenticated user session.
- Upserts into `profiles`.
- Includes admin fallback for `42501` policy denial.

### 5.2 Shop and Marketplace APIs

#### `POST /api/shops`
File: `app/api/shops/route.ts`
- Creates a new shop for current authenticated owner.
- Checks owner has no existing shop.
- Generates unique slug.
- Supports admin fallback for permission-denied DB cases.

#### `POST /api/shops/create`
File: `app/api/shops/create/route.ts`
- Alias export to `/api/shops` POST.

#### `GET /api/marketplace/shops`
File: `app/api/marketplace/shops/route.ts`
- Public-facing shop list with optional query `q`.
- Uses admin client.
- Returns computed `rating` and `review_count` from `shop_ratings` relation.

#### `GET /api/marketplace/shops/[shopId]`
File: `app/api/marketplace/shops/[shopId]/route.ts`
- Returns shop details, reviews, and active catalog items.
- Uses admin client.

#### `GET /api/customer/reviews`
File: `app/api/customer/reviews/route.ts`
- Requires authenticated user.
- Returns current user reviews from `shop_ratings`.
- Uses admin client for read.

### 5.3 Customer Management API

#### `POST /api/customers`
File: `app/api/customers/route.ts`
- Body includes `shopId`, `firstName`, `lastName`, optional contact/address fields.
- Auth required.
- Checks `hasShopAccess` and `hasStaffPermission(..., 'manage_customers')`.
- Inserts customer row with `created_by`.

### 5.4 Measurement Management API

#### `POST /api/measurements`
File: `app/api/measurements/route.ts`
- Body includes `shopId`, `customerId`, `standardMeasurements`, `customMeasurements`, `notes`.
- Auth required.
- Checks `hasShopAccess` and `manage_measurements` permission.
- Merges incoming standard/custom maps with most recent existing record per customer.
- If record exists, updates it; else inserts.

### 5.5 Order Management APIs

#### `POST /api/orders`
File: `app/api/orders/route.ts`
- Body includes `shopId`, `customerId`, `designDescription`, optional delivery/price/notes.
- Auth required.
- Checks `hasShopAccess` and `manage_orders` permission.
- Creates order with generated `ORD-{timestamp}` order number.

#### `POST /api/catalog/order-request`
File: `app/api/catalog/order-request/route.ts`
- Public-style request endpoint for catalog visitors.
- Body requires `shopId`, `catalogItemId`, `requesterName`, plus email or phone.
- Validates catalog item is active and belongs to shop.
- Uses admin client to insert into `catalog_order_requests`.

### 5.6 Catalog Management APIs

#### `GET /api/shops/[shopId]/catalog`
#### `POST /api/shops/[shopId]/catalog`
File: `app/api/shops/[shopId]/catalog/route.ts`
- Auth required.
- Requires `hasShopAccess` and `manage_catalog` permission.
- GET returns all catalog items for shop.
- POST creates catalog item.

#### `PATCH /api/shops/[shopId]/catalog/[itemId]`
#### `DELETE /api/shops/[shopId]/catalog/[itemId]`
File: `app/api/shops/[shopId]/catalog/[itemId]/route.ts`
- Auth required.
- Requires `hasShopAccess` and `manage_catalog` permission.
- PATCH supports partial updates.
- DELETE removes item.

### 5.7 Inventory Management APIs

#### `GET /api/shops/[shopId]/inventory`
#### `POST /api/shops/[shopId]/inventory`
File: `app/api/shops/[shopId]/inventory/route.ts`
- Auth required.
- Requires `hasShopAccess` and `manage_inventory` permission.
- GET returns inventory items.
- POST creates new item.

#### `PATCH /api/shops/[shopId]/inventory/[itemId]`
#### `DELETE /api/shops/[shopId]/inventory/[itemId]`
File: `app/api/shops/[shopId]/inventory/[itemId]/route.ts`
- Auth required.
- Requires `hasShopAccess` and `manage_inventory` permission.
- PATCH partial update; DELETE hard delete.

### 5.8 Staff Management APIs

#### `POST /api/staff/invitations`
#### `DELETE /api/staff/invitations`
File: `app/api/staff/invitations/route.ts`
- Owner-only per shop.
- POST creates invitation token + invite code, pending `shop_staff` row, default permissions row.
- Supports `deliveryMethod`: `supabase_email` or `manual_link`.
- DELETE removes invitation and cleanup of related pending staff rows when no pending invite remains.

#### `POST /api/staff/invitations/resend`
File: `app/api/staff/invitations/resend/route.ts`
- Owner-only.
- Regenerates token/code and optional email resend.

#### `POST /api/staff/invitations/accept`
File: `app/api/staff/invitations/accept/route.ts`
- Staff acceptance endpoint using token or invite code.
- Requires authenticated user and matching invitation email.
- Uses admin client to resolve pending row visibility and dedupe staff rows.
- Activates staff membership, marks invitation accepted, upserts `profiles.user_type='staff'`.

#### `POST|DELETE /api/staff/invite`
File: `app/api/staff/invite/route.ts`
- Alias export to `/api/staff/invitations`.

#### `DELETE /api/staff/[staffId]`
File: `app/api/staff/[staffId]/route.ts`
- Owner-only for shop owning that staff row.
- `?hard=true` does hard delete of staff + permissions.
- Default behavior: soft revoke staff status.

#### `PATCH /api/staff/[staffId]/permissions`
File: `app/api/staff/[staffId]/permissions/route.ts`
- Owner-only for target staff's shop.
- Updates one or more permission flags.
- Propagates updates to related staff rows by same email within same shop for status `active|pending`.

### 5.9 Voice and AI APIs

#### `POST /api/voice/process`
File: `app/api/voice/process/route.ts`
- Auth + shop access required.
- Rate limited (40 requests / 60 seconds per `userId:shopId`).
- Determines required permission from voice intent/session and enforces permission.
- Runs direct voice commands and guided flows; falls back to Groq text reply.

#### `POST /api/chat`
File: `app/api/chat/route.ts`
- Streams AI response using AI SDK `streamText` with `openai/gpt-5` model identifier.

### 5.10 Location APIs

#### `GET /api/location/options`
File: `app/api/location/options/route.ts`
- Provides country/state/city options.
- Uses CountriesNow API with in-memory caching and query filtering.

#### `GET /api/location/search`
File: `app/api/location/search/route.ts`
- Address lookup via LocationIQ.
- Requires `LOCATIONIQ_API_KEY`.
- Returns deduped location suggestions with `displayName`, lat/lon and selected hierarchy context.

## 6. Core Management Flows (Deep Dive)

### 6.1 Customer Management
Primary page: `app/dashboard/shop/[shopId]/customers/page.tsx`

UI flow:
- Loads customers by `shop_id` via client Supabase query.
- Add customer: uses `POST /api/customers`.
- Edit customer: direct `supabase.from('customers').update(...)`.
- Delete customer: direct `supabase.from('customers').delete()`.
- Detail and measurement modals are integrated in page actions.

Data model fields used:
- `first_name`, `last_name`, `email`, `phone`, `address`, `city`, `country`, `notes`, `created_by`.

Permission path:
- API create path checks `manage_customers` explicitly.
- Update/delete rely on RLS policy (`customers_owner_or_permitted_staff_write`).

Common failure modes:
- `403 Forbidden` on create: no shop access or no `manage_customers` permission.
- Update/delete failure: staff permission missing in RLS or stale staff membership status.

### 6.2 Measurement Management
Primary page: `app/dashboard/shop/[shopId]/measurements/page.tsx`

UI flow:
- Loads measurements joined with customer name.
- Supports standard measurement picker + custom free-form fields.
- Save new measurement: `POST /api/measurements`.
- Edit and delete are direct Supabase client operations.
- View modal renders normalized measurement map.

Data behavior:
- Measurements normalized to `standard_measurements` and `custom_measurements` JSON maps.
- Existing latest record per customer is merged on create API.

Permission path:
- API create checks `manage_measurements`.
- Edit/delete rely on RLS policy (`measurements_owner_or_permitted_staff_write`).

Key helper:
- `lib/utils/measurement-records.ts` handles map sanitization, legacy column extraction, sorting, and labels.

### 6.3 Order Management
Primary page: `app/dashboard/shop/[shopId]/orders/page.tsx`

UI flow:
- Loads:
  - `orders` with customer relation,
  - customers list for create modal,
  - `catalog_order_requests` for incoming marketplace requests.
- Create order: `POST /api/orders`.
- Update/delete order: direct client Supabase updates/deletes.
- Order detail and edit modals included.
- Catalog order requests currently view-only in UI.

Data model highlights:
- Order statuses: `pending`, `in_progress`, `completed`, `delivered`, `cancelled`.
- Catalog request statuses: `pending`, `contacted`, `converted`, `cancelled`.

Permission path:
- API create checks `manage_orders`.
- Update/delete rely on RLS policy (`orders_owner_or_permitted_staff_write`).
- Catalog request read/update policy tied to shop owner/staff and `manage_orders` for updates.

### 6.4 Inventory Management
Primary page: `app/dashboard/shop/[shopId]/inventory/page.tsx`

UI flow:
- Loads inventory from `GET /api/shops/[shopId]/inventory`.
- Create: `POST /api/shops/[shopId]/inventory`.
- Edit: `PATCH /api/shops/[shopId]/inventory/[itemId]`.
- Activate/deactivate: same PATCH endpoint with `isActive` toggle.
- Delete: `DELETE /api/shops/[shopId]/inventory/[itemId]`.

Data model fields:
- `name`, `sku`, `unit`, `quantity_on_hand`, `reorder_level`, `cost_price`, `selling_price`, `is_active`.

Permission path:
- All API actions check shop access and `manage_inventory` permission.

### 6.5 Staff Management
Primary page: `app/dashboard/shop/[shopId]/staff/page.tsx`
Hook: `hooks/staff/useStaffManagement.ts`

UI flow:
- Loads staff rows, invitation rows, and permission rows.
- Invite modal supports email delivery or manual link flow.
- Permissions modal updates `shop_staff_permissions` via API.
- Supports revoke staff access, hard delete staff row, delete invitation, resend invitation.

Invite lifecycle:
1. Owner creates invitation (`/api/staff/invitations`), receives link/code.
2. Staff signs up, chooses role staff.
3. Staff accepts via token/code (`/api/staff/invitations/accept`).
4. Membership activated and profile user type set to `staff`.

Permission synchronization detail:
- Permission update API applies to related rows for same staff email in same shop (`active|pending`).

### 6.6 Catalog Management
Primary page: `app/dashboard/shop/[shopId]/catalog/page.tsx`

UI flow:
- Loads items from `GET /api/shops/[shopId]/catalog`.
- Add item modal supports local image upload to storage bucket via `uploadShopMedia`.
- Add/edit/toggle/delete operations call catalog APIs.
- Detail modal is read-only display.

Marketplace connection:
- Active catalog items are exposed to marketplace shop detail endpoint.
- Customer order requests for selected catalog item go through `/api/catalog/order-request`.

Permission path:
- All owner/staff catalog CRUD endpoints require `manage_catalog`.

## 7. Voice Assistant Behavior
Components:
- Full page assistant: `components/voice-assistant/*`.
- Floating assistant: `components/voice-assistant/floating-voice-assistant.tsx` via `components/layout/floating-assistant-provider.tsx` and shop layout.

Supported voice intents include:
- add customer
- add measurement
- create order
- update order status
- delete customer
- list/find customers
- list/pending orders
- shop stats
- help/cancel

Server enforcement:
- `/api/voice/process` checks required permission before executing flow.

## 8. Database and Policy Notes
Key migrations:
- `202602260001_canonical_schema.sql`: baseline schema + RLS + helper `get_shop_owner_id`.
- `202602280002_catalog_and_location.sql`: catalog tables and policies.
- `202603010003_inventory_and_staff_permissions.sql`: staff permission table, inventory table, `has_staff_permission` function, updated write policies.
- `202603040001_fix_dashboard_access_policies.sql`: grants/policies for `shop_ratings` and `shop_staff_permissions`.
- `202603040002_fix_catalog_order_requests_rls.sql`: stricter insert/read/update policies for catalog order requests.
- `MEASUREMENTS_DB_MIGRATION.sql`: JSON measurement maps and unique `(shop_id, customer_id)` normalization.

Important policy/grant behavior:
- Client direct writes succeed only if matching table grants + RLS checks pass.
- Some endpoints use admin client to avoid RLS constraints in public or cross-user scenarios (marketplace reads, invitation acceptance internals).

## 9. Known Operational Risks and Troubleshooting

### 9.1 `403` on `shop_ratings` read
Symptom:
- `GET .../rest/v1/shop_ratings ... 403`

Check:
- Migration `202603040001_fix_dashboard_access_policies.sql` applied.
- Grants exist: `grant select on public.shop_ratings to anon, authenticated`.
- Policy exists: `shop_ratings_public_read using (true)`.

### 9.2 `42501` on `catalog_order_requests` insert
Symptom:
- `new row violates row-level security policy for table "catalog_order_requests"`

Check:
- Migration `202603040002_fix_catalog_order_requests_rls.sql` applied.
- Insert policy validates selected catalog item is active and shop-matching.
- Request payload has correct `shopId` + `catalogItemId` pair.

### 9.3 Staff sees "You do not have customer access for this shop"
Path:
- Shop layout route gate in `app/dashboard/shop/layout.tsx`.

Check:
- Active membership exists in `shop_staff` for user/shop.
- At least one related `shop_staff_permissions` row has required flag true.
- Permission update endpoint successfully updated related rows.

### 9.4 Wrong dashboard shown before redirect
Behavior sources:
- Home (`app/page.tsx`) performs client-side auth check and redirect.
- `/dashboard` uses server-side role resolver.
- Staff/customer layouts show loading spinner until auth/role checks complete.

Best stable entry:
- Use `/dashboard` or role-specific path after login to minimize transient wrong-page flashes.

## 10. Functional Mapping by Module

### Customer Management
- Pages: customer list page + modals.
- API: `POST /api/customers`.
- Tables: `customers`.
- Permissions: `manage_customers` for write.

### Measurement Management
- Pages: measurements page with create/view/edit.
- API: `POST /api/measurements`.
- Tables: `measurements`.
- Permissions: `manage_measurements` for write.

### Order Management
- Pages: orders page with order list + catalog request list.
- API: `POST /api/orders`, `POST /api/catalog/order-request`.
- Tables: `orders`, `catalog_order_requests`.
- Permissions: `manage_orders` for order writes and catalog request updates.

### Inventory Management
- Pages: inventory page.
- API: `/api/shops/[shopId]/inventory*` CRUD.
- Tables: `shop_inventory_items`.
- Permissions: `manage_inventory`.

### Staff Management
- Pages: owner staff management page; staff dashboard; staff onboarding.
- API: `/api/staff/invitations*`, `/api/staff/[staffId]`, `/api/staff/[staffId]/permissions`.
- Tables: `shop_staff`, `staff_invitations`, `shop_staff_permissions`.
- Permissions: owner-managed assignments; staff read own assignment.

### Catalog Management
- Pages: catalog page and marketplace catalog display.
- API: `/api/shops/[shopId]/catalog*`, `/api/catalog/order-request`.
- Tables: `shop_catalog_items`, `catalog_order_requests`.
- Permissions: `manage_catalog` for catalog writes.

## 11. Suggested Maintenance Workflow
When modifying any feature:
1. Update page component behavior.
2. Update matching API route contract if used.
3. Verify RLS/grants support direct client writes if page writes without API.
4. Update this document and `DOCS_INDEX.md` when route or behavior changes.

## 12. File Pointers for Fast Navigation
- Authz checks: `lib/server/authz.ts`
- Staff permission model: `lib/staff/permissions.ts`
- Staff invite helpers: `lib/staff/invitations.ts`
- Voice engine: `lib/voice/engine.ts`
- Marketplace data hook: `lib/marketplace/use-marketplace-shops.ts`
- Shop layout with mobile nav + route gates: `app/dashboard/shop/layout.tsx`
- Customer layout with mobile nav: `app/dashboard/customer/layout.tsx`
- Staff layout with mobile nav: `app/dashboard/staff/layout.tsx`
- Mobile bottom nav component: `components/dashboard/layout/MobileBottomNav.tsx`
