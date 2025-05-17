import Link from "next/link"

export function Footer() {
  return (
    <footer className="w-full py-4 flex flex-col items-center bg-black/80 text-white/70 text-xs">
      <div className="flex items-center gap-4 mb-2">
        <Link href="/legal" className="hover:text-white transition-colors">
          Legal
        </Link>
        <span>|</span>
        <Link href="/legal/privacy" className="hover:text-white transition-colors">
          Privacy
        </Link>
        <span>|</span>
        <Link href="/legal/terms" className="hover:text-white transition-colors">
          Terms
        </Link>
      </div>
      <div className="text-center">
        <p>© {new Date().getFullYear()} TYME</p>
        <p className="mt-1">
          Contact: <a href="mailto:contact@tyme.app" className="hover:text-white transition-colors">contact@tyme.app</a>
        </p>
      </div>
    </footer>
  )
} 