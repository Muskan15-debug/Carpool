'use client'
import { SignInButton, UserButton, useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { useState } from 'react'

export default function Navbar() {
  const { isSignedIn } = useUser()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-lg"
              style={{ background: 'var(--primary-gradient)' }}>
              R
            </div>
            <span className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">
              RideShare
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
              Home
            </Link>
            <Link href="/rides" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
              Find Rides
            </Link>
            {isSignedIn && (
              <>
                <Link href="/rides/create" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                  Offer a Ride
                </Link>
                <Link href="/bookings" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                  My Bookings
                </Link>
                <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                  Dashboard
                </Link>
              </>
            )}
          </div>

          {/* Auth + CTA */}
          <div className="hidden md:flex items-center gap-3">
            {!isSignedIn ? (
              <SignInButton mode="modal">
                <button className="btn-primary text-sm px-5 py-2.5">
                  Login / Register
                </button>
              </SignInButton>
            ) : (
              <UserButton />
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <div className="w-5 h-5 flex flex-col justify-center gap-1">
              <span className={`block h-0.5 bg-gray-700 transition-all duration-300 ${mobileOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
              <span className={`block h-0.5 bg-gray-700 transition-all duration-300 ${mobileOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-0.5 bg-gray-700 transition-all duration-300 ${mobileOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 py-4 animate-fade-in">
            <div className="flex flex-col gap-3">
              <Link href="/" className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-primary-lighter hover:text-primary transition-colors" onClick={() => setMobileOpen(false)}>
                Home
              </Link>
              <Link href="/rides" className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-primary-lighter hover:text-primary transition-colors" onClick={() => setMobileOpen(false)}>
                Find Rides
              </Link>
              {isSignedIn && (
                <>
                  <Link href="/rides/create" className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-primary-lighter hover:text-primary transition-colors" onClick={() => setMobileOpen(false)}>
                    Offer a Ride
                  </Link>
                  <Link href="/bookings" className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-primary-lighter hover:text-primary transition-colors" onClick={() => setMobileOpen(false)}>
                    My Bookings
                  </Link>
                  <Link href="/dashboard" className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-primary-lighter hover:text-primary transition-colors" onClick={() => setMobileOpen(false)}>
                    Dashboard
                  </Link>
                </>
              )}
              <div className="px-3 pt-2 border-t border-gray-100 mt-2">
                {!isSignedIn ? (
                  <SignInButton mode="modal">
                    <button className="btn-primary w-full text-sm py-2.5">
                      Login / Register
                    </button>
                  </SignInButton>
                ) : (
                  <UserButton />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}