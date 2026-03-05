# TailorPal Voice Assistant - Complete Commands Reference

This is a quick reference for all voice commands available in TailorPal.

## Customer Management Commands

### Add/Create Customer
```
"Add a customer"
"Create a customer"
"New customer"
"Register a customer"
"Create new customer"
"Add customer [name]"  // With name included
"Add customer Jane Doe from London"  // With full details
```

### Find/Search Customer
```
"Find [name]"
"Look up [name]"
"Search for [name]"
"Find customer [name]"
"Locate [name]"
"Get customer [name]"
"Show me [name]"
```

### List All Customers
```
"List customers"
"Show customers"
"List all customers"
"Show all customers"
"Get customer list"
"My customers"
"Who are my customers"
```

### Delete/Remove Customer
```
"Delete [name]"
"Remove [name]"
"Delete customer [name]"
"Remove customer [name]"
"Erase customer [name]"
"Delete customer"  // Assistant asks which one
```

---

## Measurement Commands

### Record/Add Measurements
```
"Add measurements"
"Record measurements"
"Take measurements"
"Record measurements for [name]"
"Add measurements for [name]"
"Measure [name]"
"Get measurements for [name]"
```

### View Measurements
```
"Show measurements"
"Show measurements for [name]"
"What are [name]'s measurements"
"Get measurements for [name]"
"View measurements"
```

### Update Measurements
```
"Update measurements"
"Update measurements for [name]"
"Correct measurements for [name]"
"Fix measurements for [name]"
```

### Measurement Types
When selecting measurements, you can say:
```
"All"  // All standard measurements
"Chest"
"Waist"
"Hip"
"Sleeve"
"Sleeve length"
"Shoulder"
"Shoulder width"
"Inseam"
"Length"
"Height"
"Chest and waist"  // Multiple
"Chest, waist, hip"  // Multiple
```

---

## Order Management Commands

### Create/New Order
```
"Create an order"
"Create order"
"New order"
"New order for [name]"
"Create order for [name]"
"Book an order"
"Start a new order"
"Place an order for [name]"
"Add new order"
```

### Update Order Status
```
"Update order status"
"Change order status"
"Update status"
"Change order"
"Update order"
"Change the order status"
"Set order status"
"Set status"
```

### Status Values
When updating status, you can say:
```
"Pending"
"In progress"
"In progress" / "Work in progress"
"Completed"
"Completed"
"Delivered"
"Shipped"
"Cancelled"
"Cancel"
```

### List/View Orders
```
"List orders"
"Show orders"
"Show all orders"
"List all orders"
"Get orders"
"My orders"
"What orders do I have"
```

### Pending/Active Orders
```
"Pending orders"
"In progress orders"
"Active orders"
"Unfinished orders"
"Work in progress"
"Current orders"
"Running orders"
"What orders are pending"
"Show pending orders"
```

---

## Shop Information Commands

### Shop Statistics
```
"Shop stats"
"Shop statistics"
"Shop summary"
"Shop overview"
"How is the shop"
"Shop information"
"Quick stats"
"How are we doing"
"Shop analytics"
"Shop report"
"Numbers"
"Dashboard"
"Performance"
```

### General Questions
You can ask any general question:
```
"What time is it"
"Tell me about tailoring"
"How do I take measurements"
"What's the weather"
"Help with my business"
"How to improve quality"
"Tips for tailoring"
```

---

## Navigation & Control Commands

### Get Help
```
"Help"
"Help me"
"What can I say"
"Show commands"
"Show help"
"What commands are available"
"How do I use this"
"Guide me"
```

### Cancel Current Action
```
"Cancel"
"Cancel it"
"Cancel that"
"Stop"
"Stop it"
"Start over"
"Restart"
"Reset"
"Never mind"
"Nevermind"
"Abort"
"Forget it"
"Forget this"
"Discard"
"End this"
"Quit"
"Go back"
```

---

## Confirmation & Correction Commands

### Confirmation
```
"Yes"
"Yes, confirm"
"Yep"
"Yup"
"Yeah"
"Correct"
"That's right"
"That's correct"
"Save it"
"Go ahead"
"Do it"
"OK"
"Okay"
"Sure"
"Good"
"Perfect"
"That's good"
```

### Rejection/No
```
"No"
"Nope"
"Nope"
"Wrong"
"Incorrect"
"Not correct"
"That's wrong"
"That's not right"
"Don't save"
"Not right"
"Error"
"Fix that"
"Change that"
```

### Skip/Pass
```
"Skip"
"Skip it"
"Skip this"
"Pass"
"Later"
"Not now"
"I'll skip that"
```

### Corrections & Changes
```
"Correct that"
"Fix that"
"Change it"
"Change it to [value]"
"Edit it"
"Update that"
"Actually [correction]"
"Wait, [correction]"
"Hold on [correction]"
"No, it's [value]"
"It's actually [value]"
"The correct one is [value]"
"Change [field] to [value]"
"Set [field] to [value]"
"Make [field] [value]"
```

---

## Advanced Usage

### Providing Information Simultaneously
Instead of answering one question at a time, you can provide multiple pieces:

**Single field:**
```
You: "Add a customer"
Assistant: "What's the name?"
You: "John Smith"
```

**Multiple fields at once:**
```
You: "Add a customer"
Assistant: "What's the name?"
You: "John Smith, john@example.com, 555-1234"
// The assistant parses and confirms all three
```

**With context:**
```
You: "Add customer John Smith from London"
You: "Record measurements for John Smith"
You: "Update order status to completed"
```

### Natural Variations
The voice assistant understands many variations:

```
"Add customer" = "Create customer" = "New customer" = "Register customer"
"List orders" = "Show orders" = "Show me orders" = "What orders"
"Find John" = "Look up John" = "Locate John" = "Get John"
```

### Measurement Input Formats
When entering measurements, these formats work:
```
"40"  // Just the number
"40 centimeters"
"40 cm"
"40 inches"
"1 meter"
"5 feet 10 inches"  // For height/length
"Large"  // For sizes
```

---

## Tips for Using Commands

1. **Natural speech** - You don't need to use exact commands. The assistant understands intent.

2. **Full sentences are fine:**
   ```
   "Add a new customer named Sarah"  // Works great
   "Sarah"  // Also works
   ```

3. **Partial information:**
   ```
   "Add customer"  // Assistant asks for name
   "Create John"  // Assistant fills in details
   ```

4. **Corrections mid-command:**
   ```
   You: "Sarah"
   Assistant: "Is the name Sarah?"
   You: "No, it's Sally"
   Assistant: "Got Sally"
   ```

5. **Context matters:**
   ```
   While recording measurements:
   - "40" = Next measurement value
   - "Done" = Finish measuring
   - "No" = Wrong value, correct it
   
   While creating order:
   - "Suit" = Order description
   - "Silk" = Fabric type
   - "Next week" = Due date
   ```

---

## Advanced Patterns

### Multi-Step Operations

**Adding customer with immediate measurements:**
```
You: "Add customer Jane Doe"
(Complete customer flow)
You: "Yes, add measurements"
(Measurement recording continues without restarting)
```

**Quick updates:**
```
You: "Update order status"
You: "John's order"
You: "Completed"
(Save)
You: "Another one"  // Update different order
You: "Sarah's order"
You: "In progress"
```

### Information Chaining

```
You: "Find Sarah Johnson"
// System finds and loads Sarah's data
You: "Add measurement"
// System knows it's for Sarah
You: "Record 38, 30, 32"
// System records measurements for Sarah
```

### Batch Corrections

```
You: "Sarah Johnson, 25 years"
Assistant: "Got Sarah Johnson. Email?"
You: "Actually, her name is Sally and she's 24"
Assistant: "Changed name to Sally and age to 24. Email?"
```

---

## Command Categories Quick Index

| Category | Key Commands |
|----------|---|
| **Customer** | add, find, list, delete |
| **Measurement** | add, record, update, show |
| **Order** | create, status, list, pending |
| **Shop Info** | stats, summary, overview |
| **Control** | help, cancel, start over |
| **Confirm** | yes, no, correct, skip |
| **Correct** | fix, change, edit, update |

---

## Keyboard Shortcuts (If Voice Not Working)

While voice is preferred, you can also type commands:

- Type your command as you would say it
- Press Enter to submit
- Assistant responds same way

```
Type: "Add customer"
Type: "John Smith"
Type: "john@email.com"
```

---

## Notes

- **Case insensitive** - "ADD CUSTOMER" and "add customer" work the same
- **Punctuation doesn't matter** - "Add, a, customer" works fine
- **Extra words are OK** - "Can you please add a customer?" works
- **Typos are forgiven** - If you meant to type something else, say "No" and correct
- **The assistant learns** - The more you use it, the better it understands you

---

## Still Have Questions?

See the full user guide: `VOICE_ASSISTANT_GUIDE.md`

Need help? Use the "Help" command in the voice assistant, or contact support.
