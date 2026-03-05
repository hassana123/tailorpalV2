import { VoiceFlow, VoiceIntent, VoicePermission } from '@/lib/voice/types'
import { preprocessVoiceInput } from './parsers'

/**
 * Enhanced intent detection with many more synonyms and patterns
 * This makes the voice assistant much smarter at understanding different ways
 * users might express the same intent
 */
const INTENT_RULES: Array<{ intent: VoiceIntent; pattern: RegExp }> = [
  // Add customer - many variations
  { 
    intent: 'add_customer', 
    pattern: /\b(add|create|register|new)\s+(a\s+)?(new\s+)?customer\b|\bcustomer\s+(add|create|register|new)\b|\badd\s+(a\s+)?(new\s+)?client\b|\bnew\s+customer\b/i 
  },
  // Add measurement - many variations
  { 
    intent: 'add_measurement', 
    pattern: /\b(add|record|take|save|enter|input)\s+measurements?\b|\bmeasurements?\s+(add|record|take|save|enter)\b|\brecord\s+(the\s+)?measurements?\b|\btake\s+(the\s+)?measurements?\b|\bget\s+measurements?\b|\bbody\s+measurements?\b/i 
  },
  // Create order - many variations
  { 
    intent: 'create_order', 
    pattern: /\b(create|new|make|start|add)\s+(a\s+)?order\b|\border\s+(create|new|make|start|add)\b|\bbook\s+(a\s+)?(new\s+)?order\b|\bnew\s+job\b|\bplace\s+(a\s+)?order\b/i 
  },
  // Update order status - many variations
  { 
    intent: 'update_order_status', 
    pattern: /\b(update|change|modify|set)\s+order(?:\s+status)?\b|\bstatus\s+(update|change|to|set)\b|\bchange\s+the\s+order\s+status\b|\bupdate\s+(the\s+)?order\b|\border\s+(status|update|change)\b/i 
  },
  // Delete customer - many variations
  { 
    intent: 'delete_customer', 
    pattern: /\b(delete|remove|erase)\s+(a\s+)?customer\b|\bcustomer\s+(delete|remove|erase)\b|\bremove\s+(a\s+)?client\b|\bdelete\s+(a\s+)?client\b/i 
  },
  // List customers - many variations
  { 
    intent: 'list_customers', 
    pattern: /\b(list|show|get|display|view|see|fetch)\s+(the\s+)?customers?\b|\bshow\s+me\s+(the\s+)?customers?\b|\bget\s+(a\s+)?list\s+of\s+customers?\b|\ball\s+customers?\b|\bdisplay\s+(the\s+)?customers?\b/i 
  },
  // Find customer - many variations
  { 
    intent: 'find_customer', 
    pattern: /\b(find|search|look\s+up|locate|get|lookup)\s+(a\s+)?customer\b|\bcustomer\s+(find|search|look\s+up|locate)\b|\bwho\s+is\s+\w+\b|\blook\s+up\s+\w+\b/i 
  },
  // List orders - many variations
  { 
    intent: 'list_orders', 
    pattern: /\b(list|show|get|display|view|see|fetch)\s+(the\s+)?orders?\b|\bshow\s+me\s+(the\s+)?orders?\b|\bget\s+(a\s+)?list\s+of\s+orders?\b|\ball\s+orders?\b|\bdisplay\s+(the\s+)?orders?\b|\bwhat\s+orders\b/i 
  },
  // Pending orders - many variations
  { 
    intent: 'pending_orders', 
    pattern: /\bpending\s+orders?|\bin\s+progress\s+orders?|\bactive\s+orders?|\bunfinished\s+orders?|\bwork\s+in\s+progress\b|\borders\s+in\s+progress\b|\bcurrent\s+orders?\b|\brunning\s+orders?\b/i 
  },
  // Shop stats - many variations
  { 
    intent: 'shop_stats', 
    pattern: /\b(shop\s+stats?|statistics|summary|overview|analytics|report)\b|\bhow\s+is\s+(the\s+)?shop\b|\bshop\s+performance\b|\bdashboard\b|\bhow\s+are\s+we\s+doing\b|\bshop\s+information\b|\bquick\s+stats?\b|\bnumbers\b/i 
  },
  // Help
  { intent: 'help', pattern: /^\s*help\b|\bhelp\s+me\b|\bwhat\s+can\s+i\s+say\b|\bcommands\b/i },
]

const INTENT_TO_FLOW: Partial<Record<VoiceIntent, VoiceFlow>> = {
  add_customer: 'add_customer',
  add_measurement: 'add_measurement',
  create_order: 'create_order',
  update_order_status: 'update_order_status',
  delete_customer: 'delete_customer',
}

const FLOW_PERMISSION: Record<VoiceFlow, VoicePermission> = {
  add_customer: 'manage_customers',
  add_measurement: 'manage_measurements',
  create_order: 'manage_orders',
  update_order_status: 'manage_orders',
  delete_customer: 'manage_customers',
}

export function detectIntent(message: string): VoiceIntent {
  const normalized = preprocessVoiceInput(message).trim()
  
  // Try to find matching intent
  const match = INTENT_RULES.find((rule) => rule.pattern.test(normalized))
  if (match) return match.intent
  
  // Also try original message for backwards compatibility
  const originalMatch = INTENT_RULES.find((rule) => rule.pattern.test(message.trim()))
  if (originalMatch) return originalMatch.intent
  
  return 'unknown'
}

export function intentToFlow(intent: VoiceIntent) {
  return INTENT_TO_FLOW[intent]
}

export function getFlowPermission(flow: VoiceFlow) {
  return FLOW_PERMISSION[flow]
}

export function isCancelCommand(message: string) {
  const cleaned = preprocessVoiceInput(message)
  return /\b(cancel|cancel it|stop|stop it|start over|restart|reset|never ?mind|abort|discard|forget it|forget this|end this|quit)\b/i.test(cleaned)
}
