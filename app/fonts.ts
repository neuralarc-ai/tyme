import { Inter, Roboto_Mono, Outfit } from "next/font/google"
import localFont from "next/font/local"

export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
})

export const roboto_mono = Roboto_Mono({
  subsets: ["latin"],
  display: "swap",
})

// Since "Fustat" isn't available in the standard Google Fonts catalog through next/font/google,
// we'll use a local font declaration as a placeholder
// In a real implementation, you would download the Fustat font files and place them in the public directory
export const fustat = localFont({
  src: [
    {
      path: "../public/fonts/fustat-regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/fustat-bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-fustat",
})

export const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
})
