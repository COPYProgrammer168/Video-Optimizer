'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileVideo, X, AlertTriangle, CheckCircle } from 'lucide-react'
import { extractMetadata, VideoMetadata, isMobileSizeLimitExceeded } from '@/lib/ffmpeg'

interface DropzoneProps {
  onFileSelected: (file: File, metadata: VideoMetadata) => void
  onClear: () => void
  selectedFile: File | null
  metadata: VideoMetadata | null
}

export default function Dropzone({ onFileSelected, onClear, selectedFile, metadata }: DropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm', 'video/x-flv', 'video/x-ms-wmv']
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp4|mov|avi|mkv|webm|flv|wmv)$/i)) {
      return 'Unsupported file format. Please use MP4, MOV, AVI, MKV, WebM, FLV, or WMV.'
    }
    if (file.size > 2 * 1024 * 1024 * 1024) {
      return 'File size exceeds 2GB limit.'
    }
    return null
  }

  const handleFile = useCallback(async (file: File) => {
    setError(null)
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsLoading(true)
    try {
      const meta = await extractMetadata(file)
      onFileSelected(file, meta)
    } catch (err) {
      setError('Failed to read video metadata. Please try another file.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [onFileSelected])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const isMobileWarning = metadata ? isMobileSizeLimitExceeded(metadata.size) : false

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {!selectedFile ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
            className={`
              relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer
              transition-all duration-300 ease-out
              ${isDragOver
                ? 'border-cyan-400 bg-cyan-400/10 dropzone-active'
                : 'border-slate-600 bg-slate-800/30 hover:border-cyan-500/50 hover:bg-slate-800/50'
              }
              ${isLoading ? 'opacity-60 pointer-events-none' : ''}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleInputChange}
              className="hidden"
            />
            <motion.div
              animate={isDragOver ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="flex flex-col items-center gap-4"
            >
              <div className={`
                w-20 h-20 rounded-full flex items-center justify-center
                ${isDragOver ? 'bg-cyan-400/20' : 'bg-slate-700/50'}
                transition-colors duration-300
              `}>
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  >
                    <FileVideo className="w-8 h-8 text-cyan-400" />
                  </motion.div>
                ) : (
                  <Upload className={`w-8 h-8 ${isDragOver ? 'text-cyan-400' : 'text-slate-400'}`} />
                )}
              </div>
              <div>
                <p className={`text-lg font-medium font-body ${isDragOver ? 'text-cyan-400' : 'text-slate-300'}`}>
                  {isLoading ? 'Analyzing video...' : 'Drop your video here'}
                </p>
                <p className="text-sm text-slate-500 mt-1 font-body">
                  or click to browse — MP4, MOV, AVI, MKV, WebM
                </p>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="metadata"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="glass-card gradient-border p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
<span className="font-medium font-body text-slate-200 truncate max-w-[200px]">
                    {metadata?.fileName}
                  </span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onClear() }}
                className="p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-slate-500 text-xs uppercase tracking-wider">Format</p>
                <p className="text-cyan-400 font-mono">{metadata?.format}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-slate-500 text-xs uppercase tracking-wider">Size</p>
                <p className="text-indigo-400 font-mono">{metadata?.sizeMB} MB</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-slate-500 text-xs uppercase tracking-wider">Resolution</p>
                <p className="text-emerald-400 font-mono">{metadata?.resolution}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-slate-500 text-xs uppercase tracking-wider">Bitrate</p>
                <p className="text-cyan-400 font-mono">{metadata?.bitrate}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-slate-500 text-xs uppercase tracking-wider">Duration</p>
                <p className="text-indigo-400 font-mono">{metadata?.duration}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-slate-500 text-xs uppercase tracking-wider">FPS</p>
                <p className="text-emerald-400 font-mono">{metadata?.fps}</p>
              </div>
            </div>

            <AnimatePresence>
              {isMobileWarning && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mobile-warning p-4 flex items-start gap-3"
                >
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
<p className="text-amber-300 text-sm font-medium font-body">Mobile Device Detected</p>
                      <p className="text-amber-400/70 text-xs mt-1 font-body">
                      Files over 100MB may process slowly on mobile. For unlimited sizes and faster processing, we recommend using a desktop browser.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3"
          >
            <X className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-300 text-sm">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}