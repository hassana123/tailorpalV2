# Fresh Supabase setup

1. Update the new project URL, anon key and server service key in `.env`. Check
   `.env.local` too: Next.js gives it precedence. Never expose a service key through
   a `NEXT_PUBLIC_*` variable.
2. Paste the complete `supabase/migrations/202610050001_master_schema.sql` into the
   new Supabase project's SQL Editor and run it. This includes all previous dated
   migrations, signup profiles, dynamic measurements, storage, RLS and grants,
   through planner settings and staff alerts. It runs atomically and refuses an
   existing TailorPal installation. It cannot recover records from the deleted DB.
3. Start `npm run dev`, sign up and choose the owner role. Configure Supabase Auth
   redirect URLs/email confirmation for your app URL.
4. In `supabase/seed.sql`, replace `owner@example.com` with your account email and
   run the entire file in SQL Editor. Select **TailorPal Demo Atelier** in the app.
5. Run `npm run verify:demo` using the new project URL and service key in `.env`.

The seed creates a separate shop, six customers and measurements, six orders
covering all statuses, multi-garment orders, three active staff with permissions,
a pending invitation, 36 tasks, completed time entries and a running timer,
partial/full/unpaid balances, expenses, approved/pending design notes, placeholder
photos, fitting/delivery plans, group tags, active/inactive catalogue styles,
a catalogue request, suppliers/purchases/material usage, low stock, planner
settings and staff alerts. Dates are relative to the day you run it. Repeat runs
skip an existing demo shop without changing it; existing shop data is untouched.
Staff fixtures have no Auth logins: use real invitations to test staff access.
No email or WhatsApp message is sent. Replace placeholder images to test uploads.

## Optional terminal execution

Install PostgreSQL client tools (`psql` on PATH). Set `SUPABASE_DB_URL` to the new
project's direct/session database connection string and `DEMO_OWNER_EMAIL` to your
account email in `.env`. URL-encode passwords in the connection string.

```sh
npm run db:setup -- --apply
# Sign up and choose the owner role first.
npm run seed:demo -- --apply
npm run verify:demo
```

Without `--apply`, setup/seed commands only print SQL Editor instructions. No
`execute_sql` REST function is required. SQL Editor does not record CLI migration
history; reconcile the baseline with `supabase migration repair` before later
using `supabase db push`. See [Supabase migrations](https://supabase.com/docs/guides/deployment/database-migrations)
and [database connections](https://supabase.com/docs/guides/database/connecting-to-postgres).

## Dummy test cases

| Scenario | Expected result |
| --- | --- |
| DEMO-1 overdue/unpaid | Overdue warning; balance 80,000 |
| DEMO-2 urgent bridal | Active sewing timer, scheduled fitting, balance 120,000 |
| DEMO-3 completed | All tasks done, fully paid, ready for pickup |
| DEMO-4 delivered | Delivered, tasks done, fully paid |
| DEMO-5 cancelled | Excluded from active work queues |
| DEMO-6 upcoming | Pending tasks, later deadline, two garments |
| Navy fabric | 2 yards remaining, reorder level 5; low-stock alert |
| Draft style | Owner sees it; public catalogue hides it |
| Permissions | Real invited staff can perform only permitted writes |
| Shop isolation | Another owner cannot read demo customers/orders/payments |
| Upload | Owner can upload shop-media under their user-ID folder |

See `docs/TEST_CASES.md` for the broader checklist. Fixtures and schema checks
do not replace testing the browser workflows.
