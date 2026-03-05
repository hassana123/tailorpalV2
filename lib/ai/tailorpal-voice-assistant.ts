/**
 * TailorPal Voice Assistant
 * Advanced LLM integration with context-aware prompting for intelligent,
 * ChatGPT-grade conversational AI tailored to shop operations
 */

import { ConversationContext } from '@/lib/voice/conversation-context'
import { ShopContextData, formatShopContextForPrompt } from '@/lib/voice/shop-awareness'
//import { VoiceSupabase } from '@/lib/voice/db-types'

export interface AssistantOptions {
  conversationContext: ConversationContext
  shopContext: ShopContextData
  shopId: string
  userId: string
  addressingName?: string | null
}

/**
 * Generate an enhanced system prompt with full context awareness
 */
export function generateEnhancedSystemPrompt(options: AssistantOptions): string {
  const { conversationContext, shopContext, addressingName } = options

  const shopContextString = formatShopContextForPrompt(shopContext)
  const conversationHistory = conversationContext.getContext()
  const workingObject = conversationContext.getWorkingObject()

  const workingObjectInfo =
    workingObject.type !== 'none'
      ? `User is currently working with: ${workingObject.type}${workingObject.name ? ` named "${workingObject.name}"` : ''}`
      : ''

  const addressingRule = addressingName
    ? `Preferred addressee: ${addressingName}`
    : 'Preferred addressee: not provided'

  return `You are TailorPal, an intelligent voice assistant for a professional tailor shop management system.

## Your Capabilities
You can help users:
1. **Manage Customers** - Add customers, update their information, track contact history
2. **Record Measurements** - Capture body measurements using standard tailoring metrics
3. **Create & Track Orders** - Create new tailoring orders, update status, track delivery
4. **Answer Questions** - Answer general questions about shop operations, order status, customer info
5. **Correct Mistakes** - Allow users to correct values at any point without restarting
6. **Provide Suggestions** - Recommend next actions based on current shop activity

## Current Shop Context
${shopContextString}

## Conversation Context
${conversationHistory}

${workingObjectInfo ? `## Current Task\n${workingObjectInfo}` : ''}

## Voice Assistant Guidelines
1. **Multi-turn Conversation**: Remember previous context and build naturally on it
2. **Error Recovery**: If user says "no", "wrong", or "correct that", ask what should change
3. **Confirmation**: Always confirm important actions before proceeding
4. **Brevity**: Keep responses short and natural (1-3 sentences max)
5. **Clarification**: Ask for clarification if ambiguous
6. **Shop Actions**: For operations, suggest using specific commands when helpful
7. **Value Corrections**: When user corrects a value, acknowledge and confirm the change
8. **Natural Flow**: Maintain natural conversation flow, not robotic
9. **Context Awareness**: Use recent shop data to make intelligent suggestions
10. **General Knowledge**: For non-shop questions, provide helpful answers but try to connect back to shop context
11. **User Addressing**: ${addressingRule}

## Available Shop Actions (for when user wants to do something)
- "add customer" - Start adding a new customer
- "add measurement" - Record measurements for a customer
- "create order" - Create a new tailoring order
- "update order status" - Change an order's status
- "delete customer" - Remove a customer
- "list customers" - Show all customers
- "find customer [name]" - Search for a customer
- "list orders" - Show all orders
- "pending orders" - Show orders in progress

## Response Style
- Be conversational and friendly
- Address the user as the preferred addressee when greeting
- Provide helpful suggestions based on context
- Don't be robotic or overly formal
- If unsure, ask clarifying questions
- For general knowledge questions, answer directly then relate back to shop if possible

## Important Rules
- Never make up information about customers or orders
- Never address the user using any customer name from shop context
- Always confirm before making changes to data
- If the user is correcting a value, always acknowledge: "Got it, changed [field] to [value]"
- For multi-part requests, handle one part at a time
- If a command isn't clear, ask for clarification`
}

/**
 * Generate a smart reply using Groq LLM with enhanced context
 */
export async function generateSmartReply(
  userMessage: string,
  options: AssistantOptions,
): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY

  if (!apiKey) {
    console.warn('GROQ_API_KEY not set, cannot generate smart reply')
    return null
  }

  try {
    const systemPrompt = generateEnhancedSystemPrompt(options)

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', // Latest Groq model (3.3 current, 3.1 deprecated Jan 2025)
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.3, // Lower temperature for more focused responses
        max_tokens: 200, // Allow slightly longer responses for natural conversation
        top_p: 0.8,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Groq API error:', response.status, errorData)
      return null
    }

    const data = await response.json()
    const reply = data?.choices?.[0]?.message?.content as string | null

    return reply
  } catch (error) {
    console.error('Error generating smart reply:', error)
    return null
  }
}

/**
 * Stream smart reply for real-time response
 * Useful for long responses
 */
export async function streamSmartReply(userMessage: string, options: AssistantOptions) {
  const apiKey = process.env.GROQ_API_KEY

  if (!apiKey) {
    console.warn('GROQ_API_KEY not set, cannot stream reply')
    return null
  }

  try {
    const systemPrompt = generateEnhancedSystemPrompt(options)

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.3,
        max_tokens: 200,
        stream: true,
      }),
    })

    if (!response.ok) {
      return null
    }

    return response.body
  } catch (error) {
    console.error('Error streaming smart reply:', error)
    return null
  }
}

/**
 * Detect if a message is asking for general knowledge vs shop operation
 */
export function detectMessageType(message: string): 'shop_action' | 'shop_question' | 'general_knowledge' | 'correction' {
  const shopActionPatterns = [
    /\b(add|create|record|update|delete|list|find)\s+(customer|order|measurement)\b/i,
    /\b(new|create|start)\s+(customer|order|measurement)\b/i,
  ]

  const shopQuestionPatterns = [
    /\b(how many|how much|what|when|status|where)\b.*\b(customer|order|measurement|shop)\b/i,
    /\b(customer|order|measurement|shop).*\b(status|information|details)\b/i,
  ]

  const correctionPatterns = [
    /\b(no|wrong|correct|change|fix|edit)\b/i,
    /\b(actually|wait|hold on)\b/i,
  ]

  if (correctionPatterns.some((p) => p.test(message))) {
    return 'correction'
  }

  if (shopActionPatterns.some((p) => p.test(message))) {
    return 'shop_action'
  }

  if (shopQuestionPatterns.some((p) => p.test(message))) {
    return 'shop_question'
  }

  return 'general_knowledge'
}

/**
 * Generate a suggestion for next action based on shop context
 */
export function generateNextActionSuggestion(shopContext: ShopContextData): string | null {
  if (shopContext.pendingOrders > 3) {
    return 'You have several pending orders. Would you like to update their status?'
  }

  if (shopContext.totalCustomers === 0) {
    return 'Your shop has no customers yet. Start by adding your first customer with "add customer".'
  }

  if (shopContext.pendingOrders === 0 && shopContext.totalCustomers > 0) {
    return `You have ${shopContext.totalCustomers} customers but no pending orders. Ready to create a new order?`
  }

  return null
}
