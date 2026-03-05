//import { generateGroqReply, TAILORPAL_VOICE_SYSTEM_PROMPT } from '@/lib/ai/groq'
import { generateSmartReply } from '@/lib/ai/tailorpal-voice-assistant'
import { detectMessageType } from '@/lib/ai/tailorpal-voice-assistant'
import { handleVoiceRequest, hasPermissionIssue, getRequiredPermissionForRequest } from '@/lib/voice/engine'
import { getSessionKey, getConversationContext, getVoiceSession, setConversationContext } from '@/lib/voice/session-store'
import { getShopContext, clearShopContextCache } from '@/lib/voice/shop-awareness'
//import { detectIntent } from '@/lib/voice/intents'
//generateCorrectionResponse
import { detectSmartIntent, generateHelpResponse,  } from '@/lib/voice/smart-intent-detector'
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
    
    const activeSession = getVoiceSession(sessionKey)

    // Always continue an active flow, even when the utterance is short
    // (e.g. "yes", "no", numeric values) and not a command by itself.
    if (activeSession) {
      conversationContext.addUserMessage(message, activeSession.flow)
      const voiceResult = await handleVoiceRequest({
        supabase,
        shopId,
        userId: user.id,
        message,
        sessionKey,
      })
      if (voiceResult) {
        conversationContext.addAssistantMessage(voiceResult.reply, voiceResult.action)
        setConversationContext(sessionKey, conversationContext)
        return NextResponse.json(voiceResult)
      }
    }

    // Use smart intent detector to understand what the user actually wants
    const smartIntent = detectSmartIntent(message)
    conversationContext.addUserMessage(message, smartIntent.intent)

    // If it's a help request or question about how to do something, DON'T start a flow
    if (!smartIntent.shouldExecuteFlow && (smartIntent.intent === 'help_request' || smartIntent.intent === 'greeting' || smartIntent.intent === 'knowledge_question')) {
      const helpResponse = generateHelpResponse(smartIntent.intent)
      conversationContext.addAssistantMessage(helpResponse)
      setConversationContext(sessionKey, conversationContext)
      return NextResponse.json({ reply: helpResponse })
    }

    // Only try voice flows if it's actually a command to execute
    if (smartIntent.shouldExecuteFlow) {
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
