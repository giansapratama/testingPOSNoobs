"use client"

import { LogOut, Users, Wifi, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePOS } from '@/lib/pos-context'

export function POSHeader() {
  const { currentUser, logout, settings } = usePOS()
  
  return (
    <header className="bg-white px-6 py-4 shadow-sm flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{settings.storeName}</h1>
        <p className="text-xs text-gray-500 mt-1">
          Role: <span className="font-semibold capitalize">{currentUser?.role}</span> | User: <span className="font-semibold">{currentUser?.name}</span>
        </p>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Connection Status */}
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg border border-gray-200">
          <div className="relative">
            <Wifi className="w-4 h-4 text-green-500" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
          <span className="text-xs font-semibold text-gray-600">Connected</span>
        </div>
        
        {/* Logout Button */}
        <Button
          onClick={logout}
          className="bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </header>
  )
}
