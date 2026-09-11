'use client'

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, GitCompareArrows, Play, Pause, Maximize } from 'lucide-react'
import { calculateBitrate, calculateFileSizeMB } from '@/lib/ffmpeg'

interface BeforeData {
  fileName: string
  format: string
  size: number
  sizeMB: string
  resolution: string
  width: number
  height: number
  bitrate: string
  duration: string
  fps: number
}

interface ComparisonTableProps {
  before: BeforeData
  afterBlob: Blob
  afterName: string
  targetFps: number
  targetWidth: number
  targetHeight: number
  crf: number
  preset: string
}

export default function ComparisonTable({ before, afterBlob, afterName, targetFps, targetWidth, targetHeight, crf, preset }: ComparisonTableProps) {
  const [activeTab, setActiveTab] = useState<'table' | 'compare'>('table')
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const afterUrl = useMemo(() => URL.createObjectURL(afterBlob), [afterBlob])

  useEffect(() => {
    return () => { URL.revokeObjectURL(afterUrl) };
  }, [afterUrl])

  const afterSizeMB = calculateFileSizeMB(afterBlob.size)
  const beforeSizeNum = parseFloat(before.sizeMB)
  const afterSizeNum = parseFloat(afterSizeMB)
  const savedPercent = beforeSizeNum > 0 ? ((1 - afterSizeNum / beforeSizeNum) * 100).toFixed(1) : '0'
  const beforeDuration = parseFloat(before.duration.split(':')[0]) * 3600 + parseFloat(before.duration.split(':')[1]) * 60 + parseFloat(before.duration.split(':')[2])
  const afterBitrate = calculateBitrate(afterBlob.size, beforeDuration)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setSliderPosition(pct)
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.touches[0].clientX - rect.left
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setSliderPosition(pct)
  }, [isDragging])

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleDownload = useCallback(() => {
    const url = URL.createObjectURL(afterBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = afterName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [afterBlob, afterName])

  const metrics = [
    {
      label: 'File Size',
      before: `${before.sizeMB} MB`,
      after: `${afterSizeMB} MB`,
      afterHighlight: `${savedPercent}% Saved`,
      highlight: true,
    },
    {
      label: 'Resolution',
      before: `${before.width}x${before.height}`,
      after: `${targetWidth}x${targetHeight}`,
      afterHighlight: '',
      highlight: false,
    },
    {
      label: 'Framerate',
      before: `${before.fps} FPS`,
      after: `${targetFps} FPS`,
      afterHighlight: '',
      highlight: false,
    },
    {
      label: 'Video Bitrate',
      before: before.bitrate,
      after: afterBitrate,
      afterHighlight: '',
      highlight: false,
    },
    {
      label: 'Estimated Load',
      before: 'Slow',
      after: 'Ultra Fast',
      afterHighlight: 'Optimized',
      highlight: true,
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card gradient-border p-6 space-y-5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GitCompareArrows className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold font-display text-slate-200">Analytics & Comparison</h3>
        </div>
        <div className="flex gap-2">
          {(['table', 'compare'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
                ${activeTab === tab
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-slate-800/50 text-slate-500 border border-slate-700'
                }
              `}
            >
              {tab === 'table' ? 'Metrics' : 'Compare'}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'table' ? (
          <motion.div
            key="table"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden rounded-xl border border-slate-700/50"
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800/80">
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Metric</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Before</th>
                  <th className="text-left py-3 px-4 text-emerald-400 font-medium">After</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((m, i) => (
                  <motion.tr
                    key={m.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="border-t border-slate-700/30"
                  >
                    <td className="py-3 px-4 text-slate-400">{m.label}</td>
                    <td className="py-3 px-4 text-slate-300 font-mono">{m.before}</td>
                    <td className={`py-3 px-4 font-mono ${m.highlight ? 'text-emerald-400 font-semibold' : 'text-slate-300'}`}>
                      {m.after}
                      {m.afterHighlight && (
                        <span className="ml-2 text-xs text-emerald-400/70">({m.afterHighlight})</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        ) : (
          <motion.div
            key="compare"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <div
               ref={containerRef}
               className="relative w-full rounded-xl overflow-hidden border border-slate-700/50 bg-black"
               style={{ aspectRatio: '16/9' }}
               onMouseMove={handleMouseMove}
               onMouseUp={handleMouseUp}
               onMouseLeave={handleMouseUp}
               onTouchMove={handleTouchMove}
               onTouchEnd={handleTouchEnd}
             >
               <div className="absolute inset-0">
                 <video
                   ref={videoRef}
                   src={afterUrl}
                   className="w-full h-full object-contain"
                   muted
                   playsInline
                   preload="auto"
                 />
                 <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
                   <span className="text-slate-400 text-sm">After Optimization</span>
                 </div>
               </div>
               <div
                 className="absolute inset-y-0 overflow-hidden"
                 style={{ width: `${sliderPosition}%` }}
               >
                 <div className="absolute inset-0 bg-slate-900/70 flex items-center justify-center">
                   <span className="text-slate-500 text-sm">Original</span>
                 </div>
               </div>
               <div
                 className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] z-10 cursor-ew-resize"
                 style={{ left: `${sliderPosition}%` }}
                 onMouseDown={() => setIsDragging(true)}
                 onTouchStart={() => setIsDragging(true)}
               >
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-cyan-400 rounded-full flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing">
                   <span className="text-[10px] text-[#0B0F17] font-bold">⇔</span>
                 </div>
               </div>
             </div>
            <p className="text-xs text-slate-500 text-center font-body">Drag the slider to compare before/after</p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.97 }}
        whileHover={{ scale: 1.01 }}
        onClick={handleDownload}
        className="
          btn-glow-emerald w-full py-3.5 rounded-xl text-[#0B0F17] font-bold text-base
          flex items-center justify-center gap-2
        "
      >
        <Download className="w-5 h-5" />
        Download {targetFps} FPS Video
      </motion.button>
    </motion.div>
  )
}