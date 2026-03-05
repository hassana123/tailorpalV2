import { generateGroqReply, TAILORPAL_VOICE_SYSTEM_PROMPT } from '@/lib/ai/groq'
import { generateSmartReply } from '@/lib/ai/tailorpal-voice-assistant'
import { detectMessageType } from '@/lib/ai/tailorpal-voice-assistant'
import { handleVoiceRequest, hasPermissionIssue, getRequiredPermissionForRequest } from '@/lib/voice/engine'
import { getSessionKey, getConversationContext, setConversationContext } from '@/lib/voice/session-store'
import { getShopContext, clearShopContextCache } from '@/lib/voice/shop-awareness'
import { detectIntent } from '@/lib/voice/intents'
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

    // Get or create conversation context
    const conversationContext = getConversationContext(sessionKey)
    conversationContext.addUserMessage(message, detectIntent(message))

    const voiceResult = await handleVoiceRequest({
      supabase,
      shopId,
      userId: user.id,
      message,
      sessionKey,
    })
    if (voiceResult) {
      // Add assistant response to conversation context
      conversationContext.addAssistantMessage(voiceResult.reply, voiceResult.action)
      setConversationContext(sessionKey, conversationContext)
      return NextResponse.json(voiceResult)
    }

    // Get shop context for intelligent responses
    let shopContext
    try {
      shopContext = await getShopContext(supabase, shopId)
    } catch (error) {
      console.error('Failed to fetch shop context:', error)
      shopContext = {
        shopId,
        totalCustomers: 0,
        recentCustomers: [],
        pendingOrders: 0,
        recentOrders: [],
        totalOrders: 0,
        completedOrders: 0,
        lastFetchTime: Date.now(),
      }
    }

    const messageType = detectMessageType(message)

    // Use smart reply with full context for fallback
    let smartReply = null
    if (messageType !== 'shop_action') {
      // For questions and general knowledge, use the smart assistant
      try {
        smartReply = await generateSmartReply(message, {
          conversationContext,
          shopContext,
          shopId,
          userId: user.id,
        })
      } catch (error) {
        console.error('Failed to generate smart reply:', error)
      }
    }

    const reply = smartReply ?? 'I did not catch that clearly. Say "help" to hear supported commands.'

    // Add assistant response to conversation context
    conversationContext.addAssistantMessage(reply)
    setConversationContext(sessionKey, conversationContext)

    // Clear shop context cache periodically to ensure fresh data
    if (Math.random() < 0.1) {
      clearShopContextCache(shopId)
    }

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('Error processing voice command:', error)
    return NextResponse.json({ error: 'Failed to process command' }, { status: 500 })
  }
}
