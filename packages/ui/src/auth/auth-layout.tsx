import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background grid lg:grid-cols-2">
      <div className="hidden lg:block relative overflow-hidden bg-sacred-red">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,white,transparent_60%)]" />
        <div className="relative h-full flex flex-col justify-between p-12 text-white">
          <Link to="/" className="flex items-center gap-3">
            <img src="/imgAcc.jpg" alt="Sacré Cœur" className="size-10 rounded-full border-2 border-sacred-gold" />
            <span className="font-display text-2xl">Sacré Cœur</span>
          </Link>
          <div>
            <p className="font-display text-5xl italic leading-tight max-w-md">
              &quot;Le savoir est une lumière qui ne s&apos;éteint jamais.&quot;
            </p>
            <p className="text-sm opacity-70 mt-6 tracking-widest uppercase">S.C.D.J— Depuis 2017</p>
          </div>
          <div />
        </div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }} className="w-full max-w-md">
          <h1 className="font-display text-4xl mb-2">{title}</h1>
          <p className="opacity-60 mb-8">{subtitle}</p>
          {children}
        </motion.div>
      </div>
      <style>{`.auth-input { width: 100%; padding: 0.875rem 1rem; border-radius: 0.75rem; border: 1px solid var(--color-border); background: var(--color-background); color: var(--color-foreground); font-size: 0.95rem; outline: none; transition: all 0.2s; } .auth-input:focus { border-color: var(--sacred-red); box-shadow: 0 0 0 3px var(--ring); }`}</style>
    </div>
  )
}

export function AuthField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-2 block">{label}</span>
      {children}
    </label>
  )
}

export function AuthError({ message }: { message: string }) {
  if (!message) return null
  return (
    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
      role="alert" className="px-4 py-3 rounded-xl bg-destructive/10 text-destructive text-sm">
      {message}
    </motion.div>
  )
}
