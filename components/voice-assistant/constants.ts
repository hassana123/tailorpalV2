export const SILENCE_TIMEOUT_MS = 2500  // Changed from 1500 to 2500 (2.5 seconds)
export const MAX_MESSAGES = 50

export const HELP_TEXT = `Say simple starters and I will guide you:
- "add customer" or "create customer"
- "add measurement" or "record measurements"
- "create order" or "new order"
- "update order status"
- "delete customer"
- "list customers" or "show customers"
- "find customer Jane"
- "list orders" or "show orders"
- "pending orders"
- "shop stats" or "shop summary"

During guided steps:
- say "skip" (or "skip skip", "skip it", "pass", "none") to skip optional fields
- say "yes", "confirm", or "ok" to confirm save
- say "no", "cancel", or "stop" to cancel
- for email, spoken forms work: "hassana at gmail dot com"
- say "help" anytime for this list

Controls:
- Auto: sends after 2.5 seconds of silence
- Loop: always on; microphone restarts after assistant reply`
