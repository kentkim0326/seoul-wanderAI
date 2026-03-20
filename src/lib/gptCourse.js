/**
 * GPT-4o 여행 코스 생성
 * Seoul public data + user preferences → AI travel course
 */

import { getCrowdSummary } from './seoulData'

// ─── 메인 함수: 코스 생성 ────────────────────────────────────
export async function generateCourse({ themes, days, language, extraRequest = '' }) {
  // 1. 서울 공공데이터에서 실시간 혼잡도 가져오기
  const crowdData = await getCrowdSummary()

  // 2. GPT-4o 프롬프트 구성
  const prompt = buildPrompt({ themes, days, language, crowdData, extraRequest })

  // 3. OpenAI API 호출
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, language }),
  })

  if (!response.ok) throw new Error('Course generation failed')

  const data = await response.json()
  return parseCourse(data.course, crowdData)
}

// ─── 프롬프트 빌더 ───────────────────────────────────────────
function buildPrompt({ themes, days, language, crowdData, extraRequest }) {
  const themeList  = themes.join(', ')
  const avoidList  = crowdData.summary.avoid.join(', ')  || 'none'
  const preferList = crowdData.summary.prefer.join(', ') || 'none'

  const langInstructions = {
    en: 'Respond entirely in English.',
    zh: '请完全用中文回答。',
    ja: '全て日本語で回答してください。',
    es: 'Responde completamente en español.',
    fr: 'Répondez entièrement en français.',
  }

  return `
You are Seoul Wander, an expert Seoul travel guide for foreign tourists.
Create a ${days}-day Seoul travel itinerary for a tourist who:
- Is interested in: ${themeList}
- Does NOT speak Korean (so avoid places with no English signage)
- Wants to avoid overcrowded places right now

REAL-TIME CROWD DATA from Seoul Open Data (서울 열린데이터광장):
- Currently crowded (AVOID or go early morning): ${avoidList}
- Less crowded right now (PREFER): ${preferList}
- Raw data: ${crowdData.summary.note}

${extraRequest ? `Special request: ${extraRequest}` : ''}

Return a JSON object (no markdown, no backticks) with this exact structure:
{
  "title": "catchy trip name",
  "overview": "2-sentence trip summary",
  "days": [
    {
      "day": 1,
      "theme": "day theme name",
      "slots": [
        {
          "time": "09:00",
          "place": "place name in English",
          "placeKo": "장소명 (Korean name for map search)",
          "category": "food|attraction|transport|shopping|cafe",
          "duration": 90,
          "tip": "one practical foreigner-friendly tip",
          "crowdLevel": "low|mid|high",
          "transport": "subway line 2 / walk 10 min / taxi"
        }
      ]
    }
  ],
  "tips": ["3 general tips for foreign tourists in Seoul"]
}

${langInstructions[language] || langInstructions.en}
Make it realistic, fun, and optimized for someone who cannot read Korean.
`.trim()
}

// ─── 응답 파싱 & 혼잡도 색상 매핑 ──────────────────────────
function parseCourse(raw, crowdData) {
  let course
  try {
    course = typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch {
    throw new Error('Failed to parse AI response')
  }

  // 실제 혼잡도 데이터로 각 장소 crowdLevel 업데이트
  const spotMap = {}
  crowdData.spots.forEach(s => { spotMap[s.name] = s.crowd })

  course.days = course.days.map(day => ({
    ...day,
    slots: day.slots.map(slot => ({
      ...slot,
      crowdLevel: spotMap[slot.placeKo] || slot.crowdLevel || 'mid',
      crowdColor: { low: '#22C55E', mid: '#F6993F', high: '#EF4444' }[
        spotMap[slot.placeKo] || slot.crowdLevel || 'mid'
      ],
    })),
  }))

  return course
}

// ─── 개발용 Mock 코스 (API 없을 때) ────────────────────────
export function getMockCourse(language = 'en') {
  const mocks = {
    en: {
      title: 'Seoul Food & History Adventure',
      overview: 'A perfect blend of ancient palaces and modern street food. Crafted to avoid the midday rush.',
      days: [
        {
          day: 1, theme: 'Palaces & Traditional Markets',
          slots: [
            { time:'09:00', place:'Gyeongbokgung Palace', placeKo:'경복궁', category:'attraction', duration:120, tip:'Go early to avoid crowds. Rent hanbok at the entrance for free entry.', crowdLevel:'low', crowdColor:'#22C55E', transport:'Subway Line 3 · Gyeongbokgung station' },
            { time:'11:30', place:'Bukchon Hanok Village', placeKo:'북촌한옥마을', category:'attraction', duration:60, tip:'Walk the alley quietly — residents live here. Best photo spots at 09:00.', crowdLevel:'mid', crowdColor:'#F6993F', transport:'Walk 15 min from palace' },
            { time:'13:00', place:'Gwangjang Market', placeKo:'광장시장', category:'food', duration:90, tip:'Try bindaetteok (mung bean pancake) and mayak gimbap. Point at what you want — vendors are used to tourists.', crowdLevel:'high', crowdColor:'#EF4444', transport:'Walk 20 min or taxi' },
            { time:'15:30', place:'Insadong', placeKo:'인사동', category:'shopping', duration:90, tip:'Find unique Korean souvenirs here. Many shops have English labels.', crowdLevel:'mid', crowdColor:'#F6993F', transport:'Walk 5 min' },
            { time:'18:00', place:'Cheonggyecheon Stream', placeKo:'청계천', category:'attraction', duration:60, tip:'Beautiful evening walk along the lit stream. Very peaceful.', crowdLevel:'low', crowdColor:'#22C55E', transport:'Walk 10 min' },
          ],
        },
        {
          day: 2, theme: 'K-Culture & Hongdae Vibes',
          slots: [
            { time:'10:00', place:'Lotte World Tower Sky31', placeKo:'롯데월드타워', category:'attraction', duration:90, tip:'Book tickets online in advance to skip queues. Card payment accepted.', crowdLevel:'mid', crowdColor:'#F6993F', transport:'Subway Line 2 · Jamsil station' },
            { time:'13:00', place:'Gangnam COEX Mall', placeKo:'코엑스몰', category:'shopping', duration:60, tip:'Huge underground mall. The COEX Library is free and very photogenic.', crowdLevel:'low', crowdColor:'#22C55E', transport:'Walk 15 min' },
            { time:'16:00', place:'Hongdae Street', placeKo:'홍대', category:'kpop', duration:120, tip:'Best K-POP merch shops here. Street performances start around 6pm.', crowdLevel:'high', crowdColor:'#EF4444', transport:'Subway Line 2 · Hongik Univ. station' },
            { time:'19:00', place:'Mangwon Market', placeKo:'망원시장', category:'food', duration:90, tip:'Less touristy than Gwangjang. Great tteokbokki and hotteok (sweet pancake).', crowdLevel:'low', crowdColor:'#22C55E', transport:'Walk 15 min from Hongdae' },
          ],
        },
      ],
      tips: [
        'Load T-money card at any convenience store (GS25, CU) for subway & bus.',
        'Naver Maps works better than Google Maps in Seoul for transit directions.',
        'Most restaurants show menus with photos — just point and order!',
      ],
    },
  }
  return mocks[language] || mocks.en
}
