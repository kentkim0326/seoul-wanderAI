import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { generateCourse, getMockCourse } from '../lib/gptCourse'

const THEMES = [
  { id:'food',     icon:'🍜', labelKey:'themes.food' },
  { id:'history',  icon:'🏯', labelKey:'themes.history' },
  { id:'nature',   icon:'🌿', labelKey:'themes.nature' },
  { id:'kpop',     icon:'🎵', labelKey:'themes.kpop' },
  { id:'shopping', icon:'🛍️', labelKey:'themes.shopping' },
  { id:'cafe',     icon:'☕', labelKey:'themes.cafe' },
  { id:'art',      icon:'🎨', labelKey:'themes.art' },
  { id:'night',    icon:'🌙', labelKey:'themes.night' },
]

export default function PlannerPage() {
  const { t, i18n } = useTranslation()
  const navigate     = useNavigate()
  const [themes,   setThemes]   = useState([])
  const [days,     setDays]     = useState(1)
  const [extra,    setExtra]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [isListening, setListening] = useState(false)
  const recognitionRef = useRef(null)

  function toggleTheme(id) {
    setThemes(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  // ─── 음성 입력 (Web Speech API) ──────────────────────────
  function handleVoice() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast.error('Voice input not supported in this browser.')
      return
    }
    if (isListening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }
    const r = new SpeechRecognition()
    r.lang = i18n.language === 'ja' ? 'ja-JP'
           : i18n.language === 'zh' ? 'zh-CN'
           : i18n.language === 'es' ? 'es-ES'
           : i18n.language === 'fr' ? 'fr-FR'
           : 'en-US'
    r.onresult  = e => setExtra(e.results[0][0].transcript)
    r.onend     = ()  => setListening(false)
    r.onerror   = ()  => { toast.error('Voice error'); setListening(false) }
    r.start()
    recognitionRef.current = r
    setListening(true)
  }

  // ─── 코스 생성 ────────────────────────────────────────────
  async function handleGenerate() {
    if (themes.length === 0) {
      toast.error('Please select at least one theme.')
      return
    }
    setLoading(true)
    try {
      // OPENAI_API_KEY 없으면 mock 사용 (개발 환경)
      let course
      try {
        course = await generateCourse({
          themes, days, language: i18n.language?.slice(0,2) || 'en', extraRequest: extra,
        })
      } catch {
        course = getMockCourse({ themes, days, language: i18n.language?.slice(0,2) || 'en' })
      }
      navigate('/result', { state: { course, themes, days } })
    } catch (err) {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0D1120] px-6 py-10 max-w-2xl mx-auto">

      {/* Header */}
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="mb-10">
        <button onClick={() => navigate('/')} className="text-white/40 hover:text-white text-sm mb-6 flex items-center gap-2 transition-colors">
          ← Back
        </button>
        <h2 className="font-display text-4xl font-black text-white">
          Plan Your<br/>
          <span className="gradient-text">Seoul Trip</span>
        </h2>
      </motion.div>

      {/* Theme selector */}
      <motion.section
        initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
        className="mb-8"
      >
        <h3 className="text-white/50 uppercase tracking-widest text-xs mb-4">{t('step_theme')}</h3>
        <div className="grid grid-cols-4 gap-3">
          {THEMES.map(th => (
            <button
              key={th.id}
              onClick={() => toggleTheme(th.id)}
              className={`glass rounded-xl p-3 flex flex-col items-center gap-1.5 transition-all duration-200 ${
                themes.includes(th.id)
                  ? 'ring-2 ring-teal bg-teal/10'
                  : 'hover:bg-white/5'
              }`}
            >
              <span className="text-2xl">{th.icon}</span>
              <span className="text-[11px] text-white/70 text-center leading-tight">
                {t(th.labelKey)}
              </span>
            </button>
          ))}
        </div>
      </motion.section>

      {/* Days slider */}
      <motion.section
        initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
        className="mb-8"
      >
        <h3 className="text-white/50 uppercase tracking-widest text-xs mb-4">{t('step_days')}</h3>
        <div className="flex items-center gap-5">
          {[1,2,3].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`w-16 h-16 rounded-2xl font-bold text-xl transition-all duration-200 ${
                days === d
                  ? 'bg-teal text-navy scale-105 glow-teal'
                  : 'glass text-white/60 hover:text-white'
              }`}
            >
              {d}
            </button>
          ))}
          <span className="text-white/40 text-sm">days</span>
        </div>
      </motion.section>

      {/* Voice / extra input */}
      <motion.section
        initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
        className="mb-10"
      >
        <h3 className="text-white/50 uppercase tracking-widest text-xs mb-4">
          {t('cta_voice')} (optional)
        </h3>
        <div className="flex gap-3">
          <input
            value={extra}
            onChange={e => setExtra(e.target.value)}
            placeholder="e.g. I have a baby stroller / avoid spicy food / budget traveler"
            className="flex-1 glass rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-teal"
          />
          <button
            onClick={handleVoice}
            className={`glass rounded-xl px-4 transition-all ${
              isListening ? 'ring-2 ring-coral text-coral animate-pulse' : 'text-white/50 hover:text-white'
            }`}
            title={t('cta_voice')}
          >
            {isListening ? '⏹' : '🎤'}
          </button>
        </div>
        {isListening && (
          <p className="text-coral text-xs mt-2 animate-pulse">Listening... speak now</p>
        )}
      </motion.section>

      {/* Generate button */}
      <motion.button
        initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.4 }}
        onClick={handleGenerate}
        disabled={loading}
        whileHover={!loading ? { scale:1.02 } : {}}
        whileTap={!loading ? { scale:0.98 } : {}}
        className="w-full bg-teal hover:bg-teal/80 disabled:opacity-50 text-navy font-bold text-lg py-4 rounded-2xl glow-teal transition-all duration-200"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-3">
            <span className="w-5 h-5 border-2 border-navy border-t-transparent rounded-full animate-spin" />
            {t('generating')}
          </span>
        ) : (
          t('step_generate') + ' →'
        )}
      </motion.button>
    </div>
  )
}
