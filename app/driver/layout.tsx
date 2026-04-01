import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export default async function DriverLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) {
    redirect('/sign-in')
  } else {
    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (user && user.role === 'PASSENGER') {
      redirect('/book')
    }
  }
  return <>{children}</>
}
