import Link from "next/link"

export function Footer() {
  return (
    <footer className="w-full py-4 backdrop-blur-md bg-black/40 border-t border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Links */}
          <div className="flex items-center space-x-4 text-sm text-white/70">
            <Link 
              href="/terms" 
              className="hover:text-white transition-colors"
            >
              Terms of use
            </Link>
            <span className="text-white/30">•</span>
            <Link 
              href="/privacy" 
              className="hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <span className="text-white/30">•</span>
            <Link 
              href="/disclaimer" 
              className="hover:text-white transition-colors"
            >
              Disclaimer
            </Link>
            <span className="text-white/30">•</span>
            <Link 
              href="/responsible-ai" 
              className="hover:text-white transition-colors"
            >
              Responsible AI
            </Link>
          </div>

          {/* Copyright */}
          <div className="text-sm text-white/50 flex items-center space-x-2">
            <p>Copyright 2025. All rights reserved.</p>
            <span className="text-white/30">•</span>
            <p>
              Tyme, a thing by{" "}
              <Link 
                href="https://neuralarc.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white/70 hover:text-white transition-colors"
              >
                NeuralArc
              </Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
} 