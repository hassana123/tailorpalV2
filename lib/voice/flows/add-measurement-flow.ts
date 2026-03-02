import { listCustomers } from '@/lib/voice/db-read'
import { upsertMeasurements } from '@/lib/voice/db-write'
import { formatCustomerList, pickCustomerFromMessage } from '@/lib/voice/customer-match'
import { VoiceFlowContext } from '@/lib/voice/flow-context'
import {
  isNo,
  isSkip,
  isYes,
  parseCustomMeasurementPairs,
  parseMeasurements,
} from '@/lib/voice/parsers'
import { summarizeMeasurementDraft } from '@/lib/voice/replies'
import { clearVoiceSession, getVoiceSession, setVoiceSession } from '@/lib/voice/session-store'
import { VoiceReply } from '@/lib/voice/types'

function hasMeasurements(standard: Record<string, number>, custom: Record<string, number>) {
  return Object.keys(standard).length > 0 || Object.keys(custom).length > 0
}

function parseDone(message: string) {
  return /\b(done|finish|finished|complete|that is all)\b/i.test(message)
}

export async function startAddMeasurementFlow(
  context: VoiceFlowContext,
  message?: string,
): Promise<VoiceReply> {
  const customers = await listCustomers(context.supabase, context.shopId, 20)
  if (!customers.length) {
    return { reply: 'You do not have any customers yet. Say "add customer" first.' }
  }

  const seededText = message
    ? message
        .replace(/^\s*(add|record|take|save)\s+measurements?\b/i, '')
        .replace(/^\s*for\b/i, '')
        .trim()
    : ''
  const selected = seededText ? pickCustomerFromMessage(customers, seededText) : null
  setVoiceSession(context.sessionKey, {
    flow: 'add_measurement',
    step: selected ? 'ask_measurements' : 'ask_customer',
    addMeasurement: {
      customerId: selected?.id,
      customerName: selected ? `${selected.first_name} ${selected.last_name}` : undefined,
      standardMeasurements: {},
      customMeasurements: {},
    },
    expiresAt: 0,
  })

  if (!selected) {
    return {
      reply: `Which customer should I record measurements for?\n${formatCustomerList(customers)}\n\nSay the customer's name.`,
    }
  }

  return {
    reply: `Okay, recording measurements for ${selected.first_name} ${selected.last_name}. Say values like "chest 40 waist 34". Say "done" when finished.`,
  }
}

export async function continueAddMeasurementFlow(
  context: VoiceFlowContext,
): Promise<VoiceReply> {
  const session = getVoiceSession(context.sessionKey)
  if (!session?.addMeasurement) return startAddMeasurementFlow(context)

  const draft = session.addMeasurement
  const text = context.message.trim()

  if (session.step === 'ask_customer') {
    const customers = await listCustomers(context.supabase, context.shopId, 20)
    const selected = pickCustomerFromMessage(customers, text)
    if (!selected) {
      return {
        reply: `I could not match that customer. Please say one of these names:\n${formatCustomerList(customers)}`,
      }
    }

    draft.customerId = selected.id
    draft.customerName = `${selected.first_name} ${selected.last_name}`
    session.step = 'ask_measurements'
    setVoiceSession(context.sessionKey, session)
    return {
      reply: `Great. Recording for ${draft.customerName}. Say measurements now, then say "done" when finished.`,
    }
  }

  if (session.step === 'ask_measurements') {
    if (parseDone(text)) {
      if (!hasMeasurements(draft.standardMeasurements, draft.customMeasurements)) {
        return { reply: 'I still have no measurement values. Please say at least one, like "chest 40".' }
      }
      session.step = 'ask_notes'
      setVoiceSession(context.sessionKey, session)
      return { reply: 'Any notes for these measurements? Say "skip" if none.' }
    }

    const standard = parseMeasurements(text)
    const custom = parseCustomMeasurementPairs(text)
    draft.standardMeasurements = { ...draft.standardMeasurements, ...standard }
    draft.customMeasurements = { ...draft.customMeasurements, ...custom }
    setVoiceSession(context.sessionKey, session)

    const total = Object.keys(draft.standardMeasurements).length + Object.keys(draft.customMeasurements).length
    if (!total) {
      return { reply: 'No valid measurements detected. Example: "chest 40, waist 32".' }
    }
    return { reply: `Saved ${total} measurement value(s) so far. Add more, or say "done".` }
  }

  if (session.step === 'ask_notes') {
    draft.notes = isSkip(text) ? null : text
    session.step = 'confirm'
    setVoiceSession(context.sessionKey, session)
    return {
      reply: `Please confirm these measurements:\n${summarizeMeasurementDraft(draft)}\n\nSay "yes" to save or "no" to cancel.`,
    }
  }

  if (session.step === 'confirm') {
    if (isNo(text)) {
      clearVoiceSession(context.sessionKey)
      return { reply: 'Measurement recording cancelled.' }
    }
    if (!isYes(text)) return { reply: 'Please say "yes" to save or "no" to cancel.' }

    await upsertMeasurements(context.supabase, context.shopId, context.userId, draft)
    clearVoiceSession(context.sessionKey)
    return { reply: `Done. Measurements saved for ${draft.customerName}.`, action: 'add_measurement' }
  }

  return { reply: 'Let us restart measurement recording.' }
}
