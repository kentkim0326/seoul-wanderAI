import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

const CROWD_LABEL = {
  low:  { color:'#22C55E', bg:'rgba(34,197,94,0.15)',  label:'Comfortable' },
  mid:  { color:'#F6993F', bg:'rgba(246,153,63,0.15)', label:'Moderate'    },
  high: { color:'#EF4444', bg:'rgba(239,68,68,0.15)',  label:'Crowded'     },
}

const CATEGORY_COLOR = {
  food:       '#FF6B6B',
  attraction: '#00B4D8',
  shopping:   '#FFD166',
  cafe:       '#A78BFA',
  transport:  '#94A3B8',
  kpop:       '#EC4899',
}

export default function ResultPage() {
  const { t }    = useTranslation()
  const navigate = useNavigate()
  const { state } = useLocation()
  const course   = state?.course

  if (!course) {
    navigate('/')
    return null
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: `Seoul Wander — ${course.title}`,
        text:  course.overview,
        url:   window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied!')
    }
  }

  return (
    <div className="min-h-screen bg-[#0D1120] px-5 py-10 max-w-2xl mx-auto">

      {/* Header */}
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="mb-8">
        <button
          onClick={() => navigate('/plan')}
          className="text-white/40 hover:text-white text-sm mb-5 flex items-center gap-2 transition-colors"
        >
          ← Replanning
        </button>
        <h2 className="font-display text-3xl font-black text-white leading-tight">
          {course.title}
        </h2>
        <p className="text-white/50 text-sm mt-2 leading-relaxed">{course.overview}</p>

        {/* Action buttons */}
        <div className="flex gap-3 mt-5">
          <button
            onClick={handleShare}
            className="glass rounded-xl px-5 py-2.5 text-sm text-white/80 hover:text-white transition-colors flex items-center gap-2"
          >
            ↗ {t('share')}
          </button>
          <button
            onClick={() => window.print()}
            className="glass rounded-xl px-5 py-2.5 text-sm text-white/80 hover:text-white transition-colors"
          >
            ↓ PDF
          </button>
        </div>
      </motion.div>

      {/* Crowd legend */}
      <motion.div
        initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
        className="glass rounded-xl p-4 mb-8 flex items-center gap-6"
      >
        <span className="text-white/40 text-xs uppercase tracking-wider">Real-time crowds</span>
        {Object.entries(CROWD_LABEL).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1.5 text-xs" style={{ color: v.color }}>
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: v.color }} />
            {v.label}
          </span>
        ))}
      </motion.div>

      {/* Days */}
      {course.days.map((day, di) => (
        <motion.div
          key={day.day}
          initial={{ opacity:0, y:20 }}
          animate={{ opacity:1, y:0 }}
          transition={{ delay: 0.15 + di * 0.1 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-5">
            <span className="w-8 h-8 rounded-lg bg-teal/20 text-teal flex items-center justify-center font-bold text-sm">
              {day.day}
            </span>
            <h3 className="font-display text-xl font-bold text-white">{day.theme}</h3>
          </div>

          <div className="relative pl-5">
            {/* Vertical line */}
            <div className="absolute left-0 top-3 bottom-3 w-px bg-white/10" />

            {day.slots.map((slot, si) => {
              const crowd = CROWD_LABEL[slot.crowdLevel] || CROWD_LABEL.mid
              const catColor = CATEGORY_COLOR[slot.category] || '#94A3B8'
              return (
                <motion.div
                  key={si}
                  initial={{ opacity:0, x:-10 }}
                  animate={{ opacity:1, x:0 }}
                  transition={{ delay: 0.2 + di * 0.1 + si * 0.05 }}
                  className="relative mb-5"
                >
                  {/* Timeline dot */}
                  <div
                    className="absolute -left-5 top-3 w-2.5 h-2.5 rounded-full border-2 border-[#0D1120]"
                    style={{ backgroundColor: catColor }}
                  />

                  <div className="glass rounded-xl p-4 hover:bg-white/5 transition-colors">
                    {/* Time + crowd */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-teal font-bold text-sm font-body">{slot.time}</span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ color: crowd.color, backgroundColor: crowd.bg }}
                      >
                        {crowd.label}
                      </span>
                    </div>

                    {/* Place name */}
                    <h4 className="font-display font-bold text-white text-lg leading-tight">
                      {slot.place}
                    </h4>
                    <p className="text-white/30 text-xs mt-0.5">{slot.placeKo}</p>

                    {/* Tip */}
                    <p className="text-white/60 text-sm mt-2 leading-relaxed">{slot.tip}</p>

                    {/* Transport + duration */}
                    <div className="flex items-center gap-3 mt-3 text-xs text-white/30">
                      <span>🚇 {slot.transport}</span>
                      <span>·</span>
                      <span>⏱ {slot.duration} min</span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      ))}

      {/* General tips */}
      {course.tips?.length > 0 && (
        <motion.div
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.6 }}
          className="glass rounded-2xl p-5 mt-4"
        >
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

      {/* Re-generate */}
      <motion.button
        initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.7 }}
        onClick={() => navigate('/plan')}
        className="w-full mt-8 glass rounded-2xl py-4 text-white/60 hover:text-white transition-colors font-body"
      >
        Generate another route →
      </motion.button>
    </div>
  )
}
