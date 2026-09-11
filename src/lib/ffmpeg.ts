'use client'

import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL, fetchFile } from '@ffmpeg/util'

let ffmpegInstance: FFmpeg | null = null
let isLoading = false

const FFmpeg_CORE_URL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.js'
const FFmpeg_WASM_URL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.wasm'

export async function loadFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance && ffmpegInstance.loaded) {
    return ffmpegInstance
  }

  if (isLoading) {
    return new Promise((resolve, reject) => {
      const checkLoaded = setInterval(() => {
        if (ffmpegInstance && ffmpegInstance.loaded) {
          clearInterval(checkLoaded)
          resolve(ffmpegInstance)
        }
      }, 200)
    })
  }

  isLoading = true
  ffmpegInstance = new FFmpeg()

  ffmpegInstance.on('log', ({ message }) => {
    console.log('[FFmpeg]', message)
  })

  try {
    await ffmpegInstance.load({
      coreURL: await toBlobURL(FFmpeg_CORE_URL, 'text/javascript'),
      wasmURL: await toBlobURL(FFmpeg_WASM_URL, 'application/wasm'),
    })
    isLoading = false
    return ffmpegInstance
  } catch (error) {
    isLoading = false
    throw error
  }
}

export interface VideoMetadata {
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

export async function extractMetadata(file: File): Promise<VideoMetadata> {
  const ffmpeg = await loadFFmpeg()

  const inputName = `input_${Date.now()}${getFileExt(file.name)}`
  await ffmpeg.writeFile(inputName, await fetchFile(file))

  let probeLog = ''
  ffmpeg.on('log', ({ message, type }: { message: string; type: string }) => {
    if (type === 'fferr') {
      probeLog += message + '\n'
    }
  })

  await ffmpeg.exec(['-i', inputName])

  const metadata = parseFFmpegProbe(probeLog, file)

  await ffmpeg.deleteFile(inputName)

  return metadata
}

function getFileExt(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase()
  if (['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv'].includes(ext || '')) {
    return `.${ext}`
  }
  return '.mp4'
}

function parseFFmpegProbe(log: string, file: File): VideoMetadata {
  const durationMatch = log.match(/Duration:\s*(\d{2}):(\d{2}):(\d{2}\.\d{2})/)
  const bitrateMatch = log.match(/bitrate:\s*(\d+)\s*kb\/s/)
  const fpsMatch = log.match(/(\d+(?:\.\d+)?)\s*tbr/)
  const resolutionMatch = log.match(/(\d{3,5})x(\d{3,5})/)

  const duration = durationMatch
    ? `${durationMatch[1]}:${durationMatch[2]}:${durationMatch[3]}`
    : 'N/A'
  const bitrate = bitrateMatch ? `${bitrateMatch[1]} kbps` : 'N/A'
  const fps = fpsMatch ? parseFloat(fpsMatch[1]) : 30
  const width = resolutionMatch ? parseInt(resolutionMatch[1]) : 1920
  const height = resolutionMatch ? parseInt(resolutionMatch[2]) : 1080

  const sizeMB = (file.size / (1024 * 1024)).toFixed(2)
  const format = file.name.split('.').pop()?.toUpperCase() || 'MP4'

  return {
    fileName: file.name,
    format,
    size: file.size,
    sizeMB,
    resolution: `${width}x${height}`,
    width,
    height,
    bitrate,
    duration,
    fps,
  }
}

export interface OptimizationParams {
  targetFps: number
  width: number
  height: number
  crf: number
  preset: string
  pixFmt: string
}

export async function optimizeVideo(
  file: File,
  params: OptimizationParams,
  onProgress: (progress: number) => void
): Promise<{ outputBlob: Blob; outputName: string }> {
  const ffmpeg = await loadFFmpeg()

  const inputName = `input_${Date.now()}${getFileExt(file.name)}`
  const outputName = `output_${Date.now()}.mp4`

  await ffmpeg.writeFile(inputName, await fetchFile(file))

  const progressHandler = (event: { progress: number }) => {
    onProgress(Math.round(event.progress * 100))
  }
  ffmpeg.on('progress', progressHandler)

  const args = [
    '-i', inputName,
    '-r', String(params.targetFps),
    '-s', `${params.width}x${params.height}`,
    '-c:v', 'libx264',
    '-crf', String(params.crf),
    '-preset', params.preset,
    '-pix_fmt', params.pixFmt,
    '-y',
    outputName,
  ]

  await ffmpeg.exec(args)

  ffmpeg.off('progress', progressHandler)

  const outputData = await ffmpeg.readFile(outputName)
  const outputBlob = new Blob([outputData as BlobPart], { type: 'video/mp4' })

  await ffmpeg.deleteFile(inputName)
  await ffmpeg.deleteFile(outputName)

  return { outputBlob, outputName }
}

export function calculateBitrate(fileSizeBytes: number, durationSeconds: number): string {
  if (durationSeconds <= 0) return 'N/A'
  const bitrate = (fileSizeBytes * 8) / durationSeconds / 1000
  if (bitrate > 1000) {
    return `${(bitrate / 1000).toFixed(1)} Mbps`
  }
  return `${bitrate.toFixed(0)} kbps`
}

export function calculateFileSizeMB(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(2)
}

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  const ua = navigator.userAgent
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
}

export function isMobileSizeLimitExceeded(fileSize: number): boolean {
  return isMobileDevice() && fileSize > 100 * 1024 * 1024
}