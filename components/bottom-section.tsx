"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { ArrowUp, Mic, MicOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { motion } from "framer-motion"

// Add Web Speech API type definitions
interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionError) => any) | null
  onend: ((this: SpeechRecognition, ev: Event) => any) | null
}

declare global {
  interface Window {
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionError extends Event {
  error: string
}

interface BottomSectionProps {
  onSubmit: (query: string) => void
  isLoading?: boolean
}

export function BottomSection({ onSubmit, isLoading = false }: BottomSectionProps) {
  const [query, setQuery] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      recognitionRef.current = new window.webkitSpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('')
        setQuery(transcript)
      }

      recognitionRef.current.onerror = (event: SpeechRecognitionError) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        toast({
          variant: "destructive",
          title: "Speech Recognition Error",
          description: "Failed to recognize speech. Please try again.",
        })
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [toast])

  const toggleListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast({
        variant: "destructive",
        title: "Speech Recognition Not Supported",
        description: "Your browser doesn't support speech recognition. Please use Chrome or Edge.",
      })
      return
    }

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    } else {
      recognitionRef.current?.start()
      setIsListening(true)
    }
  }

  const isValidQuery = (text: string): boolean => {
    const keywords = ['time', 'location', 'date', 'in', 'at', 'and', ',']
    const hasLocationKeywords = keywords.some(keyword => text.toLowerCase().includes(keyword))
    
    // Check for time format (e.g., 2am, 3pm, 10:30, 2:30pm)
    const hasTimeFormat = /(\d{1,2}(:\d{2})?\s*(am|pm|AM|PM)?)/.test(text)
    
    // Check for location indicators
    const hasLocationIndicators = /(in|at|,|and)/.test(text.toLowerCase())
    
    return hasLocationKeywords || (hasTimeFormat && hasLocationIndicators)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedQuery = query.trim()
    
    if (trimmedQuery) {
      if (isValidQuery(trimmedQuery)) {
        setIsProcessing(true)
        try {
          await onSubmit(trimmedQuery)
      setQuery("")
        } finally {
          setIsProcessing(false)
        }
      } else {
        toast({
          variant: "destructive",
          title: "Invalid Query",
          description: "Please ask about time in one or two locations. For example: 'What time is it in Tokyo?' or '2am in Tokyo, Singapore'",
          duration: 3000,
        })
      }
    }
  }

  return (
    <div className="relative w-full h-full">
      <div className="absolute inset-0 bg-black" />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.6,
          ease: [0.16, 1, 0.3, 1],
          delay: 0.2
        }}
        className="relative z-10 flex flex-col items-center justify-center h-full p-8"
      >
        <motion.form 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.5,
            ease: [0.16, 1, 0.3, 1],
            delay: 0.4
          }}
          onSubmit={handleSubmit} 
          className="w-full max-w-2xl"
        >
          <div className="relative">
          <div className="relative">
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about time in one or two locations..."
                className={`w-full h-16 px-6 text-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/50 focus:border-0 focus:ring-0 focus:outline-none transition-all duration-300 ${
                  isProcessing ? 'pr-24' : ''
                }`}
                disabled={isProcessing}
              />
              {isProcessing && (
                <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center space-x-1.5">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse [animation-delay:0ms]" />
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse [animation-delay:200ms]" />
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse [animation-delay:400ms]" />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={toggleListening}
              disabled={isProcessing}
              className={`absolute right-14 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                isListening 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-white hover:bg-white/90'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isListening ? (
                <MicOff className="w-5 h-5 text-white" />
              ) : (
                <Mic className="w-5 h-5 text-black" />
              )}
            </button>
            <button
              type="submit"
              disabled={isProcessing || isLoading}
              className={`absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                (isProcessing || isLoading)
                  ? 'bg-white/50 cursor-not-allowed' 
                  : 'bg-white hover:bg-white/90'
              }`}
            >
              {(isProcessing || isLoading) ? (
                <Loader2 className="w-5 h-5 text-black animate-spin" />
              ) : (
                <ArrowUp className="w-5 h-5 text-black" />
              )}
            </button>
          </div>
        </motion.form>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.5,
            ease: [0.16, 1, 0.3, 1],
            delay: 0.6
          }}
          className="mt-8 text-center text-white/50"
        >
          <p className="text-sm">Try asking things like:</p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {[
              "What time is it in Tokyo?",
              "Time in New York",
              "2am in Tokyo, Singapore",
              "3pm in London, Paris",
              "10pm Dubai and New York",
              "Current time in Sydney, Melbourne"
            ].map((example, index) => (
              <motion.button
                key={example}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.4,
                  ease: [0.16, 1, 0.3, 1],
                  delay: 0.7 + (index * 0.1)
                }}
                onClick={() => {
                  setQuery(example)
                  onSubmit(example)
                }}
                disabled={isProcessing}
                className={`px-4 py-2 text-sm rounded-full bg-white/10 hover:bg-white/20 transition-colors ${
                  isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {example}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </motion.div>
      <Toaster />
    </div>
  )
}
