# 🚀 TailorPal — Production & Business Features TODO

## 1. 👥 Customer Management

- [x] ☐ Create customer profiles
- [x] ☐ Store customer contact information
- [x] ☐ Store customer measurements
- [x] ☐ Edit/update customer measurements
- [x] ☐ Keep measurement history
- [x] ☐ View customer's previous orders
- [x] ☐ View customer's payment history
- [x] ☐ Search customers
- [x] ☐ Filter customers
- [x] ☐ Add customer notes

**Status:** ☐ Not Started | ☐ In Progress | ☑ Completed


---

## Implementation audit (repository review)

- [x] Customer profiles, contact details, notes, measurement create/edit/history, and customer search
- [x] Order create/edit/cancel, customer attachment, delivery date, price, notes, status tracking, and search
- [x] Production stages, tasks, task assignment, worker-role data, estimates, start/stop time entries, and task completion
- [x] Staff invitations/profiles, task assignment, role-based order permissions, and protected shop data
- [x] Basic production planner: deadline risk, priority queue, workload, daily plan, and weekly capacity
- [x] Inventory items, quantities, cost/selling price, reorder levels, low-stock visibility, editing, deletion, and search
- [x] Shop catalogue, catalogue order requests, marketplace shop search, PWA install prompt, authentication, and role access

Still unchecked: multi-garment orders, payments/profit, customer tracking, WhatsApp automation, Aso-Ebi projects, fittings, supplier/purchase history, offline data sync, notifications, AI measurements, historical production learning, and full reports.

<!-- VERIFICATION AUDIT — 9 September 2026
Only mark [x] after the specific feature has been used successfully against the running application and Supabase.
Verified technical checks: [x] TypeScript check; [x] production build (39 routes); [x] development-server startup.
No database-backed workflow has an end-to-end test record yet, so all feature checkboxes below intentionally remain [ ].
Source-only implementations awaiting end-to-end verification: customers, orders, measurements, catalogue, inventory, staff permissions, voice flows, production planner, and production workflow.
-->

# 2. 📦 Order Management

- [x] ☐ Create new orders
- [x] ☐ Attach customer to an order
- [x] ☐ Add one or multiple garments to an order
- [x] ☐ Add order deadline
- [x] ☐ Add order price
- [x] ☐ Add order notes
- [x] ☐ Attach measurements to order
- [x] ☐ Attach design references to order
- [x] ☐ Track order status
- [x] ☐ Edit orders
- [x] ☐ Cancel orders
- [x] ☐ Search orders
- [x] ☐ Filter orders
- [x] ☐ Sort orders by deadline/status/priority

**Status:** ☐ Not Started | ☑ In Progress | ☐ Completed


---

# 3. 🔧 Proper Production Workflow

- [x] ☐ Create custom production stages
- [x] ☐ Allow tasks to be assigned to specific staff
- [x] ☐ Define different worker/staff roles
- [x] ☐ Add actual time tracking for production tasks
- [x] ☐ Track when a task starts
- [x] ☐ Track when a task is completed
- [x] ☐ Record estimated production time
- [x] ☐ Record actual production time
- [x] ☐ Compare estimated vs actual production time
- [x] ☐ Allow tasks to be reordered/prioritized
- [x] ☐ Mark tasks as pending/in progress/completed
- [x] ☐ Track production progress for each order
- [x] ☐ Show overall workshop production dashboard
- [x] ☐ Identify overdue tasks
- [x] ☐ Identify upcoming deadlines
- [x] ☐ Flag high-priority orders

**Status:** ☐ Not Started | ☑ In Progress | ☐ Completed


---

# 4. 👷 Staff & Worker Management

- [x] ☐ Create staff profiles
- [x] ☐ Define staff roles
- [x] ☐ Define staff skills
- [x] ☐ Assign tasks to staff
- [x] ☐ View each staff member's assigned tasks
- [x] ☐ View staff workload
- [x] ☐ Track staff production time
- [x] ☐ Track completed tasks per staff member
- [x] ☐ Allow staff to update task status
- [x] ☐ Add role-based permissions
- [x] ☐ Restrict sensitive business information where necessary

**Status:** ☐ Not Started | ☑ In Progress | ☐ Completed


---

# 5. 🧠 Smart Production Intelligence

- [x] ☐ Learn production times from completed orders
- [x] ☐ Build historical production-time data
- [x] ☐ Calculate average production time by garment type
- [x] ☐ Calculate production time by production stage
- [x] ☐ Calculate production time by worker
- [x] ☐ Predict the risk of an order being late
- [x] ☐ Show why an order is considered high-risk
- [x] ☐ Identify orders likely to miss their deadline
- [x] ☐ Add "Can I accept this order?" decision support
- [x] ☐ Consider current workload when assessing new orders
- [x] ☐ Consider production deadlines when assessing new orders
- [x] ☐ Consider available staff capacity
- [x] ☐ Estimate when a new order can realistically be completed
- [x] ☐ Recommend the best staff member for a task
- [x] ☐ Consider staff workload when recommending assignments
- [x] ☐ Consider staff skill/role when recommending assignments
- [x] ☐ Recommend task priorities
- [x] ☐ Recommend daily production schedule
- [x] ☐ Show workshop capacity
- [x] ☐ Alert user when workshop capacity is exceeded

**Status:** ☐ Not Started | ☐ In Progress | ☐ Completed


---

# 6. 💰 Payments, Pricing & Profit

### Payments

- [ ] ☐ Add deposit tracking
- [ ] ☐ Track amount paid
- [ ] ☐ Track outstanding balance
- [ ] ☐ Record payment dates
- [ ] ☐ Record payment method
- [x] ☐ Generate invoices
- [ ] ☐ Generate receipts
- [ ] ☐ Track payment history

### Expenses

- [x] ☐ Record business expenses
- [x] ☐ Categorize expenses
- [x] ☐ Track material costs
- [x] ☐ Track labour costs
- [x] ☐ Track other business expenses

### Profit

- [x] ☐ Calculate order profit
- [x] ☐ Calculate total revenue
- [x] ☐ Calculate total expenses
- [x] ☐ Calculate profit after expenses
- [x] ☐ Show profit per order
- [ ] ☐ Show profit over a selected period
- [ ] ☐ Add pricing/profit calculator
- [ ] ☐ Suggest profitable pricing based on costs

**Status:** ☐ Not Started | ☐ In Progress | ☐ Completed


---

# 7. 💬 Customer Experience

- [x] ☐ Create a no-login outfit tracking link
- [x] ☐ Allow customers to view outfit progress
- [x] ☐ Show current production stage
- [x] ☐ Show expected completion date
- [x] ☐ Add progress photos
- [x] ☐ Show fitting information
- [x] ☐ Show payment/balance information where appropriate
- [x] ☐ Send WhatsApp order updates
- [x] ☐ Send WhatsApp deadline reminders
- [x] ☐ Notify customer when order changes stage
- [x] ☐ Notify customer when outfit is ready
- [x] ☐ Notify customer about fitting appointments
- [x] ☐ Allow tailor to manually trigger customer updates

**Status:** ☐ Not Started | ☐ In Progress | ☐ Completed


---

# 8. 🇳🇬 Nigerian Fashion Advantage

## Wedding / Aso-Ebi Group Projects

- [ ] ☐ Create group projects for weddings/events
- [ ] ☐ Add multiple customers to one group project
- [ ] ☐ Add a shared event/wedding deadline
- [ ] ☐ Track individual garments within the group
- [ ] ☐ Track different deadlines for individual garments
- [ ] ☐ Track fittings for each customer
- [ ] ☐ Track multiple garments per customer
- [ ] ☐ Show overall group/project progress
- [ ] ☐ Identify customers/garments at risk
- [ ] ☐ Show how many outfits are completed
- [ ] ☐ Show how many outfits remain
- [ ] ☐ Track outstanding payments across the group

**Status:** ☐ Not Started | ☐ In Progress | ☐ Completed


---

# 9. 🎨 Design Management

- [x] ☐ Upload reference photos
- [x] ☐ Attach reference photos to an order
- [x] ☐ Add fabric notes
- [x] ☐ Add embroidery notes
- [x] ☐ Add colour/material notes
- [x] ☐ Add other design instructions
- [x] ☐ Keep history of design changes
- [x] ☐ Track customer approvals
- [x] ☐ Record when approval was given
- [x] ☐ Record what the customer approved
- [ ] ☐ Keep previous versions of approved designs
- [ ] ☐ Allow customer to approve/reject a design
- [ ] ☐ Store final approved design separately

**Status:** ☐ Not Started | ☐ In Progress | ☐ Completed


---

# 10. 🧵 Inventory & Fabric Management

- [x] ☐ Create inventory items
- [x] ☐ Track fabric/material stock
- [x] ☐ Record quantity available
- [x] ☐ Record material cost
- [x] ☐ Attach fabrics/materials to orders
- [x] ☐ Deduct materials when used
- [x] ☐ Track low-stock items
- [x] ☐ Add low-stock alerts
- [ ] ☐ Track suppliers
- [ ] ☐ Track fabric/material purchase history
- [x] ☐ Search inventory
- [x] ☐ Filter inventory
- [x] ☐ Track inventory value

**Status:** ☐ Not Started | ☐ In Progress | ☐ Completed


---

# 11. 📅 Fittings & Delivery

- [x] ☐ Schedule fittings
- [x] ☐ Record fitting dates
- [x] ☐ Track fitting status
- [x] ☐ Record fitting notes
- [x] ☐ Schedule delivery/pickup
- [x] ☐ Record delivery date
- [x] ☐ Track delivery status
- [x] ☐ Mark order as delivered
- [x] ☐ Notify customer about fitting/delivery
- [x] ☐ Flag orders approaching delivery deadline

**Status:** ☐ Not Started | ☐ In Progress | ☐ Completed


---

# 12. 👗 Styles & Catalogue

- [x] ☐ Create style catalogue
- [x] ☐ Upload style images
- [x] ☐ Add style names/categories
- [x] ☐ Save frequently used designs
- [x] ☐ Attach saved styles to orders
- [x] ☐ Search styles
- [x] ☐ Filter styles
- [x] ☐ Organize styles by category
- [x] ☐ Share selected styles with customers

**Status:** ☐ Not Started | ☐ In Progress | ☐ Completed


---

# 13. 📊 Analytics & Business Insights

- [x] ☐ Dashboard overview
- [x] ☐ Total orders
- [x] ☐ Completed orders
- [x] ☐ Pending orders
- [ ] ☐ Overdue orders
- [ ] ☐ Orders at risk
- [ ] ☐ Total revenue
- [ ] ☐ Total expenses
- [ ] ☐ Total profit
- [ ] ☐ Outstanding customer balances
- [ ] ☐ Best-performing garment types
- [ ] ☐ Average production time
- [ ] ☐ Staff productivity
- [ ] ☐ Production completion rate
- [ ] ☐ Monthly/weekly business reports
- [ ] ☐ Export reports

**Status:** ☐ Not Started | ☐ In Progress | ☐ Completed


---

# 14. 📱 Offline Sync / PWA

> The PWA already exists. The remaining work is reliable offline data creation and synchronization.

- [ ] ☐ Allow users to create data while offline
- [ ] ☐ Store offline-created data locally
- [ ] ☐ Detect when device goes back online
- [ ] ☐ Automatically sync offline data
- [ ] ☐ Handle sync conflicts
- [ ] ☐ Prevent duplicate records during sync
- [ ] ☐ Show sync status to the user
- [ ] ☐ Allow failed syncs to retry
- [ ] ☐ Handle interrupted syncs safely
- [ ] ☐ Handle partially completed syncs
- [ ] ☐ Test offline → online synchronization thoroughly
- [ ] ☐ Test app behaviour after browser/app is closed while offline
- [ ] ☐ Test poor/unstable Nigerian network conditions

**Status:** ☐ Not Started | ☐ In Progress | ☐ Completed


---

# 15. 🔔 Notifications & Reminders

- [x] ☐ Order deadline reminders
- [x] ☐ Overdue order alerts
- [ ] ☐ Task assignment notifications
- [x] ☐ Task deadline reminders
- [ ] ☐ Fitting reminders
- [ ] ☐ Delivery reminders
- [ ] ☐ Payment/balance reminders
- [x] ☐ Low inventory alerts
- [ ] ☐ Customer WhatsApp notifications
- [x] ☐ Staff notifications

**Status:** ☐ Not Started | ☐ In Progress | ☐ Completed


---

# 🤖 16. Optional Later Differentiator — AI Measurements

- [ ] ☐ Research AI-based body measurement from photos
- [ ] ☐ Determine which measurements can realistically be estimated
- [ ] ☐ Design photo capture flow
- [ ] ☐ Build photo measurement prototype
- [ ] ☐ Compare AI measurements against manual measurements
- [ ] ☐ Add confidence/accuracy indicators
- [ ] ☐ Allow manual correction
- [ ] ☐ Add AI measurements to customer profiles
- [ ] ☐ Add AI measurements to orders
- [ ] ☐ Test different body types
- [ ] ☐ Test different poses
- [ ] ☐ Test different lighting conditions
- [ ] ☐ Test different clothing
- [ ] ☐ Validate accuracy with real tailors

**Priority:** ☐ Later / After Core Features


---

# 🔐 17. Security & Data Protection

- [ ] ☐ Secure customer data
- [ ] ☐ Secure payment information
- [x] ☐ Authentication
- [x] ☐ Role-based access
- [ ] ☐ Protect customer measurement data
- [ ] ☐ Secure customer tracking links
- [ ] ☐ Backup business data
- [ ] ☐ Account recovery
- [ ] ☐ Data deletion/export

**Status:** ☐ Not Started | ☐ In Progress | ☐ Completed


---

# 🧪 18. Testing & Quality

- [ ] ☐ Test customer creation
- [ ] ☐ Test order creation
- [ ] ☐ Test order editing
- [ ] ☐ Test production workflow
- [ ] ☐ Test task assignment
- [ ] ☐ Test payments
- [ ] ☐ Verify profit calculations
- [ ] ☐ Test customer tracking links
- [ ] ☐ Test WhatsApp notifications
- [ ] ☐ Test Aso-Ebi/group projects
- [ ] ☐ Test inventory calculations
- [ ] ☐ Test offline functionality
- [ ] ☐ Test offline → online sync
- [ ] ☐ Test duplicate prevention
- [ ] ☐ Test sync conflicts
- [ ] ☐ Test different screen sizes
- [ ] ☐ Test mobile experience
- [ ] ☐ Test slow internet
- [ ] ☐ Test poor/unstable network
- [ ] ☐ Test edge cases
- [ ] ☐ Fix critical bugs
- [ ] ☐ Conduct real-user testing with tailors

**Status:** ☐ Not Started | ☐ In Progress | ☐ Completed


---

# 📊 OVERALL PROGRESS

- [ ] ☐ Customer Management
- [ ] ☐ Order Management
- [ ] ☐ Production Workflow
- [ ] ☐ Staff Management
- [ ] ☐ Smart Intelligence
- [ ] ☐ Payments & Profit
- [ ] ☐ Customer Experience
- [ ] ☐ Nigerian Fashion Features
- [ ] ☐ Design Management
- [ ] ☐ Inventory
- [ ] ☐ Fittings & Delivery
- [ ] ☐ Styles & Catalogue
- [ ] ☐ Analytics
- [ ] ☐ Offline Sync
- [ ] ☐ Notifications
- [ ] ☐ AI Measurements
- [ ] ☐ Security
- [ ] ☐ Testing


# 🏆 FINAL PRODUCTION CHECKLIST

- [ ] ☐ All core features implemented
- [ ] ☐ All critical features tested
- [ ] ☐ Critical bugs fixed
- [ ] ☐ Mobile experience tested
- [ ] ☐ PWA tested
- [ ] ☐ Offline functionality tested
- [ ] ☐ Offline → online synchronization tested
- [ ] ☐ Payment/profit calculations verified
- [ ] ☐ Production workflow tested with real orders
- [ ] ☐ Customer tracking tested
- [ ] ☐ WhatsApp notifications tested
- [ ] ☐ Aso-Ebi/group project tested
- [ ] ☐ Real tailor/user testing completed
- [ ] ☐ User feedback incorporated
- [ ] ☐ Performance checked
- [ ] ☐ Security checked
- [ ] ☐ Ready for production 🚀
