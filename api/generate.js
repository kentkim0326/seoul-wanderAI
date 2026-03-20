/**
 * Vercel Serverless Function: /api/generate
 * GPT-4o 코스 생성 엔드포인트
 *
 * 환경변수 (Vercel Dashboard > Settings > Environment Variables):
 *   OPENAI_API_KEY=sk-...
 */

export const config = { runtime: 'edge' }

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const { prompt, language } = await req.json()

  if (!prompt) {
    return new Response(JSON.stringify({ error: 'prompt is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    // 개발 환경: mock 응답 반환
    return new Response(
      JSON.stringify({ course: getMockResponse(language) }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0.7,
        max_tokens: 3000,
        messages: [
          {
            role: 'system',
            content:
              'You are Seoul Wander, an expert AI travel guide specializing in Seoul, Korea for foreign tourists. Always respond with valid JSON only — no markdown, no backticks, no extra text.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`OpenAI API error: ${err}`)
    }

    const data    = await res.json()
    const content = data.choices[0].message.content.trim()

    return new Response(
      JSON.stringify({ course: content }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('GPT error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// ─── 개발용 Mock ─────────────────────────────────────────────
function getMockResponse(language) {
  return JSON.stringify({
    title:    'Seoul Food & History Adventure',
    overview: 'Crafted by AI with real-time crowd data from Seoul Open Data.',
    days: [
      {
        day: 1, theme: 'Palaces & Markets',
        slots: [
          { time:'09:00', place:'Gyeongbokgung Palace', placeKo:'경복궁', category:'attraction', duration:120, tip:'Rent hanbok for free entry.', crowdLevel:'low', transport:'Subway Line 3' },
          { time:'13:00', place:'Gwangjang Market',     placeKo:'광장시장', category:'food',       duration:90,  tip:'Point at what you want to order.', crowdLevel:'mid', transport:'Walk 20 min' },
          { time:'15:30', place:'Insadong',              placeKo:'인사동',   category:'shopping',   duration:90,  tip:'Best Korean souvenirs here.',   crowdLevel:'low', transport:'Walk 5 min' },
        ],
      },
    ],
    tips: ['Use T-money card for all transit.', 'Naver Maps is better than Google here.'],
  })
}
