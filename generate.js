/**
 * Vercel Serverless Function: /api/generate
 * GPT-4o 코스 생성 엔드포인트
 */

export const config = { runtime: 'edge' }

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const { prompt, language, themes } = await req.json()

  if (!prompt) {
    return new Response(JSON.stringify({ error: 'prompt is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    // API 키 없으면 테마 반영한 mock 반환
    return new Response(
      JSON.stringify({ course: getMockResponse(language, themes) }),
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
            content: 'You are Seoul Wander, an expert AI travel guide for Seoul, Korea. Always respond with valid JSON only — no markdown, no backticks, no extra text.',
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
    // GPT 실패시에도 테마 반영 mock 반환
    return new Response(
      JSON.stringify({ course: getMockResponse(language, themes) }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// 테마별 mock 데이터
const MOCK_DATA = {
  food: {
    title: 'Seoul Street Food Safari',
    overview: 'A delicious journey through legendary food markets and hidden local eateries.',
    theme: 'Markets & Street Food',
    slots: [
      { time:'08:30', place:'Gwangjang Market', placeKo:'광장시장', category:'food', duration:90, tip:'Try bindaetteok and mayak gimbap. Point at what you want.', crowdLevel:'mid', transport:'Subway Line 1 · Jongno 5-ga' },
      { time:'11:00', place:'Tongin Market', placeKo:'통인시장', category:'food', duration:60, tip:'Use the special coin tray to pick food from different stalls.', crowdLevel:'low', transport:'Walk 25 min or taxi' },
      { time:'13:30', place:'Myeongdong Street Food', placeKo:'명동 먹자골목', category:'food', duration:90, tip:'Try tornado potato, egg bread, and tteokbokki. Everything has English signs.', crowdLevel:'high', transport:'Subway Line 4 · Myeongdong' },
      { time:'16:00', place:'Mangwon Market', placeKo:'망원시장', category:'food', duration:75, tip:'Less touristy than Gwangjang. Great hotteok and fresh produce.', crowdLevel:'low', transport:'Subway Line 6 · Mangwon' },
      { time:'19:00', place:'Noryangjin Fish Market', placeKo:'노량진수산시장', category:'food', duration:90, tip:'Buy fresh seafood upstairs and get it cooked at a restaurant downstairs.', crowdLevel:'mid', transport:'Subway Line 1 · Noryangjin' },
    ],
    tips: ['Most markets accept card but bring some cash just in case.', 'Point and smile — vendors are very used to foreign tourists.', 'GS25 and CU convenience stores have surprisingly good cheap food too.'],
  },
  kpop: {
    title: 'K-POP Seoul Ultimate Tour',
    overview: 'Dive into the heart of K-POP culture with idol cafes, merch shops, and live spots.',
    theme: 'K-POP & Idol Culture',
    slots: [
      { time:'10:00', place:'HYBE Insight Museum', placeKo:'하이브 인사이트', category:'kpop', duration:120, tip:'Book tickets online weeks in advance — sells out fast.', crowdLevel:'mid', transport:'Subway Line 3 · Apgujeong Rodeo' },
      { time:'13:00', place:'SM Entertainment Building', placeKo:'SM엔터테인먼트', category:'kpop', duration:45, tip:'The SM Store inside sells official merch at retail price.', crowdLevel:'low', transport:'Subway Line 2 · Samsong' },
      { time:'14:30', place:'Hongdae K-POP Street', placeKo:'홍대 K-POP거리', category:'kpop', duration:120, tip:'Best merch shops for all major idol groups. Street performances from 6pm.', crowdLevel:'high', transport:'Subway Line 2 · Hongik Univ.' },
      { time:'17:30', place:'Idol Themed Cafe Hongdae', placeKo:'홍대 아이돌카페', category:'cafe', duration:60, tip:'Search "idol cafe Hongdae" on Instagram for current themed cafes.', crowdLevel:'mid', transport:'Walk 5 min' },
      { time:'20:00', place:'Gangnam K-Star Road', placeKo:'강남 K스타로드', category:'kpop', duration:60, tip:'Giant K-POP character statues line the street. Great for night photos.', crowdLevel:'mid', transport:'Subway Line 3 · Apgujeong Rodeo' },
    ],
    tips: ['Buy merch at official stores — cheaper and guaranteed authentic.', 'Check Melon or Weverse for upcoming fan meetings and events.', 'Wear your fandom colors — locals will notice and be friendly!'],
  },
  history: {
    title: 'Seoul Through the Centuries',
    overview: 'Walk through 600 years of Korean history from royal palaces to folk villages.',
    theme: 'Palaces & Heritage',
    slots: [
      { time:'09:00', place:'Gyeongbokgung Palace', placeKo:'경복궁', category:'attraction', duration:120, tip:'Rent hanbok at the entrance for free entry. English audio guide available.', crowdLevel:'mid', transport:'Subway Line 3 · Gyeongbokgung' },
      { time:'11:30', place:'Bukchon Hanok Village', placeKo:'북촌한옥마을', category:'attraction', duration:75, tip:'Be quiet — residents live here. Best photos from the top of the hill.', crowdLevel:'high', transport:'Walk 15 min' },
      { time:'13:30', place:'Changdeokgung Palace', placeKo:'창덕궁', category:'attraction', duration:90, tip:'The Secret Garden tour in English is breathtaking. Book online.', crowdLevel:'low', transport:'Walk 20 min' },
      { time:'15:30', place:'Jongmyo Shrine', placeKo:'종묘', category:'attraction', duration:60, tip:'UNESCO World Heritage site. Free guided tours on weekends.', crowdLevel:'low', transport:'Walk 10 min' },
      { time:'17:30', place:'Insadong Antique Street', placeKo:'인사동', category:'shopping', duration:60, tip:'Great for Korean art, traditional crafts, and calligraphy gifts.', crowdLevel:'mid', transport:'Walk 10 min' },
    ],
    tips: ['Hanbok rental near palaces gives free entry to all 5 royal palaces.', 'Most palace audio guides are free with a QR code at the entrance.', 'Visit palaces on weekdays — much less crowded than weekends.'],
  },
  nature: {
    title: 'Seoul Green Escapes',
    overview: 'Discover stunning parks, mountain trails, and peaceful riverside walks.',
    theme: 'Parks & Nature',
    slots: [
      { time:'08:00', place:'Bukhansan National Park', placeKo:'북한산국립공원', category:'attraction', duration:180, tip:'Wear sturdy shoes. The Baegundae peak trail takes 3-4 hours with stunning views.', crowdLevel:'low', transport:'Subway Line 3 · Gupabal' },
      { time:'13:00', place:'Gyeongui Line Forest Park', placeKo:'경의선숲길', category:'attraction', duration:60, tip:'A beautiful linear park through Yeonnam-dong. Great for a stroll.', crowdLevel:'mid', transport:'Subway Line 2 · Hongik Univ.' },
      { time:'15:30', place:'Seoul Forest', placeKo:'서울숲', category:'attraction', duration:90, tip:'Deer roam freely in one section. Very peaceful on weekday afternoons.', crowdLevel:'low', transport:'Subway Line 2 · Seoul Forest' },
      { time:'18:00', place:'Han River Park Yeouido', placeKo:'여의도 한강공원', category:'attraction', duration:90, tip:'Rent a bike (₩3,000/hr) and cycle along the river. Stunning at sunset.', crowdLevel:'mid', transport:'Subway Line 5 · Yeouinaru' },
    ],
    tips: ['Download the Seoul Bike (따릉이) app for cheap bike rentals along the river.', 'Bukhansan trailheads are clearly marked in English.', 'Han River parks have free BBQ grills — bring your own food!'],
  },
  shopping: {
    title: 'Seoul Shopping Spree',
    overview: 'From luxury malls to bargain markets — Seoul has it all for every budget.',
    theme: 'Markets & Malls',
    slots: [
      { time:'10:00', place:'Dongdaemun Design Plaza', placeKo:'동대문디자인플라자', category:'shopping', duration:90, tip:'The building itself is stunning. Fashion wholesale market opens at night.', crowdLevel:'mid', transport:'Subway Line 2/4 · Dongdaemun H&C' },
      { time:'12:30', place:'Namdaemun Market', placeKo:'남대문시장', category:'shopping', duration:90, tip:'Great for Korean snacks, clothing, and souvenirs. Bargain hard!', crowdLevel:'high', transport:'Subway Line 4 · Hoehyeon' },
      { time:'15:00', place:'Myeongdong Shopping Street', placeKo:'명동', category:'shopping', duration:90, tip:'Best for Korean cosmetics. Many stores give free samples — grab them all!', crowdLevel:'high', transport:'Walk 10 min' },
      { time:'17:30', place:'Garosu-gil Boutique Street', placeKo:'가로수길', category:'shopping', duration:75, tip:'Upscale boutiques and cafes. Good for unique Korean fashion brands.', crowdLevel:'mid', transport:'Subway Line 3 · Sinsa' },
      { time:'20:00', place:'COEX Underground Mall', placeKo:'코엑스몰', category:'shopping', duration:60, tip:'Massive underground mall open until 10pm. The library is free and beautiful.', crowdLevel:'low', transport:'Subway Line 2 · Samseong' },
    ],
    tips: ['Tax refund available at most stores — look for the "Tax Free" sticker.', 'Myeongdong cosmetics stores are cheapest on the main street.', 'Dongdaemun wholesale fashion market opens 10pm–5am for the best deals.'],
  },
  cafe: {
    title: 'Seoul Cafe Hopping Adventure',
    overview: 'Seoul has the world\'s highest density of cafes — explore unique and specialty coffee shops.',
    theme: 'Cafes & Coffee Culture',
    slots: [
      { time:'09:30', place:'Fritz Coffee Dohwa', placeKo:'프릳츠 도화점', category:'cafe', duration:60, tip:'One of Seoul\'s most loved specialty roasters. Try their croissants.', crowdLevel:'mid', transport:'Subway Line 5 · Mapo' },
      { time:'11:00', place:'Yeonnam-dong Cafe Street', placeKo:'연남동 카페거리', category:'cafe', duration:90, tip:'Walk the neighborhood and pop into any cafe that catches your eye.', crowdLevel:'mid', transport:'Walk 15 min' },
      { time:'13:30', place:'Cafe Bora Insadong', placeKo:'카페보라 인사동', category:'cafe', duration:60, tip:'Famous for purple matcha latte. Come before 2pm to avoid long queues.', crowdLevel:'high', transport:'Subway Line 3 · Anguk' },
      { time:'15:30', place:'Seongsu-dong Cafe Street', placeKo:'성수동 카페거리', category:'cafe', duration:90, tip:'Seoul\'s coolest neighborhood. Mix of industrial and artsy cafes.', crowdLevel:'mid', transport:'Subway Line 2 · Seongsu' },
      { time:'18:00', place:'Han River Convenience Store', placeKo:'한강공원 편의점', category:'cafe', duration:75, tip:'Buy ramyeon and snacks from GS25 and eat by the river — a true local experience!', crowdLevel:'low', transport:'Subway Line 5 · Yeouinaru' },
    ],
    tips: ['Most cafes in Seoul are non-smoking and have free WiFi.', 'Instagram the cafe name in Korean for directions — locals will help!', 'Cafes are open late — many until midnight in Hongdae and Itaewon.'],
  },
  art: {
    title: 'Seoul Art & Culture Discovery',
    overview: 'From ancient Buddhist art to cutting-edge contemporary galleries.',
    theme: 'Museums & Galleries',
    slots: [
      { time:'10:00', place:'National Museum of Korea', placeKo:'국립중앙박물관', category:'attraction', duration:120, tip:'Free entry. English audio guide available. The celadon pottery is world-class.', crowdLevel:'low', transport:'Subway Line 4 · Ichon' },
      { time:'13:00', place:'Leeum Samsung Museum of Art', placeKo:'리움미술관', category:'attraction', duration:90, tip:'Stunning architecture by 3 world-renowned architects. English labels throughout.', crowdLevel:'low', transport:'Subway Line 6 · Hangangjin' },
      { time:'15:30', place:'Ihwa Mural Village', placeKo:'이화동 벽화마을', category:'attraction', duration:60, tip:'Hillside covered in murals. Find the famous cat mural for the best photos.', crowdLevel:'mid', transport:'Subway Line 4 · Hyehwa' },
      { time:'17:30', place:'Dongdaemun Design Plaza DDP', placeKo:'동대문디자인플라자', category:'attraction', duration:75, tip:'Zaha Hadid-designed building. Free outdoor area, indoor exhibitions often free too.', crowdLevel:'mid', transport:'Subway Line 2/4 · Dongdaemun H&C' },
    ],
    tips: ['Most national museums in Seoul are free entry.', 'The National Museum of Korea app has excellent English audio tours.', 'Street art in Hongdae changes frequently — always something new.'],
  },
  night: {
    title: 'Seoul After Dark',
    overview: 'Seoul never sleeps — explore neon streets, rooftop bars, and vibrant night markets.',
    theme: 'Nightlife & Night Markets',
    slots: [
      { time:'17:00', place:'Namsan Tower Sunset', placeKo:'남산타워', category:'attraction', duration:90, tip:'Take the cable car up. Sunset view of Seoul is spectacular.', crowdLevel:'mid', transport:'Subway Line 4 · Myeongdong + cable car' },
      { time:'19:30', place:'Itaewon Bar Street', placeKo:'이태원', category:'attraction', duration:60, tip:'Most bars have English menus. Haebangchon side streets are less touristy.', crowdLevel:'high', transport:'Subway Line 6 · Itaewon' },
      { time:'21:00', place:'Dongdaemun Night Market', placeKo:'동대문 야시장', category:'shopping', duration:90, tip:'Fashion wholesale opens at 10pm. Great for late-night street food too.', crowdLevel:'high', transport:'Subway Line 2/4 · Dongdaemun' },
      { time:'23:00', place:'Han River Night Walk', placeKo:'한강공원 야간', category:'attraction', duration:60, tip:'Beautifully lit bridges and city reflections. Open 24 hours. Very safe.', crowdLevel:'low', transport:'Taxi recommended at night' },
    ],
    tips: ['Seoul is very safe at night — walking alone is fine in most areas.', 'Taxis are cheap and easy to get via the Kakao T app.', 'Last subway is around midnight — check the schedule or plan to taxi back.'],
  },
}

function getMockResponse(language, themes) {
  const themeList = Array.isArray(themes) ? themes : ['history']
  const primary   = themeList.find(t => MOCK_DATA[t]) || 'history'
  const mock      = MOCK_DATA[primary]

  const course = {
    title:    mock.title,
    overview: mock.overview,
    days: [{ day: 1, theme: mock.theme, slots: mock.slots }],
    tips: mock.tips,
  }

  // 2일 이상이면 두 번째 테마 추가
  if (themeList.length > 1 || true) {
    const secondTheme = themeList[1] && MOCK_DATA[themeList[1]]
      ? themeList[1]
      : Object.keys(MOCK_DATA).find(k => k !== primary) || 'food'
    const second = MOCK_DATA[secondTheme]
    if (course.days.length < 2) {
      course.days.push({ day: 2, theme: second.theme, slots: second.slots.slice(0, 4) })
    }
  }

  return JSON.stringify(course)
}
