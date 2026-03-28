import { prisma } from '@/lib/prisma'
import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const clerkUser = await currentUser()
  let user = await prisma.user.findUnique({ where: { clerkId: userId } })
  
  const clerkName = clerkUser && clerkUser.firstName 
    ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim() 
    : "Unknown User"

  const clerkEmail = clerkUser?.emailAddresses[0]?.emailAddress || "unknown@example.com"

  if (!user) {
    user = await prisma.user.create({
      data: {
        clerkId: userId,
        email: clerkEmail,
        name: clerkName,
        avatar: clerkUser?.imageUrl,
        role: 'UNASSIGNED',
      }
    })
  }

  // Redirect based on role
  if (user.role === 'DRIVER') redirect('/driver')
  if (user.role === 'PASSENGER') redirect('/book')
  
  // No role set — redirect to role selection
  redirect('/select-role')
}
