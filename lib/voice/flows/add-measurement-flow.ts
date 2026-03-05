import { listCustomers } from '@/lib/voice/db-read'
import { upsertMeasurements } from '@/lib/voice/db-write'
import { STANDARD_MEASUREMENTS, STANDARD_MEASUREMENT_KEYS } from '@/lib/constants/measurements'
import { formatMeasurementLabel, toMeasurementKey } from '@/lib/utils/measurement-records'
import { formatCustomerList, pickCustomerFromMessage } from '@/lib/voice/customer-match'
import { VoiceFlowContext } from '@/lib/voice/flow-context'
import {
  isNo,
  isSkip,
  isYes,
  parseCustomMeasurementPairs,
  parseNumber,
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

const STANDARD_OPTIONS = STANDARD_MEASUREMENTS.map((measurement) => ({
  key: measurement.key,
  label: measurement.label,
  category: measurement.category,
}))

const STANDARD_ORDER = new Map(STANDARD_MEASUREMENTS.map((measurement, index) => [measurement.key, index]))
const STANDARD_SELECTION_ALIASES = new Map<string, string>()
const PICKER_SELECTION_COMMAND = '@select_standard_measurements'

function addSelectionAlias(alias: string, key: string) {
  const normalized = toMeasurementKey(alias)
  if (!normalized) return
  STANDARD_SELECTION_ALIASES.set(normalized, key)
}

for (const measurement of STANDARD_MEASUREMENTS) {
  addSelectionAlias(measurement.key, measurement.key)
  addSelectionAlias(measurement.label, measurement.key)
}

addSelectionAlias('bust', 'chest')
addSelectionAlias('hips', 'hip')
addSelectionAlias('shoulder', 'shoulder_width')
addSelectionAlias('sleeve', 'sleeve_length')

function escapeForRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function orderStandardKeys(keys: string[]) {
  return [...new Set(keys)].sort(
    (a, b) => (STANDARD_ORDER.get(a) ?? Number.MAX_SAFE_INTEGER) - (STANDARD_ORDER.get(b) ?? Number.MAX_SAFE_INTEGER),
  )
}

function parseSelectedStandardKeys(message: string) {
  const trimmed = message.trim()
  const payload = trimmed
    .toLowerCase()
    .startsWith(PICKER_SELECTION_COMMAND)
    ? trimmed.slice(PICKER_SELECTION_COMMAND.length).trim()
    : trimmed

  if (!payload) return []
  if (/\ball\b/i.test(payload)) return STANDARD_MEASUREMENTS.map((measurement) => measurement.key)

  const selected = new Set<string>()
  const chunks = payload
    .split(/,|\band\b/gi)
    .map((chunk) => chunk.trim())
    .filter(Boolean)

  for (const chunk of chunks) {
    const key = STANDARD_SELECTION_ALIASES.get(toMeasurementKey(chunk))
    if (key) selected.add(key)
  }

  if (selected.size > 0) return orderStandardKeys([...selected])

  const normalizedPayload = toMeasurementKey(payload)
  const aliases = [...STANDARD_SELECTION_ALIASES.keys()].sort((a, b) => b.length - a.length)
  for (const alias of aliases) {
    const pattern = new RegExp(`(?:^|_)${escapeForRegex(alias)}(?:_|$)`, 'i')
    if (!pattern.test(normalizedPayload)) continue
    const key = STANDARD_SELECTION_ALIASES.get(alias)
    if (key) selected.add(key)
  }

  return orderStandardKeys([...selected])
}

function buildStandardPickerReply(customerName: string): VoiceReply {
  return {
    reply:
      `Great. Recording for ${customerName}.\n` +
      'Select the standard measurements from the popup, then tap "Start Recording".\n' +
      'You can also say names like "chest, waist, hip".',
    prompt: {
      type: 'measurement_standard_picker',
      measurements: STANDARD_OPTIONS,
    },
  }
}

function getCurrentStandardKey(draft: { selectedStandardKeys: string[]; currentStandardIndex: number }) {
  return draft.selectedStandardKeys[draft.currentStandardIndex]
}

function askCurrentStandardValue(draft: { selectedStandardKeys: string[]; currentStandardIndex: number }) {
  const currentKey = getCurrentStandardKey(draft)
  if (!currentKey) return null
  return `What is ${formatMeasurementLabel(currentKey)} in centimeters? Say a number, or say "skip".`
}

function askForCustomMeasurementsReply() {
  return 'Do you want to add custom measurements? Say "yes" or "no".'
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
    step: selected ? 'ask_standard_selection' : 'ask_customer',
    addMeasurement: {
      customerId: selected?.id,
      customerName: selected ? `${selected.first_name} ${selected.last_name}` : undefined,
      selectedStandardKeys: [],
      currentStandardIndex: 0,
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

  return buildStandardPickerReply(`${selected.first_name} ${selected.last_name}`)
}

export async function continueAddMeasurementFlow(
  context: VoiceFlowContext,
): Promise<VoiceReply> {
  const session = getVoiceSession(context.sessionKey)
  if (!session?.addMeasurement) return startAddMeasurementFlow(context)

  const draft = session.addMeasurement
  if (!Array.isArray(draft.selectedStandardKeys)) draft.selectedStandardKeys = []
  if (typeof draft.currentStandardIndex !== 'number') draft.currentStandardIndex = 0
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
    const customerName = `${selected.first_name} ${selected.last_name}`
    draft.customerName = customerName
    draft.selectedStandardKeys = []
    draft.currentStandardIndex = 0
    session.step = 'ask_standard_selection'
    setVoiceSession(context.sessionKey, session)
    return buildStandardPickerReply(customerName)
  }

  if (session.step === 'ask_standard_selection') {
    const selectedKeys = parseSelectedStandardKeys(text)
    if (!selectedKeys.length) {
      return {
        reply:
          'I did not catch any standard measurement selection. Please pick from the popup or say names like "chest, waist, hip".',
        prompt: {
          type: 'measurement_standard_picker',
          measurements: STANDARD_OPTIONS,
        },
      }
    }

    draft.selectedStandardKeys = selectedKeys
    draft.currentStandardIndex = 0
    session.step = 'ask_standard_value'
    setVoiceSession(context.sessionKey, session)
    return { reply: askCurrentStandardValue(draft) ?? askForCustomMeasurementsReply() }
  }

  if (session.step === 'ask_standard_value') {
    const currentKey = getCurrentStandardKey(draft)
    if (!currentKey) {
      session.step = 'ask_custom_choice'
      setVoiceSession(context.sessionKey, session)
      return { reply: askForCustomMeasurementsReply() }
    }

    if (parseDone(text)) {
      draft.currentStandardIndex = draft.selectedStandardKeys.length
      session.step = 'ask_custom_choice'
      setVoiceSession(context.sessionKey, session)
      return { reply: askForCustomMeasurementsReply() }
    }

    if (isSkip(text)) {
      draft.currentStandardIndex += 1
      const nextQuestion = askCurrentStandardValue(draft)
      if (nextQuestion) {
        setVoiceSession(context.sessionKey, session)
        return { reply: `Skipping ${formatMeasurementLabel(currentKey)}. ${nextQuestion}` }
      }

      session.step = 'ask_custom_choice'
      setVoiceSession(context.sessionKey, session)
      return { reply: `Skipping ${formatMeasurementLabel(currentKey)}. ${askForCustomMeasurementsReply()}` }
    }

    const value = parseNumber(text)
    if (value === null || value <= 0) {
      return {
        reply:
          `Please say a valid number for ${formatMeasurementLabel(currentKey)}.` +
          ' Example: "40". You can also say "skip".',
      }
    }

    draft.standardMeasurements[currentKey] = value
    draft.currentStandardIndex += 1

    const nextQuestion = askCurrentStandardValue(draft)
    if (nextQuestion) {
      setVoiceSession(context.sessionKey, session)
      return { reply: `Saved ${formatMeasurementLabel(currentKey)} as ${value} cm. ${nextQuestion}` }
    }

    session.step = 'ask_custom_choice'
    setVoiceSession(context.sessionKey, session)
    return {
      reply: `Saved ${formatMeasurementLabel(currentKey)} as ${value} cm. All selected standard measurements are done. ${askForCustomMeasurementsReply()}`,
    }
  }

  if (session.step === 'ask_custom_choice') {
    if (isYes(text)) {
      session.step = 'ask_custom_measurements'
      setVoiceSession(context.sessionKey, session)
      return {
        reply:
          'Okay. Say custom measurements like "torso length 52" or "torso length 52, cap height 18". Say "done" when finished.',
      }
    }

    if (isNo(text) || isSkip(text)) {
      if (!hasMeasurements(draft.standardMeasurements, draft.customMeasurements)) {
        return {
          reply: 'No measurement value has been recorded yet. Please say "yes" to add at least one custom measurement.',
        }
      }
      session.step = 'ask_notes'
      setVoiceSession(context.sessionKey, session)
      return { reply: 'Any notes for these measurements? Say "skip" if none.' }
    }

    return { reply: 'Please say "yes" to add custom measurements, or "no" to continue.' }
  }

  if (session.step === 'ask_custom_measurements') {
    if (parseDone(text)) {
      if (!hasMeasurements(draft.standardMeasurements, draft.customMeasurements)) {
        return { reply: 'I still need at least one measurement value before saving.' }
      }
      session.step = 'ask_notes'
      setVoiceSession(context.sessionKey, session)
      return { reply: 'Any notes for these measurements? Say "skip" if none.' }
    }

    const parsedCustom = parseCustomMeasurementPairs(text)
    const custom: Record<string, number> = {}
    for (const [key, value] of Object.entries(parsedCustom)) {
      if (STANDARD_MEASUREMENT_KEYS.has(key)) continue
      custom[key] = value
    }
    draft.customMeasurements = { ...draft.customMeasurements, ...custom }
    setVoiceSession(context.sessionKey, session)

    const count = Object.keys(custom).length
    if (!count) {
      return {
        reply: 'No valid custom measurements detected. Example: "torso length 52". Say "done" when finished.',
      }
    }

    return { reply: `Saved ${count} custom measurement value(s). Add more, or say "done".` }
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
