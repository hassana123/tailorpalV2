'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import { Mic, X, Volume2, Sparkles, Command, MessageCircle, Zap, GripHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVoiceRecognition } from './hooks/use-voice-recognition'
import { useVoiceSynthesis } from './hooks/use-voice-synthesis'
//import { SILENCE_TIMEOUT_MS } from './constants'

type AssistantState = 'idle' | 'greeting' | 'instructing' | 'listening' | 'processing' | 'responding'

interface FloatingVoiceAssistantProps {
  shopId: string
}

export function FloatingVoiceAssistant({ shopId }: FloatingVoiceAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [state, setState] = useState<AssistantState>('idle')
  const [currentInstruction, setCurrentInstruction] = useState(0)
  const [transcript, setTranscript] = useState('')
  const [response, setResponse] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  
  const hasGreeted = useRef(false)
  const instructionTimer = useRef<NodeJS.Timeout | null>(null)
  const autoCloseTimer = useRef<NodeJS.Timeout | null>(null)
  const dragControls = useDragControls()
  const containerRef = useRef<HTMLDivElement>(null)

  const instructions = [
    {
      icon: <Mic className="w-4 h-4" />,
      text: "Speak naturally — I'm listening for your commands",
      color: "from-blue-400 to-cyan-400"
    },
    {
      icon: <Command className="w-4 h-4" />,
      text: "Try: 'Add customer', 'Create order', or 'Show orders'",
      color: "from-purple-400 to-pink-400"
    },
    {
      icon: <Zap className="w-4 h-4" />,
      text: "Pause for 2.5 seconds and I'll respond automatically",
      color: "from-amber-400 to-orange-400"
    },
    {
      icon: <MessageCircle className="w-4 h-4" />,
      text: "Say 'help' anytime to hear available commands",
      color: "from-emerald-400 to-teal-400"
    }
  ]

  const {
    isListening,
    isStarting,
    voiceError,
    speechSupported,
    interimTranscript,
    startListening,
    stopListening,
    clearSilenceTimer,
  } = useVoiceRecognition({
    autoSend: true,
    isSending: state === 'processing' || state === 'responding',
    onAutoSend: handleVoiceInput,
  })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // ✅ FIX OPTION 1: Drop the stale condition (simplest)
const { speak } = useVoiceSynthesis(true, () => {
  setTimeout(() => {
    setState('listening')
    setResponse('')
  }, 500)
})

  // Handle voice input received
  async function handleVoiceInput(text: string) {
    if (!text.trim()) return
    
    // CRITICAL: Stop listening while processing to prevent AI response being recorded
    stopListening()
    clearSilenceTimer()
    
    setState('processing')
    setTranscript(text)

    try {
      const res = await fetch('/api/voice/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, shopId }),
      })
      
      const data = await res.json()
      const reply = data?.reply || "I didn't catch that. Could you try again?"
      
      setResponse(reply)
      setState('responding')
      speak(reply)
    } catch (error) {
      const errorReply = "I'm having trouble connecting. Please try again."
      setResponse(errorReply)
      setState('responding')
      speak(errorReply)
    }
  }

  // Start the assistant flow
  const activateAssistant = useCallback(() => {
    setIsOpen(true)
    
    if (!hasGreeted.current) {
      // First time - show greeting then instructions
      setState('greeting')
      speak("Hello, welcome to TailorPal!")
      
      setTimeout(() => {
        setState('instructing')
        startInstructionCycle()
      }, 2000)
    } else {
      // Returning user - go straight to listening
      setState('listening')
      startListening()
    }
    
    hasGreeted.current = true
  }, [speak, startListening])

  // Cycle through instructions
  const startInstructionCycle = useCallback(() => {
    let index = 0
    setCurrentInstruction(index)
    
    instructionTimer.current = setInterval(() => {
      index += 1
      if (index >= instructions.length) {
        // Instructions done, start listening
        if (instructionTimer.current) clearInterval(instructionTimer.current)
        setState('listening')
        startListening()
      } else {
        setCurrentInstruction(index)
      }
    }, 3500) // Show each instruction for 3.5 seconds
  }, [instructions.length, startListening])

  // Close assistant
  const closeAssistant = useCallback(() => {
    stopListening()
    clearSilenceTimer()
    if (instructionTimer.current) clearInterval(instructionTimer.current)
    setIsOpen(false)
    setState('idle')
    setTranscript('')
    setResponse('')
  }, [stopListening, clearSilenceTimer])

  // Start listening when state changes to listening
  useEffect(() => {
    if (state === 'listening' && !isListening && !isStarting) {
      startListening()
    }
  }, [state, isListening, isStarting, startListening])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (instructionTimer.current) clearInterval(instructionTimer.current)
      if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current)
    }
  }, [])

  // Get orb color based on state
  const getOrbColor = () => {
    switch (state) {
      case 'greeting': return 'from-amber-400 to-orange-500'
      case 'instructing': return 'from-purple-400 to-pink-500'
      case 'listening': return 'from-emerald-400 to-cyan-500'
      case 'processing': return 'from-blue-400 to-indigo-500'
      case 'responding': return 'from-violet-400 to-purple-500'
      default: return 'from-brand-gold to-amber-500'
    }
  }

  // Get status text
  const getStatusText = () => {
    switch (state) {
      case 'greeting': return 'Welcome...'
      case 'instructing': return 'Getting started...'
      case 'listening': return 'Listening...'
      case 'processing': return 'Thinking...'
      case 'responding': return 'Speaking...'
      default: return 'Ready'
    }
  }

  if (!speechSupported) return null

  return (
    <>
      {/* Floating Trigger Button - Fixed position, NOT draggable */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={activateAssistant}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-brand-gold to-amber-600 text-white shadow-lg shadow-brand-gold/30 flex items-center justify-center group"
          >
            <Mic className="w-6 h-6 group-hover:animate-pulse" />
            <span className="absolute inset-0 rounded-full bg-brand-gold animate-ping opacity-20" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded Assistant - Draggable */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={containerRef}
            drag
            dragControls={dragControls}
            dragMomentum={false}
            dragElastic={0.1}
            dragConstraints={{
              left: -window.innerWidth + 340,
              right: 0,
              top: -window.innerHeight + 400,
              bottom: 0
            }}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => setIsDragging(false)}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 cursor-move"
            style={{ touchAction: 'none' }}
          >
            <div className={cn(
              "relative transition-shadow duration-200",
              isDragging ? "shadow-2xl" : "shadow-xl"
            )}>
              {/* Main Card */}
              <div className="w-80 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/20 border border-white/50 overflow-hidden">
                
                {/* Drag Handle / Header */}
                <div 
                  className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-brand-ink to-brand-charcoal cursor-grab active:cursor-grabbing"
                  onPointerDown={(e) => dragControls.start(e)}
                >
                  <div className="flex items-center gap-2">
                    <GripHorizontal className="w-4 h-4 text-white/40" />
                    <Sparkles className="w-4 h-4 text-brand-gold" />
                    <span className="text-white text-sm font-medium">TailorPal AI</span>
                  </div>
                  <button
                    onClick={closeAssistant}
                    className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Content Area */}
                <div className="p-6 min-h-[280px] flex flex-col items-center justify-center relative">
                  
                  {/* Animated Orb */}
                  <div className="relative mb-6">
                    <motion.div
                      animate={{
                        scale: state === 'listening' ? [1, 1.2, 1] : 1,
                        rotate: state === 'processing' ? 360 : 0,
                      }}
                      transition={{
                        scale: { repeat: state === 'listening' ? Infinity : 0, duration: 1.5 },
                        rotate: { repeat: state === 'processing' ? Infinity : 0, duration: 2, ease: 'linear' }
                      }}
                      className={cn(
                        'w-24 h-24 rounded-full bg-gradient-to-br shadow-xl flex items-center justify-center',
                        getOrbColor()
                      )}
                    >
                      {/* Inner orb */}
                      <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        {state === 'greeting' && <span className="text-3xl">👋</span>}
                        {state === 'instructing' && instructions[currentInstruction]?.icon}
                        {state === 'listening' && <Mic className="w-8 h-8 text-white animate-pulse" />}
                        {state === 'processing' && (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                          >
                            <Sparkles className="w-8 h-8 text-white" />
                          </motion.div>
                        )}
                        {state === 'responding' && <Volume2 className="w-8 h-8 text-white animate-bounce" />}
                      </div>
                    </motion.div>
                    
                    {/* Orb glow effect */}
                    <div className={cn(
                      'absolute inset-0 rounded-full blur-xl opacity-50 -z-10',
                      'bg-gradient-to-br',
                      getOrbColor()
                    )} />
                    
                    {/* Listening ripples */}
                    {state === 'listening' && (
                      <>
                        <motion.div
                          animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="absolute inset-0 rounded-full border-2 border-emerald-400"
                        />
                        <motion.div
                          animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                          transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                          className="absolute inset-0 rounded-full border-2 border-emerald-400"
                        />
                      </>
                    )}
                  </div>

                  {/* Status Text */}
                  <motion.p
                    key={state + currentInstruction}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center text-brand-ink font-medium text-lg mb-2"
                  >
                    {state === 'greeting' && "Hello, welcome to TailorPal!"}
                    {state === 'instructing' && instructions[currentInstruction]?.text}
                    {state === 'listening' && "I'm listening..."}
                    {state === 'processing' && "Processing..."}
                    {state === 'responding' && response}
                  </motion.p>

                  {/* Subtitle / Hint */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-center text-brand-stone text-xs max-w-[240px]"
                  >
                    {state === 'listening' && "Speak naturally. Pause for 2.5s to send."}
                    {state === 'processing' && "Analyzing your request..."}
                    {state === 'responding' && "Speaking response..."}
                    {state === 'instructing' && `Tip ${currentInstruction + 1} of ${instructions.length}`}
                  </motion.p>

                  {/* Live Transcript Preview */}
                  {(state === 'listening' || state === 'processing') && (transcript || interimTranscript) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 px-4 py-2 bg-brand-cream/50 rounded-xl border border-brand-border/50 max-w-[260px]"
                    >
                      <p className="text-xs text-brand-stone text-center truncate">
                        {transcript || interimTranscript}
                      </p>
                    </motion.div>
                  )}

                  {/* Error Display */}
                  {voiceError && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-4 px-4 py-2 bg-red-50 rounded-xl border border-red-100 max-w-[260px]"
                    >
                      <p className="text-xs text-red-600 text-center">{voiceError}</p>
                    </motion.div>
                  )}
                </div>

                {/* Bottom Action Bar */}
                <div className="px-4 py-3 bg-brand-cream/30 border-t border-brand-border/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'w-2 h-2 rounded-full',
                      state === 'listening' ? 'bg-emerald-400 animate-pulse' : 
                      state === 'processing' ? 'bg-blue-400' :
                      state === 'responding' ? 'bg-purple-400' : 'bg-brand-stone'
                    )} />
                    <span className="text-[10px] text-brand-stone uppercase tracking-wider font-semibold">
                      {getStatusText()}
                    </span>
                  </div>
                  
                  {state === 'listening' && (
                    <button
                      onClick={() => {
                        stopListening()
                        setState('idle')
                      }}
                      className="text-[10px] px-3 py-1.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors font-medium"
                    >
                      Stop
                    </button>
                  )}
                  
                  {(state === 'idle' || state === 'greeting' || state === 'instructing') && (
                    <button
                      onClick={() => {
                        if (instructionTimer.current) clearInterval(instructionTimer.current)
                        setState('listening')
                        startListening()
                      }}
                      className="text-[10px] px-3 py-1.5 rounded-full bg-brand-gold/10 text-brand-gold hover:bg-brand-gold/20 transition-colors font-medium"
                    >
                      Skip Intro
                    </button>
                  )}
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-2 -right-2 w-20 h-20 bg-gradient-to-br from-brand-gold/20 to-amber-500/20 rounded-full blur-2xl -z-10" />
              <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-2xl -z-10" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}