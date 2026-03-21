import { SignIn } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function SignInPage() {
  const { userId } = await auth()
  if (userId) redirect('/dashboard')  

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: 'linear-gradient(135deg, #EDE9FE 0%, #F3F4F6 50%, #EDE9FE 100%)' }}>
      <div className="animate-fade-in-up">
        <SignIn />
      </div>
    </div>
  )
}