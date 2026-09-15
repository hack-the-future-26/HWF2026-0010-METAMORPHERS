/**
 * Server-side LLM. AI_API_KEY never leaves this process.
 * Compatible with OpenAI / OpenRouter / Groq chat completions.
 */

const SYSTEM = `You are YatraSense, an adaptive travel assistant.
Use ONLY the structured trip context when it contains a fact.
Never invent live traffic, crowd percentages, ticket prices, or GPS if the context says they are unavailable.
If weather, places, budget, or itinerary fields are present, prefer them over general knowledge.
When the user asks why the plan changed, quote the adaptation explanation from context.
When the user asks about remaining money, use remainingBudget from context.
Keep answers concise and practical. Currency is INR unless the destination is outside India.`

export function aiConfigured() {
  return Boolean(process.env.AI_API_KEY)
}

export async function askLlm(prompt, context = {}) {
  const key = process.env.AI_API_KEY
  if (!key) {
    const err = new Error('AI is not configured. Set AI_API_KEY on the server.')
    err.status = 503
    err.code = 'unconfigured'
    throw err
  }
  const model = process.env.AI_MODEL || 'openai/gpt-4o-mini'
  const url = process.env.AI_API_URL || 'https://openrouter.ai/api/v1/chat/completions'
  const body = {
    model,
    temperature: 0.3,
    messages: [
      { role: 'system', content: SYSTEM },
      {
        role: 'user',
        content: `Trip context (JSON):\n${JSON.stringify(context, null, 2)}\n\nTraveler question:\n${prompt}`,
      },
    ],
  }
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 25000)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
        'HTTP-Referer': process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
        'X-Title': 'YatraSense',
      },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const err = new Error('AI provider rejected the request')
      err.status = res.status === 429 ? 429 : 502
      throw err
    }
    const reply = data.choices?.[0]?.message?.content || data.reply || data.content
    if (!String(reply || '').trim()) {
      const err = new Error('AI returned an empty reply')
      err.status = 502
      throw err
    }
    return { reply: String(reply).trim(), source: 'llm', model }
  } finally {
    clearTimeout(t)
  }
}
