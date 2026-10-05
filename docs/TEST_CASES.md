# TailorPal acceptance test cases

Run the relevant Supabase migrations first, then complete these tests on a phone and desktop browser. Mark a case only when its expected result occurs.

## Setup and customers

1. Create a customer with phone, city, and notes. Expected: profile appears in Customers search.
2. Record measurements manually, then edit one value. Expected: the customer profile shows the updated measurement record.
3. Take a clear photo of a handwritten measurement sheet. Expected: recognized values fill editable fields; review them before saving.
4. Create a customer order with a deadline, price, notes, garment, linked measurements, and a design reference. Expected: all details appear in Order Details.

## Workshop and planner

5. Open Production Planner for the first time. Expected: Planner Setup asks for workshop type, work days, hours/day, and makers.
6. Activate Quick mode, then open Production Workflow. Create a Cutting task and assign a staff member.
7. Start and complete that task. Expected: Planner shows the order’s updated progress, current stage, and remaining task time.
8. In Pro mode, set a short deadline and several task hours. Expected: Planner identifies the order as needing attention when work exceeds configured capacity.

## Orders and customer experience

9. Schedule a fitting, add fitting notes, and click the WhatsApp fitting reminder. Expected: WhatsApp opens with the correct customer message.
10. Add a progress photo, set delivery to Ready, and click the ready update. Expected: photo appears in order details; WhatsApp message opens.
11. Copy the tracking link and open it in a private browser window. Expected: customer sees current stage, progress, fitting date, and expected completion.
12. Print an invoice from order details. Expected: print dialog opens and can save as PDF.

## Inventory and finance

13. Add fabric inventory with stock and reorder level. Expected: stock value and low-stock filter update.
14. Attach fabric to an order. Expected: order lists the material and inventory quantity decreases.
15. Add material and labour expenses to an order. Expected: Finance shows total expenses and profit per order.

## Notifications and permissions

16. Create a task/order due within one day and open the bell. Expected: a workshop reminder appears.
17. Sign in as a staff account with order permission. Expected: they can see assigned work but cannot access areas without permission.

## Regression checks

18. Run `npm run typecheck` and `npm run build`. Expected: both finish successfully.
19. Test on a narrow mobile browser: add customer, create order, change task status, and upload a photo. Expected: controls remain usable with no horizontal overflow.
