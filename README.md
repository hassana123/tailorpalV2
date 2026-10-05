# TailorPal: product review, app behavior and growth strategy

Reviewed: 5 October 2026. This README is a working product assessment for the founder, based on the current repository and the checks completed in this development session. It describes what exists today, where behavior is incomplete, and what to validate with real users before expanding or marketing it.

## Product direction

TailorPal manages the path from a customer's measurements and outfit request to workshop tasks, fitting, payment records and delivery. It also includes a public shop catalogue/marketplace and a customer dashboard.

**Recommended position:** a workshop companion for Nigerian bespoke fashion businesses that helps owners see what is due, who is doing the work, and which orders need attention.

**Proposed customer promise:** “Know what needs to be finished today, keep every customer's measurements together, and give clients clearer delivery updates.” This is a promise to test in a pilot, not a proven outcome claim.

The immediate opportunity is a reliable daily workflow for a small tailoring team. Marketplace growth, AI scanning and broad business analytics should support that workflow once its reliability is established.

## What “functional” means in this review

| Evidence level | What has actually been established |
| --- | --- |
| Implemented | A screen, API or database workflow exists in source. This does not prove it succeeds in the browser. |
| Database verified | The master schema and seed executed on local PostgreSQL with Supabase auth/storage stubs; fixture counts and owner isolation checks passed. Demo fixture counts were also checked read-only against the configured Supabase project. |
| Technical checks passed | Production build, TypeScript and focused lint checks passed during this session. Later shop-switcher edits passed TypeScript and focused lint. |
| Auth storage verified | A synthetic session with 24 KB of user metadata produced 364 bytes of compact cookie headers; server user verification and local sign-out passed. This was not a real email/Google signup acceptance test. |
| Still needs acceptance testing | Complete browser journeys, real invited staff logins, real customer tracking, mobile uploads, AI scans, weak-network behavior, and actual workshop use. |

The existing `todo.md` checkboxes are not a release certification. Use [the acceptance checklist](docs/TEST_CASES.md) and record actual results. This README makes no claim that every feature is production-ready.

## Who this should serve first

These segments and problems are hypotheses to validate through observation and interviews.

| User | Daily problem to investigate | Useful outcome | Fit today |
| --- | --- | --- | --- |
| Owner of a bespoke shop with roughly 2–10 makers | Deadlines, work allocation and customer details are spread across notebooks and messages | A clear daily work queue and one order record | Strongest initial segment |
| Solo tailor or designer | Re-entering measurements, forgetting deposits, answering progress questions | Fast customer/order capture with minimal setup | Useful if Quick mode is genuinely simple |
| Bridal/event atelier | One fixed event date, multiple fittings and complex outfits | Earlier risk visibility and fewer missed handoffs | Attractive; full event-project management still needs work |
| Staff member | Unclear assignment or missing measurements/design instructions | A short, permission-aware list of assigned work | Exists in source; test with real staff accounts |
| Customer | Uncertainty about progress, fitting or collection | A clear update without needing another app account | Public tracking exists but needs correctness and privacy work |
| Ready-to-wear retailer or factory | Retail checkout or industrial production needs | Specialized stock/sales or manufacturing tools | Do not make this the first target |

## How the app behaves today

### Entry, accounts and shops

Users can sign up/sign in, including a Google OAuth path, then choose shop owner, staff or customer. Supabase creates a profile on signup. An owner can create a shop and configure its name, contact/location information and media. Staff join through an invitation/onboarding flow; customers have marketplace and request views.

An owner can switch between owned shops using the dashboard header. The selected shop is remembered in that browser. Most workshop data is scoped to the shop ID in the route. A different shop can therefore legitimately show an empty dashboard.

The seed creates **TailorPal Demo Atelier** as a separate shop. It does not populate the owner's original shop. This distinction caused the earlier empty-dashboard confusion and should be explained during onboarding.

### Feature and behavior inventory

| Area | Current implemented behavior | Limits or important details |
| --- | --- | --- |
| Customers | Create/edit/search customer records, phone/contact details and notes; inspect linked orders and payment records | Duplicate detection, import and a formal customer merge workflow need validation or implementation |
| Measurements | Manual standard/custom measurements, inches/cm, editing, links to orders and WhatsApp sharing | The schema enforces one current record per customer/shop. Editing that record is not a versioned history or immutable order snapshot |
| Measurement-sheet scan | Upload a photo of a written measurement sheet; AI maps recognized values into fields for review | Requires configured Groq service and a compatible available model. Does not estimate a person's body measurements from a photo; no accuracy claim is established |
| Orders | Customer-linked order, deadline, price/deposit, priority, status, description, fabric notes and contact details | Order statuses are pending, in progress, completed, delivered and cancelled; workflow/task status is a separate layer |
| Garments and design | Multiple garments, linked measurements, reference images, categorized design notes and owner-recorded approval state/time | Owner marking a note approved is not authenticated customer approval; full design versioning is absent |
| Workshop Floor | Custom stages, assigned tasks, estimates, due dates, priority, start/stop time entries and completion | Task completion and order completion need a consistent tested rule; do not assume one always updates the other |
| Garment recipes | Starter task sequences for garment types, including Nigerian styles such as Agbada and Senator | Times are starting estimates, not proven production standards; shops should adjust them |
| Floor Board/planner | Quick/Pro setup, workdays, hours/day, team capacity, order progress, deadline attention, workload and printable job tags | Risk and acceptance suggestions are arithmetic heuristics. Several assumptions, including hours/day in helper calculations, need consistency review |
| Production insights | Average recorded times by garment/stage; skill/workload-based assignment suggestions; a “can I accept this?” estimate | Sparse or inaccurate time entries weaken suggestions. This is not a validated predictive model or a guarantee of delivery |
| Staff | Invitations/codes, pending/active membership, role, production role, skills, phone and operational permissions | Seed staff are display fixtures without Auth logins. Real invitation, expiry and permission journeys remain acceptance-test items |
| Inventory | Items, units, SKU, cost/selling price, stock quantity, reorder level, search/filter and low-stock visibility | Material-use RPC checks permission and stock, then records usage and deducts stock. Supplier/purchase tables exist, but a full purchasing UI/workflow was not found in the reviewed inventory screen |
| Finance/payments | Manual order payment records; categorized expenses, optional order costs, revenue/profit summaries and invoices through browser printing | No verified payment-gateway reconciliation. Finance revenue is the sum of non-cancelled order prices, not bank receipts or cash collected |
| Fitting/delivery | Dates, status and notes; ready/delivered state, progress-photo records and prepared customer messages | Appointment rescheduling, reminder delivery and tracking-page consistency need testing |
| Notifications | Order/task deadline and low-stock reminders, read state, staff alerts and optional WhatsApp handoff | Reminder refresh is invoked by application views. No scheduled background delivery service was established by this review |
| Catalogue | Shop styles with descriptions, prices, images and active state; public requests, owner response and conversion flow | A request is not a paid checkout; request conversion and duplicate prevention need real acceptance tests |
| Marketplace/customer portal | Browse/search shops, public shop profiles/catalogues, ratings, customer request views | No verified demand generation, shop verification or established marketplace liquidity |
| Public tracking | Share `/track/<order-id>` without a customer login; status, delivery date, stage and task-based progress | See the tracking correctness/privacy issues below before promoting it widely |
| WhatsApp | Buttons prepare messages and open WhatsApp for measurements, fittings, progress, pickup or staff instructions | The user must send the message. Opening WhatsApp does not establish delivery, reading or automated sending |
| Voice/chat | Browser speech/text input, guided customer/order/measurement flows, corrections, confirmation and permission checks; AI replies | Browser/device/accent and service availability vary. Conversation state is in server memory, so it is not durable across process restarts or necessarily shared across instances |
| Insights/export | Date-range business cards, garment-description groupings, task completion/time and CSV export | Metrics have inconsistent definitions and date filters; do not treat them as accounting reports yet |
| Mobile/PWA | Responsive UI, manifest, install prompt and a service-worker implementation | Installable does not mean reliable offline writes. No complete durable write queue/conflict resolution was established; cached routes/assets need review |

### A representative daily journey

1. The owner selects the correct shop and opens the daily board.
2. A customer is added; measurements, design instructions and a delivery date are recorded.
3. An order is created, with garments, price, deposit/payment records and linked measurements.
4. The owner creates tasks or applies a garment recipe, checks capacity and assigns work.
5. Staff start/stop tasks and mark work done. The owner reviews late or urgent items.
6. A fitting is scheduled; the owner prepares and sends the WhatsApp message.
7. Materials and expenses are recorded. The owner checks balances and order costs.
8. The outfit is marked ready, the customer is updated, and collection/delivery is recorded.

This should become the primary acceptance-test journey. Validate each transition using real staff/customer roles rather than only a service key.

## Where it can improve users' lives

| Existing workflow | Intended real-world benefit | How to measure it |
| --- | --- | --- |
| One customer/order record | Less searching for measurements and instructions | Time to retrieve a returning customer's complete order details |
| Daily tasks and ownership | Fewer forgotten handoffs and owner interruptions | Number of unassigned/overdue tasks; interruptions per working day |
| Capacity/deadline view | More realistic promises and earlier corrective action | On-time delivery rate and warning lead time |
| Fitting and progress updates | Less uncertainty for customers | Status-chasing messages per active order; fitting attendance |
| Payments and cost records | Better awareness of unpaid balances and margin | Balance discrepancies and unrecorded expenses, compared with actual receipts |
| Recipe/job tag | Easier workshop onboarding and less repeated explanation | Time to prepare/hand off a new job; missing-instruction incidents |

These benefits must be demonstrated. A feature list alone does not establish reduced stress, saved hours or increased profit.

## Concrete issues to resolve before a broad launch

| Priority | Finding from source | Required improvement |
| --- | --- | --- |
| P0 | Public tracking uses an admin client and accepts both UUID and order number | Introduce a separate revocable share token, remove order-number lookup, minimize exposed details and test access boundaries/rate limits |
| P0 | Tracking logic reads deposit/fitting fields that are not selected in its order query | Query the required fields and use a canonical payment calculation; test a real seeded fitting/partial-payment order in a private browser |
| P0 | Finance calls order value “revenue”; Insights includes cancelled order values and derives balances from deposit fields | Define booked value, collected payments, receivables, refunds and profit separately; reconcile every screen against the same payment ledger |
| P0 | Insights can show empty results after database errors; some screens suppress fetch errors | Distinguish empty, loading, forbidden, network failure and missing-schema states; preserve useful retry feedback |
| P0 | RLS exists, but fixture verification uses a service key and cannot prove browser authorization | Test owner, restricted staff, other owner, anonymous and public-link access using their actual sessions |
| P1 | Measurements are mutable shared records | Add measurement versions/order snapshots with unit/source/date; preserve the values used to cut each garment |
| P1 | Material deduction exists; cancellation, edits and returns need a consistent stock policy | Use auditable stock movements with explicit reversals; prevent cross-shop links and double-use |
| P1 | Task stage/progress, order status and delivery status are separate | Define allowed transitions, completion/reopening rules and cancellation handling; ensure every screen agrees |
| P1 | Planner helpers use simplified capacity assumptions | Use one workshop calendar and explicit assumptions; consider leave, bottleneck roles, fittings, waiting for material and task dependencies |
| P1 | PWA/service-worker assets include legacy paths; offline write behavior is incomplete | Audit installation/cache behavior and user-specific data handling; build queued writes, retries and conflict resolution before claiming offline support |
| P1 | Invoice settings live in localStorage; conversational state lives in process memory | Decide which settings/state must survive devices/restarts; persist business-critical configuration and audit history |
| P1 | Recovery, backup restore, deletion/export and upload lifecycle are not proven end-to-end | Test restore and recovery, implement practical export, and define media retention/access behavior |

These are identified improvements, not fixes made as part of writing this README. The public tracking concern is particularly important because it changes the exposure of client information.

## Competition and defensible differentiation

Public competitor information was reviewed on 5 October 2026. This is a directional comparison of vendor descriptions, not a hands-on comparative test or a complete market survey. Absence from a website is not evidence that a competitor lacks a feature.

| Alternative | What its public information establishes | Implication for TailorPal |
| --- | --- | --- |
| TailorsPA | Promotes measurement records, orders/debtors, reminders and a public style mini-site for African fashion businesses | “Digital measurement book for African tailors” is already occupied; localized language alone will not differentiate TailorPal. [Vendor features](https://tailorspa.com/features) |
| TailorPad | Presents itself as tailoring ERP | Basic tailoring-specific business management is an existing category. Validate its current workflow directly before making comparisons. [Vendor site](https://tailorpad.com/) |
| Bumpa | Offers retail-oriented inventory, orders, customers, invoices/receipts, expenses, analytics and selling tools | Generic business administration is not a sufficient advantage. TailorPal should demonstrate the making/fitting/deadline workflow. [Vendor site](https://www.getbumpa.com/) |
| Notebook, WhatsApp and spreadsheets | These are practical substitutes to investigate in user interviews, rather than one named software competitor | Win on low entry effort, retrieval, coordinated work and trust. Users will compare the app with their existing habits |

**Proposed differentiator:** delivery reliability for small bespoke workshops, combining a simple daily board, garment-specific job records, fitting handoffs and capacity advice grounded in the shop's own recorded work.

This is a positioning hypothesis, not a claim of uniqueness. It becomes defensible through reliable product behavior, calibrated workshop data, useful templates, easy migration, user support and measured results.

### What could make TailorPal stand out

1. **A useful morning screen.** Show today's work, missing measurements/design approval, overdue fittings, material blockers and balances to resolve before handover. Each warning should lead to one clear action.
2. **A fast garment job card.** Keep measurements/version, reference, fabric, cutter/sewer, fitting date and instructions together; make printable/phone-readable handoffs routine.
3. **A trustworthy delivery estimate.** Start with editable recipe times, expose assumptions and gradually use observed task durations. Report sample count and uncertainty rather than pretending every prediction is precise.
4. **True event-group management.** Extend the existing group-name tag into projects with one event date, customers/garments, individual fittings, risk and outstanding balances. This is proposed work, not today's complete feature.
5. **Low-friction notebook migration.** Assisted measurement-sheet capture plus reviewed import could reduce switching effort. Confirm accuracy and editing speed with real sheets before using it as an acquisition claim.
6. **Reliable weak-network use.** Make saving state visible and recoverable. Full offline creation/sync is a future advantage only after it actually works.

## Positioning and messaging

### Recommended positioning statement

For small Nigerian bespoke fashion workshops managing several customer jobs at once, TailorPal brings measurements, garment instructions, assigned work and delivery dates into a daily workshop view, helping the owner coordinate production and communicate progress.

### Suggested landing-page message

**Headline:** “Keep your workshop on track, one outfit at a time.”

**Supporting copy:** “See what is due, assign the next task, keep customer measurements together, and prepare clear fitting and pickup updates.”

**Pilot CTA:** “Book a guided workshop demo.”

Show a complete customer-to-delivery journey in the demo. Avoid promises about guaranteed on-time delivery, automatic WhatsApp messages, accurate body-photo measurements, offline reliability or accounting-grade reports until those claims are demonstrated.

### Tailor the message to the buyer

| Segment | Message to test | Demonstration |
| --- | --- | --- |
| Small team owner | “See who is working on each outfit and what must be finished next.” | Job card → assigned task → daily board |
| Solo tailor | “Find a customer's measurements and next delivery without searching your chats.” | Returning customer → measurements → new order |
| Bridal atelier | “See fitting dates and deadline pressure before the event week.” | Several dated orders → fitting queue → risk explanations |

Lead with the user's daily job. Voice, AI and marketplace functionality can appear later in the demonstration when they are relevant.

## Marketing and pilot plan

### Start with direct observation

Recruit about 10–15 shops from one accessible local cluster or community, with owners willing to use the app on real work for four weeks. This is a proposed pilot size, not existing traction. Prioritize shops with enough active work to experience coordination problems.

Observe their existing workflow before presenting features: where measurements live, who promises delivery, how work is assigned, how payment is checked and when a customer asks for updates. Ask about the last late job or lost detail, rather than asking whether they “like the app.”

### Give them a quick first result

Help each shop enter a few real customers and active orders, assign one real maker and complete one task. Aim for a first useful board in one session. Offer a simple owner setup and reveal advanced planning later. Keep demo and real data clearly labeled.

### Test channels with a clear conversion path

| Channel to test | Offer/content | Measure |
| --- | --- | --- |
| Tailoring schools, workshop networks and fabric suppliers | Guided demonstration plus assisted setup; partnerships require outreach and agreement | Qualified demos → activated shops |
| Instagram/TikTok short demos | One actual workflow: find measurements, hand off work, plan a fitting | Enquiries → completed guided setup |
| Opt-in WhatsApp community/demo follow-up | Short practical onboarding videos and help with first orders | Time to first active order; weekly usage |
| Referrals from successful pilot users | Introduce another relevant workshop after value is observed | Referred shops that remain active |
| Paid advertising, later | One proven use case and a clear demo CTA | Cost per retained paying shop, not installs alone |

Do not start by promising marketplace customers to shop owners. A useful operations product can be sold before two-sided marketplace demand exists. Promote real user case studies only with permission and accurate baseline/results.

### Pricing experiments

No paid subscription/billing workflow was established in this review. Treat pricing as a test, not an implemented plan or researched market price.

Consider a simple owner-only tier and a team tier covering assignments, permissions and planning. In interviews and the pilot, test monthly willingness-to-pay, what users expect support/import to include, and whether saved effort or fewer mistakes justify the fee. Price against observed value and service/hosting cost; avoid competing solely on the lowest fee.

## Suggested next 90 days

| Period | Work | Exit evidence |
| --- | --- | --- |
| Days 1–14 | Fix tracking/payment definitions and high-impact error states; test owner/staff isolation, signup, shop selection and the full seed journey | Documented browser acceptance results on phone and desktop; correct finance/tracking examples |
| Days 15–30 | Observe pilot shops; simplify first-order setup; test real staff handoffs; calibrate recipes | Shops can independently create and progress real orders; record the most common friction |
| Days 31–60 | Improve the daily board and job card; measurement snapshots; reliable fitting/balance follow-up; resolve frequent blockers | Repeated weekly use and fewer retrieval/handoff failures |
| Days 61–90 | Test paid continuation, referrals and one acquisition channel; prioritize group projects/offline from actual demand | Paying retained users and defensible outcome evidence; explicit go/no-go decisions |

Don't add every idea at once. A small number of dependable daily workflows is a better pilot than a broad product with inconsistent records.

## Metrics for product decisions

- **Activation:** owner creates a real customer, measurements and order, then completes an assigned task within the first week.
- **Retention:** shops with active work that use the board/order records weekly. Examine quiet weeks separately from abandonment.
- **Operational outcome:** on-time delivery percentage, retrieval time, overdue work and status-chasing messages, compared with a recorded baseline.
- **Data trust:** differences between app balances and receipts; duplicate customers; missing or changed measurement values; failed/retried saves.
- **Commercial outcome:** pilot-to-paid conversion, retained paying shops, support time per shop, acquisition cost and cancellation reasons.

Agree pilot success thresholds before running it. For example, target most participants progressing multiple real orders and wanting to continue, then investigate why others stop. Numerical targets here would be hypotheses, not current results.

## Founder review questions

1. Which problem do owners return to TailorPal to solve every morning?
2. Can a new shop get value without filling every module?
3. Can the owner trust a balance, measurement and deadline across every screen?
4. Will staff actually update tasks while working, and what happens when they don't?
5. Which workflow makes an owner willing to leave a notebook/chat-only routine?
6. Which claimed improvement can be demonstrated with a baseline and a real shop?
7. Is marketplace discovery helping the initial buyer, or distracting from workshop reliability?

## Run, seed and review the current app

The stack is Next.js 16, React 19, TypeScript and Tailwind, with Supabase Postgres/Auth/Storage. Voice and scanning have additional browser/provider dependencies.

```sh
npm install
npm run dev
npm run typecheck
npm run build
node scripts/test-auth-cookies.cjs
```

Configure `.env` for the new Supabase project. Check `.env.local` for overrides. Only URL/anon configuration belongs in browser-exposed variables; service/provider keys remain on the server.

For a fresh database, run [the master migration](supabase/migrations/202610050001_master_schema.sql). Sign up and choose the owner role, then run [the demo seed](supabase/seed.sql) with its owner-email setting matching the account. The current seed is configured for the development owner's email. Select **TailorPal Demo Atelier** in the shop dropdown. Do not rerun the fresh baseline against an installed TailorPal schema.

```sh
npm run verify:demo
```

This checks the fixture records with a service key; it does not certify browser RLS or business outcomes. The seed covers six order scenarios, six customers/measurements, three active staff plus a pending member, 36 tasks, recorded times, payments, expenses, catalogue requests and inventory examples. It skips an existing demo shop on repeat runs. Demo staff require real invitations to test login.

See [database setup](docs/DATABASE_SETUP.md) and [acceptance tests](docs/TEST_CASES.md) for operational steps. A deployed release should also have tested backup/restore, account recovery, user-data export and support procedures.

## Useful source locations

| Behavior | Source |
| --- | --- |
| Signup role persistence | `app/api/auth/set-user-type/route.ts`, `app/auth/choose-role/` |
| Shop selection | `components/dashboard/layout/ShopSwitcher.tsx`, `app/dashboard/shop/page.tsx` |
| Customers, measurements, orders | `app/dashboard/shop/[shopId]/customers/`, `components/dashboard/shop/measurements/`, `components/dashboard/orders/` |
| Daily board and task work | `components/dashboard/shop/planner/`, `components/dashboard/shop/workflow/`, `lib/constants/garmentRecipes.ts` |
| Finance and Insights definitions | `components/dashboard/shop/finance/FinancePageContent.tsx`, `components/dashboard/shop/analytics/AnalyticsPageContent.tsx` |
| Customer tracking | `app/api/track/[orderId]/route.ts`, `app/track/[orderId]/page.tsx` |
| Voice and scan | `lib/voice/`, `app/api/voice/process/route.ts`, `app/api/measurements/scan/route.ts` |
| Permissions and schema | `lib/server/authz.ts`, `lib/staff/permissions.ts`, `supabase/migrations/202610050001_master_schema.sql` |
| Install/offline behavior | `components/pwa/`, `public/sw.js`, `public/manifest.json` |

This review should be updated after each pilot round with verified behavior, measured outcomes and decisions. It is a product planning document, not customer-facing evidence of benefits already achieved.
