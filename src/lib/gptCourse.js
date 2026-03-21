/**
 * GPT-4o 여행 코스 생성
 * Seoul public data + user preferences → AI travel course
 */

import { getCrowdSummary } from './seoulData'

// ─── 메인 함수 ────────────────────────────────────────────────
export async function generateCourse({ themes, days, language, extraRequest = '' }) {
  const crowdData = await getCrowdSummary()
  const prompt    = buildPrompt({ themes, days, language, crowdData, extraRequest })

  const response = await fetch('/api/generate', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ prompt, language, themes }),
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
- Is SPECIFICALLY interested in: ${themeList}
- Does NOT speak Korean (avoid places with no English signage)
- Wants to avoid overcrowded places

IMPORTANT: The itinerary MUST reflect the chosen themes (${themeList}).
- If "food" is selected → include street food markets, famous restaurants
- If "kpop" is selected → include K-POP merch shops, idol cafes, music stores
- If "history" is selected → include palaces, traditional villages, museums
- If "nature" is selected → include parks, mountains, Han River
- If "shopping" is selected → include malls, markets, boutique streets
- If "cafe" is selected → include famous cafe streets, unique themed cafes
- If "art" is selected → include galleries, street art, cultural centers
- If "night" is selected → include night markets, rooftop bars, neon streets

REAL-TIME CROWD DATA (서울 열린데이터광장):
- Crowded NOW (avoid or go early): ${avoidList}
- Less crowded NOW (prefer): ${preferList}

${extraRequest ? `Special request: ${extraRequest}` : ''}

Return ONLY a valid JSON object (no markdown, no backticks):
{
  "title": "catchy theme-specific trip name",
  "overview": "2-sentence summary mentioning the themes",
  "days": [
    {
      "day": 1,
      "theme": "day theme name",
      "slots": [
        {
          "time": "09:00",
          "place": "place name in English",
          "placeKo": "장소명",
          "category": "food|attraction|shopping|cafe|kpop",
          "duration": 90,
          "tip": "one practical foreigner-friendly tip",
          "crowdLevel": "low|mid|high",
          "transport": "Subway Line 2 / Walk 10 min / Taxi"
        }
      ]
    }
  ],
  "tips": ["3 general tips for foreign tourists in Seoul"]
}

${langInstructions[language] || langInstructions.en}
Make it realistic and fun. Each day should have 4-5 slots.
`.trim()
}

// ─── 응답 파싱 ────────────────────────────────────────────────
function parseCourse(raw, crowdData) {
  let course
  try {
    // JSON 블록 추출 (GPT가 가끔 ```json 을 붙이는 경우 처리)
    const cleaned = typeof raw === 'string'
      ? raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      : raw
    course = typeof cleaned === 'string' ? JSON.parse(cleaned) : cleaned
  } catch {
    throw new Error('Failed to parse AI response')
  }

  const spotMap = {}
  crowdData.spots.forEach(s => { spotMap[s.name] = s.crowd })

  course.days = course.days.map(day => ({
    ...day,
    slots: day.slots.map(slot => ({
      ...slot,
      crowdLevel: spotMap[slot.placeKo] || slot.crowdLevel || 'mid',
      crowdColor: { low:'#22C55E', mid:'#F6993F', high:'#EF4444' }[
        spotMap[slot.placeKo] || slot.crowdLevel || 'mid'
      ],
    })),
  }))

  return course
}

// ─── Mock 코스 (OPENAI_API_KEY 없을 때) ──────────────────────
// 테마/일수를 실제로 반영한 다양한 mock 데이터
const MOCK_THEMES = {
  food: {
    title: 'Seoul Street Food Safari',
    overview: 'A delicious journey through Seoul\'s legendary food markets and hidden local eateries.',
    dayTheme: 'Markets & Street Food',
    slots: [
      { time:'08:30', place:'Gwangjang Market', placeKo:'광장시장', category:'food', duration:90,
        tip:'Try bindaetteok (mung bean pancake) and mayak gimbap. Point at what you want — vendors are used to tourists.', crowdLevel:'mid', transport:'Subway Line 1 · Jongno 5-ga' },
      { time:'11:00', place:'Tongin Market', placeKo:'통인시장', category:'food', duration:60,
        tip:'Use the special coin tray to pick food from different stalls. Very local experience.', crowdLevel:'low', transport:'Walk 25 min or taxi' },
      { time:'13:30', place:'Myeongdong Street Food', placeKo:'명동 먹자골목', category:'food', duration:90,
        tip:'Try tornado potato, egg bread, and tteokbokki. Everything has English signs.', crowdLevel:'high', transport:'Subway Line 4 · Myeongdong' },
      { time:'16:00', place:'Mangwon Market', placeKo:'망원시장', category:'food', duration:75,
        tip:'Less touristy than Gwangjang. Great hotteok (sweet pancake) and fresh produce.', crowdLevel:'low', transport:'Subway Line 6 · Mangwon' },
      { time:'19:00', place:'Mapo Na루 Night Market', placeKo:'마포나루 야시장', category:'food', duration:90,
        tip:'Open Thu–Sun evenings. Street food along the Han River with great views.', crowdLevel:'mid', transport:'Walk 10 min from Mangwon' },
    ],
  },
  kpop: {
    title: 'K-POP Seoul Ultimate Tour',
    overview: 'Dive into the heart of K-POP culture with idol cafes, merch shops, and live performance spots.',
    dayTheme: 'K-POP & Idol Culture',
    slots: [
      { time:'10:00', place:'HYBE Insight Museum', placeKo:'하이브 인사이트', category:'kpop', duration:120,
        tip:'Book tickets online weeks in advance — sells out fast. No photos inside some areas.', crowdLevel:'mid', transport:'Subway Line 3 · Apgujeong Rodeo' },
      { time:'13:00', place:'SM Entertainment Building', placeKo:'SM엔터테인먼트', category:'kpop', duration:45,
        tip:'Take photos outside. The SM Store inside sells official merch at retail price.', crowdLevel:'low', transport:'Subway Line 2 · Samsong' },
      { time:'14:30', place:'Hongdae K-POP Street', placeKo:'홍대 K-POP거리', category:'kpop', duration:120,
        tip:'Best merch shops for all major idol groups. Street performances from 6pm.', crowdLevel:'high', transport:'Subway Line 2 · Hongik Univ.' },
      { time:'17:30', place:'Idol Cafe in Hongdae', placeKo:'홍대 아이돌카페', category:'cafe', duration:60,
        tip:'Themed cafes change frequently — search "idol cafe Hongdae" for current ones.', crowdLevel:'mid', transport:'Walk 5 min' },
      { time:'19:30', place:'KBS Arena / Olympic Hall', placeKo:'올림픽홀', category:'kpop', duration:120,
        tip:'Check for live concert schedules at kstarpass.com. Even watching fans is fun!', crowdLevel:'high', transport:'Subway Line 5 · Olympic Park' },
    ],
  },
  history: {
    title: 'Seoul Through the Centuries',
    overview: 'Walk through 600 years of Korean history from royal palaces to folk villages.',
    dayTheme: 'Palaces & Heritage',
    slots: [
      { time:'09:00', place:'Gyeongbokgung Palace', placeKo:'경복궁', category:'attraction', duration:120,
        tip:'Rent hanbok at the entrance for free entry. English audio guide available.', crowdLevel:'mid', transport:'Subway Line 3 · Gyeongbokgung' },
      { time:'11:30', place:'Bukchon Hanok Village', placeKo:'북촌한옥마을', category:'attraction', duration:75,
        tip:'Be quiet — residents live here. Best photos from the top of the hill.', crowdLevel:'high', transport:'Walk 15 min' },
      { time:'13:30', place:'Changdeokgung Palace', placeKo:'창덕궁', category:'attraction', duration:90,
        tip:'The Secret Garden tour (English available) is breathtaking. Book online.', crowdLevel:'low', transport:'Walk 20 min' },
      { time:'15:30', place:'Jongmyo Shrine', placeKo:'종묘', category:'attraction', duration:60,
        tip:'UNESCO World Heritage site. Free guided tours available on weekends.', crowdLevel:'low', transport:'Walk 10 min' },
      { time:'17:30', place:'Insadong Antique Street', placeKo:'인사동', category:'shopping', duration:60,
        tip:'Great for Korean art, traditional crafts, and calligraphy gifts.', crowdLevel:'mid', transport:'Walk 10 min' },
    ],
  },
  nature: {
    title: 'Seoul Green Escapes',
    overview: 'Discover Seoul\'s stunning parks, mountain trails, and peaceful riverside walks.',
    dayTheme: 'Parks & Nature',
    slots: [
      { time:'08:00', place:'Bukhansan National Park', placeKo:'북한산국립공원', category:'attraction', duration:180,
        tip:'Wear sturdy shoes. The Baegundae peak trail takes 3-4 hours and has stunning views.', crowdLevel:'low', transport:'Subway Line 3 · Gupabal' },
      { time:'13:00', place:'Inwangsan Shamanist Trail', placeKo:'인왕산', category:'attraction', duration:75,
        tip:'Shorter hike with great city views and traditional shaman shrines.', crowdLevel:'low', transport:'Taxi from park' },
      { time:'15:30', place:'Gyeongui Line Forest Park', placeKo:'경의선숲길', category:'attraction', duration:60,
        tip:'A beautiful linear park through residential Yeonnam-dong. Great for cycling.', crowdLevel:'mid', transport:'Subway Line 2 · Hongik Univ.' },
      { time:'17:30', place:'Han River Park (Yeouido)', placeKo:'여의도 한강공원', category:'attraction', duration:90,
        tip:'Rent a bike (₩3,000/hr) and cycle along the river. Stunning at sunset.', crowdLevel:'mid', transport:'Subway Line 5 · Yeouinaru' },
    ],
  },
  shopping: {
    title: 'Seoul Shopping Spree',
    overview: 'From luxury malls to bargain markets — Seoul has it all for every budget.',
    dayTheme: 'Markets & Malls',
    slots: [
      { time:'10:00', place:'Dongdaemun Design Plaza', placeKo:'동대문디자인플라자', category:'shopping', duration:90,
        tip:'The building itself is worth seeing. Fashion wholesale market opens at night.', crowdLevel:'mid', transport:'Subway Line 2/4/5 · Dongdaemun History & Culture' },
      { time:'12:30', place:'Namdaemun Market', placeKo:'남대문시장', category:'shopping', duration:90,
        tip:'Huge traditional market. Great for Korean snacks, clothing, and souvenirs. Bargain!', crowdLevel:'high', transport:'Subway Line 4 · Hoehyeon' },
      { time:'15:00', place:'Myeongdong Shopping Street', placeKo:'명동', category:'shopping', duration:90,
        tip:'Best for Korean cosmetics (Innisfree, Etude, COSRX). Many stores give free samples.', crowdLevel:'high', transport:'Walk 10 min' },
      { time:'17:30', place:'Garosu-gil Boutique Street', placeKo:'가로수길', category:'shopping', duration:75,
        tip:'Upscale boutiques and cafes in a tree-lined street. Good for unique Korean fashion.', crowdLevel:'mid', transport:'Subway Line 3 · Sinsa' },
      { time:'20:00', place:'COEX Underground Mall', placeKo:'코엑스몰', category:'shopping', duration:60,
        tip:'Massive underground mall open until 10pm. The library inside is free and beautiful.', crowdLevel:'low', transport:'Subway Line 2 · Samseong' },
    ],
  },
  cafe: {
    title: 'Seoul Cafe Hopping Adventure',
    overview: 'Seoul has the world\'s highest density of cafes — explore themed and specialty coffee shops.',
    dayTheme: 'Cafes & Coffee Culture',
    slots: [
      { time:'09:30', place:'Fritz Coffee (Dohwa)', placeKo:'프릳츠 도화점', category:'cafe', duration:60,
        tip:'One of Seoul\'s most loved specialty coffee roasters. Try their croissants.', crowdLevel:'mid', transport:'Subway Line 5 · Mapo' },
      { time:'11:00', place:'Yeonnam-dong Cafe Street', placeKo:'연남동 카페거리', category:'cafe', duration:90,
        tip:'Walk the neighborhood and pop into any cafe that catches your eye. Very instagrammable.', crowdLevel:'mid', transport:'Walk 15 min' },
      { time:'13:30', place:'Cafe Bora (Insadong)', placeKo:'카페보라 인사동', category:'cafe', duration:60,
        tip:'Famous for purple matcha latte. Expect queues — come before 2pm.', crowdLevel:'high', transport:'Subway Line 3 · Anguk' },
      { time:'15:30', place:'Sky Terrace Cafe (Seongsu)', placeKo:'성수동 루프탑카페', category:'cafe', duration:75,
        tip:'Seoul\'s Brooklyn. Search "Seongsu rooftop cafe" on Instagram for the best current spot.', crowdLevel:'mid', transport:'Subway Line 2 · Seongsu' },
      { time:'18:00', place:'Han River Convenience Store Picnic', placeKo:'한강공원 편의점', category:'cafe', duration:75,
        tip:'Buy ramyeon, chimaek (fried chicken + beer), and ramyeon from the GS25 by the river. Very local!', crowdLevel:'low', transport:'Subway Line 5 · Yeouinaru' },
    ],
  },
  art: {
    title: 'Seoul Art & Culture Tour',
    overview: 'From ancient Buddhist art to cutting-edge contemporary galleries — Seoul\'s creative scene.',
    dayTheme: 'Museums & Galleries',
    slots: [
      { time:'10:00', place:'National Museum of Korea', placeKo:'국립중앙박물관', category:'attraction', duration:120,
        tip:'Free entry. English audio guide available. The celadon pottery collection is world-class.', crowdLevel:'low', transport:'Subway Line 4 · Ichon' },
      { time:'13:00', place:'Leeum Samsung Museum of Art', placeKo:'리움미술관', category:'attraction', duration:90,
        tip:'Stunning architecture by 3 different world-renowned architects. English labels throughout.', crowdLevel:'low', transport:'Subway Line 6 · Hangangjin' },
      { time:'15:30', place:'Ihwa Mural Village', placeKo:'이화동 벽화마을', category:'attraction', duration:60,
        tip:'Hillside neighborhood covered in murals. Find the famous "cat" mural — locals love photos there.', crowdLevel:'mid', transport:'Subway Line 4 · Hyehwa' },
      { time:'17:30', place:'Dongdaemun Design Plaza (DDP)', placeKo:'동대문디자인플라자', category:'attraction', duration:75,
        tip:'Zaha Hadid-designed building. Free outdoor area, and indoor exhibitions are often free.', crowdLevel:'mid', transport:'Subway Line 2/4 · Dongdaemun H&C' },
    ],
  },
  night: {
    title: 'Seoul After Dark',
    overview: 'Seoul never sleeps — explore neon-lit streets, rooftop bars, and night markets.',
    dayTheme: 'Nightlife & Night Markets',
    slots: [
      { time:'17:00', place:'Namsan Tower Sunset', placeKo:'남산타워', category:'attraction', duration:90,
        tip:'Take the cable car up. The sunset view of Seoul is spectacular. Love locks at the fence.', crowdLevel:'mid', transport:'Subway Line 4 · Myeongdong + cable car' },
      { time:'19:30', place:'Itaewon Bar Street', placeKo:'이태원', category:'attraction', duration:60,
        tip:'Most bars have English menus. The side streets (Haebangchon) are less touristy.', crowdLevel:'high', transport:'Subway Line 6 · Itaewon' },
      { time:'21:00', place:'Dongdaemun Night Market', placeKo:'동대문 야시장', category:'shopping', duration:90,
        tip:'Fashion wholesale market opens at 10pm. Great for late-night street food too.', crowdLevel:'high', transport:'Subway Line 2/4 · Dongdaemun' },
      { time:'23:00', place:'Han River Night Walk', placeKo:'한강공원 야간', category:'attraction', duration:60,
        tip:'Beautifully lit bridges and city reflections. Open 24 hours. Very safe.', crowdLevel:'low', transport:'Taxi (recommended at night)' },
    ],
  },
}

export function getMockCourse({ themes = ['history'], days = 1, language = 'en' } = {}) {
  // 선택된 테마 중 첫 번째로 매치되는 mock 사용, 없으면 history 기본
  const primaryTheme = themes.find(t => MOCK_THEMES[t]) || 'history'
  const mock = MOCK_THEMES[primaryTheme]

  // days 수에 맞게 날 구성
  const daysList = []
  for (let d = 1; d <= Math.min(days, 3); d++) {
    // 2번째 날이 있으면 다른 테마에서 slots 가져오기
    if (d === 1) {
      daysList.push({ day: 1, theme: mock.dayTheme, slots: mock.slots })
    } else {
      // 2일차: 두 번째 선택 테마 or 다른 테마로
      const secondTheme = themes[1] && MOCK_THEMES[themes[1]]
        ? themes[1]
        : Object.keys(MOCK_THEMES).find(k => k !== primaryTheme) || 'food'
      const second = MOCK_THEMES[secondTheme]
      daysList.push({ day: d, theme: second.dayTheme, slots: second.slots.slice(0, 4) })
    }
  }

  return {
    title:    mock.title,
    overview: mock.overview,
    days:     daysList,
    tips: [
      'Load T-money card at any GS25 or CU convenience store for subway & bus.',
      'Naver Maps works better than Google Maps for Seoul transit directions.',
      'Most places accept credit cards — Visa and Mastercard work everywhere.',
    ],
  }
}
