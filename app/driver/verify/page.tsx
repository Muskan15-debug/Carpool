'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

export default function DriverVerificationPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [kycStatus, setKycStatus] = useState<'UNVERIFIED' | 'PENDING' | 'VERIFIED'>('UNVERIFIED')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  // 1. Driving Licence, 2. RC Book, 3. Insurance, 4. Selfie Liveness, 5. Vehicle Photos

  useEffect(() => {
    fetch('/api/user/me')
      .then(res => res.json())
      .then(user => {
        setKycStatus(user.kycStatus || 'UNVERIFIED')
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1)
    } else {
      submitKyc()
    }
  }

  const submitKyc = async () => {
    setUploading(true)
    // Mock API call to change status
    try {
      await fetch('/api/driver/submit-kyc', { method: 'POST' })
      setKycStatus('VERIFIED')
    } catch {
      alert("Failed to submit documents")
    }
    setUploading(false)
  }

  if (loading) return <div className="min-h-screen bg-[var(--background)] flex justify-center items-center"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"/></div>

  if (kycStatus === 'PENDING') {
    return (
      <main className="min-h-screen" style={{ background: 'var(--background)' }}>
        <Navbar />
        <div className="max-w-xl mx-auto px-4 py-16 text-center animate-fade-in-up">
          <div className="w-24 h-24 rounded-full mx-auto mb-6 flex flex-col items-center justify-center bg-amber-500/20 text-amber-500 text-4xl">
            ⏳
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Under Review</h1>
          <p className="text-gray-400 leading-relaxed mb-8">
            Your documents have been submitted securely. Our trust & safety team is reviewing your profile. 
            Verification typically takes <strong>1–3 business days</strong>.
          </p>
          <button onClick={() => router.push('/')} className="btn-outline px-8 py-3">
            Return Home
          </button>
        </div>
      </main>
    )
  }

  if (kycStatus === 'VERIFIED') {
    router.push('/driver')
    return null
  }

  return (
    <main className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Navbar />

      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">Driver Verification</h1>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--surface-light)] text-gray-400">
            Step {step} of 5
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-[var(--surface-light)] rounded-full mb-8 overflow-hidden">
          <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${(step / 5) * 100}%` }} />
        </div>

        <div className="card-dark p-6 animate-fade-in-up" key={step}>
          
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto bg-blue-500/10 rounded-2xl flex items-center justify-center text-3xl mb-4">🪪</div>
                <h2 className="text-xl font-bold text-white mb-2">Driving Licence</h2>
                <p className="text-sm text-gray-400">Upload your valid driving licence or fetch via DigiLocker.</p>
              </div>
              <button className="w-full py-4 border-2 border-dashed border-[var(--border)] rounded-xl text-gray-400 hover:border-primary hover:text-primary transition-colors flex flex-col items-center justify-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                <span>Tap to upload photo</span>
              </button>
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-[var(--border)]"></div>
                <span className="flex-shrink-0 mx-4 text-xs text-gray-500 uppercase">or</span>
                <div className="flex-grow border-t border-[var(--border)]"></div>
              </div>
              <button className="w-full py-3.5 bg-[var(--surface-light)] rounded-xl text-white font-medium hover:bg-white/5 flex items-center justify-center gap-2">
                Fetch with DigiLocker API
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto bg-emerald-500/10 rounded-2xl flex items-center justify-center text-3xl mb-4">📄</div>
                <h2 className="text-xl font-bold text-white mb-2">RC Book</h2>
                <p className="text-sm text-gray-400">Upload your Vehicle Registration Certificate</p>
              </div>
              <button className="w-full py-12 border-2 border-dashed border-[var(--border)] rounded-xl text-gray-400 hover:border-primary hover:text-primary transition-colors flex flex-col items-center justify-center gap-2">
                <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span>Scan RC Document</span>
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto bg-purple-500/10 rounded-2xl flex items-center justify-center text-3xl mb-4">🛡️</div>
                <h2 className="text-xl font-bold text-white mb-2">Insurance Certificate</h2>
                <p className="text-sm text-gray-400">Upload your valid third-party or comprehensive insurance cover.</p>
              </div>
              <button className="w-full py-12 border-2 border-dashed border-[var(--border)] rounded-xl text-gray-400 hover:border-primary hover:text-primary transition-colors flex flex-col items-center justify-center gap-2">
                <span>Upload PDF or Photo</span>
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto bg-pink-500/10 rounded-full flex items-center justify-center text-3xl mb-4 overflow-hidden border-2 border-pink-500/50">
                  📷
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Selfie Liveness Check</h2>
                <p className="text-sm text-gray-400">Take a quick selfie to match with your DL photo and confirm your identity.</p>
              </div>
              <div className="bg-[var(--surface-light)] rounded-2xl aspect-[3/4] flex items-center justify-center relative overflow-hidden group border border-[var(--border)]">
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl">
                    <span className="w-14 h-14 rounded-full border-2 border-black flex items-center justify-center"></span>
                  </button>
                </div>
                <span className="text-gray-500 flex flex-col items-center gap-2">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Camera preview
                </span>
                
                {/* Liveness frame overlay */}
                <div className="absolute inset-x-8 inset-y-16 border-2 border-dashed border-primary/50 rounded-full pointer-events-none"></div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto bg-amber-500/10 rounded-2xl flex items-center justify-center text-3xl mb-4">🚙</div>
                <h2 className="text-xl font-bold text-white mb-2">Vehicle Photos</h2>
                <p className="text-sm text-gray-400">Provide clear photos of your vehicle including the number plate.</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="aspect-square bg-[var(--surface-light)] rounded-xl flex flex-col items-center justify-center text-xs text-gray-500 border border-[var(--border)] cursor-pointer hover:border-primary transition-colors">
                  <span className="text-xl mb-1">🚘</span> Front (Plate)
                </div>
                <div className="aspect-square bg-[var(--surface-light)] rounded-xl flex flex-col items-center justify-center text-xs text-gray-500 border border-[var(--border)] cursor-pointer hover:border-primary transition-colors">
                  <span className="text-xl mb-1">🚗</span> Back (Plate)
                </div>
                <div className="aspect-square bg-[var(--surface-light)] rounded-xl flex flex-col items-center justify-center text-xs text-gray-500 border border-[var(--border)] cursor-pointer hover:border-primary transition-colors">
                  <span className="text-xl mb-1">💺</span> Interior Front
                </div>
                <div className="aspect-square bg-[var(--surface-light)] rounded-xl flex flex-col items-center justify-center text-xs text-gray-500 border border-[var(--border)] cursor-pointer hover:border-primary transition-colors">
                  <span className="text-xl mb-1">🧳</span> Interior Back
                </div>
              </div>
            </div>
          )}

          <div className="mt-8">
            <button 
              onClick={handleNext} 
              disabled={uploading}
              className="btn-primary w-full py-4 text-base font-bold shadow-lg shadow-primary/20"
            >
              {uploading ? 'Submitting...' : step < 5 ? 'Continue →' : 'Submit for Verification'}
            </button>
            {step > 1 && (
              <button 
                onClick={() => setStep(step - 1)}
                className="w-full text-center text-gray-500 text-sm mt-4 hover:text-white"
              >
                Go back
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
