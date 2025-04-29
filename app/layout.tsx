import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: "Dynamic Time & Weather Dashboard",
  description: "A sleek, modern dashboard displaying time and weather information",
  generator: 'v0.dev'
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
        </ThemeProvider>
      </body>
    </html>
  )
}
