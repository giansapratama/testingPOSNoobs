// POS Store - State management for the Point of Sale system

export interface User {
  id: string
  name: string
  username: string
  password: string
  role: 'admin' | 'cashier'
  createdAt: string
}

export interface Category {
  id: string
  name: string
  createdAt: string
}

export interface Product {
  id: string
  name: string
  category: string
  price: number
  stock: number
  createdAt: string
}

export interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
}

export interface LineItem {
  id: string
  transactionId: string
  productId: string
  name: string
  price: number
  quantity: number
  createdAt: string
}

export interface Transaction {
  id: string
  items: string
  subtotal: number
  discount: number
  total: number
  table: string
  serviceType: 'dine-in' | 'takeaway'
  paymentMethod: 'qris' | 'debit' | 'credit' | 'cash'
  customerName: string
  createdAt: string
  lineItems?: LineItem[]
}

export interface Settings {
  storeName: string
  notificationEmail: string
  minStock: number
  currencySymbol: string
}

// Simple hash function for demo purposes
export function hashPassword(password: string): string {
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return 'hash_' + Math.abs(hash)
}

// Default data
const defaultUsers: User[] = [
  {
    id: 'user_1',
    name: 'Admin User',
    username: 'admin',
    password: hashPassword('admin123'),
    role: 'admin',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user_2',
    name: 'Cashier User',
    username: 'cashier',
    password: hashPassword('cashier123'),
    role: 'cashier',
    createdAt: new Date().toISOString(),
  },
]

const defaultCategories: Category[] = [
  { id: 'cat_1', name: 'Food', createdAt: new Date().toISOString() },
  { id: 'cat_2', name: 'Drink', createdAt: new Date().toISOString() },
  { id: 'cat_3', name: 'Dessert', createdAt: new Date().toISOString() },
]

const defaultProducts: Product[] = [
  { id: 'prod_1', name: 'Nasi Goreng', category: 'Food', price: 25000, stock: 50, createdAt: new Date().toISOString() },
  { id: 'prod_2', name: 'Mie Goreng', category: 'Food', price: 22000, stock: 45, createdAt: new Date().toISOString() },
  { id: 'prod_3', name: 'Ayam Bakar', category: 'Food', price: 35000, stock: 30, createdAt: new Date().toISOString() },
  { id: 'prod_4', name: 'Es Teh', category: 'Drink', price: 8000, stock: 100, createdAt: new Date().toISOString() },
  { id: 'prod_5', name: 'Es Jeruk', category: 'Drink', price: 10000, stock: 80, createdAt: new Date().toISOString() },
  { id: 'prod_6', name: 'Kopi', category: 'Drink', price: 12000, stock: 60, createdAt: new Date().toISOString() },
  { id: 'prod_7', name: 'Pudding', category: 'Dessert', price: 15000, stock: 25, createdAt: new Date().toISOString() },
  { id: 'prod_8', name: 'Es Krim', category: 'Dessert', price: 18000, stock: 40, createdAt: new Date().toISOString() },
]

const defaultSettings: Settings = {
  storeName: 'Noobs POS',
  notificationEmail: '',
  minStock: 10,
  currencySymbol: 'Rp ',
}

// Storage keys
const STORAGE_KEYS = {
  users: 'pos_users',
  categories: 'pos_categories',
  products: 'pos_products',
  transactions: 'pos_transactions',
  lineItems: 'pos_line_items',
  settings: 'pos_settings',
  currentUser: 'pos_current_user',
}

// Helper functions
function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue
  const stored = localStorage.getItem(key)
  if (!stored) return defaultValue
  try {
    return JSON.parse(stored)
  } catch {
    return defaultValue
  }
}

function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

// Initialize storage with defaults
export function initializeStorage(): void {
  if (typeof window === 'undefined') return
  
  if (!localStorage.getItem(STORAGE_KEYS.users)) {
    saveToStorage(STORAGE_KEYS.users, defaultUsers)
  }
  if (!localStorage.getItem(STORAGE_KEYS.categories)) {
    saveToStorage(STORAGE_KEYS.categories, defaultCategories)
  }
  if (!localStorage.getItem(STORAGE_KEYS.products)) {
    saveToStorage(STORAGE_KEYS.products, defaultProducts)
  }
  if (!localStorage.getItem(STORAGE_KEYS.transactions)) {
    saveToStorage(STORAGE_KEYS.transactions, [])
  }
  if (!localStorage.getItem(STORAGE_KEYS.lineItems)) {
    saveToStorage(STORAGE_KEYS.lineItems, [])
  }
  if (!localStorage.getItem(STORAGE_KEYS.settings)) {
    saveToStorage(STORAGE_KEYS.settings, defaultSettings)
  }
}

// User functions
export function getUsers(): User[] {
  return getFromStorage(STORAGE_KEYS.users, defaultUsers)
}

export function createUser(user: Omit<User, 'id' | 'createdAt'>): User {
  const users = getUsers()
  const newUser: User = {
    ...user,
    id: 'user_' + Date.now(),
    createdAt: new Date().toISOString(),
  }
  users.push(newUser)
  saveToStorage(STORAGE_KEYS.users, users)
  return newUser
}

export function deleteUser(userId: string): void {
  const users = getUsers().filter(u => u.id !== userId)
  saveToStorage(STORAGE_KEYS.users, users)
}

export function getCurrentUser(): User | null {
  return getFromStorage<User | null>(STORAGE_KEYS.currentUser, null)
}

export function setCurrentUser(user: User | null): void {
  saveToStorage(STORAGE_KEYS.currentUser, user)
}

// Category functions
export function getCategories(): Category[] {
  return getFromStorage(STORAGE_KEYS.categories, defaultCategories)
}

export function createCategory(name: string): Category {
  const categories = getCategories()
  const newCategory: Category = {
    id: 'cat_' + Date.now(),
    name,
    createdAt: new Date().toISOString(),
  }
  categories.push(newCategory)
  saveToStorage(STORAGE_KEYS.categories, categories)
  return newCategory
}

export function deleteCategory(categoryId: string): void {
  const categories = getCategories().filter(c => c.id !== categoryId)
  saveToStorage(STORAGE_KEYS.categories, categories)
}

export function updateCategory(categoryId: string, name: string): Category | null {
  const categories = getCategories()
  const index = categories.findIndex(c => c.id === categoryId)
  if (index === -1) return null
  categories[index].name = name
  saveToStorage(STORAGE_KEYS.categories, categories)
  return categories[index]
}

// Product functions
export function getProducts(): Product[] {
  return getFromStorage(STORAGE_KEYS.products, defaultProducts)
}

export function createProduct(product: Omit<Product, 'id' | 'createdAt'>): Product {
  const products = getProducts()
  const newProduct: Product = {
    ...product,
    id: 'prod_' + Date.now(),
    createdAt: new Date().toISOString(),
  }
  products.push(newProduct)
  saveToStorage(STORAGE_KEYS.products, products)
  return newProduct
}

export function updateProductStock(productId: string, quantity: number): void {
  const products = getProducts()
  const productIndex = products.findIndex(p => p.id === productId)
  if (productIndex !== -1) {
    products[productIndex].stock -= quantity
    saveToStorage(STORAGE_KEYS.products, products)
  }
}

export function deleteProduct(productId: string): void {
  const products = getProducts().filter(p => p.id !== productId)
  saveToStorage(STORAGE_KEYS.products, products)
}

export function updateProduct(productId: string, data: Partial<Omit<Product, 'id' | 'createdAt'>>): Product | null {
  const products = getProducts()
  const index = products.findIndex(p => p.id === productId)
  if (index === -1) return null
  products[index] = { ...products[index], ...data }
  saveToStorage(STORAGE_KEYS.products, products)
  return products[index]
}

// Transaction functions
export function getTransactions(): Transaction[] {
  const transactions = getFromStorage<Transaction[]>(STORAGE_KEYS.transactions, [])
  const lineItems = getFromStorage<LineItem[]>(STORAGE_KEYS.lineItems, [])
  
  return transactions.map(tx => ({
    ...tx,
    lineItems: lineItems.filter(item => item.transactionId === tx.id),
  }))
}

export function createTransaction(
  transaction: Omit<Transaction, 'id' | 'createdAt' | 'lineItems'>,
  cartItems: CartItem[]
): Transaction {
  const transactions = getFromStorage<Transaction[]>(STORAGE_KEYS.transactions, [])
  const lineItems = getFromStorage<LineItem[]>(STORAGE_KEYS.lineItems, [])
  
  const transactionId = 'TRX_' + Date.now()
  const now = new Date().toISOString()
  
  const newTransaction: Transaction = {
    ...transaction,
    id: transactionId,
    createdAt: now,
  }
  
  transactions.push(newTransaction)
  saveToStorage(STORAGE_KEYS.transactions, transactions)
  
  // Create line items
  const newLineItems: LineItem[] = cartItems.map((item, index) => ({
    id: `line_${Date.now()}_${index}`,
    transactionId,
    productId: item.productId,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    createdAt: now,
  }))
  
  lineItems.push(...newLineItems)
  saveToStorage(STORAGE_KEYS.lineItems, lineItems)
  
  // Update product stock
  cartItems.forEach(item => {
    updateProductStock(item.productId, item.quantity)
  })
  
  return { ...newTransaction, lineItems: newLineItems }
}

// Settings functions
export function getSettings(): Settings {
  return getFromStorage(STORAGE_KEYS.settings, defaultSettings)
}

export function updateSettings(settings: Partial<Settings>): Settings {
  const currentSettings = getSettings()
  const newSettings = { ...currentSettings, ...settings }
  saveToStorage(STORAGE_KEYS.settings, newSettings)
  return newSettings
}

// Utility functions
export function formatCurrency(amount: number): string {
  const settings = getSettings()
  return settings.currencySymbol + amount.toLocaleString('id-ID')
}

export function getProductEmoji(category: string): string {
  const emojiMap: Record<string, string> = {
    Food: '🍲',
    Drink: '🥤',
    Dessert: '🍰',
    Appetizer: '🥢',
    Main: '🍖',
    Beverage: '🍹',
    Snack: '🍪',
    Burger: '🍔',
    Pizza: '🍕',
    Noodle: '🍜',
    Rice: '🍚',
    Coffee: '☕',
  }
  return emojiMap[category] || '🍽️'
}
