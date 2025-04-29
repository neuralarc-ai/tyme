"use client"

import type React from "react"

import { useState } from "react"
import { ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface BottomSectionProps {
  onSubmit: (query: string) => void
}

export function BottomSection({ onSubmit }: BottomSectionProps) {
  const [query, setQuery] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSubmit(query.trim())
      setQuery("")
    }
  }

  return (
    <div className="relative w-full h-full grain">
      <div className="absolute inset-0 bg-black" />
      <div className="relative z-10 flex flex-col items-center justify-center h-full p-8">
        <form onSubmit={handleSubmit} className="w-full max-w-2xl">
          <div className="relative">
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about any time in any place..."
              className="w-full h-16 px-6 text-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/50 focus:border-0 focus:ring-0 focus:outline-none"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-white/90 transition-colors"
            >
              <ArrowUp className="w-5 h-5 text-black" />
            </button>
          </div>
        </form>

        <div className="mt-8 text-center text-white/50">
          <p className="text-sm">Try asking things like:</p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {[
              "What time is it in Tokyo?",
              "Time in New York",
              "Current time in London",
              "Time in Sydney right now"
            ].map((example) => (
              <button
                key={example}
                onClick={() => {
                  setQuery(example)
                  onSubmit(example)
                }}
                className="px-4 py-2 text-sm rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
