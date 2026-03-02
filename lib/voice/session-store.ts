import { VoiceSession } from '@/lib/voice/types'

const SESSION_TTL_MS = 10 * 60 * 1000
const sessions = new Map<string, VoiceSession>()

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
