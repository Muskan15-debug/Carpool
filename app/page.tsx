import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute top-20 right-0 w-96 h-96 rounded-full opacity-10" style={{ background: 'var(--primary-gradient)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-10" style={{ background: 'var(--primary-gradient)', filter: 'blur(60px)' }} />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
                style={{ background: 'var(--primary-lighter)', color: 'var(--primary)' }}>
                <span className="w-2 h-2 rounded-full animate-pulse-soft" style={{ background: 'var(--primary)' }} />
                Uber-Style Smart Carpooling
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-white mb-6">
                Book a Ride,{' '}
                <span className="gradient-text">Pool & Save,</span>
                <br />
                Go Green
              </h1>
              <p className="text-gray-500 text-lg max-w-lg mb-8 leading-relaxed">
                Choose your ride, match with co-passengers headed your way, and split the fare.
                Your driver is just a tap away.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/book" className="btn-primary inline-flex items-center gap-2 text-base">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Book a Ride
                </Link>
                <Link href="/select-role" className="btn-outline inline-flex items-center gap-2 text-base">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Drive & Earn
                </Link>
              </div>
            </div>

            {/* Hero Illustration */}
            <div className="hidden md:flex justify-center animate-fade-in-up delay-200">
              <div className="relative">
                <div className="w-80 h-80 rounded-full flex items-center justify-center animate-float"
                  style={{ background: 'var(--primary-lighter)' }}>
                  <div className="text-center">
                    <div className="text-7xl mb-2">🚗</div>
                    <div className="flex justify-center gap-2 mt-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ background: 'rgba(16,185,129,0.2)' }}>👤</div>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ background: 'rgba(16,185,129,0.2)' }}>👤</div>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ background: 'rgba(16,185,129,0.2)' }}>👤</div>
                    </div>
                    <p className="text-primary font-semibold text-sm mt-3">Pool & Save!</p>
                  </div>
                </div>
                <div className="absolute -top-2 -right-4 rounded-xl shadow-lg px-3 py-2 animate-float delay-300"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🌱</span>
                    <div>
                      <p className="text-xs font-bold text-white">-2.4kg CO₂</p>
                      <p className="text-[10px] text-gray-500">per ride</p>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-2 -left-4 rounded-xl shadow-lg px-3 py-2 animate-float delay-500"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💰</span>
                    <div>
                      <p className="text-xs font-bold text-white">Save 30%</p>
                      <p className="text-[10px] text-gray-500">with pool</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20" style={{ background: 'var(--surface)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-3">How It Works</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Book a ride in 4 simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { icon: '📍', step: '01', title: 'Enter Your Route', desc: 'Enter your pickup and destination. We\'ll find the best matches along your path.' },
              { icon: '🚗', step: '02', title: 'Choose Vehicle', desc: 'Pick from Auto, Mini Cab, Sedan, or SUV. See real-time pricing per km.' },
              { icon: '🤝', step: '03', title: 'Pool & Save', desc: 'See co-passengers headed your way. Match types: exact route, dest on route, or pickup on route.' },
              { icon: '✅', step: '04', title: 'Ride Confirmed', desc: 'Your driver is assigned instantly. Track in real-time until you arrive.' },
            ].map((item, i) => (
              <div key={i} className="relative rounded-2xl p-6 card-hover animate-fade-in-up"
                style={{ background: 'var(--surface-light)', border: '1px solid var(--border)', animationDelay: `${i * 150}ms` }}>
                <div className="absolute top-4 right-4 text-4xl font-black" style={{ color: 'rgba(16,185,129,0.1)' }}>{item.step}</div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-4"
                  style={{ background: 'var(--primary-lighter)' }}>
                  {item.icon}
                </div>
                <h3 className="font-bold text-white mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-3">Why Choose RideShare?</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Built for the ultimate ride-sharing experience</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '🧠', title: 'Smart Matching', desc: 'AI-powered route overlap detection finds co-passengers on your exact path — not just destination.' },
              { icon: '💸', title: 'Pool Discounts', desc: 'Save up to 30% by pooling with others. Exact matches get the biggest discounts.' },
              { icon: '🛡️', title: 'Safety First', desc: 'KYC verification, OTP check-in, route tracking, and SOS button for every ride.' },
              { icon: '⏱️', title: 'Live ETA', desc: 'Real-time driver tracking and ETA countdown. Know exactly when your ride arrives.' },
              { icon: '💚', title: 'Eco-Friendly', desc: 'Every pool ride reduces carbon emissions. Track your environmental impact on your dashboard.' },
              { icon: '🚗', title: 'Vehicle Choice', desc: 'Auto, Mini Cab, Sedan, or SUV — choose the ride that fits your budget and comfort.' },
            ].map((item, i) => (
              <div key={i} className="group p-6 rounded-2xl transition-all card-hover"
                style={{ border: '1px solid var(--border)' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform"
                  style={{ background: 'var(--primary-lighter)' }}>
                  {item.icon}
                </div>
                <h3 className="font-bold text-white mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl p-10 md:p-14 text-center text-white relative overflow-hidden" style={{ background: 'var(--primary-gradient)' }}>
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/20 -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/20 translate-y-1/2 -translate-x-1/2" />
            </div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Ride?</h2>
              <p className="text-white/80 max-w-lg mx-auto mb-8 text-lg">
                Join thousands of riders saving money and reducing their carbon footprint every day.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/sign-up" className="bg-white text-primary font-semibold px-8 py-3 rounded-xl hover:shadow-lg hover:-translate-y-1 transition-all">
                  Get Started Free
                </Link>
                <Link href="/book" className="border-2 border-white/30 text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/10 transition-all">
                  Book a Ride
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}