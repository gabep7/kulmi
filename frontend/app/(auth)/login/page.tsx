'use client'
import { useState, FormEvent } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Logo from '@/components/Logo'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await signIn('credentials', { email, password, redirect: false })
      if (result?.error) {
        setError('Invalid email or password.')
      } else {
        router.push(searchParams.get('callbackUrl') ?? '/dashboard')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-10 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Logo size={32} />
          <h1 className="text-5xl font-semibold text-[#111111] tracking-tight">kulmi</h1>
        </div>
        <p className="text-[#999999] text-sm">your ai study companion</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        <Input label="Password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        {error && <p className="text-sm text-[#cc0000]">{error}</p>}
        <Button type="submit" loading={loading} className="w-full mt-2" size="lg">Sign in</Button>
      </form>

      <p className="text-center text-[#999999] text-sm mt-8">
        No account?{' '}
        <Link href="/register" className="text-[#111111] underline underline-offset-2 hover:text-[#333333]">Create one</Link>
      </p>
    </div>
  )
}
