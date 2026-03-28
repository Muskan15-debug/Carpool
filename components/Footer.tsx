import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                style={{ background: 'var(--primary-gradient)' }}>
                R
              </div>
              <span className="text-lg font-bold text-white">RideShare</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              Smart carpooling platform. Pool with co-passengers, save money, go green.
            </p>
          </div>

          {/* Passengers */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">For Passengers</h3>
            <ul className="space-y-2.5">
              <li><Link href="/book" className="text-sm text-gray-500 hover:text-primary transition-colors">Book a Ride</Link></li>
              <li><Link href="/bookings" className="text-sm text-gray-500 hover:text-primary transition-colors">My Trips</Link></li>
              <li><Link href="/select-role" className="text-sm text-gray-500 hover:text-primary transition-colors">Get Started</Link></li>
            </ul>
          </div>

          {/* Drivers */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">For Drivers</h3>
            <ul className="space-y-2.5">
              <li><Link href="/driver" className="text-sm text-gray-500 hover:text-primary transition-colors">Driver Dashboard</Link></li>
              <li><Link href="/select-role" className="text-sm text-gray-500 hover:text-primary transition-colors">Become a Driver</Link></li>
            </ul>
          </div>

          {/* Safety */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Safety</h3>
            <ul className="space-y-2.5">
              <li><span className="text-sm text-gray-500">KYC Verification</span></li>
              <li><span className="text-sm text-gray-500">OTP Check-in</span></li>
              <li><span className="text-sm text-gray-500">SOS Button</span></li>
              <li><span className="text-sm text-gray-500">Route Tracking</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4"
          style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-gray-600 text-xs">© 2026 RideShare. All rights reserved.</p>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>🌱</span>
            <span>Reducing carbon, one ride at a time</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
