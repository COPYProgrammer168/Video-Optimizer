import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Video Optimizer | 3D Futuristic Web App',
  description: 'Browser-side video optimization with FFmpeg WebAssembly',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0B0F17] text-slate-200 antialiased font-body crt-flicker">
        {children}
      </body>
    </html>
  )
}