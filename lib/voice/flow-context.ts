import { VoiceSupabase } from '@/lib/voice/db-types'

export interface VoiceFlowContext {
  supabase: VoiceSupabase
  shopId: string
  userId: string
  message: string
  sessionKey: string
}
