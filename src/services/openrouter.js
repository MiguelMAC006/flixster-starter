const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY
const MODEL = 'openrouter/free'

// Friendly fallback shown whenever the AI call can't produce a usable answer.
const FALLBACK_INSIGHT =
  "We couldn't generate a recommendation for this one — check out the overview above!"

// Role + constraints from the prompt spec (see planning.md → AI Feature Spec).
const SYSTEM_PROMPT = [
  'You are an enthusiastic but honest film critic who gives quick, personal watch recommendations.',
  'Write a 2-3 sentence recommendation telling the reader whether the movie is worth their evening and why.',
  'Rules:',
  '- Plain text only — no markdown, no lists, no headings.',
  '- 2-3 sentences, no more.',
  '- No plot spoilers.',
  '- No first-person "I" statements — speak to the reader in second person.',
  '- Avoid generic hype like "a must-see" or "instant classic".',
  '- No comparisons to other films unless genuinely helpful.',
  '- Base your take only on the title, genres, and overview provided.',
].join('\n')

// Requests a short AI watch recommendation for one movie. Returns the AI text
// on success, or a friendly fallback string on any failure (it never throws),
// so callers can drop the result straight into state.
export const getMovieInsight = async (title, genres, overview) => {
  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              `Title: ${title}`,
              `Genres: ${genres || 'Unknown'}`,
              `Overview: ${overview || 'No overview available.'}`,
            ].join('\n'),
          },
        ],
      }),
    })

    if (!response.ok) throw new Error(`OpenRouter error: ${response.status}`)

    const data = await response.json()
    const insight = data.choices?.[0]?.message?.content?.trim()
    // An empty/whitespace response is as useless as an error — fall back.
    if (!insight) throw new Error('OpenRouter returned an empty response')

    return insight
  } catch (error) {
    console.error('AI insight failed:', error)
    return FALLBACK_INSIGHT
  }
}
