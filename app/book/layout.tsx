import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export default async function BookLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (userId) {
    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (user && user.role === 'DRIVER') {
      redirect('/driver')
    }
  }
  return <>{children}</>
}
