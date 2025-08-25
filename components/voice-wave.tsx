"use client"

import { useEffect, useRef, useState } from "react"

interface VoiceWaveProps {
  isActive?: boolean
  isProcessing?: boolean
  audioStream?: MediaStream | null
}

export default function VoiceWave({ isActive = false, isProcessing = false, audioStream = null }: VoiceWaveProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array(32))

  // Initialize audio context and analyzer when audio stream is available
  useEffect(() => {
    if (audioStream && isActive) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
        analyserRef.current = audioContextRef.current.createAnalyser()
        
        // Configure analyzer for better frequency resolution
        analyserRef.current.fftSize = 256
        analyserRef.current.smoothingTimeConstant = 0.8
        
        sourceRef.current = audioContextRef.current.createMediaStreamSource(audioStream)
        sourceRef.current.connect(analyserRef.current)
        
        const bufferLength = analyserRef.current.frequencyBinCount
        setFrequencyData(new Uint8Array(bufferLength))
      } catch (error) {
        console.error('Error setting up audio analysis:', error)
      }
    }

    return () => {
      if (animationRef.current !== undefined) {
        cancelAnimationFrame(animationRef.current)
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect()
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close()
      }
    }
  }, [audioStream, isActive])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    let time = 0

    const animate = () => {
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      const centerY = height / 2

      // Clear canvas
      ctx.clearRect(0, 0, width, height)

      // Get real-time frequency data if available
      let realFrequencyData: Uint8Array | null = null
      if (analyserRef.current && isActive) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
        analyserRef.current.getByteFrequencyData(dataArray)
        realFrequencyData = dataArray
      }

      const baseAmplitude = isActive ? 40 : isProcessing ? 25 : 15
      const speedMultiplier = isActive ? 2 : isProcessing ? 1.5 : 1

      // Create gradient
      const gradient = ctx.createLinearGradient(0, 0, width, 0)
      if (isActive) {
        gradient.addColorStop(0, "rgba(34, 197, 94, 0.8)") // green-500 for recording
        gradient.addColorStop(0.5, "rgba(59, 130, 246, 0.8)") // blue-500
        gradient.addColorStop(1, "rgba(34, 197, 94, 0.8)") // green-500
      } else if (isProcessing) {
        gradient.addColorStop(0, "rgba(251, 191, 36, 0.8)") // amber-400 for processing
        gradient.addColorStop(0.5, "rgba(245, 158, 11, 0.8)") // amber-500
        gradient.addColorStop(1, "rgba(251, 191, 36, 0.8)") // amber-400
      } else {
        gradient.addColorStop(0, "rgba(59, 130, 246, 0.8)") // blue-500 default
        gradient.addColorStop(0.3, "rgba(147, 51, 234, 0.8)") // purple-600
        gradient.addColorStop(0.7, "rgba(168, 85, 247, 0.8)") // purple-500
        gradient.addColorStop(1, "rgba(59, 130, 246, 0.8)") // blue-500
      }

      if (realFrequencyData && isActive) {
        // Real-time frequency visualization with center peak distribution
        const barCount = 32
        const barWidth = width / barCount
        
        // Create frequency distribution that peaks in center
        for (let i = 0; i < barCount; i++) {
          const frequencyIndex = Math.floor((i / barCount) * realFrequencyData.length)
          const amplitude = (realFrequencyData[frequencyIndex] / 255) * baseAmplitude
          
          // Apply center-peak distribution: higher amplitude in center, lower at edges
          const centerDistance = Math.abs(i - barCount / 2) / (barCount / 2)
          const centerPeakMultiplier = 1 - Math.pow(centerDistance, 2) // Quadratic falloff from center
          const finalAmplitude = amplitude * (0.3 + 0.7 * centerPeakMultiplier)
          
          const x = i * barWidth + barWidth / 2
          
          // Draw frequency bars
          ctx.beginPath()
          ctx.fillStyle = gradient
          ctx.globalAlpha = 0.8
          
          // Top bar
          ctx.fillRect(x - barWidth / 4, centerY - finalAmplitude, barWidth / 2, finalAmplitude)
          // Bottom bar (mirrored)
          ctx.fillRect(x - barWidth / 4, centerY, barWidth / 2, finalAmplitude)
          
          // Add glowing effect for active bars
          if (finalAmplitude > 5) {
            ctx.globalAlpha = 0.3
            ctx.fillRect(x - barWidth / 3, centerY - finalAmplitude - 2, barWidth * 2/3, finalAmplitude + 4)
            ctx.fillRect(x - barWidth / 3, centerY - 2, barWidth * 2/3, finalAmplitude + 4)
          }
        }
        
        // Add center line with pulsing effect based on overall volume
        const averageAmplitude = realFrequencyData.reduce((a, b) => a + b, 0) / realFrequencyData.length
        const pulseIntensity = (averageAmplitude / 255) * 0.5 + 0.5
        
        ctx.globalAlpha = pulseIntensity
        ctx.strokeStyle = gradient
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(0, centerY)
        ctx.lineTo(width, centerY)
        ctx.stroke()
        
      } else {
        // Fallback animated waves when no real audio data
        for (let layer = 0; layer < 3; layer++) {
          ctx.beginPath()

          const amplitude = baseAmplitude + layer * 15
          const frequency = 0.02 + layer * 0.005
          const phase = time * 0.003 * speedMultiplier + (layer * Math.PI) / 3
          const opacity = 0.6 - layer * 0.15

          // Create wave path with center-peak distribution
          for (let x = 0; x <= width; x += 2) {
            const centerDistance = Math.abs(x - width / 2) / (width / 2)
            const centerPeakMultiplier = 1 - Math.pow(centerDistance, 1.5) // Center peak effect
            
            const y1 = centerY + Math.sin(x * frequency + phase) * amplitude * Math.sin(time * 0.002 * speedMultiplier) * centerPeakMultiplier
            const y2 = centerY + Math.sin(x * frequency * 1.5 + phase + Math.PI / 4) * amplitude * 0.7 * Math.cos(time * 0.0015 * speedMultiplier) * centerPeakMultiplier
            const y3 = centerY + Math.sin(x * frequency * 0.8 + phase + Math.PI / 2) * amplitude * 0.5 * Math.sin(time * 0.0025 * speedMultiplier) * centerPeakMultiplier

            const finalY = (y1 + y2 + y3) / 3

            if (x === 0) {
              ctx.moveTo(x, finalY)
            } else {
              ctx.lineTo(x, finalY)
            }
          }

          // Create mirror wave for bottom
          for (let x = width; x >= 0; x -= 2) {
            const centerDistance = Math.abs(x - width / 2) / (width / 2)
            const centerPeakMultiplier = 1 - Math.pow(centerDistance, 1.5)
            
            const y1 = centerY - Math.sin(x * frequency + phase) * amplitude * Math.sin(time * 0.002 * speedMultiplier) * centerPeakMultiplier
            const y2 = centerY - Math.sin(x * frequency * 1.5 + phase + Math.PI / 4) * amplitude * 0.7 * Math.cos(time * 0.0015 * speedMultiplier) * centerPeakMultiplier
            const y3 = centerY - Math.sin(x * frequency * 0.8 + phase + Math.PI / 2) * amplitude * 0.5 * Math.sin(time * 0.0025 * speedMultiplier) * centerPeakMultiplier

            const finalY = (y1 + y2 + y3) / 3
            ctx.lineTo(x, finalY)
          }

          ctx.closePath()

          // Apply gradient with opacity
          ctx.globalAlpha = opacity
          ctx.fillStyle = gradient
          ctx.fill()
        }

        // Draw center line
        ctx.globalAlpha = 0.3
        ctx.strokeStyle = gradient
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(0, centerY)
        ctx.lineTo(width, centerY)
        ctx.stroke()
      }

      ctx.globalAlpha = 1
      time += 1
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isActive, isProcessing, audioStream])

  return (
    <div className="w-full max-w-2xl mx-auto">
      <canvas ref={canvasRef} className="w-full h-32 rounded-lg" style={{ width: "100%", height: "128px" }} />
    </div>
  )
}
