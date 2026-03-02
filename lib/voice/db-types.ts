import { createClient } from '@/lib/supabase/server'

export type VoiceSupabase = Awaited<ReturnType<typeof createClient>>
