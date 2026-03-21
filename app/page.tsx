import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-20 right-0 w-96 h-96 rounded-full opacity-10" style={{ background: 'var(--primary-gradient)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-10" style={{ background: 'var(--primary-gradient)', filter: 'blur(60px)' }} />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-lighter text-primary text-xs font-semibold mb-6">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse-soft" />
                Smart Carpooling Platform
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-gray-900 mb-6">
                Hop In,{' '}
                <span className="gradient-text">Split Fare,</span>
                <br />
                Make Friends
              </h1>
              <p className="text-gray-500 text-lg max-w-lg mb-8 leading-relaxed">
                Join the movement to reduce your carbon footprint and protect the beauty of Mother Nature.
                So, what are you waiting for? Let&apos;s ride together!
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/rides" className="btn-primary inline-flex items-center gap-2 text-base">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  Find a Ride
                </Link>
                <Link href="/rides/create" className="btn-outline inline-flex items-center gap-2 text-base">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                  Offer a Ride
                </Link>
              </div>
            </div>

            {/* Hero Illustration */}
            <div className="hidden md:flex justify-center animate-fade-in-up delay-200">
              <div className="relative">
                {/* Decorative circle */}
                <div className="w-80 h-80 rounded-full bg-primary-lighter flex items-center justify-center animate-float">
                  <div className="text-center">
                    <div className="text-7xl mb-2">🚗</div>
                    <div className="flex justify-center gap-2 mt-4">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-xl">👤</div>
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-xl">👤</div>
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-xl">👤</div>
                    </div>
                    <p className="text-primary font-semibold text-sm mt-3">Sharing is caring!</p>
                  </div>
                </div>
                {/* Floating badges */}
                <div className="absolute -top-2 -right-4 bg-white rounded-xl shadow-lg px-3 py-2 animate-float delay-300">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🌱</span>
                    <div>
                      <p className="text-xs font-bold text-gray-800">-2.4kg CO₂</p>
                      <p className="text-[10px] text-gray-400">per ride</p>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-2 -left-4 bg-white rounded-xl shadow-lg px-3 py-2 animate-float delay-500">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💰</span>
                    <div>
                      <p className="text-xs font-bold text-gray-800">Save 60%</p>
                      <p className="text-[10px] text-gray-400">on commute</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">How It Works</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Get started in just 3 simple steps — it takes less than a minute!</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '📍', step: '01', title: 'Enter Your Route', desc: 'Tell us where you\'re heading and when. Our smart matching engine finds the best rides along your path.' },
              { icon: '🤝', step: '02', title: 'Match & Book', desc: 'Browse matched rides, see driver ratings and prices. Book a seat with one click — instant confirmation!' },
              { icon: '🚀', step: '03', title: 'Ride Together', desc: 'Meet at the pinpoint meetup spot, share the ride and split costs. Track everything in real-time.' },
            ].map((item, i) => (
              <div key={i} className="relative bg-white rounded-2xl p-8 shadow-sm card-hover animate-fade-in-up" style={{ animationDelay: `${i * 150}ms` }}>
                <div className="absolute top-6 right-6 text-5xl font-black text-primary/10">{item.step}</div>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-5" style={{ background: 'var(--primary-lighter)' }}>
                  {item.icon}
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Why Choose RideShare?</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Built with cutting-edge technology for the ultimate carpooling experience</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '🧠', title: 'Smart Matching', desc: 'AI-powered route overlap detection matches you with drivers on your exact path — not just destination.' },
              { icon: '📍', title: 'Pinpoint Meetup', desc: 'Drop a pin at the exact gate, parking spot, or building entrance. No more "where are you?" confusion.' },
              { icon: '🛡️', title: 'Safety First', desc: 'KYC verification, route deviation alerts, and silent check-ins keep every ride safe and secure.' },
              { icon: '⏱️', title: 'Live ETA', desc: 'Real-time countdown shows exactly how many minutes until your driver arrives. No guesswork.' },
              { icon: '💚', title: 'Eco-Friendly', desc: 'Every shared ride reduces carbon emissions. Track your environmental impact on your dashboard.' },
              { icon: '💳', title: 'Fair Pricing', desc: 'Transparent pricing with smart cancellation policies. Free cancellation up to 2 hours before departure.' },
            ].map((item, i) => (
              <div key={i} className="group p-6 rounded-2xl border border-gray-100 hover:border-primary/30 transition-all card-hover">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-4 bg-primary-lighter group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl p-10 md:p-14 text-center text-white relative overflow-hidden" style={{ background: 'var(--primary-gradient)' }}>
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/20 -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/20 translate-y-1/2 -translate-x-1/2" />
            </div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Sharing Rides?</h2>
              <p className="text-white/80 max-w-lg mx-auto mb-8 text-lg">
                Join thousands of commuters who save money and reduce their carbon footprint every day.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/sign-up" className="bg-white text-primary font-semibold px-8 py-3 rounded-xl hover:shadow-lg hover:-translate-y-1 transition-all">
                  Get Started Free
                </Link>
                <Link href="/rides" className="border-2 border-white/30 text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/10 transition-all">
                  Browse Rides
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