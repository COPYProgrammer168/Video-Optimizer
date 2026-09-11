'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Video, Settings, BarChart3, Zap, Cpu, AlertTriangle, X } from 'lucide-react'
import Background3D from '@/components/Background3D'
import Dropzone from '@/components/Dropzone'
import Controls from '@/components/Controls'
import ComparisonTable from '@/components/ComparisonTable'
import { optimizeVideo, VideoMetadata, OptimizationParams, isMobileDevice } from '@/lib/ffmpeg'

type Step = 'upload' | 'configure' | 'processing' | 'result'

export default function Home() {
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null)
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null)
  const [outputName, setOutputName] = useState('')
  const [progress, setProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [targetFps, setTargetFps] = useState(60)
  const [targetWidth, setTargetWidth] = useState(1920)
  const [targetHeight, setTargetHeight] = useState(1080)
  const [crf, setCrf] = useState(22)
  const [preset, setPreset] = useState('ultrafast')
  const [mobileWarningDismissed, setMobileWarningDismissed] = useState(false)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const handleFileSelected = useCallback((f: File, meta: VideoMetadata) => {
    setFile(f)
    setMetadata(meta)
    setOutputBlob(null)
    setProgress(0)
    setStep('configure')
  }, [])

  const handleClear = useCallback(() => {
    setFile(null)
    setMetadata(null)
    setOutputBlob(null)
    setProgress(0)
    setStep('upload')
  }, [])

  const handleOptimize = useCallback(async (params: OptimizationParams) => {
    if (!file) return

    setTargetFps(params.targetFps)
    setTargetWidth(params.width)
    setTargetHeight(params.height)
    setCrf(params.crf)
    setPreset(params.preset)
    setIsProcessing(true)
    setStep('processing')
    setProgress(0)

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
    }

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressIntervalRef.current!)
          return prev
        }
        return prev + Math.random() * 5 + 1
      })
    }, 300)

    try {
      const result = await optimizeVideo(file, params, (pct) => {
        setProgress(pct)
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current)
        }
      })

      setOutputBlob(result.outputBlob)
      setOutputName(result.outputName)
      setProgress(100)
      setStep('result')
    } catch (err) {
      console.error('Optimization failed:', err)
      setStep('upload')
    } finally {
      setIsProcessing(false)
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [file])

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [])

  const isMobile = isMobileDevice()

  return (
    <div className="relative min-h-screen">
      <Background3D />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4 data-stream">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-400 text-xs font-san uppercase tracking-wider">Client-Side Processing</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-display gradient-text mb-3 neon-text">
            Video Optimizer
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto font-body">
            Browser-side video optimization with FFmpeg WebAssembly. No uploads, no backend, pure privacy.
          </p>
        </motion.header>

        {/* Mobile Warning */}
        <AnimatePresence>
          {isMobile && !mobileWarningDismissed && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mobile-warning p-4 mb-6 flex items-start gap-3"
            >
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-amber-300 text-sm font-medium">Mobile Device Detected</p>
                <p className="text-amber-400/70 text-xs mt-1">
                  Large files (&gt;100MB) may process slowly. For best results, use a desktop browser.
                </p>
              </div>
              <button
                onClick={() => setMobileWarningDismissed(true)}
                className="text-amber-400/50 hover:text-amber-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Dropzone & Controls */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              {step === 'upload' && (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Dropzone
                    onFileSelected={handleFileSelected}
                    onClear={handleClear}
                    selectedFile={file}
                    metadata={metadata}
                  />
                </motion.div>
              )}

              {step === 'configure' && (
                <motion.div
                  key="configure"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <Dropzone
                    onFileSelected={handleFileSelected}
                    onClear={handleClear}
                    selectedFile={file}
                    metadata={metadata}
                  />
                  <Controls
                    onOptimize={handleOptimize}
                    isProcessing={isProcessing}
                  />
                </motion.div>
              )}

              {step === 'processing' && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass-card gradient-border p-8 text-center"
                >
                  <div className="relative w-32 h-32 mx-auto mb-6">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        fill="none"
                        stroke="rgba(34,211,238,0.1)"
                        strokeWidth="8"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        fill="none"
                        stroke="url(#progressGradient)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 50}`}
                        strokeDashoffset={`${2 * Math.PI * 50 * (1 - progress / 100)}`}
                        className="progress-ring-circle"
                      />
                      <defs>
                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#22D3EE" />
                          <stop offset="100%" stopColor="#818CF8" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-cyan-400">{Math.round(progress)}%</span>
                      <span className="text-xs text-slate-500 mt-1 font-body">Processing</span>
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm font-body">
                    Optimizing with {preset} preset • {targetFps} FPS • CRF {crf}
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-emerald-400 text-xs font-mono font-body">Running in browser</span>
                  </div>
                </motion.div>
              )}

              {step === 'result' && outputBlob && metadata && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-6"
                >
                  <Dropzone
                    onFileSelected={handleFileSelected}
                    onClear={handleClear}
                    selectedFile={file}
                    metadata={metadata}
                  />
                  <ComparisonTable
                    before={metadata}
                    afterBlob={outputBlob}
                    afterName={outputName}
                    targetFps={targetFps}
                    targetWidth={targetWidth}
                    targetHeight={targetHeight}
                    crf={crf}
                    preset={preset}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column - Info Panel */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-semibold font-display text-slate-200">How It Works</h3>
              </div>
              <ol className="space-y-3 text-sm text-slate-400">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                  <span className="text-sm text-slate-400 font-body">Upload or drag your video file into the dropzone</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                  <span className="text-sm text-slate-400 font-body">Select optimization presets or fine-tune CRF, FPS, and encoder settings</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                  <span className="text-sm text-slate-400 font-body">FFmpeg WebAssembly processes everything locally in your browser</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</span>
                  <span className="text-sm text-slate-400 font-body">Download your optimized video — no data leaves your device</span>
                </li>
              </ol>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="glass-card p-6 border-emerald-500/20"
            >
              <div className="flex items-center gap-3 mb-3">
                <Zap className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-semibold font-display text-slate-200">Privacy First</h3>
              </div>
<p className="text-sm text-slate-400 font-body">
                 All video processing happens entirely in your browser. Your files are never uploaded to any server. We don&apos;t collect, store, or transmit your data.
               </p>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-12 pb-8"
        >
          <p className="text-slate-600 text-xs font-body">
            Video Optimizer — Built with Next.js, React Three Fiber, Framer Motion, and @ffmpeg/ffmpeg
          </p>
        </motion.footer>
      </div>
    </div>
  )
}