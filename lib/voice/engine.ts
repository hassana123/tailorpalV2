import { runDirectCommand } from '@/lib/voice/direct-commands'
import { VoiceFlowContext } from '@/lib/voice/flow-context'
import { continueAddCustomerFlow, startAddCustomerFlow } from '@/lib/voice/flows/add-customer-flow'
import {
  continueAddMeasurementFlow,
  startAddMeasurementFlow,
} from '@/lib/voice/flows/add-measurement-flow'
import { continueCreateOrderFlow, startCreateOrderFlow } from '@/lib/voice/flows/create-order-flow'
import {
  continueDeleteCustomerFlow,
  startDeleteCustomerFlow,
} from '@/lib/voice/flows/delete-customer-flow'
import {
  continueUpdateOrderStatusFlow,
  startUpdateOrderStatusFlow,
} from '@/lib/voice/flows/update-order-status-flow'
import { detectIntent, getFlowPermission, intentToFlow, isCancelCommand } from '@/lib/voice/intents'
import { preprocessVoiceInput } from '@/lib/voice/parsers'
import { clearVoiceSession, getVoiceSession } from '@/lib/voice/session-store'
import { VoicePermission, VoiceReply } from '@/lib/voice/types'

async function continueFlow(context: VoiceFlowContext): Promise<VoiceReply> {
  const session = getVoiceSession(context.sessionKey)
  if (!session) return { reply: 'Session expired. Please say your command again.' }

  if (session.flow === 'add_customer') return continueAddCustomerFlow(context)
  if (session.flow === 'add_measurement') return continueAddMeasurementFlow(context)
  if (session.flow === 'create_order') return continueCreateOrderFlow(context)
  if (session.flow === 'update_order_status') return continueUpdateOrderStatusFlow(context)
  if (session.flow === 'delete_customer') return continueDeleteCustomerFlow(context)
  return { reply: 'I could not continue that action. Please try again.' }
}

async function startFlow(context: VoiceFlowContext, message: string): Promise<VoiceReply | null> {
  const flow = intentToFlow(detectIntent(message))
  if (!flow) return null

  if (flow === 'add_customer') return startAddCustomerFlow(context, message)
  if (flow === 'add_measurement') return startAddMeasurementFlow(context, message)
  if (flow === 'create_order') return startCreateOrderFlow(context, message)
  if (flow === 'update_order_status') return startUpdateOrderStatusFlow(context, message)
  if (flow === 'delete_customer') return startDeleteCustomerFlow(context, message)
  return null
}

function isLikelyFlowRestartCommand(message: string) {
  const words = message.trim().split(/\s+/).filter(Boolean)
  return words.length > 0 && words.length <= 6
}

export function getRequiredPermissionForRequest(sessionKey: string, message: string) {
  if (isCancelCommand(message)) return null

  const existing = getVoiceSession(sessionKey)
  if (existing) return getFlowPermission(existing.flow)

  const flow = intentToFlow(detectIntent(message))
  if (!flow) return null
  return getFlowPermission(flow)
}

export async function handleVoiceRequest(context: VoiceFlowContext): Promise<VoiceReply | null> {
  // Preprocess voice input to handle transcription issues
  const processedMessage = preprocessVoiceInput(context.message)
  const message = processedMessage || context.message.trim()
  
  if (!message) return { reply: 'Please say something.' }

  // Use processed message for all checks
  if (isCancelCommand(message)) {
    const existingSession = getVoiceSession(context.sessionKey)
    if (!existingSession) return { reply: 'There is no active action to cancel.' }
    clearVoiceSession(context.sessionKey)
    return { reply: 'Current action cancelled.' }
  }

  const existing = getVoiceSession(context.sessionKey)
  const incomingFlow = intentToFlow(detectIntent(message))

  if (existing && incomingFlow && incomingFlow !== existing.flow) {
    clearVoiceSession(context.sessionKey)
    const started = await startFlow(context, message)
    if (started) return { reply: `Switched action.\n${started.reply}` }
  }

  if (existing && incomingFlow && incomingFlow === existing.flow && isLikelyFlowRestartCommand(message)) {
    clearVoiceSession(context.sessionKey)
    const restarted = await startFlow(context, message)
    if (restarted) return { reply: `Restarted action.\n${restarted.reply}` }
  }

  if (existing) {
    return continueFlow(context)
  }

  const intent = detectIntent(message)
  const direct = await runDirectCommand(context.supabase, context.shopId, intent, message)
  if (direct) return direct

  return startFlow(context, message)
}

export function hasPermissionIssue(requiredPermission: VoicePermission | null) {
  if (!requiredPermission) return null
  if (requiredPermission === 'manage_customers') return 'You do not have permission to manage customers in this shop.'
  if (requiredPermission === 'manage_measurements') return 'You do not have permission to manage measurements in this shop.'
  return 'You do not have permission to manage orders in this shop.'
}
