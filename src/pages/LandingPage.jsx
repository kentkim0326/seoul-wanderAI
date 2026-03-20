import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import i18n from '../lib/i18n'

const LANGS = [
  { code:'en', label:'English',  flag:'EN', color:'#0052B4' },
  { code:'zh', label:'中文',     flag:'ZH', color:'#DE2910' },
  { code:'ja', label:'日本語',   flag:'JP', color:'#BC002D' },
  { code:'es', label:'Español',  flag:'ES', color:'#AA151B' },
  { code:'fr', label:'Français', flag:'FR', color:'#0055A4' },
]

export default function LandingPage() {
  const { t }      = useTranslation()
  const navigate   = useNavigate()
  const [selected, setSelected] = useState(i18n.language?.slice(0,2) || 'en')

  function handleStart() {
    i18n.changeLanguage(selected)
    navigate('/plan')
  }

  return (
    <div className="min-h-screen bg-[#0D1120] flex flex-col items-center justify-center px-6 relative overflow-hidden">

      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-teal/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-coral/10 blur-3xl pointer-events-none" />

      {/* Logo */}
      <motion.div
        initial={{ opacity:0, y:-20 }}
        animate={{ opacity:1, y:0 }}
        transition={{ duration:0.6 }}
        className="text-center mb-10"
      >
        <h1 className="font-display text-6xl md:text-8xl font-black gradient-text leading-tight">
          Seoul<br/>Wander
        </h1>
        <p className="mt-4 text-white/60 text-lg font-body">
          {t('hero_sub')}
        </p>
      </motion.div>

      {/* Language selector */}
      <motion.div
        initial={{ opacity:0, y:20 }}
        animate={{ opacity:1, y:0 }}
        transition={{ duration:0.6, delay:0.2 }}
        className="glass rounded-2xl p-6 w-full max-w-md mb-8"
      >
        <p className="text-white/50 text-sm font-body mb-4 text-center uppercase tracking-widest">
          {t('step_lang')}
        </p>
        <div className="grid grid-cols-5 gap-2">
          {LANGS.map(l => (
            <button
              key={l.code}
              onClick={() => setSelected(l.code)}
              className={`flex flex-col items-center gap-1 py-3 rounded-xl transition-all duration-200 ${
                selected === l.code
                  ? 'ring-2 ring-teal scale-105'
                  : 'hover:bg-white/5'
              }`}
            >
              <span
                className="w-10 h-7 rounded flex items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: l.color }}
              >
                {l.flag}
              </span>
              <span className="text-[11px] text-white/60">{l.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.button
        initial={{ opacity:0, scale:0.9 }}
        animate={{ opacity:1, scale:1 }}
        transition={{ duration:0.4, delay:0.4 }}
        whileHover={{ scale:1.04 }}
        whileTap={{ scale:0.97 }}
        onClick={handleStart}
        className="bg-teal hover:bg-teal/80 text-navy font-bold text-lg px-12 py-4 rounded-2xl glow-teal transition-all duration-200"
      >
        {t('cta_start')} →
      </motion.button>

      {/* Badge */}
      <motion.p
        initial={{ opacity:0 }}
        animate={{ opacity:1 }}
        transition={{ delay:0.7 }}
        className="mt-6 text-white/30 text-xs text-center"
      >
        Powered by Seoul Open Data × GPT-4o
      </motion.p>
    </div>
  )
}
