// app/(auth)/login/page.tsx
'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authApi } from '@/app/lib/api/endpoints'
import { getErrorMessage } from '@/app/lib/api/client'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('admin@cure.com')
  const [password, setPassword] = useState('Admin@123')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await authApi.login(email, password)

      if (!result.ok) {
        setError(getErrorMessage(result.error))
        setLoading(false)
        return
      }

      // Redirect based on role
      const role = result.data?.data.user.role;
      if (role === 'ADMIN') {
        router.replace('/admin/nurses')
      } else if (role === 'DISPATCHER') {
        router.replace('/operations/kanban')
      } else {
        router.replace('/')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg bg-white p-8 shadow-lg">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900">CURE</h1>
            <p className="mt-2 text-sm text-gray-600">Command Center Operations Portal</p>
          </div>

          {error && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                placeholder="admin@cure.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 space-y-2 rounded-md bg-blue-50 p-4 text-sm text-blue-700">
            <p className="font-semibold">Demo Credentials:</p>
            <p>Admin: admin@cure.com / Admin@123</p>
            <p>Dispatcher: dispatcher@cure.com / Disp@123</p>
            <p>Nurse: nurse1@cure.com / Nurse@123</p>
          </div>
        </div>
      </div>
    </div>
  )
}
