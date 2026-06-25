'use client'

import { useState } from 'react'

interface CheckoutButtonProps {
  planId: string
  children: React.ReactNode
  className: string
}

export function CheckoutButton({ planId, children, className }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })
      const data = (await res.json()) as { url?: string; error?: string }
      if (!res.ok) {
        alert(data.error ?? 'Checkout failed. Please try again.')
        return
      }
      if (data.url) window.location.href = data.url
    } catch {
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button type="button" onClick={handleClick} disabled={loading} className={className}>
      {loading ? 'Redirecting…' : children}
    </button>
  )
}
