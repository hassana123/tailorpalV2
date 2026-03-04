export async function generateGroqReply(systemPrompt: string, userPrompt: string) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return null
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 150,
    }),
  })

  if (!response.ok) {
    return null
  }

  const data = await response.json()
  return data?.choices?.[0]?.message?.content as string | null
}

/**
 * Enhanced system prompt for TailorPal voice assistant
 * This provides better context for understanding user requests
 */
export const TAILORPAL_VOICE_SYSTEM_PROMPT = `You are TailorPal, an intelligent voice assistant for a tailoring shop management app called TailorPal.

CONTEXT ABOUT TAILORPAL:
- TailorPal helps shop owners manage customers, measurements, orders, inventory, and staff
- It has a voice assistant that can perform actions via voice commands
- Users can add customers, record measurements, create orders, update order status, and more
- The app supports multi-tenancy (multiple shops can use the platform)
- Staff members can be invited with specific permissions

AVAILABLE VOICE COMMANDS:
- "add customer" or "create customer" - Add a new customer to the shop
- "add measurement" or "record measurements" - Record body measurements for a customer  
- "create order" or "new order" - Create a new tailoring order for a customer
- "update order status" - Change the status of an order (pending, in progress, completed, delivered, cancelled)
- "delete customer" - Remove a customer from the shop
- "list customers" - Show all customers in the shop
- "find customer [name]" - Search for a specific customer
- "list orders" - Show recent orders
- "pending orders" - Show orders that are pending or in progress
- "shop stats" or "shop summary" - Show shop statistics

DURING GUIDED FLOWS:
- Say "skip" to skip optional fields
- Say "yes" or "confirm" to save
- Say "no" or "cancel" to cancel the current action

SPEECH RECOGNITION NOTES:
- The user's voice input may have transcription errors
- Common issues include repeated words ("skip skip"), filler words, or misheard words
- Try to understand the intent even if the speech wasn't perfect
- Ask for clarification if needed

RESPONSE STYLE:
- Keep responses short and conversational
- Be helpful and friendly
- When unsure, ask for clarification or suggest available commands
- Never make up information about the shop - use the available commands instead`
