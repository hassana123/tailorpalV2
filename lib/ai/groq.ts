export async function generateGroqReply(systemPrompt: string, userPrompt: string) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return null
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 150,
    }),
  })

  if (!response.ok) {
    return null
  }

  const data = await response.json()
  return data?.choices?.[0]?.message?.content as string | null
}
