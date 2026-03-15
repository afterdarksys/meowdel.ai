'use client'

import { useEffect, useRef } from 'react'

export interface PurrAudioProps {
    isPurring: boolean
}

export function PurrAudio({ isPurring }: PurrAudioProps) {
    const audioCtxRef = useRef<AudioContext | null>(null)
    const oscillatorRef = useRef<OscillatorNode | null>(null)
    const gainNodeRef = useRef<GainNode | null>(null)

    useEffect(() => {
        // Initialize AudioContext only precisely when needed to comply with browser autoplay policies
        if (isPurring && !audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
            
            // Create a low frequency oscillator to simulate purring
            const osc = audioCtxRef.current.createOscillator()
            osc.type = 'sawtooth' // Sawtooth gives a jagged, motor-like rumble
            osc.frequency.setValueAtTime(25, audioCtxRef.current.currentTime) // 25Hz is typical cat purr frequency
            
            const gain = audioCtxRef.current.createGain()
            gain.gain.setValueAtTime(0, audioCtxRef.current.currentTime)
            
            // Add a slight tremolo (volume oscillation) to make it breathe
            const lfo = audioCtxRef.current.createOscillator()
            lfo.type = 'sine'
            lfo.frequency.setValueAtTime(5, audioCtxRef.current.currentTime) // 5Hz wobble
            
            const lfoGain = audioCtxRef.current.createGain()
            lfoGain.gain.setValueAtTime(0.5, audioCtxRef.current.currentTime)
            
            lfo.connect(lfoGain)
            lfoGain.connect(gain.gain) // Modulate the main volume
            
            osc.connect(gain)
            gain.connect(audioCtxRef.current.destination)
            
            osc.start()
            lfo.start()
            
            oscillatorRef.current = osc
            gainNodeRef.current = gain
        }

        if (isPurring && audioCtxRef.current && gainNodeRef.current) {
            // Fade in gently
            if (audioCtxRef.current.state === 'suspended') {
                audioCtxRef.current.resume()
            }
            gainNodeRef.current.gain.setTargetAtTime(0.15, audioCtxRef.current.currentTime, 0.5) // Max volume 0.15 to keep it subtle
        } else if (!isPurring && gainNodeRef.current && audioCtxRef.current) {
            // Fade out
            gainNodeRef.current.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.5)
        }

        return () => {
            // Cleanup on unmount
            if (oscillatorRef.current) {
                try {
                    oscillatorRef.current.stop()
                    oscillatorRef.current.disconnect()
                } catch (e) {}
            }
        }
    }, [isPurring])

    return null; // Invisible component
}
