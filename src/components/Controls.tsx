'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sliders, Monitor, Zap } from 'lucide-react'
import { OptimizationParams } from '@/lib/ffmpeg'

interface ControlsProps {
  onOptimize: (params: OptimizationParams) => void
  isProcessing: boolean
}

const socialPreset = { width: 1080, height: 1920, targetFps: 60, crf: 22, preset: 'ultrafast', pixFmt: 'yuv420p' }
const balancedPreset = { width: 1920, height: 1080, targetFps: 60, crf: 22, preset: 'fast', pixFmt: 'yuv420p' }
const maxCompressionPreset = { width: 1920, height: 1080, targetFps: 60, crf: 28, preset: 'ultrafast', pixFmt: 'yuv420p' }

export default function Controls({ onOptimize, isProcessing }: ControlsProps) {
  const [targetFps, setTargetFps] = useState(60)
  const [crf, setCrf] = useState(22)
  const [preset, setPreset] = useState('ultrafast')
  const [activePreset, setActivePreset] = useState<string | null>(null)

  const applyPreset = (p: typeof socialPreset, name: string) => {
    setTargetFps(p.targetFps)
    setCrf(p.crf)
    setPreset(p.preset)
    setActivePreset(name)
    onOptimize({
      targetFps: p.targetFps,
      width: p.width,
      height: p.height,
      crf: p.crf,
      preset: p.preset,
      pixFmt: p.pixFmt,
    })
  }

  const handleCustomOptimize = () => {
    setActivePreset(null)
    onOptimize({ targetFps, crf, preset, width: 1920, height: 1080, pixFmt: 'yuv420p' })
  }

  const presetButtons = [
    { label: 'TikTok / Shorts / Reels', config: socialPreset, name: 'social' },
    { label: 'Balanced Quality', config: balancedPreset, name: 'balanced' },
    { label: 'Maximum Compression', config: maxCompressionPreset, name: 'compression' },
  ]

  return (
    <div className="space-y-6">
      <div className="glass-card gradient-border p-6">
        <div className="flex items-center gap-3 mb-5">
          <Sliders className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold font-display text-slate-200">Optimization Controls</h3>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Target Framerate</label>
            <div className="flex gap-3">
              {[30, 60].map((fps) => (
                <motion.button
                  key={fps}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => {
                    setTargetFps(fps)
                    if (!activePreset) onOptimize({ targetFps: fps, crf, preset, width: 1920, height: 1080, pixFmt: 'yuv420p' })
                  }}
                  className={`
                    flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                    ${targetFps === fps
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                      : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:border-slate-600'
                    }
                  `}
                >
                  {fps} FPS
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-2 block">Social Presets</label>
            <div className="grid grid-cols-1 gap-2">
              {presetButtons.map(({ label, config, name }) => (
                <motion.button
                  key={name}
                  whileTap={{ scale: 0.98 }}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => applyPreset(config, name)}
                  className={`
                    w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-200
                    ${activePreset === name
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                      : 'bg-slate-800/50 text-slate-300 border border-slate-700 hover:border-slate-600'
                    }
                  `}
                >
                  {label}
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-slate-400">CRF Quality</label>
              <span className="text-sm font-mono text-cyan-400">{crf}</span>
            </div>
            <input
              type="range"
              min="18"
              max="32"
              value={crf}
              onChange={(e) => {
                const val = parseInt(e.target.value)
                setCrf(val)
                if (!activePreset) onOptimize({ targetFps, crf: val, preset, width: 1920, height: 1080, pixFmt: 'yuv420p' })
              }}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-600 mt-1">
              <span>Higher Quality (18)</span>
              <span>Smaller Size (32)</span>
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-2 block">Encoder Preset</label>
            <div className="flex gap-2">
              {['ultrafast', 'superfast', 'veryfast', 'faster', 'fast', 'medium'].map((p) => (
                <motion.button
                  key={p}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => {
                    setPreset(p)
                    if (!activePreset) onOptimize({ targetFps, crf, preset: p, width: 1920, height: 1080, pixFmt: 'yuv420p' })
                  }}
                  className={`
                    px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-200
                    ${preset === p
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50'
                      : 'bg-slate-800/50 text-slate-500 border border-slate-700 hover:border-slate-600'
                    }
                  `}
                >
                  {p}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        whileHover={{ scale: 1.01 }}
        onClick={handleCustomOptimize}
        disabled={isProcessing}
        className="
          btn-glow-cyan w-full py-4 rounded-xl text-white font-semibold text-lg
          flex items-center justify-center gap-3
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        <Zap className="w-5 h-5" />
        {isProcessing ? 'Processing...' : 'Optimize Video'}
      </motion.button>
    </div>
  )
}