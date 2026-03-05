import { VoiceIntent } from '@/lib/voice/types'
import { preprocessVoiceInput } from '@/lib/voice/parsers'

/**
 * Smart intent detector that understands:
 * 1. Questions about HOW to do something (asks for help, not executing)
 * 2. Commands to execute an action (actually do something)
 * 3. General conversation and knowledge questions
 */

export interface IntentDetectionResult {
  intent: VoiceIntent
  isQuestion: boolean
  isCommand: boolean
  confidence: number
  shouldExecuteFlow: boolean // False for "how can I...", true for "add customer"
}

// Question patterns: "how", "what", "can I", "tell me", "explain", "help me"
const QUESTION_PATTERNS = [
  /^(how|what|when|where|why|who|which)\s+/i,
  /\b(how do|how can|how should|how would)\s+(i|we)\b/i,
  /\b(can you|could you|would you|will you)\s+(help|tell|explain|show|guide)\b/i,
  /\b(tell me|show me|explain|help me|teach me|guide me)\b/i,
  /\b(what is|what are|what should|what do)\b/i,
  /\bwhat.*to\b/i,
]

// Command patterns: Direct action words
const COMMAND_PATTERNS = [
  /^\s*(add|create|new|record|start|make|begin|register)\s+/i,
  /^\s*(add|record|take)\s+\w+\s+(now|please|for|to)/i,
  /\b(add|create|new|record)\s+(a|the)?\s*(customer|order|measurement)\b/i,
  /^\s*(list|show|get|fetch|display|view)\s+(customers?|orders?|details?|info)/i,
]

// Casual greeting patterns
const GREETING_PATTERNS = [
  /^(hi|hello|hey|greetings|good morning|good afternoon|good evening)\b/i,
  /^\s*it'?s\s+me\b/i,
]

// General knowledge/conversation patterns (not shop-related)
const KNOWLEDGE_PATTERNS = [
  /^(what is|who is|explain|tell me about)\b/i,
  /\b(weather|temperature|time|date|news|sports|music|movie|book)\b/i,
  /\b(why|how does|what makes|what causes)\b/i,
]

export function detectSmartIntent(message: string): IntentDetectionResult {
  const cleaned = preprocessVoiceInput(message).trim()
  const original = message.trim()

  // 1. Check if it's a greeting
  if (GREETING_PATTERNS.some(p => p.test(original))) {
    return {
      intent: 'greeting',
      isQuestion: false,
      isCommand: false,
      confidence: 0.95,
      shouldExecuteFlow: false,
    }
  }

  // 2. Check if it's a question about how to do something
  const isQuestion = QUESTION_PATTERNS.some(p => p.test(original))

  // 3. Check if it's a direct command
  const isCommand = COMMAND_PATTERNS.some(p => p.test(cleaned))

  // 4. If it's a question AND contains a shop action word, it's a help request
  if (isQuestion && /\b(add|customer|measurement|order|create|register)\b/i.test(original)) {
    return {
      intent: 'help_request',
      isQuestion: true,
      isCommand: false,
      confidence: 0.9,
      shouldExecuteFlow: false, // Don't start the flow, just explain
    }
  }

  // 5. If it's a general question not about shop operations
  if (isQuestion && KNOWLEDGE_PATTERNS.some(p => p.test(original))) {
    return {
      intent: 'knowledge_question',
      isQuestion: true,
      isCommand: false,
      confidence: 0.85,
      shouldExecuteFlow: false,
    }
  }

  // 6. Detect specific shop intents only if it's a command or clear action
  let specificIntent = detectSpecificShopIntent(cleaned, isCommand)

  if (isQuestion && !isCommand) {
    // If it's a question without a clear command, ask for clarification
    return {
      intent: specificIntent || 'unknown',
      isQuestion: true,
      isCommand: false,
      confidence: 0.6,
      shouldExecuteFlow: false,
    }
  }

  if (isCommand || specificIntent) {
    return {
      intent: specificIntent || 'unknown',
      isQuestion: false,
      isCommand: true,
      confidence: isCommand ? 0.9 : 0.7,
      shouldExecuteFlow: true,
    }
  }

  // Default to unknown
  return {
    intent: 'unknown',
    isQuestion: false,
    isCommand: false,
    confidence: 0.3,
    shouldExecuteFlow: false,
  }
}

function detectSpecificShopIntent(cleaned: string, isCommand: boolean): VoiceIntent | null {
  // Only detect specific intents if it looks like a command
  const patterns = [
    {
      intent: 'add_customer' as const,
      patterns: [
        /\b(add|create|register|new)\s+(a\s+)?(new\s+)?customer\b/i,
        /\bcustomer\s+(add|create|register|new)\b/i,
        /^\s*(add|new)\s+customer\b/i,
      ],
    },
    {
      intent: 'add_measurement' as const,
      patterns: [
        /\b(add|record|take|enter)\s+measurements?\b/i,
        /\b(measure|add measurements|record measurements)\b/i,
        /^\s*(add|record|take)\s+measurements?\b/i,
      ],
    },
    {
      intent: 'create_order' as const,
      patterns: [
        /\b(create|new|make|start|book)\s+(a\s+)?order\b/i,
        /^\s*(new|create|book)\s+order\b/i,
      ],
    },
    {
      intent: 'list_customers' as const,
      patterns: [
        /\b(list|show|get|fetch|view)\s+(the\s+)?customers?\b/i,
        /^\s*(list|show|get|view|all)\s+customers?\b/i,
      ],
    },
    {
      intent: 'list_orders' as const,
      patterns: [
        /\b(list|show|get|fetch|view)\s+(the\s+)?orders?\b/i,
        /^\s*(list|show|get|view|all)\s+orders?\b/i,
      ],
    },
    {
      intent: 'find_customer' as const,
      patterns: [
        /\b(find|search|look\s+up|locate)\s+(a\s+)?customer\b/i,
        /\bcustomer\s+(find|search|look\s+up)\b/i,
      ],
    },
  ]

  for (const { intent, patterns } of patterns) {
    if (patterns.some(p => p.test(cleaned))) {
      return intent
    }
  }

  return null
}

/**
 * Generate a helpful response for when user asks HOW to do something
 */
export function generateHelpResponse(intent: VoiceIntent): string {
  const helpMessages: Record<VoiceIntent, string> = {
    help_request:
      "To add a customer, say 'add customer' and I'll guide you through entering their name, email, and phone. You can also say 'add customer John Smith' to include info right away.",
    add_customer:
      "To add a customer, say 'add customer' and then just tell me their name, email, and phone number.",
    add_measurement:
      "To add measurements, say 'add measurement' and then give me the measurements like 'chest 40, waist 32'. Or I can ask you for each one.",
    create_order: "To create an order, say 'create order' and tell me the customer name and order details.",
    list_customers: "Say 'list customers' to see all your customers.",
    list_orders: "Say 'list orders' to see all your orders.",
    find_customer: "Say 'find customer' followed by the name to search for a specific customer.",
    pending_orders: "Say 'pending orders' to see orders that are still in progress.",
    knowledge_question:
      "I can help you with your tailor shop operations. Try asking things like 'add customer', 'create order', or 'list orders'.",
    greeting:
      "Hello! I'm your AI assistant for managing your tailor shop. You can ask me to add customers, create orders, add measurements, list customers, or even answer general questions!",
    update_order_status: "To update an order, say 'update order' followed by the order number.",
    delete_customer: "To delete a customer, say 'delete customer' followed by their name.",
    shop_stats: "Say 'shop stats' to see quick statistics about your shop.",
    unknown:
      'I can help you manage your shop. Try saying "add customer", "create order", "list customers", or "help" to learn more.',
  }

  return helpMessages[intent] || helpMessages.unknown
}

/**
 * Generate a correction clarification message
 */
export function generateCorrectionResponse(field: string): string {
  const responses: Record<string, string> = {
    name: "What should the customer name be?",
    firstName: "What should the first name be?",
    lastName: "What should the last name be?",
    email: "What should the email be?",
    phone: "What should the phone number be?",
    address: "What should the address be?",
    measurement: "Which measurement should I change, and what should it be?",
    default: `Let me correct that. What should it be?`,
  }

  return responses[field] || responses.default
}
