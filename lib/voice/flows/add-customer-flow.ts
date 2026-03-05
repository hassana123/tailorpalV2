import { createCustomer } from '@/lib/voice/db-write'
import { VoiceFlowContext } from '@/lib/voice/flow-context'
import { STANDARD_MEASUREMENTS } from '@/lib/constants/measurements'
import { parseEmail, parseFullName, parsePhone, isNo, isSkip, isYes } from '@/lib/voice/parsers'
import { summarizeCustomerDraft } from '@/lib/voice/replies'
import { clearVoiceSession, getVoiceSession, setVoiceSession } from '@/lib/voice/session-store'
import { VoiceReply } from '@/lib/voice/types'

const STANDARD_OPTIONS = STANDARD_MEASUREMENTS.map((measurement) => ({
  key: measurement.key,
  label: measurement.label,
  category: measurement.category,
}))

function buildCustomerName(firstName?: string, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(' ').trim()
}

function cleanLastNameInput(input: string) {
  return input
    .replace(/\b(last name is|surname is|family name is|last name|surname|family name)\b/gi, '')
    .replace(/[^a-zA-Z\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function startAddCustomerFlow({ sessionKey }: VoiceFlowContext, message?: string): VoiceReply {
  const seededText = message
    ? message.replace(/^\s*(add|create|new)\s+customer\b/i, '').trim()
    : ''
  const name = seededText ? parseFullName(seededText) : null
  const phone = seededText ? parsePhone(seededText) : null
  const email = seededText ? parseEmail(seededText) : null

  const nextStep = !name
    ? 'ask_name'
    : !name.lastName
    ? 'ask_last_name'
    : !email
    ? 'ask_email'
    : !phone
    ? 'ask_phone'
    : 'ask_address'
  setVoiceSession(sessionKey, {
    flow: 'add_customer',
    step: nextStep,
    addCustomer: {
      firstName: name?.firstName,
      lastName: name?.lastName ?? null,
      phone,
      email,
      addMeasurementsNow: false,
    },
    expiresAt: 0,
  })

  if (!name) {
    return { reply: 'Sure. What is the customer first name? You can also say full name if you want.' }
  }
  if (!name.lastName) {
    return {
      reply: `Great. I got first name ${name.firstName}. What is the last name? Say "skip" if unavailable.`,
    }
  }
  if (!email) {
    return { reply: 'What is the email address? Say "skip" if unavailable.' }
  }
  if (!phone) {
    return { reply: 'What is the phone number? Say "skip" if unavailable.' }
  }
  return { reply: 'What is the address? Say "skip" to leave it empty.' }
}

export async function continueAddCustomerFlow(context: VoiceFlowContext): Promise<VoiceReply> {
  const session = getVoiceSession(context.sessionKey)
  if (!session?.addCustomer) return startAddCustomerFlow(context)

  const draft = session.addCustomer
  const text = context.message.trim()

  if (session.step === 'ask_name') {
    const name = parseFullName(text)
    if (!name) return { reply: 'Please say at least the first name. Example: "Jane" or "Jane Doe".' }
    draft.firstName = name.firstName
    draft.lastName = name.lastName ?? null
    session.step = name.lastName ? 'ask_email' : 'ask_last_name'
    setVoiceSession(context.sessionKey, session)
    if (!name.lastName) {
      return { reply: 'Got it. What is the last name? Say "skip" if unavailable.' }
    }
    return { reply: 'Got it. What is the email address? Say "skip" if unavailable.' }
  }

  if (session.step === 'ask_last_name') {
    if (isSkip(text)) {
      draft.lastName = null
    } else {
      const cleaned = cleanLastNameInput(text)
      if (!cleaned) return { reply: 'Please say a last name, or say "skip".' }
      const normalized = parseFullName(cleaned)
      draft.lastName = normalized?.lastName ?? normalized?.firstName ?? cleaned
    }
    session.step = 'ask_email'
    setVoiceSession(context.sessionKey, session)
    return { reply: 'What is the email address? Say "skip" if unavailable.' }
  }

  if (session.step === 'ask_email') {
    draft.email = isSkip(text) ? null : parseEmail(text)
    if (!isSkip(text) && !draft.email) {
      return {
        reply:
          'Please say a valid email address, or say "skip". Example: "hassana at gmail dot com".',
      }
    }
    session.step = 'ask_phone'
    setVoiceSession(context.sessionKey, session)
    return { reply: 'What is the phone number? Say "skip" if unavailable.' }
  }

  if (session.step === 'ask_phone') {
    draft.phone = isSkip(text) ? null : parsePhone(text)
    if (!isSkip(text) && !draft.phone) return { reply: 'Please say a valid phone number, or say "skip".' }
    session.step = 'ask_address'
    setVoiceSession(context.sessionKey, session)
    return { reply: 'What is the address? Say "skip" to leave it empty.' }
  }

  if (session.step === 'ask_address') {
    draft.address = isSkip(text) ? null : text
    session.step = 'ask_city'
    setVoiceSession(context.sessionKey, session)
    return { reply: 'Which city? Say "skip" to leave it empty.' }
  }

  if (session.step === 'ask_city') {
    draft.city = isSkip(text) ? null : text
    session.step = 'ask_country'
    setVoiceSession(context.sessionKey, session)
    return { reply: 'Which country? Say "skip" to leave it empty.' }
  }

  if (session.step === 'ask_country') {
    draft.country = isSkip(text) ? null : text
    session.step = 'ask_notes'
    setVoiceSession(context.sessionKey, session)
    return { reply: 'Any extra notes? Say "skip" if none.' }
  }

  if (session.step === 'ask_notes') {
    draft.notes = isSkip(text) ? null : text
    session.step = 'ask_measurement_timing'
    setVoiceSession(context.sessionKey, session)
    return {
      reply: 'Would you like to add measurements immediately after saving this customer? Say "yes" or "no".',
    }
  }

  if (session.step === 'ask_measurement_timing') {
    if (isYes(text)) {
      draft.addMeasurementsNow = true
    } else if (isNo(text) || isSkip(text)) {
      draft.addMeasurementsNow = false
    } else {
      return { reply: 'Please say "yes" to add measurements now, or "no" to add later.' }
    }

    session.step = 'confirm'
    setVoiceSession(context.sessionKey, session)
    return {
      reply: `Please confirm this new customer:\n${summarizeCustomerDraft(draft)}\n\nSay "yes" to save or "no" to cancel.`,
    }
  }

  if (session.step === 'confirm') {
    if (isNo(text)) {
      clearVoiceSession(context.sessionKey)
      return { reply: 'Customer creation cancelled.' }
    }
    if (!isYes(text)) return { reply: 'Please say "yes" to save or "no" to cancel.' }

    const created = await createCustomer(context.supabase, context.shopId, context.userId, draft)
    const customerName = buildCustomerName(created.first_name, created.last_name)

    if (draft.addMeasurementsNow) {
      setVoiceSession(context.sessionKey, {
        flow: 'add_measurement',
        step: 'ask_standard_selection',
        addMeasurement: {
          customerId: created.id,
          customerName,
          selectedStandardKeys: [],
          currentStandardIndex: 0,
          standardMeasurements: {},
          customMeasurements: {},
        },
        expiresAt: 0,
      })
      return {
        reply:
          `Done. ${customerName} has been added successfully.\n` +
          'Great, let us record measurements now. Select standard measurements from the popup to begin.',
        action: 'add_customer',
        prompt: {
          type: 'measurement_standard_picker',
          measurements: STANDARD_OPTIONS,
        },
      }
    }

    clearVoiceSession(context.sessionKey)
    return {
      reply: `Done. ${customerName} has been added successfully.`,
      action: 'add_customer',
    }
  }

  return { reply: 'Let us start again. What is the customer first name?' }
}
