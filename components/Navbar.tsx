import { SignInButton, UserButton } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'

export default async function Navbar() {
  const { userId } = await auth()

  return (
    <nav className="flex justify-between p-4 border-b">
      <span className="font-bold">Carpool</span>
      <div>
        {!userId ? (
          <SignInButton mode="modal">
            <button className="bg-black text-white px-4 py-2 rounded">
              Sign In
            </button>
          </SignInButton>
        ) : (
          <UserButton />
        )}
      </div>
    </nav>
  )
}