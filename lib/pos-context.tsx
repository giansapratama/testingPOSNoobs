"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  User,
  Category,
  Product,
  CartItem,
  Transaction,
  Settings,
  getUsers,
  createUser as createUserStore,
  deleteUser as deleteUserStore,
  getCurrentUser,
  setCurrentUser as setCurrentUserStore,
  getCategories,
  createCategory as createCategoryStore,
  deleteCategory as deleteCategoryStore,
  updateCategory as updateCategoryStore,
  getProducts,
  createProduct as createProductStore,
  deleteProduct as deleteProductStore,
  updateProduct as updateProductStore,
  getTransactions,
  createTransaction as createTransactionStore,
  getSettings,
  updateSettings as updateSettingsStore,
  initializeStorage,
  hashPassword,
  formatCurrency,
} from './pos-store'

interface POSContextType {
  // Auth state
  currentUser: User | null
  isAuthenticated: boolean
  login: (username: string, password: string) => { success: boolean; message: string }
  logout: () => void
  register: (data: { name: string; username: string; password: string; role: 'admin' | 'cashier' }) => { success: boolean; message: string }
  
  // Users
  users: User[]
  deleteUser: (userId: string) => void
  refreshUsers: () => void
  
  // Categories
  categories: Category[]
  createCategory: (name: string) => { success: boolean; message: string }
  updateCategory: (categoryId: string, name: string) => { success: boolean; message: string }
  deleteCategory: (categoryId: string) => void
  refreshCategories: () => void
  
  // Products
  products: Product[]
  createProduct: (product: Omit<Product, 'id' | 'createdAt'>) => { success: boolean; message: string }
  updateProduct: (productId: string, data: Partial<Omit<Product, 'id' | 'createdAt'>>) => { success: boolean; message: string }
  deleteProduct: (productId: string) => void
  refreshProducts: () => void
  
  // Cart
  cart: CartItem[]
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  removeFromCart: (index: number) => void
  updateCartItemQuantity: (index: number, quantity: number) => void
  clearCart: () => void
  
  // Transactions
  transactions: Transaction[]
  checkout: (data: {
    discount: number
    customerName: string
    tableNumber: string
    serviceType: 'dine-in' | 'takeaway'
    paymentMethod: 'qris' | 'debit' | 'credit' | 'cash'
  }) => Transaction | null
  refreshTransactions: () => void
  
  // Settings
  settings: Settings
  updateSettings: (settings: Partial<Settings>) => void
  
  // Utility
  formatCurrency: (amount: number) => string
  isLoading: boolean
}

const POSContext = createContext<POSContextType | undefined>(undefined)

export function POSProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [settings, setSettings] = useState<Settings>({
    storeName: 'Noobs POS',
    notificationEmail: '',
    minStock: 10,
    currencySymbol: 'Rp ',
  })
  const [isLoading, setIsLoading] = useState(true)

  // Initialize data on mount
  useEffect(() => {
    initializeStorage()
    setCurrentUser(getCurrentUser())
    setUsers(getUsers())
    setCategories(getCategories())
    setProducts(getProducts())
    setTransactions(getTransactions())
    setSettings(getSettings())
    setIsLoading(false)
  }, [])

  // Auth functions
  const login = useCallback((username: string, password: string) => {
    const allUsers = getUsers()
    const user = allUsers.find(u => u.username === username)
    
    if (!user) {
      return { success: false, message: 'Invalid username or password' }
    }
    
    const hashedPassword = hashPassword(password)
    if (user.password !== hashedPassword) {
      return { success: false, message: 'Invalid username or password' }
    }
    
    setCurrentUserStore(user)
    setCurrentUser(user)
    return { success: true, message: `Welcome, ${user.name}!` }
  }, [])

  const logout = useCallback(() => {
    setCurrentUserStore(null)
    setCurrentUser(null)
    setCart([])
  }, [])

  const register = useCallback((data: { name: string; username: string; password: string; role: 'admin' | 'cashier' }) => {
    const allUsers = getUsers()
    
    if (allUsers.some(u => u.username === data.username)) {
      return { success: false, message: 'Username already exists' }
    }
    
    if (data.password.length < 8) {
      return { success: false, message: 'Password must be at least 8 characters' }
    }
    
    createUserStore({
      name: data.name,
      username: data.username,
      password: hashPassword(data.password),
      role: data.role,
    })
    
    setUsers(getUsers())
    return { success: true, message: 'Account created successfully' }
  }, [])

  // Refresh functions
  const refreshUsers = useCallback(() => setUsers(getUsers()), [])
  const refreshCategories = useCallback(() => setCategories(getCategories()), [])
  const refreshProducts = useCallback(() => setProducts(getProducts()), [])
  const refreshTransactions = useCallback(() => setTransactions(getTransactions()), [])

  // User functions
  const handleDeleteUser = useCallback((userId: string) => {
    if (currentUser?.id === userId) return
    deleteUserStore(userId)
    setUsers(getUsers())
  }, [currentUser])

  // Category functions
  const handleCreateCategory = useCallback((name: string) => {
    const allCategories = getCategories()
    if (allCategories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      return { success: false, message: 'Category already exists' }
    }
    createCategoryStore(name)
    setCategories(getCategories())
    return { success: true, message: 'Category created successfully' }
  }, [])

  const handleUpdateCategory = useCallback((categoryId: string, name: string) => {
    const allCategories = getCategories()
    if (allCategories.some(c => c.name.toLowerCase() === name.toLowerCase() && c.id !== categoryId)) {
      return { success: false, message: 'Category name already exists' }
    }
    const updated = updateCategoryStore(categoryId, name)
    if (updated) {
      setCategories(getCategories())
      return { success: true, message: 'Category updated successfully' }
    }
    return { success: false, message: 'Category not found' }
  }, [])

  const handleDeleteCategory = useCallback((categoryId: string) => {
    deleteCategoryStore(categoryId)
    setCategories(getCategories())
  }, [])

  // Product functions
  const handleCreateProduct = useCallback((product: Omit<Product, 'id' | 'createdAt'>) => {
    const allProducts = getProducts()
    if (allProducts.some(p => p.name.toLowerCase() === product.name.toLowerCase())) {
      return { success: false, message: 'Product already exists' }
    }
    createProductStore(product)
    setProducts(getProducts())
    return { success: true, message: 'Product created successfully' }
  }, [])

  const handleUpdateProduct = useCallback((productId: string, data: Partial<Omit<Product, 'id' | 'createdAt'>>) => {
    const allProducts = getProducts()
    if (data.name && allProducts.some(p => p.name.toLowerCase() === data.name!.toLowerCase() && p.id !== productId)) {
      return { success: false, message: 'Product name already exists' }
    }
    const updated = updateProductStore(productId, data)
    if (updated) {
      setProducts(getProducts())
      return { success: true, message: 'Product updated successfully' }
    }
    return { success: false, message: 'Product not found' }
  }, [])

  const handleDeleteProduct = useCallback((productId: string) => {
    deleteProductStore(productId)
    setProducts(getProducts())
  }, [])

  // Cart functions
  const addToCart = useCallback((item: Omit<CartItem, 'quantity'>, quantity = 1) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(i => i.productId === item.productId)
      if (existingIndex !== -1) {
        const updated = [...prev]
        updated[existingIndex].quantity += quantity
        return updated
      }
      return [...prev, { ...item, quantity }]
    })
  }, [])

  const removeFromCart = useCallback((index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index))
  }, [])

  const updateCartItemQuantity = useCallback((index: number, quantity: number) => {
    setCart(prev => {
      const updated = [...prev]
      if (updated[index]) {
        updated[index].quantity = quantity
      }
      return updated
    })
  }, [])

  const clearCart = useCallback(() => setCart([]), [])

  // Checkout function
  const checkout = useCallback((data: {
    discount: number
    customerName: string
    tableNumber: string
    serviceType: 'dine-in' | 'takeaway'
    paymentMethod: 'qris' | 'debit' | 'credit' | 'cash'
  }) => {
    if (cart.length === 0) return null
    
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const total = Math.max(0, subtotal - data.discount)
    
    const transaction = createTransactionStore(
      {
        items: JSON.stringify(cart),
        subtotal,
        discount: data.discount,
        total,
        table: data.serviceType === 'dine-in' ? data.tableNumber : 'N/A',
        serviceType: data.serviceType,
        paymentMethod: data.paymentMethod,
        customerName: data.customerName || 'Anonymous',
      },
      cart
    )
    
    setCart([])
    setTransactions(getTransactions())
    setProducts(getProducts())
    return transaction
  }, [cart])

  // Settings functions
  const handleUpdateSettings = useCallback((newSettings: Partial<Settings>) => {
    const updated = updateSettingsStore(newSettings)
    setSettings(updated)
  }, [])

  const value: POSContextType = {
    currentUser,
    isAuthenticated: !!currentUser,
    login,
    logout,
    register,
    users,
    deleteUser: handleDeleteUser,
    refreshUsers,
    categories,
    createCategory: handleCreateCategory,
    updateCategory: handleUpdateCategory,
    deleteCategory: handleDeleteCategory,
    refreshCategories,
    products,
    createProduct: handleCreateProduct,
    updateProduct: handleUpdateProduct,
    deleteProduct: handleDeleteProduct,
    refreshProducts,
    cart,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    transactions,
    checkout,
    refreshTransactions,
    settings,
    updateSettings: handleUpdateSettings,
    formatCurrency,
    isLoading,
  }

  return <POSContext.Provider value={value}>{children}</POSContext.Provider>
}

export function usePOS() {
  const context = useContext(POSContext)
  if (context === undefined) {
    throw new Error('usePOS must be used within a POSProvider')
  }
  return context
}
