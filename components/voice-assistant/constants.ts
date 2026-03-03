export const SILENCE_TIMEOUT_MS = 2500  // Changed from 1500 to 2500 (2.5 seconds)
export const MAX_MESSAGES = 50

export const HELP_TEXT = `Say simple starters and I will guide you:
- "add customer"
- "add measurement"
- "create order"
- "update order status"
- "delete customer"
- "list customers"
- "find customer Jane"
- "list orders"
- "pending orders"
- "shop stats"

During guided steps:
- say "skip" for optional fields
- say "yes" to confirm save
- say "no" or "cancel" to stop

Controls:
- Auto: sends after 2.5 seconds of silence
- Loop: always on; microphone restarts after assistant reply`