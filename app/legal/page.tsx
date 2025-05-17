import Link from 'next/link'

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Legal Information</h1>
        
        <div className="space-y-6">
          <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
            <Link href="/legal/disclaimer" className="block">
              <h2 className="text-xl font-semibold mb-2">Disclaimer</h2>
              <p className="text-gray-600">Last updated: May 2025</p>
            </Link>
          </div>

          <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
            <Link href="/legal/responsible-ai" className="block">
              <h2 className="text-xl font-semibold mb-2">Responsible AI Use Policy</h2>
              <p className="text-gray-600">Guidelines for ethical AI usage</p>
            </Link>
          </div>

          <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
            <Link href="/legal/privacy" className="block">
              <h2 className="text-xl font-semibold mb-2">Privacy Policy</h2>
              <p className="text-gray-600">Effective Date: May 2025</p>
            </Link>
          </div>

          <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
            <Link href="/legal/terms" className="block">
              <h2 className="text-xl font-semibold mb-2">Terms of Use</h2>
              <p className="text-gray-600">Last Updated: May 2025</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 