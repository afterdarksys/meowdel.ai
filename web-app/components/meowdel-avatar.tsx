"use client"

import { useState, useEffect } from 'react'

export function MeowdelAvatar() {
  const [state, setState] = useState<'idle' | 'sleeping' | 'happy' | 'thinking'>('idle')
  const [isHovered, setIsHovered] = useState(false)

  // Randomly change state when idle
  useEffect(() => {
    if (isHovered) return

    const interval = setInterval(() => {
      const rand = Math.random()
      if (rand > 0.8) {
         setState('sleeping')
         setTimeout(() => setState('idle'), 5000)
      } else if (rand > 0.6) {
         setState('thinking')
         setTimeout(() => setState('idle'), 3000)
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [isHovered])

  return (
    <div 
       className="fixed bottom-6 right-6 z-[100] cursor-pointer"
       onMouseEnter={() => {
         setIsHovered(true)
         setState('happy')
       }}
       onMouseLeave={() => {
         setIsHovered(false)
         setState('idle')
       }}
       title="Meowdel the Assistant"
    >
       <div className="relative group">
          {/* Tooltip bubble */}
          <div className={`absolute -top-12 right-0 bg-popover text-popover-foreground text-xs font-semibold px-3 py-1.5 rounded-2xl rounded-br-none border shadow-lg transition-all duration-300 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 whitespace-nowrap`}>
             {state === 'happy' && 'Purrrrr... Need help?'}
             {state === 'sleeping' && 'Zzz...'}
             {state === 'thinking' && 'Processing data...'}
             {state === 'idle' && 'Meow!'}
          </div>

          {/* Avatar Base */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-[0_0_20px_rgba(99,102,241,0.4)] flex items-center justify-center relative overflow-hidden transition-transform duration-300 hover:scale-110">
             
             {/* Dynamic Cat CSS Drawing inside */}
             <div className="relative w-10 h-10 mt-2">
                {/* Ears */}
                <div className={`absolute top-0 w-3 h-3 bg-white rounded-tl-full ${state === 'sleeping' ? 'rotate-[-60deg] top-2' : ''} transition-all duration-300`} style={{ left: '10%' }}></div>
                <div className={`absolute top-0 w-3 h-3 bg-white rounded-tr-full ${state === 'sleeping' ? 'rotate-[60deg] top-2' : ''} transition-all duration-300`} style={{ right: '10%' }}></div>
                
                {/* Face */}
                <div className="absolute bottom-0 w-full h-[80%] bg-white rounded-t-[40%] rounded-b-[45%] flex flex-col items-center justify-center pt-2">
                   
                   {/* Eyes */}
                   <div className="flex gap-2 w-full justify-center px-1">
                      {state === 'sleeping' || state === 'happy' ? (
                         <>
                           <div className="w-2.5 h-1 border-b-[2px] border-slate-800 rounded-full mt-1"></div>
                           <div className="w-2.5 h-1 border-b-[2px] border-slate-800 rounded-full mt-1"></div>
                         </>
                      ) : state === 'thinking' ? (
                         <>
                           <div className="w-2 w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                           <div className="w-2 w-2 h-2 rounded-full bg-emerald-400 animate-pulse delay-75"></div>
                         </>
                      ) : (
                         <>
                           <div className="w-2 h-2 rounded-full bg-slate-800 animate-blink"></div>
                           <div className="w-2 h-2 rounded-full bg-slate-800 animate-blink"></div>
                         </>
                      )}
                   </div>
                   
                   {/* Nose */}
                   <div className={`w-1.5 h-1 rounded-full bg-pink-400 mt-1 ${state === 'happy' ? 'animate-bounce' : ''}`}></div>
                </div>
             </div>
          </div>
       </div>
    </div>
  )
}
