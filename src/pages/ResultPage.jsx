import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'

const CROWD_LABEL = {
  low:  { color:'#22C55E', bg:'rgba(34,197,94,0.15)',  label:'Comfortable' },
  mid:  { color:'#F6993F', bg:'rgba(246,153,63,0.15)', label:'Moderate'    },
  high: { color:'#EF4444', bg:'rgba(239,68,68,0.15)',  label:'Crowded'     },
}
const CATEGORY_COLOR = {
  food:'#FF6B6B', attraction:'#00B4D8', shopping:'#FFD166',
  cafe:'#A78BFA', transport:'#94A3B8',  kpop:'#EC4899',
}
const CATEGORY_ICON = {
  food:'🍜', attraction:'🏯', shopping:'🛍️', cafe:'☕', transport:'🚇', kpop:'🎵',
}

// ── 카카오맵 ─────────────────────────────────────────────────
function KakaoMap({ slots, activeIdx, onMarkerClick }) {
  const mapRef   = useRef(null)
  const mapObj   = useRef(null)
  const overlays = useRef([])
  const polyRef  = useRef(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (window.kakao?.maps) { setReady(true); return }
    const key = import.meta.env.VITE_KAKAO_MAP_KEY
    if (!key) { setReady(true); return }   // key 없으면 fallback
    const s = document.createElement('script')
    s.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&libraries=services&autoload=false`
    s.onload = () => window.kakao.maps.load(() => setReady(true))
    document.head.appendChild(s)
  }, [])

  useEffect(() => {
    if (!ready || !mapRef.current || !window.kakao?.maps) return
    const { maps } = window.kakao
    mapObj.current = new maps.Map(mapRef.current, {
      center: new maps.LatLng(37.5665, 126.9780), level: 7,
    })
    const ps = new maps.services.Places()
    const coords = []

    const mark = (slot, idx) => new Promise(resolve => {
      ps.keywordSearch(`${slot.placeKo || slot.place} 서울`, (res, status) => {
        if (status === maps.services.Status.OK && res[0]) {
          const pos = new maps.LatLng(+res[0].y, +res[0].x)
          coords[idx] = pos
          const cat = CATEGORY_COLOR[slot.category] || '#00B4D8'
          const ico = CATEGORY_ICON[slot.category]  || '📍'
          const html = `<div style="cursor:pointer;filter:drop-shadow(0 2px 6px rgba(0,0,0,.4))" data-i="${idx}">
            <div style="background:${cat};color:#fff;border-radius:50%;width:36px;height:36px;
              display:flex;align-items:center;justify-content:center;font-size:15px;border:3px solid #fff">
              ${ico}
            </div>
            <div style="position:absolute;bottom:-26px;left:50%;transform:translateX(-50%);
              white-space:nowrap;background:rgba(15,17,34,.88);color:#fff;font-size:11px;
              padding:2px 6px;border-radius:4px;pointer-events:none">
              ${slot.time}&nbsp;${slot.place}
            </div>
          </div>`
          const ov = new maps.CustomOverlay({ position: pos, content: html, yAnchor: 1.15 })
          ov.setMap(mapObj.current)
          ov.getContent()?.addEventListener('click', () => onMarkerClick(idx))
          overlays.current[idx] = ov
        }
        resolve()
      })
    })

    Promise.all(slots.map(mark)).then(() => {
      const valid = coords.filter(Boolean)
      if (valid.length > 1) {
        if (polyRef.current) polyRef.current.setMap(null)
        polyRef.current = new maps.Polyline({
          path: valid, strokeWeight:3, strokeColor:'#00B4D8',
          strokeOpacity:.7, strokeStyle:'dashed',
        })
        polyRef.current.setMap(mapObj.current)
      }
      if (valid.length) {
        const b = new maps.LatLngBounds()
        valid.forEach(c => b.extend(c))
        mapObj.current.setBounds(b)
      }
    })
  }, [ready, slots])

  useEffect(() => {
    if (!ready || activeIdx === null) return
    overlays.current[activeIdx]?.getPosition &&
      mapObj.current?.panTo(overlays.current[activeIdx].getPosition())
  }, [activeIdx, ready])

  if (!window.kakao?.maps && !ready) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white/5 rounded-2xl">
        <span className="text-white/30 text-sm animate-pulse">Loading map...</span>
      </div>
    )
  }

  if (!import.meta.env.VITE_KAKAO_MAP_KEY) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-white/5 rounded-2xl gap-3">
        <span className="text-2xl">🗺️</span>
        <span className="text-white/40 text-sm text-center px-6">
          Add <code className="text-teal">VITE_KAKAO_MAP_KEY</code> in Vercel env to enable map
        </span>
        <a href="https://developers.kakao.com" target="_blank" rel="noreferrer"
          className="text-teal text-xs underline">Get free key →</a>
      </div>
    )
  }

  return <div ref={mapRef} className="w-full h-full rounded-2xl overflow-hidden" />
}

// ── ResultPage ────────────────────────────────────────────────
export default function ResultPage() {
  const { t }     = useTranslation()
  const navigate  = useNavigate()
  const { state } = useLocation()
  const course    = state?.course

  const [activeDay,  setActiveDay]  = useState(0)
  const [activeSlot, setActiveSlot] = useState(null)
  const [showMap,    setShowMap]    = useState(true)

  if (!course) { navigate('/'); return null }

  const currentDay   = course.days?.[activeDay]
  const currentSlots = currentDay?.slots || []

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: `Seoul Wander — ${course.title}`, text: course.overview, url: window.location.href })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied!')
    }
  }

  return (
    <div className="min-h-screen bg-[#0D1120]">
      {/* 헤더 */}
      <div className="px-5 pt-8 pb-4 max-w-2xl mx-auto">
        <button onClick={() => navigate('/plan')}
          className="text-white/40 hover:text-white text-sm mb-4 transition-colors">
          ← Replanning
        </button>
        <motion.h2 initial={{ opacity:0 }} animate={{ opacity:1 }}
          className="font-display text-3xl font-black text-white leading-tight">
          {course.title}
        </motion.h2>
        <p className="text-white/50 text-sm mt-1 leading-relaxed">{course.overview}</p>
        <div className="flex gap-3 mt-4 flex-wrap">
          <button onClick={handleShare}
            className="glass rounded-xl px-4 py-2 text-sm text-white/70 hover:text-white transition-colors">
            ↗ Share
          </button>
          <button onClick={() => window.print()}
            className="glass rounded-xl px-4 py-2 text-sm text-white/70 hover:text-white transition-colors">
            ↓ PDF
          </button>
          <button onClick={() => setShowMap(m => !m)}
            className={`glass rounded-xl px-4 py-2 text-sm transition-all duration-200 flex items-center gap-1.5 ${
              showMap ? 'text-teal ring-1 ring-teal' : 'text-white/50 hover:text-white'
            }`}>
            🗺 {showMap ? 'Hide Map' : 'Show Map'}
          </button>
        </div>
      </div>

      {/* Day 탭 */}
      {course.days?.length > 1 && (
        <div className="px-5 max-w-2xl mx-auto flex gap-2 mb-4">
          {course.days.map((day, di) => (
            <button key={di}
              onClick={() => { setActiveDay(di); setActiveSlot(null) }}
              className={`px-4 py-1.5 rounded-xl text-sm font-bold transition-all ${
                activeDay === di ? 'bg-teal text-navy' : 'glass text-white/50 hover:text-white'
              }`}>
              Day {day.day}
            </button>
          ))}
        </div>
      )}

      {/* 지도 */}
      {showMap && (
        <motion.div
          initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:300 }}
          transition={{ duration:0.35 }}
          className="mx-4 mb-4 max-w-2xl md:mx-auto overflow-hidden rounded-2xl"
        >
          <KakaoMap
            slots={currentSlots}
            activeIdx={activeSlot}
            onMarkerClick={idx => {
              setActiveSlot(idx)
              setTimeout(() => {
                document.getElementById(`slot-${idx}`)?.scrollIntoView({ behavior:'smooth', block:'center' })
              }, 100)
            }}
          />
        </motion.div>
      )}

      <div className="px-5 max-w-2xl mx-auto">
        {/* 혼잡도 범례 */}
        <div className="glass rounded-xl px-4 py-2.5 mb-5 flex items-center gap-5 flex-wrap">
          <span className="text-white/40 text-xs uppercase tracking-wider">Live crowds</span>
          {Object.entries(CROWD_LABEL).map(([k, v]) => (
            <span key={k} className="flex items-center gap-1.5 text-xs" style={{ color:v.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor:v.color }} />
              {v.label}
            </span>
          ))}
        </div>

        {/* 슬롯 리스트 */}
        <div className="relative pl-5 mb-8">
          <div className="absolute left-0 top-3 bottom-3 w-px bg-white/10" />
          {currentSlots.map((slot, si) => {
            const crowd    = CROWD_LABEL[slot.crowdLevel] || CROWD_LABEL.mid
            const catColor = CATEGORY_COLOR[slot.category] || '#00B4D8'
            const isActive = activeSlot === si
            return (
              <motion.div key={si} id={`slot-${si}`}
                initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }}
                transition={{ delay: si * 0.05 }}
                className="relative mb-4"
              >
                <div className="absolute -left-5 top-4 w-2.5 h-2.5 rounded-full border-2 border-[#0D1120] transition-transform duration-200"
                  style={{ backgroundColor:catColor, transform: isActive ? 'scale(1.5)' : 'scale(1)' }} />
                <button
                  onClick={() => setActiveSlot(isActive ? null : si)}
                  className={`w-full text-left glass rounded-xl p-4 transition-all duration-200 ${
                    isActive ? 'ring-1 ring-teal bg-teal/5' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-teal font-bold text-sm">{slot.time}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ color:crowd.color, backgroundColor:crowd.bg }}>
                      {crowd.label}
                    </span>
                  </div>
                  <h4 className="font-display font-bold text-white text-lg leading-tight">{slot.place}</h4>
                  <p className="text-white/30 text-xs mt-0.5">{slot.placeKo}</p>
                  <p className="text-white/60 text-sm mt-2 leading-relaxed">{slot.tip}</p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-white/30">
                    <span>🚇 {slot.transport}</span>
                    <span>·</span>
                    <span>⏱ {slot.duration} min</span>
                  </div>
                  {isActive && (
                    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
                      className="mt-3 pt-3 border-t border-white/10 flex items-center gap-1 flex-wrap">
                      <a href={`https://map.kakao.com/link/search/${encodeURIComponent(slot.placeKo || slot.place)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-xs text-teal hover:text-teal/80 transition-colors"
                        onClick={e => e.stopPropagation()}>
                        🗺 Kakao Maps →
                      </a>
                      <span className="mx-2 text-white/20">|</span>
                      <a href={`https://www.google.com/maps/search/${encodeURIComponent(slot.place+' Seoul')}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-xs text-white/40 hover:text-white/70 transition-colors"
                        onClick={e => e.stopPropagation()}>
                        🌐 Google Maps →
                      </a>
                    </motion.div>
                  )}
                </button>
              </motion.div>
            )
          })}
        </div>

        {/* 외국인 팁 */}
        {course.tips?.length > 0 && (
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
            transition={{ delay:0.4 }}
            className="glass rounded-2xl p-5 mb-6">
            <h3 className="font-display font-bold text-gold text-lg mb-4">Foreigner Tips</h3>
            <ul className="space-y-3">
              {course.tips.map((tip, i) => (
                <li key={i} className="flex gap-3 text-sm text-white/70">
                  <span className="text-gold mt-0.5">★</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        <button onClick={() => navigate('/plan')}
          className="w-full glass rounded-2xl py-4 text-white/50 hover:text-white transition-colors mb-10">
          Generate another route →
        </button>
      </div>
    </div>
  )
}
