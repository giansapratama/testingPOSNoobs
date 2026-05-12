"use client"

import { usePOS } from '@/lib/pos-context'
import { LoginScreen } from './login-screen'
import { POSHeader } from './pos-header'
import { AdminDashboard } from './admin-dashboard'
import { CashierDashboard } from './cashier-dashboard'
import { Spinner } from '@/components/ui/spinner'

export function POSApp() {
  const { isAuthenticated, currentUser, isLoading } = usePOS()
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center">
        <div className="text-center text-white">
          <Spinner className="w-10 h-10 mx-auto mb-4" />
          <p className="font-semibold">Loading POS System...</p>
        </div>
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return <LoginScreen />
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-500 to-amber-700 flex flex-col">
      <POSHeader />
      
      <main className="flex-1 overflow-auto p-6">
        {currentUser?.role === 'admin' ? (
          <AdminDashboard />
        ) : (
          <CashierDashboard />
        )}
      </main>
    </div>
  )
}
