'use client'
import { SignInButton, UserButton, useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function Navbar() {
  const { isSignedIn } = useUser()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    if (isSignedIn) {
      fetch('/api/user/me')
        .then(res => res.json())
        .then(data => {
          if (data.role) setUserRole(data.role)
        })
        .catch(() => {})
    }
  }, [isSignedIn])

  const passengerLinks = [
    { href: '/', label: 'Home' },
    { href: '/book', label: 'Book a Ride' },
    { href: '/bookings', label: 'My Trips' },
  ]

  const driverLinks = [
    { href: '/', label: 'Home' },
    { href: '/driver', label: 'Dashboard' },
    { href: '/bookings', label: 'My Rides' },
  ]

  const navLinks = userRole === 'DRIVER' ? driverLinks : passengerLinks

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-lg border-b shadow-sm"
      style={{ background: 'rgba(15, 15, 15, 0.85)', borderColor: 'var(--border)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-lg"
              style={{ background: 'var(--primary-gradient)' }}>
              R
            </div>
            <span className="text-xl font-bold text-white group-hover:text-primary transition-colors">
              RideShare
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {isSignedIn ? (
              navLinks.map(link => (
                <Link key={link.href} href={link.href}
                  className="text-sm font-medium text-gray-400 hover:text-primary transition-colors">
                  {link.label}
                </Link>
              ))
            ) : (
              <Link href="/" className="text-sm font-medium text-gray-400 hover:text-primary transition-colors">
                Home
              </Link>
            )}
          </div>

          {/* Auth */}
          <div className="hidden md:flex items-center gap-3">
            {!isSignedIn ? (
              <SignInButton mode="modal">
                <button className="btn-primary text-sm px-5 py-2.5">
                  Login / Register
                </button>
              </SignInButton>
            ) : (
              <div className="flex items-center gap-3">
                <UserButton />
              </div>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-[var(--surface-light)] transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <div className="w-5 h-5 flex flex-col justify-center gap-1">
              <span className={`block h-0.5 bg-gray-400 transition-all duration-300 ${mobileOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
              <span className={`block h-0.5 bg-gray-400 transition-all duration-300 ${mobileOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-0.5 bg-gray-400 transition-all duration-300 ${mobileOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t py-4 animate-fade-in" style={{ borderColor: 'var(--border)' }}>
            <div className="flex flex-col gap-3">
              {isSignedIn ? (
                navLinks.map(link => (
                  <Link key={link.href} href={link.href}
                    className="px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-[var(--surface-light)] hover:text-primary transition-colors"
                    onClick={() => setMobileOpen(false)}>
                    {link.label}
                  </Link>
                ))
              ) : (
                <Link href="/"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-[var(--surface-light)] hover:text-primary transition-colors"
                  onClick={() => setMobileOpen(false)}>
                  Home
                </Link>
              )}
              <div className="px-3 pt-2 border-t mt-2" style={{ borderColor: 'var(--border)' }}>
                {!isSignedIn ? (
                  <SignInButton mode="modal">
                    <button className="btn-primary w-full text-sm py-2.5">
                      Login / Register
                    </button>
                  </SignInButton>
                ) : (
                  <div className="flex items-center gap-3">
                    <UserButton />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}