'use client'
import { useState, FormEvent } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { registerUser } from '@/lib/api'
import Logo from '@/components/Logo'

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await registerUser({ full_name: fullName, email, password })
      const result = await signIn('credentials', { email, password, redirect: false })
      if (result?.error) {
        setError('Account created. Please sign in.')
        router.push('/login')
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.')
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
        <p className="text-[#999999] text-sm">create your account</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Full name" type="text" placeholder="Jane Smith" value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="name" />
        <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        <Input label="Password" type="password" placeholder="Min. 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
        {error && <p className="text-sm text-[#cc0000]">{error}</p>}
        <Button type="submit" loading={loading} className="w-full mt-2" size="lg">Create account</Button>
      </form>

      <p className="text-center text-[#999999] text-sm mt-8">
        Already have an account?{' '}
        <Link href="/login" className="text-[#111111] underline underline-offset-2 hover:text-[#333333]">Sign in</Link>
      </p>
    </div>
  )
}
