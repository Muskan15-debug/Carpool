import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RideShare — Share Rides, Save Money, Make Friends',
  description: 'Join the movement to reduce your carbon footprint. Find people travelling your way, book a seat or offer a ride in minutes. Smart matching, real-time tracking, and trusted community.',
  keywords: ['carpool', 'rideshare', 'car sharing', 'commute', 'save money', 'eco-friendly'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        </head>
        <body className="antialiased">{children}</body>
      </html>
    </ClerkProvider>
  )
}