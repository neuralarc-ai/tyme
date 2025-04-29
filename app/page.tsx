"use client"

import { useState } from "react"
import TimeDisplay from "@/components/time-display"
import { BottomSection } from "@/components/bottom-section"

export default function Home() {
  const [searchQuery, setSearchQuery] = useState<string>("")

  const handleQuerySubmit = async (text: string) => {
    setSearchQuery(text)
  }

  return (
    <main className="flex flex-col h-screen w-full overflow-hidden">
      <div className="h-2/3">
        <TimeDisplay searchQuery={searchQuery} />
      </div>
      <div className="h-1/3">
        <BottomSection onSubmit={handleQuerySubmit} />
      </div>
    </main>
  )
}
