"use client"

import type React from "react"

import { useState } from "react"
import { ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface BottomSectionProps {
  onSubmit: (query: string) => void
}

export default function BottomSection({ onSubmit }: BottomSectionProps) {
  const [inputValue, setInputValue] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim()) {
      onSubmit(inputValue)
      setInputValue("")
    }
  }

  return (
    <div className="h-full bg-black w-full flex items-center justify-center">
      <div className="w-full max-w-2xl px-4">
        <form onSubmit={handleSubmit} className="relative">
          <Input
            placeholder="Ask about time in different locations (e.g., 'What time is it at 2pm in Tokyo?')"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full bg-white/5 backdrop-blur-md text-white pr-12 rounded-xl py-6 focus:outline-none focus:ring-none shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] border-[1px] border-white/20 hover:bg-white/10 transition-all duration-200"
          />
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 transition-all duration-200"
          >
            <ArrowUp className="h-4 w-4 text-white" />
          </Button>
        </form>
        <div className="mt-4 text-gray-400 text-sm text-center">
          <p>Try asking:</p>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            <span className="px-3 py-1 bg-gray-800 rounded-full text-xs">"What time is it at 2pm in Tokyo?"</span>
            <span className="px-3 py-1 bg-gray-800 rounded-full text-xs">"What time is it in New York right now?"</span>
          </div>
        </div>
      </div>
    </div>
  )
}
