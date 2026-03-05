import { VoiceSession } from '@/lib/voice/types'
import { ConversationContext } from '@/lib/voice/conversation-context'

const SESSION_TTL_MS = 10 * 60 * 1000
const sessions = new Map<string, VoiceSession>()
const conversationContexts = new Map<string, ConversationContext>()

function cleanupExpiredSessions() {
  const now = Date.now()
  for (const [key, session] of sessions.entries()) {
    if (session.expiresAt <= now) {
      sessions.delete(key)
    }
  }
}

export function getSessionKey(userId: string, shopId: string) {
  return `${userId}:${shopId}`
}

export function getVoiceSession(key: string) {
  cleanupExpiredSessions()
  const session = sessions.get(key)
  if (!session) return null
  if (session.expiresAt <= Date.now()) {
    sessions.delete(key)
    return null
  }
  return session
}

export function setVoiceSession(key: string, session: VoiceSession) {
  sessions.set(key, {
    ...session,
    expiresAt: Date.now() + SESSION_TTL_MS,
  })
}

export function clearVoiceSession(key: string) {
  sessions.delete(key)
}

/**
 * Get conversation context for a user/shop session
 * Creates a new one if it doesn't exist
 */
export function getConversationContext(key: string): ConversationContext {
  let context = conversationContexts.get(key)
  if (!context) {
    context = new ConversationContext()
    conversationContexts.set(key, context)
  }
  return context
}

/**
 * Set conversation context for a user/shop session
 */
export function setConversationContext(key: string, context: ConversationContext) {
  conversationContexts.set(key, context)
}

/**
 * Clear conversation context
 */
export function clearConversationContext(key: string) {
  conversationContexts.delete(key)
}

/**
 * Get all active conversation contexts (for analytics/debugging)
 */
export function getAllConversationContexts() {
  return Array.from(conversationContexts.entries())
}
