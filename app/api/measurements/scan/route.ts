import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const allowedKeys = new Set(['chest','under_bust','waist','hip','neck','shoulder_width','across_back','across_chest','back_length','front_length','sleeve_length','upper_arm','elbow','wrist','armhole_depth','inseam','outseam','thigh','knee','calf','ankle','rise','trouser_length','skirt_length','dress_length','height','full_length','waist_to_floor','waist_to_knee','nape_to_waist','shoulder_to_waist'])
export async function POST(request: NextRequest) {
  const { data: { user } } = await (await createClient()).auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in to scan measurements.' }, { status: 401 })
  const { image } = await request.json() as { image?: string }
  if (!image?.startsWith('data:image/') || image.length > 14_000_000) return NextResponse.json({ error: 'Upload a clear image smaller than 10 MB.' }, { status: 400 })
  if (!process.env.GROQ_API_KEY) return NextResponse.json({ error: 'Measurement scanning is not configured. Add GROQ_API_KEY to your server environment.' }, { status: 503 })
  const prompt = `Read this tailoring measurement sheet. Return ONLY JSON: {"measurements":{"standard_key":number},"unmatched":[],"notes":""}. Units should be numbers only; preserve the written number without converting inches/cm. Use only these keys: ${[...allowedKeys].join(', ')}. Map common labels carefully (bust=chest, shoulder=shoulder_width). Ignore names, phone numbers, prices, and uncertain values. Put any label/value you cannot map in unmatched.`
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'qwen/qwen3.6-27b', temperature: 0.1, max_completion_tokens: 700, messages: [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: image } }] }] }) })
  if (!response.ok) return NextResponse.json({ error: 'Could not read this sheet. Use a brighter, sharper photo or enter values manually.' }, { status: 422 })
  const data = await response.json() as { choices?: { message?: { content?: string } }[] }
  const raw = data.choices?.[0]?.message?.content || '{}'
  try {
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim()) as { measurements?: Record<string, unknown>; unmatched?: string[]; notes?: string }
    const measurements = Object.fromEntries(Object.entries(parsed.measurements || {}).filter(([key, value]) => allowedKeys.has(key) && typeof value === 'number' && Number.isFinite(value) && value > 0))
    return NextResponse.json({ measurements, unmatched: parsed.unmatched || [], notes: parsed.notes || '' })
  } catch { return NextResponse.json({ error: 'The scan was unclear. Please review manually or take another photo.' }, { status: 422 }) }
}
