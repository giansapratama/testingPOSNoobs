"use client"

import { useState } from 'react'
import { Lock, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { usePOS } from '@/lib/pos-context'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function LoginScreen() {
  const { login, register } = usePOS()
  const { toast } = useToast()
  
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  
  // Register form state
  const [regName, setRegName] = useState('')
  const [regUsername, setRegUsername] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirmPassword, setRegConfirmPassword] = useState('')
  const [regRole, setRegRole] = useState<'admin' | 'cashier'>('cashier')
  const [showRegPassword, setShowRegPassword] = useState(false)

  const handleLogin = () => {
    if (!username || !password) {
      toast({
        title: 'Error',
        description: 'Username and password are required',
        variant: 'destructive',
      })
      return
    }
    
    const result = login(username, password)
    if (result.success) {
      toast({
        title: 'Success',
        description: result.message,
      })
    } else {
      toast({
        title: 'Error',
        description: result.message,
        variant: 'destructive',
      })
    }
  }

  const handleRegister = () => {
    if (!regName || !regUsername || !regPassword || !regConfirmPassword) {
      toast({
        title: 'Error',
        description: 'All fields are required',
        variant: 'destructive',
      })
      return
    }
    
    if (regPassword !== regConfirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      })
      return
    }
    
    const result = register({
      name: regName,
      username: regUsername,
      password: regPassword,
      role: regRole,
    })
    
    if (result.success) {
      toast({
        title: 'Success',
        description: result.message,
      })
      setIsRegisterOpen(false)
      setUsername(regUsername)
      setRegName('')
      setRegUsername('')
      setRegPassword('')
      setRegConfirmPassword('')
      setRegRole('cashier')
    } else {
      toast({
        title: 'Error',
        description: result.message,
        variant: 'destructive',
      })
    }
  }

  const getPasswordStrength = (pwd: string) => {
    let strength = 0
    if (pwd.length >= 8) strength++
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++
    if (/[0-9]/.test(pwd) && /[!@#$%^&*]/.test(pwd)) strength++
    return strength
  }

  const passwordStrength = getPasswordStrength(regPassword)
  const strengthColors = ['bg-red-500', 'bg-yellow-500', 'bg-green-500']
  const strengthLabels = ['Weak', 'Medium', 'Strong']

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-amber-600 to-amber-800">
      <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-5 bg-gradient-to-br from-amber-500 to-amber-700 rounded-full flex items-center justify-center">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Noobs POS</h1>
          <p className="text-gray-500 text-sm">Please login to continue</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label className="text-gray-900 font-semibold">Username</Label>
            <Input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="mt-2"
            />
          </div>
          
          <div>
            <Label className="text-gray-900 font-semibold">Password</Label>
            <div className="relative mt-2">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <Button
            onClick={handleLogin}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white mt-2"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Login
          </Button>
          
          <Button
            onClick={() => setIsRegisterOpen(true)}
            variant="secondary"
            className="w-full"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Register
          </Button>
          
          <p className="text-xs text-center text-gray-400 mt-4">
            Demo: admin/admin123 or cashier/cashier123
          </p>
        </div>
      </div>

      {/* Register Modal */}
      <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Account</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div>
              <Label className="text-gray-900 font-semibold">Full Name</Label>
              <Input
                type="text"
                placeholder="Enter full name"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="mt-2"
              />
            </div>
            
            <div>
              <Label className="text-gray-900 font-semibold">Username</Label>
              <Input
                type="text"
                placeholder="Enter username"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                className="mt-2"
              />
            </div>
            
            <div>
              <Label className="text-gray-900 font-semibold">Password</Label>
              <div className="relative mt-2">
                <Input
                  type={showRegPassword ? 'text' : 'password'}
                  placeholder="Enter password (min 8 characters)"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              
              {regPassword && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded ${
                          i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${
                    passwordStrength === 1 ? 'text-red-500' :
                    passwordStrength === 2 ? 'text-yellow-500' :
                    passwordStrength === 3 ? 'text-green-500' : 'text-gray-400'
                  }`}>
                    {passwordStrength > 0 ? strengthLabels[passwordStrength - 1] : 'Enter password'}
                  </p>
                </div>
              )}
            </div>
            
            <div>
              <Label className="text-gray-900 font-semibold">Confirm Password</Label>
              <Input
                type="password"
                placeholder="Repeat password"
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
                className="mt-2"
              />
            </div>
            
            <div>
              <Label className="text-gray-900 font-semibold">Role</Label>
              <Select value={regRole} onValueChange={(v) => setRegRole(v as 'admin' | 'cashier')}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cashier">Cashier</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button onClick={handleRegister} className="flex-1 bg-gradient-to-r from-amber-500 to-amber-700">
                Register
              </Button>
              <Button onClick={() => setIsRegisterOpen(false)} variant="secondary" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
