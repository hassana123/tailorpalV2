import { generateGroqReply } from '@/lib/ai/groq'
import { handleVoiceRequest, hasPermissionIssue, getRequiredPermissionForRequest } from '@/lib/voice/engine'
import { getSessionKey } from '@/lib/voice/session-store'
import { hasShopAccess, hasStaffPermission } from '@/lib/server/authz'
import { checkRateLimit } from '@/lib/server/rate-limit'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const payloadSchema = z.object({
  message: z.string().min(1),
  shopId: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = payloadSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { message, shopId } = parsed.data
    const canAccess = await hasShopAccess(user.id, shopId)
    if (!canAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const rateLimit = checkRateLimit(`${user.id}:${shopId}`, 40, 60_000)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { reply: 'Rate limit exceeded. Please wait a moment before trying again.' },
        { status: 429 },
      )
    }

    const sessionKey = getSessionKey(user.id, shopId)
    const requiredPermission = getRequiredPermissionForRequest(sessionKey, message)
    if (requiredPermission) {
      const allowed = await hasStaffPermission(user.id, shopId, requiredPermission)
      if (!allowed) {
        return NextResponse.json(
          { reply: hasPermissionIssue(requiredPermission) },
          { status: 403 },
        )
      }
    }

    const voiceResult = await handleVoiceRequest({
      supabase,
      shopId,
      userId: user.id,
      message,
      sessionKey,
    })
    if (voiceResult) {
      return NextResponse.json(voiceResult)
    }

    const fallback = await generateGroqReply(
      `You are TailorPal, a concise voice assistant for tailoring shops.
Keep replies under 3 short sentences.
If the user is asking for a shop action, suggest one of these starters:
"add customer", "add measurement", "create order", "update order status", "list customers".`,
      message,
    )

    return NextResponse.json({
      reply: fallback ?? 'I did not catch that clearly. Say "help" to hear supported commands.',
    })
  } catch (error) {
    console.error('Error processing voice command:', error)
    return NextResponse.json({ error: 'Failed to process command' }, { status: 500 })
  }
}
