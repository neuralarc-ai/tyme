"use client"

import type React from "react"

import { useState } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

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
    <div className="h-[50vh] bg-gray-900 w-full flex items-center justify-center">
      <div className="w-full max-w-2xl px-4">
        <form onSubmit={handleSubmit} className="relative">
          <Textarea
            placeholder="Ask about time in different locations (e.g., 'What time is it at 2pm in Tokyo?')"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full bg-gray-800 border-gray-700 text-white resize-none h-24 pr-12 rounded-xl"
          />
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            className="absolute right-3 bottom-3 text-white hover:bg-gray-700"
          >
            <Send className="h-5 w-5" />
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
