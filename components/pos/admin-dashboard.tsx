"use client"

import { useState, useMemo } from 'react'
import { 
  LayoutGrid, 
  Package, 
  Tag, 
  History, 
  BarChart3, 
  Settings,
  Plus,
  Trash2,
  Users,
  Eye,
  Download,
  Pencil
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { usePOS } from '@/lib/pos-context'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getProductEmoji } from '@/lib/pos-store'

type AdminTab = 'dashboard' | 'products' | 'categories' | 'transactions' | 'reports' | 'settings'

export function AdminDashboard() {
  const { 
    products, 
    categories, 
    transactions,
    users,
    settings,
    createProduct,
    updateProduct,
    deleteProduct,
    createCategory,
    updateCategory,
    deleteCategory,
    deleteUser,
    updateSettings,
    formatCurrency,
  } = usePOS()
  const { toast } = useToast()
  
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard')
  const [isAddProductOpen, setIsAddProductOpen] = useState(false)
  const [isEditProductOpen, setIsEditProductOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<typeof products[0] | null>(null)
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false)
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<typeof categories[0] | null>(null)
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false)
  const [isViewTransactionOpen, setIsViewTransactionOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<typeof transactions[0] | null>(null)
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
  
  // Product form state
  const [productName, setProductName] = useState('')
  const [productCategory, setProductCategory] = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [productStock, setProductStock] = useState('')
  
  // Category form state
  const [categoryName, setCategoryName] = useState('')
  const [editCategoryName, setEditCategoryName] = useState('')
  
  // Edit product form state
  const [editProductName, setEditProductName] = useState('')
  const [editProductCategory, setEditProductCategory] = useState('')
  const [editProductPrice, setEditProductPrice] = useState('')
  const [editProductStock, setEditProductStock] = useState('')
  
  // Settings form state
  const [storeName, setStoreName] = useState(settings.storeName)
  const [notificationEmail, setNotificationEmail] = useState(settings.notificationEmail)
  const [minStock, setMinStock] = useState(settings.minStock.toString())

  // Calculated stats
  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  
  const todayTransactions = transactions.filter(tx => new Date(tx.createdAt) >= startOfToday)
  const monthTransactions = transactions.filter(tx => new Date(tx.createdAt) >= startOfMonth)
  
  const todayRevenue = todayTransactions.reduce((sum, tx) => sum + tx.total, 0)
  const monthRevenue = monthTransactions.reduce((sum, tx) => sum + tx.total, 0)
  
  const lowStockProducts = products.filter(p => p.stock < settings.minStock)

  // Top selling products
  const productSales: Record<string, number> = {}
  transactions.forEach(tx => {
    const lineItems = tx.lineItems || []
    lineItems.forEach(item => {
      productSales[item.name] = (productSales[item.name] || 0) + item.quantity
    })
  })
  const topProducts = Object.entries(productSales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // Filtered transactions
  const getFilteredTransactions = () => {
    const now = new Date()
    switch (transactionFilter) {
      case 'today':
        return transactions.filter(tx => new Date(tx.createdAt) >= startOfToday)
      case 'week':
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay())
        startOfWeek.setHours(0, 0, 0, 0)
        return transactions.filter(tx => new Date(tx.createdAt) >= startOfWeek)
      case 'month':
        return transactions.filter(tx => new Date(tx.createdAt) >= startOfMonth)
      default:
        return transactions
    }
  }
  const filteredTransactions = getFilteredTransactions()

  // Monthly chart data calculations
  const monthlyChartData = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const currentYear = new Date().getFullYear()
    
    // Initialize data for all 12 months
    const monthlyData: Record<string, { month: string; revenue: number; quantity: number; transactions: number }> = {}
    monthNames.forEach((month, index) => {
      monthlyData[index] = { month, revenue: 0, quantity: 0, transactions: 0 }
    })
    
    // Aggregate transaction data by month
    transactions.forEach(tx => {
      const txDate = new Date(tx.createdAt)
      if (txDate.getFullYear() === currentYear) {
        const monthIndex = txDate.getMonth()
        monthlyData[monthIndex].revenue += tx.total
        monthlyData[monthIndex].transactions += 1
        
        // Sum up quantities from line items
        const lineItems = tx.lineItems || []
        lineItems.forEach(item => {
          monthlyData[monthIndex].quantity += item.quantity
        })
      }
    })
    
    return Object.values(monthlyData)
  }, [transactions])

  // Category breakdown data for pie chart
  const categoryChartData = useMemo(() => {
    const categoryTotals: Record<string, { category: string; quantity: number; revenue: number }> = {}
    
    transactions.forEach(tx => {
      const lineItems = tx.lineItems || []
      lineItems.forEach(item => {
        // Find the product's category
        const product = products.find(p => p.name === item.name)
        const categoryName = product?.category || 'Other'
        
        if (!categoryTotals[categoryName]) {
          categoryTotals[categoryName] = { category: categoryName, quantity: 0, revenue: 0 }
        }
        categoryTotals[categoryName].quantity += item.quantity
        categoryTotals[categoryName].revenue += item.price * item.quantity
      })
    })
    
    return Object.values(categoryTotals)
  }, [transactions, products])

  // Chart config
  const monthlyChartConfig: ChartConfig = {
    revenue: {
      label: 'Revenue',
      color: '#f59e0b',
    },
    quantity: {
      label: 'Quantity',
      color: '#6366f1',
    },
    transactions: {
      label: 'Transactions',
      color: '#10b981',
    },
  }

  const categoryChartConfig: ChartConfig = {
    quantity: {
      label: 'Quantity',
    },
  }

  const CATEGORY_COLORS = ['#f59e0b', '#6366f1', '#10b981', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316']

  const handleAddProduct = () => {
    if (!productName || !productCategory || !productPrice || !productStock) {
      toast({ title: 'Error', description: 'All fields are required', variant: 'destructive' })
      return
    }
    
    const result = createProduct({
      name: productName,
      category: productCategory,
      price: parseFloat(productPrice),
      stock: parseInt(productStock),
    })
    
    if (result.success) {
      toast({ title: 'Success', description: result.message })
      setIsAddProductOpen(false)
      setProductName('')
      setProductCategory('')
      setProductPrice('')
      setProductStock('')
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' })
    }
  }

  const handleAddCategory = () => {
    if (!categoryName) {
      toast({ title: 'Error', description: 'Category name is required', variant: 'destructive' })
      return
    }
    
    const result = createCategory(categoryName)
    
    if (result.success) {
      toast({ title: 'Success', description: result.message })
      setIsAddCategoryOpen(false)
      setCategoryName('')
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' })
    }
  }

  const openEditProduct = (product: typeof products[0]) => {
    setEditingProduct(product)
    setEditProductName(product.name)
    setEditProductCategory(product.category)
    setEditProductPrice(product.price.toString())
    setEditProductStock(product.stock.toString())
    setIsEditProductOpen(true)
  }

  const handleEditProduct = () => {
    if (!editingProduct || !editProductName || !editProductCategory || !editProductPrice || !editProductStock) {
      toast({ title: 'Error', description: 'All fields are required', variant: 'destructive' })
      return
    }
    
    const result = updateProduct(editingProduct.id, {
      name: editProductName,
      category: editProductCategory,
      price: parseFloat(editProductPrice),
      stock: parseInt(editProductStock),
    })
    
    if (result.success) {
      toast({ title: 'Success', description: result.message })
      setIsEditProductOpen(false)
      setEditingProduct(null)
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' })
    }
  }

  const openEditCategory = (category: typeof categories[0]) => {
    setEditingCategory(category)
    setEditCategoryName(category.name)
    setIsEditCategoryOpen(true)
  }

  const handleEditCategory = () => {
    if (!editingCategory || !editCategoryName) {
      toast({ title: 'Error', description: 'Category name is required', variant: 'destructive' })
      return
    }
    
    const result = updateCategory(editingCategory.id, editCategoryName)
    
    if (result.success) {
      toast({ title: 'Success', description: result.message })
      setIsEditCategoryOpen(false)
      setEditingCategory(null)
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' })
    }
  }

  const handleSaveSettings = () => {
    updateSettings({
      storeName,
      notificationEmail,
      minStock: parseInt(minStock) || 10,
    })
    toast({ title: 'Success', description: 'Settings saved successfully' })
  }

  const handleExportData = () => {
    if (transactions.length === 0) {
      toast({ title: 'No Data', description: 'There are no transactions to export', variant: 'destructive' })
      return
    }

    // Create CSV headers
    const headers = [
      'Transaction ID',
      'Date',
      'Time',
      'Customer Name',
      'Table Number',
      'Service Type',
      'Items',
      'Subtotal',
      'Discount (%)',
      'Total',
      'Payment Method',
      'Cashier'
    ]

    // Create CSV rows
    const rows = transactions.map(tx => {
      const date = new Date(tx.createdAt)
      const items = tx.lineItems?.map(item => `${item.name} x${item.quantity}`).join('; ') || ''
      const paymentLabels: Record<string, string> = { qris: 'QRIS', debit: 'Debit', credit: 'Credit', cash: 'Cash' }
      
      return [
        tx.id,
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
        tx.customerName,
        tx.tableNumber || '-',
        tx.serviceType,
        `"${items}"`,
        tx.subtotal,
        tx.discount,
        tx.total,
        paymentLabels[tx.paymentMethod] || tx.paymentMethod,
        tx.cashierName
      ]
    })

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({ title: 'Success', description: `Exported ${transactions.length} transactions to CSV` })
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'categories', label: 'Categories', icon: Tag },
    { id: 'transactions', label: 'Transactions', icon: History },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const

  return (
    <div className="fade-in">
      {/* Header with Export Button */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <Button 
          onClick={handleExportData}
          variant="outline"
          className="border-amber-500 text-amber-700 hover:bg-amber-50"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 mb-6 border-b-2 border-gray-200 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 font-semibold transition-colors border-b-3 ${
              activeTab === tab.id
                ? 'text-amber-600 border-b-2 border-amber-600'
                : 'text-gray-700 hover:text-amber-600'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <Card className="border-l-4 border-l-amber-500 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600 font-medium">📦 Total Products</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{products.length}</p>
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <Package className="w-3 h-3" /> Active stock
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-amber-500 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600 font-medium">🏷️ Total Categories</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{categories.length}</p>
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <Tag className="w-3 h-3" /> Categories saved
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-amber-500 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600 font-medium">📊 {"Today's Transactions"}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{todayTransactions.length}</p>
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <BarChart3 className="w-3 h-3" /> Sales
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-amber-500 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600 font-medium">💰 {"Today's Revenue"}</p>
                <p className="text-3xl font-bold text-indigo-600 mt-2">{formatCurrency(todayRevenue)}</p>
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <span>$</span> Total
                </p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">⚠️ Low Stock Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {lowStockProducts.length === 0 ? (
                <p className="text-gray-500 text-center py-5">No low stock items</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {lowStockProducts.map(product => (
                    <div key={product.id} className="flex justify-between items-center bg-white p-3 rounded-lg border-l-4 border-l-amber-500">
                      <div>
                        <span className="font-semibold text-gray-900">{product.name}</span>
                        <span className="text-gray-500 text-sm ml-2">({product.category})</span>
                      </div>
                      <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
                        {product.stock} units
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div>
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold text-gray-900">📦 Manage Products</h2>
            <Button onClick={() => setIsAddProductOpen(true)} className="bg-gradient-to-r from-amber-500 to-amber-700">
              <Plus className="w-4 h-4 mr-2" /> Add Product
            </Button>
          </div>
          
          <Card>
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-amber-500 to-amber-700">
                  <TableHead className="text-white font-semibold">Product Name</TableHead>
                  <TableHead className="text-white font-semibold">Category</TableHead>
                  <TableHead className="text-white font-semibold">Price</TableHead>
                  <TableHead className="text-white font-semibold">Stock</TableHead>
                  <TableHead className="text-white font-semibold">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-gray-500">No products</TableCell>
                  </TableRow>
                ) : (
                  products.map(product => (
                    <TableRow key={product.id} className="hover:bg-gray-50">
                      <TableCell className="font-semibold text-gray-900">{product.name}</TableCell>
                      <TableCell>
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                          {product.category}
                        </span>
                      </TableCell>
                      <TableCell>{formatCurrency(product.price)}</TableCell>
                      <TableCell>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          product.stock < settings.minStock 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {product.stock} units
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-amber-500 text-amber-700 hover:bg-amber-50"
                            onClick={() => openEditProduct(product)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              deleteProduct(product.id)
                              toast({ title: 'Success', description: 'Product deleted' })
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div>
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold text-gray-900">🏷️ Manage Categories</h2>
            <Button onClick={() => setIsAddCategoryOpen(true)} className="bg-gradient-to-r from-amber-500 to-amber-700">
              <Plus className="w-4 h-4 mr-2" /> Add Category
            </Button>
          </div>
          
          {categories.length === 0 ? (
            <Card className="p-10 text-center text-gray-500">
              No categories created yet. Add one to get started!
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(category => (
                <Card key={category.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                        {category.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{category.name}</p>
                        <p className="text-xs text-gray-400">
                          Created: {new Date(category.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 border-amber-500 text-amber-700 hover:bg-amber-50"
                        onClick={() => openEditCategory(category)}
                      >
                        <Pencil className="w-4 h-4 mr-2" /> Edit
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => {
                          deleteCategory(category.id)
                          toast({ title: 'Success', description: 'Category deleted' })
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div>
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold text-gray-900">📜 Transaction History</h2>
            <div className="flex gap-2">
              {(['today', 'week', 'month', 'all'] as const).map(filter => (
                <Button
                  key={filter}
                  size="sm"
                  variant={transactionFilter === filter ? 'default' : 'outline'}
                  onClick={() => setTransactionFilter(filter)}
                  className={transactionFilter === filter ? 'bg-gradient-to-r from-amber-500 to-amber-700' : ''}
                >
                  {filter === 'today' ? 'Today' : filter === 'week' ? 'This Week' : filter === 'month' ? 'This Month' : 'All'}
                </Button>
              ))}
            </div>
          </div>
          
          <Card>
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-amber-500 to-amber-700">
                  <TableHead className="text-white font-semibold">Transaction ID</TableHead>
                  <TableHead className="text-white font-semibold">Date</TableHead>
                  <TableHead className="text-white font-semibold">Customer</TableHead>
                  <TableHead className="text-white font-semibold">Items</TableHead>
                  <TableHead className="text-white font-semibold">Total</TableHead>
                  <TableHead className="text-white font-semibold">Payment</TableHead>
                  <TableHead className="text-white font-semibold">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-gray-500">No transactions</TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map(tx => {
                    const paymentLabels = { qris: 'QRIS', debit: 'Debit', credit: 'Credit', cash: 'Cash' }
                    return (
                      <TableRow key={tx.id} className="hover:bg-gray-50">
                        <TableCell className="font-mono text-sm">{tx.id}</TableCell>
                        <TableCell>{new Date(tx.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="font-semibold">{tx.customerName}</TableCell>
                        <TableCell>{tx.lineItems?.length || 0} items</TableCell>
                        <TableCell className="font-semibold text-amber-600">{formatCurrency(tx.total)}</TableCell>
                        <TableCell>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                            {paymentLabels[tx.paymentMethod]}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedTransaction(tx)
                              setIsViewTransactionOpen(true)
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900">📈 Financial Reports</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">{"Today's Revenue"}</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{formatCurrency(todayRevenue)}</p>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-indigo-500">
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">Monthly Revenue</p>
                <p className="text-3xl font-bold text-indigo-600 mt-2">{formatCurrency(monthRevenue)}</p>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">{"This Month's Transactions"}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{monthTransactions.length}</p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>⭐ Top Selling Products</CardTitle>
            </CardHeader>
            <CardContent>
              {topProducts.length === 0 ? (
                <p className="text-gray-500 text-center py-5">No data</p>
              ) : (
                <div className="space-y-2">
                  {topProducts.map(([name, qty]) => (
                    <div key={name} className="flex justify-between items-center bg-white p-3 rounded-lg border-l-4 border-l-amber-500">
                      <span className="font-semibold text-gray-900">{name}</span>
                      <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        {qty} units
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monthly Transaction History Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Transaction History</CardTitle>
              <CardDescription>
                Revenue volume vs quantity of products sold per month ({new Date().getFullYear()})
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-gray-500 text-center py-10">No transaction data available</p>
              ) : (
                <ChartContainer config={monthlyChartConfig} className="h-[350px] w-full">
                  <BarChart data={monthlyChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="month" 
                      tickLine={false} 
                      axisLine={false}
                      tickMargin={8}
                    />
                    <YAxis 
                      yAxisId="left" 
                      orientation="left" 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <ChartTooltip 
                      content={
                        <ChartTooltipContent 
                          formatter={(value, name) => {
                            if (name === 'revenue') {
                              return [formatCurrency(value as number), 'Revenue']
                            }
                            return [value, name === 'quantity' ? 'Quantity Sold' : 'Transactions']
                          }}
                        />
                      } 
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar 
                      yAxisId="left" 
                      dataKey="revenue" 
                      fill="var(--color-revenue)" 
                      radius={[4, 4, 0, 0]}
                      name="revenue"
                    />
                    <Bar 
                      yAxisId="right" 
                      dataKey="quantity" 
                      fill="var(--color-quantity)" 
                      radius={[4, 4, 0, 0]}
                      name="quantity"
                    />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Product Category Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sales by Product Category</CardTitle>
                <CardDescription>
                  Quantity distribution across product categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                {categoryChartData.length === 0 ? (
                  <p className="text-gray-500 text-center py-10">No category data available</p>
                ) : (
                  <ChartContainer config={categoryChartConfig} className="h-[300px] w-full">
                    <PieChart>
                      <ChartTooltip 
                        content={
                          <ChartTooltipContent 
                            formatter={(value, name, item) => {
                              const payload = item?.payload
                              return [
                                <span key="value" className="font-semibold">{value} units</span>,
                                payload?.category || name
                              ]
                            }}
                          />
                        } 
                      />
                      <Pie
                        data={categoryChartData}
                        dataKey="quantity"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={40}
                        paddingAngle={2}
                        label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} 
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transaction Trend</CardTitle>
                <CardDescription>
                  Number of transactions per month
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-gray-500 text-center py-10">No transaction data available</p>
                ) : (
                  <ChartContainer config={monthlyChartConfig} className="h-[300px] w-full">
                    <LineChart data={monthlyChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="month" 
                        tickLine={false} 
                        axisLine={false}
                        tickMargin={8}
                      />
                      <YAxis 
                        tickLine={false} 
                        axisLine={false}
                      />
                      <ChartTooltip 
                        content={
                          <ChartTooltipContent 
                            formatter={(value) => [value, 'Transactions']}
                          />
                        } 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="transactions" 
                        stroke="var(--color-transactions)" 
                        strokeWidth={3}
                        dot={{ fill: 'var(--color-transactions)', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900">⚙️ System Settings</h2>
          
          <Card className="max-w-xl">
            <CardContent className="pt-6 space-y-5">
              <div>
                <Label className="font-semibold text-gray-900">Store Name</Label>
                <Input
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Enter store name"
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label className="font-semibold text-gray-900">Notification Email</Label>
                <Input
                  type="email"
                  value={notificationEmail}
                  onChange={(e) => setNotificationEmail(e.target.value)}
                  placeholder="email@store.com"
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label className="font-semibold text-gray-900">Minimum Stock Level</Label>
                <Input
                  type="number"
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value)}
                  placeholder="10"
                  min="1"
                  className="mt-2"
                />
              </div>
              
              <Button onClick={handleSaveSettings} className="w-full bg-gradient-to-r from-amber-500 to-amber-700">
                <Settings className="w-4 h-4 mr-2" /> Save Settings
              </Button>
              
              <div className="pt-4 border-t">
                <Button onClick={() => setIsUserManagementOpen(true)} variant="outline" className="w-full">
                  <Users className="w-4 h-4 mr-2" /> Manage Users
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Product Modal */}
      <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div>
              <Label className="font-semibold">Product Name</Label>
              <Input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Example: Nasi Goreng"
                className="mt-2"
              />
            </div>
            
            <div>
              <Label className="font-semibold">Category</Label>
              <Select value={productCategory} onValueChange={setProductCategory}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="font-semibold">Price</Label>
              <Input
                type="number"
                value={productPrice}
                onChange={(e) => setProductPrice(e.target.value)}
                placeholder="15000"
                min="0"
                className="mt-2"
              />
            </div>
            
            <div>
              <Label className="font-semibold">Stock</Label>
              <Input
                type="number"
                value={productStock}
                onChange={(e) => setProductStock(e.target.value)}
                placeholder="100"
                min="0"
                className="mt-2"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsAddProductOpen(false)}>Cancel</Button>
            <Button onClick={handleAddProduct} className="bg-gradient-to-r from-amber-500 to-amber-700">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Category Modal */}
      <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
          </DialogHeader>
          
          <div className="pt-4">
            <Label className="font-semibold">Category Name</Label>
            <Input
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Example: Food"
              className="mt-2"
            />
          </div>
          
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsAddCategoryOpen(false)}>Cancel</Button>
            <Button onClick={handleAddCategory} className="bg-gradient-to-r from-amber-500 to-amber-700">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Management Modal */}
      <Dialog open={isUserManagementOpen} onOpenChange={setIsUserManagementOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Users</DialogTitle>
          </DialogHeader>
          
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.id}>
                    <TableCell className="font-semibold">{user.name}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {user.role === 'admin' ? 'Administrator' : 'Cashier'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          deleteUser(user.id)
                          toast({ title: 'Success', description: 'User deleted' })
                        }}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setIsUserManagementOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Transaction Modal */}
      <Dialog open={isViewTransactionOpen} onOpenChange={setIsViewTransactionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              {selectedTransaction?.id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Customer:</span>
                  <p className="font-semibold">{selectedTransaction.customerName}</p>
                </div>
                <div>
                  <span className="text-gray-500">Date:</span>
                  <p className="font-semibold">{new Date(selectedTransaction.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-500">Service Type:</span>
                  <p className="font-semibold capitalize">{selectedTransaction.serviceType}</p>
                </div>
                <div>
                  <span className="text-gray-500">Payment:</span>
                  <p className="font-semibold uppercase">{selectedTransaction.paymentMethod}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <p className="font-semibold mb-2">Items:</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedTransaction.lineItems?.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                      <span>{item.name} x{item.quantity}</span>
                      <span className="font-semibold">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(selectedTransaction.subtotal)}</span>
                </div>
                {selectedTransaction.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount:</span>
                    <span>-{formatCurrency(selectedTransaction.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg text-amber-600">
                  <span>Total:</span>
                  <span>{formatCurrency(selectedTransaction.total)}</span>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setIsViewTransactionOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Modal */}
      <Dialog open={isEditProductOpen} onOpenChange={setIsEditProductOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update the product details below.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-product-name">Product Name</Label>
              <Input
                id="edit-product-name"
                value={editProductName}
                onChange={(e) => setEditProductName(e.target.value)}
                placeholder="Enter product name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-product-category">Category</Label>
              <Select value={editProductCategory} onValueChange={setEditProductCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-product-price">Price</Label>
              <Input
                id="edit-product-price"
                type="number"
                value={editProductPrice}
                onChange={(e) => setEditProductPrice(e.target.value)}
                placeholder="Enter price"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-product-stock">Stock</Label>
              <Input
                id="edit-product-stock"
                type="number"
                value={editProductStock}
                onChange={(e) => setEditProductStock(e.target.value)}
                placeholder="Enter stock quantity"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditProductOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditProduct} className="bg-gradient-to-r from-amber-500 to-amber-700">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Modal */}
      <Dialog open={isEditCategoryOpen} onOpenChange={setIsEditCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the category name below.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-category-name">Category Name</Label>
              <Input
                id="edit-category-name"
                value={editCategoryName}
                onChange={(e) => setEditCategoryName(e.target.value)}
                placeholder="Enter category name"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditCategoryOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditCategory} className="bg-gradient-to-r from-amber-500 to-amber-700">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
