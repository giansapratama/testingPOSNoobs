"use client"

import { POSProvider } from '@/lib/pos-context'
import { POSApp } from '@/components/pos/pos-app'
import { Toaster } from '@/components/ui/toaster'

export default function Home() {
  return (
    <POSProvider>
      <POSApp />
      <Toaster />
    </POSProvider>
  )
}
