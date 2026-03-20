/**
 * Seoul Open Data API connector
 * 서울 열린데이터광장 API 연동
 * Base URL: http://openapi.seoul.go.kr:8088/{API_KEY}/json/...
 */

const SEOUL_API_KEY = import.meta.env.VITE_SEOUL_API_KEY || 'sample'
const BASE = `http://openapi.seoul.go.kr:8088/${SEOUL_API_KEY}/json`

// ─── 1. 지하철 혼잡도 ────────────────────────────────────────
// 서울 열린데이터광장 데이터셋: 서울시 지하철 혼잡도 정보
export async function getSubwayCrowd(lineNum = '2') {
  try {
    const res = await fetch(
      `${BASE}/CardSubwayTime/1/5/${lineNum}호선`
    )
    const data = await res.json()
    const rows = data?.CardSubwayTime?.row ?? []
    // 현재 시간대 혼잡도 추출
    const hour = new Date().getHours()
    return rows.map(r => ({
      station: r.SUB_STA_NM,
      crowdLevel: getCrowdLevel(r[`HR_${String(hour).padStart(2,'0')}_CNT`]),
    }))
  } catch {
    // 개발 중 fallback mock 데이터
    return mockSubwayCrowd()
  }
}

// ─── 2. 관광지 방문객 현황 ───────────────────────────────────
// 데이터셋: 서울시 관광지 방문객 현황
export async function getTouristCrowd() {
  try {
    const res = await fetch(
      `${BASE}/TbTouristTargetWater/1/20/`
    )
    const data = await res.json()
    return (data?.TbTouristTargetWater?.row ?? []).map(r => ({
      name:    r.VISIT_AREA_NM,
      monthly: parseInt(r.VISIT_CNT_M || '0'),
      crowd:   getCrowdLevel(parseInt(r.VISIT_CNT_M || '0'), 50000),
    }))
  } catch {
    return mockTouristSpots()
  }
}

// ─── 3. 문화행사 정보 ────────────────────────────────────────
// 데이터셋: 서울시 문화행사 정보
export async function getCulturalEvents(startDate, endDate) {
  try {
    const res = await fetch(
      `${BASE}/culturalEventInfo/1/10/${startDate}/${endDate}/`
    )
    const data = await res.json()
    return (data?.culturalEventInfo?.row ?? []).map(r => ({
      title:   r.TITLE,
      place:   r.PLACE,
      start:   r.STRTDATE,
      end:     r.END_DATE,
      isFree:  r.IS_FREE === '무료',
      url:     r.ORG_LINK,
    }))
  } catch {
    return []
  }
}

// ─── 4. 생활인구 (동단위 유동인구) ──────────────────────────
// 데이터셋: 서울 생활인구
export async function getLivingPopulation(area = '종로구') {
  try {
    const today = new Date()
    const yyyymmdd = today.toISOString().slice(0,10).replace(/-/g,'')
    const res = await fetch(
      `${BASE}/RtdpPopulationByArea/1/5/${yyyymmdd}/${area}/`
    )
    const data = await res.json()
    return (data?.RtdpPopulationByArea?.row ?? []).map(r => ({
      area:   r.AREA_NM,
      level:  r.AREA_CONGEST_LVL,
      msg:    r.AREA_CONGEST_MSG,
    }))
  } catch {
    return []
  }
}

// ─── 혼잡도 레벨 계산 ────────────────────────────────────────
function getCrowdLevel(count, maxCount = 10000) {
  const ratio = count / maxCount
  if (ratio < 0.4) return 'low'
  if (ratio < 0.7) return 'mid'
  return 'high'
}

// ─── Mock 데이터 (API Key 없을 때 개발용) ───────────────────
function mockSubwayCrowd() {
  return [
    { station: '홍대입구', crowdLevel: 'high' },
    { station: '경복궁',   crowdLevel: 'mid'  },
    { station: '명동',     crowdLevel: 'high' },
    { station: '이태원',   crowdLevel: 'low'  },
    { station: '강남',     crowdLevel: 'high' },
  ]
}

function mockTouristSpots() {
  return [
    { name: '경복궁',    crowd: 'high',  monthly: 120000 },
    { name: '북촌한옥마을', crowd: 'mid', monthly: 80000 },
    { name: '남산타워',  crowd: 'mid',   monthly: 95000  },
    { name: '창덕궁',    crowd: 'low',   monthly: 40000  },
    { name: '인사동',    crowd: 'mid',   monthly: 70000  },
    { name: '광장시장',  crowd: 'high',  monthly: 110000 },
    { name: '홍대',      crowd: 'high',  monthly: 150000 },
    { name: '이태원',    crowd: 'low',   monthly: 35000  },
  ]
}

// ─── 전체 혼잡도 요약 (GPT 프롬프트 주입용) ─────────────────
export async function getCrowdSummary() {
  const [subway, spots] = await Promise.all([
    getSubwayCrowd('2'),
    getTouristCrowd(),
  ])

  const highCrowd = spots.filter(s => s.crowd === 'high').map(s => s.name)
  const lowCrowd  = spots.filter(s => s.crowd === 'low').map(s => s.name)

  return {
    subway,
    spots,
    summary: {
      avoid:  highCrowd,
      prefer: lowCrowd,
      note:   `Currently crowded: ${highCrowd.join(', ')}. Less crowded: ${lowCrowd.join(', ')}.`,
    },
  }
}
