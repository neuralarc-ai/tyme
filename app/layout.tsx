import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"

export const metadata: Metadata = {
  title: "Tyme - Find the best time for your meetings",
  description: "A sleek, modern dashboard displaying time for different locations and suggesting the best time for your meetings",
  authors: [{ name: "NeuralArc", url: "https://neuralarc.ai" }],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Fustat:wght@200..800&display=swap');
            
            .fustat {
              font-family: "Fustat", sans-serif;
              font-optical-sizing: auto;
              font-style: normal;
            }
          `}
        </style>
      </head>
      <body className="fustat">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
