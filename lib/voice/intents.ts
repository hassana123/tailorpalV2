import { VoiceFlow, VoiceIntent, VoicePermission } from '@/lib/voice/types'

const INTENT_RULES: Array<{ intent: VoiceIntent; pattern: RegExp }> = [
  { intent: 'add_customer', pattern: /\b(add|create|new)\s+customer\b/i },
  { intent: 'add_measurement', pattern: /\b(add|record|take|save)\s+measurements?\b/i },
  { intent: 'create_order', pattern: /\b(create|new)\s+order\b/i },
  {
    intent: 'update_order_status',
    pattern: /\b(update|change)\s+order(?:\s+status)?\b|\bstatus\s+to\b/i,
  },
  { intent: 'delete_customer', pattern: /\b(delete|remove)\s+customer\b/i },
  { intent: 'list_customers', pattern: /\b(list|show|get)\s+customers?\b/i },
  { intent: 'find_customer', pattern: /\b(find|search|look\s+up)\s+customer\b/i },
  { intent: 'list_orders', pattern: /\b(list|show|get)\s+orders?\b/i },
  { intent: 'pending_orders', pattern: /\bpending\s+orders?\b/i },
  { intent: 'shop_stats', pattern: /\b(shop\s+stats?|statistics|summary|overview|analytics)\b/i },
  { intent: 'help', pattern: /^\s*help\b/i },
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
  const normalized = message.trim()
  const match = INTENT_RULES.find((rule) => rule.pattern.test(normalized))
  return match?.intent ?? 'unknown'
}

export function intentToFlow(intent: VoiceIntent) {
  return INTENT_TO_FLOW[intent]
}

export function getFlowPermission(flow: VoiceFlow) {
  return FLOW_PERMISSION[flow]
}

export function isCancelCommand(message: string) {
  return /\b(cancel|stop|start over|reset|never mind)\b/i.test(message)
}
