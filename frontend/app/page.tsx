'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const token = Cookies.get('token')
    
    if (token) {
      router.push('/dashboard')
    } else {
      router.push('/login')
    }
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        <p className="text-gray-600">Redirecting to the appropriate page...</p>
      </div>
    </div>
  )
}