"use client"

import { useState } from 'react'
import { 
  CreditCard, 
  Trash2, 
  Plus, 
  Minus,
  UtensilsCrossed,
  ShoppingBag,
  Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { usePOS } from '@/lib/pos-context'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getProductEmoji, type Transaction } from '@/lib/pos-store'

type ServiceType = 'dine-in' | 'takeaway'
type PaymentMethod = 'qris' | 'debit' | 'credit' | 'cash'

export function CashierDashboard() {
  const { 
    products, 
    categories,
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    checkout,
    settings,
    formatCurrency,
  } = usePOS()
  const { toast } = useToast()
  
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [serviceType, setServiceType] = useState<ServiceType>('dine-in')
  const [customerName, setCustomerName] = useState('')
  const [tableNumber, setTableNumber] = useState('')
  const [discount, setDiscount] = useState('')
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>({})
  
  // Payment modal state
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null)
  
  // Receipt modal state
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)
  const [completedTransaction, setCompletedTransaction] = useState<Transaction | null>(null)

  // Filter products by category
  const filteredProducts = selectedCategory 
    ? products.filter(p => p.category === selectedCategory)
    : products

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discountAmount = parseFloat(discount) || 0
  const total = Math.max(0, subtotal - discountAmount)

  const handleAddToCart = (productId: string) => {
    const product = products.find(p => p.id === productId)
    if (!product) return
    
    const quantity = productQuantities[productId] || 1
    
    // Check stock
    const cartItem = cart.find(i => i.productId === productId)
    const currentInCart = cartItem?.quantity || 0
    if (currentInCart + quantity > product.stock) {
      toast({ title: 'Error', description: 'Not enough stock', variant: 'destructive' })
      return
    }
    
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
    }, quantity)
    
    // Reset quantity
    setProductQuantities(prev => ({ ...prev, [productId]: 1 }))
    toast({ title: 'Added to Cart', description: `${product.name} × ${quantity}` })
  }

  const updateQuantity = (productId: string, delta: number) => {
    setProductQuantities(prev => {
      const current = prev[productId] || 1
      const product = products.find(p => p.id === productId)
      const maxStock = product?.stock || 1
      const newQty = Math.max(1, Math.min(maxStock, current + delta))
      return { ...prev, [productId]: newQty }
    })
  }

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({ title: 'Error', description: 'Cart is empty', variant: 'destructive' })
      return
    }
    setIsPaymentOpen(true)
  }

  const handleConfirmPayment = () => {
    if (!selectedPayment) {
      toast({ title: 'Error', description: 'Please select a payment method', variant: 'destructive' })
      return
    }
    
    const transaction = checkout({
      discount: discountAmount,
      customerName: customerName || 'Anonymous',
      tableNumber: serviceType === 'dine-in' ? tableNumber : 'N/A',
      serviceType,
      paymentMethod: selectedPayment,
    })
    
    if (transaction) {
      setCompletedTransaction(transaction)
      setIsPaymentOpen(false)
      setIsReceiptOpen(true)
      
      // Reset form
      setCustomerName('')
      setTableNumber('')
      setDiscount('')
      setSelectedPayment(null)
    }
  }

  const handleClearCart = () => {
    if (cart.length === 0) {
      toast({ title: 'Info', description: 'Cart is already empty' })
      return
    }
    clearCart()
    setDiscount('')
    setCustomerName('')
    setTableNumber('')
    toast({ title: 'Success', description: 'Cart cleared' })
  }

  const paymentMethods: { id: PaymentMethod; label: string; emoji: string; desc: string }[] = [
    { id: 'qris', label: 'QRIS', emoji: '📱', desc: 'Scan QR Code' },
    { id: 'debit', label: 'Debit Card', emoji: '💳', desc: 'Insert/Tap Card' },
    { id: 'credit', label: 'Credit Card', emoji: '💳', desc: 'Insert/Tap Card' },
    { id: 'cash', label: 'Cash', emoji: '💵', desc: 'Count & Receive' },
  ]

  const paymentLabels = { qris: 'QRIS', debit: 'Debit Card', credit: 'Credit Card', cash: 'Cash' }
  const paymentEmojis = { qris: '📱', debit: '💳', credit: '💳', cash: '💵' }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 h-full fade-in">
      {/* Products Section */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Select Products</h2>
        
        {/* Category Filters */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <Button
            size="sm"
            onClick={() => setSelectedCategory('')}
            className={selectedCategory === '' 
              ? 'bg-gradient-to-r from-amber-500 to-amber-700 text-white' 
              : 'bg-white text-gray-700 border border-gray-200 hover:border-amber-500'
            }
          >
            All Products
          </Button>
          {categories.map(cat => (
            <Button
              key={cat.id}
              size="sm"
              onClick={() => setSelectedCategory(cat.name)}
              className={selectedCategory === cat.name 
                ? 'bg-gradient-to-r from-amber-500 to-amber-700 text-white' 
                : 'bg-white text-gray-700 border border-gray-200 hover:border-amber-500'
              }
            >
              {cat.name}
            </Button>
          ))}
        </div>
        
        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filteredProducts.length === 0 ? (
            <p className="col-span-full text-center text-gray-500 py-10">No products available</p>
          ) : (
            filteredProducts.map(product => {
              const qty = productQuantities[product.id] || 1
              const isOutOfStock = product.stock === 0
              
              return (
                <Card 
                  key={product.id} 
                  className={`transition-all hover:shadow-lg hover:-translate-y-1 ${
                    isOutOfStock ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-amber-500'
                  }`}
                >
                  <CardContent className="p-3 flex flex-col min-h-[180px]">
                    <div className="text-center text-3xl mb-2">
                      {getProductEmoji(product.category)}
                    </div>
                    <p className="font-semibold text-gray-900 text-sm leading-tight mb-1">{product.name}</p>
                    <p className="font-bold text-amber-600 text-sm mb-1">{formatCurrency(product.price)}</p>
                    <p className="text-xs text-gray-400 mb-3">
                      {isOutOfStock ? 'Out of Stock' : `${product.stock} in stock`}
                    </p>
                    
                    {!isOutOfStock && (
                      <>
                        <div className="flex items-center gap-1 mb-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 w-7 p-0"
                            onClick={() => updateQuantity(product.id, -1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <Input
                            type="number"
                            value={qty}
                            onChange={(e) => {
                              const val = Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1))
                              setProductQuantities(prev => ({ ...prev, [product.id]: val }))
                            }}
                            className="h-7 w-10 text-center text-sm p-0"
                            min={1}
                            max={product.stock}
                          />
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 w-7 p-0"
                            onClick={() => updateQuantity(product.id, 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <Button 
                          size="sm" 
                          className="w-full bg-gradient-to-r from-amber-500 to-amber-700 text-white text-xs"
                          onClick={() => handleAddToCart(product.id)}
                        >
                          Add to Cart
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>

      {/* Cart Section */}
      <Card className="h-fit sticky top-4">
        <CardContent className="p-5 flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Shopping Cart</h3>
          
          {/* Service Type Selection */}
          <div className="flex gap-2 mb-4">
            <Button
              size="sm"
              onClick={() => setServiceType('dine-in')}
              className={`flex-1 ${serviceType === 'dine-in' 
                ? 'bg-gradient-to-r from-amber-500 to-amber-700 text-white' 
                : 'bg-gray-200 text-gray-700'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4 mr-1" /> Dine In
            </Button>
            <Button
              size="sm"
              onClick={() => setServiceType('takeaway')}
              className={`flex-1 ${serviceType === 'takeaway' 
                ? 'bg-gradient-to-r from-amber-500 to-amber-700 text-white' 
                : 'bg-gray-200 text-gray-700'
              }`}
            >
              <ShoppingBag className="w-4 h-4 mr-1" /> Takeaway
            </Button>
          </div>
          
          {/* Customer Name */}
          <div className="mb-3">
            <Label className="text-xs font-semibold text-gray-700">Customer Name</Label>
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer name"
              className="mt-1 text-sm"
            />
          </div>
          
          {/* Table Number (dine-in only) */}
          {serviceType === 'dine-in' && (
            <div className="mb-3">
              <Label className="text-xs font-semibold text-gray-700">Table Number</Label>
              <Input
                type="number"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="Enter table number"
                min={1}
                className="mt-1 text-sm"
              />
            </div>
          )}
          
          {/* Cart Items */}
          <div className="flex-1 min-h-[200px] max-h-[300px] overflow-y-auto mb-4">
            {cart.length === 0 ? (
              <p className="text-gray-400 text-center py-10">Cart is empty</p>
            ) : (
              <div className="space-y-2">
                {cart.map((item, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between bg-white p-3 rounded-lg border-l-4 border-l-amber-500 shadow-sm"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatCurrency(item.price)} × {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-indigo-600 text-sm">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 w-7 p-0"
                        onClick={() => removeFromCart(index)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Totals */}
          <div className="border-t-2 border-gray-100 pt-3 mb-3">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">Subtotal:</span>
              <span className="font-semibold">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-sm mb-3">
              <span className="text-gray-500">Discount:</span>
              <Input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="0"
                min={0}
                className="w-20 h-7 text-sm p-1"
              />
            </div>
            <div className="flex justify-between text-lg font-bold text-indigo-600">
              <span>Total:</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              className="flex-1 bg-gradient-to-r from-amber-500 to-amber-700"
              onClick={handleCheckout}
              disabled={cart.length === 0}
            >
              <CreditCard className="w-4 h-4 mr-2" /> Checkout
            </Button>
            <Button 
              variant="destructive"
              className="flex-1"
              onClick={handleClearCart}
            >
              <Trash2 className="w-4 h-4 mr-2" /> Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Modal */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">💳 Payment Method</DialogTitle>
            <p className="text-center text-gray-500 text-sm">Select how customer will pay</p>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Amount Display */}
            <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500 font-semibold">TOTAL AMOUNT</p>
                  <p className="text-2xl font-bold text-amber-600">{formatCurrency(total)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold">ITEMS</p>
                  <p className="text-xl font-bold text-gray-900">{cart.length}</p>
                </div>
              </div>
            </div>
            
            {/* Payment Methods */}
            <div className="grid grid-cols-2 gap-3">
              {paymentMethods.map(method => (
                <button
                  key={method.id}
                  onClick={() => setSelectedPayment(method.id)}
                  className={`p-5 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                    selectedPayment === method.id
                      ? 'border-amber-500 bg-amber-50 shadow-md'
                      : 'border-gray-200 hover:border-amber-400'
                  }`}
                >
                  <span className="text-4xl">{method.emoji}</span>
                  <span className="font-semibold text-gray-900">{method.label}</span>
                  <span className="text-xs text-gray-400">{method.desc}</span>
                </button>
              ))}
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button 
                variant="secondary" 
                className="flex-1"
                onClick={() => setIsPaymentOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-gradient-to-r from-amber-500 to-amber-700"
                onClick={handleConfirmPayment}
                disabled={!selectedPayment}
              >
                <Check className="w-4 h-4 mr-2" /> Confirm Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Modal - Classic Paper Receipt Style */}
      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent className="sm:max-w-[320px] p-0 overflow-hidden bg-transparent border-0 shadow-none">
          {completedTransaction && (
            <div className="relative">
              {/* Receipt Paper */}
              <div 
                className="bg-[#fffef8] mx-auto shadow-xl"
                style={{
                  fontFamily: "'Courier New', Courier, monospace",
                  backgroundImage: `
                    repeating-linear-gradient(
                      0deg,
                      transparent,
                      transparent 27px,
                      rgba(0,0,0,0.03) 27px,
                      rgba(0,0,0,0.03) 28px
                    )
                  `,
                }}
              >
                {/* Torn edge top */}
                <div 
                  className="h-3 w-full"
                  style={{
                    background: `linear-gradient(135deg, #fffef8 33.33%, transparent 33.33%), 
                                linear-gradient(225deg, #fffef8 33.33%, transparent 33.33%)`,
                    backgroundSize: '12px 12px',
                    backgroundColor: 'transparent',
                  }}
                />

                <div className="px-4 py-3">
                  {/* Store Header */}
                  <div className="text-center border-b border-dashed border-gray-400 pb-3 mb-3">
                    <p className="text-lg font-bold tracking-tight text-gray-900">{settings.storeName.toUpperCase()}</p>
                    <p className="text-[10px] text-gray-600">Premium Coffee & Cafe</p>
                    <p className="text-[10px] text-gray-500">Jl. Contoh No. 123, Jakarta</p>
                    <p className="text-[10px] text-gray-500">Tel: (021) 1234-5678</p>
                  </div>

                  {/* Transaction Info */}
                  <div className="text-[11px] text-gray-700 mb-3 space-y-0.5">
                    <div className="flex justify-between">
                      <span>No</span>
                      <span className="font-semibold">{completedTransaction.id.replace('TRX_', '#')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date</span>
                      <span>{new Date(completedTransaction.createdAt).toLocaleDateString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time</span>
                      <span>{new Date(completedTransaction.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cashier</span>
                      <span>{completedTransaction.cashierName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Customer</span>
                      <span>{completedTransaction.customerName}</span>
                    </div>
                    {completedTransaction.tableNumber !== 'N/A' && (
                      <div className="flex justify-between">
                        <span>Table</span>
                        <span>{completedTransaction.tableNumber}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Type</span>
                      <span className="uppercase">{completedTransaction.serviceType}</span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-dashed border-gray-400 my-2" />
                  <p className="text-[10px] text-center text-gray-500 mb-2">*** ORDER DETAILS ***</p>

                  {/* Items */}
                  <div className="space-y-1.5 mb-2 max-h-40 overflow-y-auto">
                    {completedTransaction.lineItems?.map((item, i) => (
                      <div key={i} className="text-[11px] text-gray-800">
                        <div className="flex justify-between">
                          <span className="font-medium truncate max-w-[140px]">{item.name}</span>
                          <span className="font-semibold">{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 pl-2">
                          {item.quantity} x {formatCurrency(item.price)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-dashed border-gray-400 my-2" />

                  {/* Totals */}
                  <div className="text-[11px] space-y-1">
                    <div className="flex justify-between text-gray-700">
                      <span>Subtotal</span>
                      <span>{formatCurrency(completedTransaction.subtotal)}</span>
                    </div>
                    {completedTransaction.discount > 0 && (
                      <div className="flex justify-between text-gray-700">
                        <span>Discount</span>
                        <span>-{formatCurrency(completedTransaction.discount)}</span>
                      </div>
                    )}
                    <div className="border-t border-gray-300 my-1" />
                    <div className="flex justify-between font-bold text-sm text-gray-900">
                      <span>TOTAL</span>
                      <span>{formatCurrency(completedTransaction.total)}</span>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="border-t border-dashed border-gray-400 my-2" />
                  <div className="text-[11px] space-y-0.5 text-gray-700">
                    <div className="flex justify-between">
                      <span>Payment</span>
                      <span className="font-semibold">{paymentLabels[completedTransaction.paymentMethod]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status</span>
                      <span className="font-semibold">PAID</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="border-t border-dashed border-gray-400 mt-3 pt-3">
                    <div className="text-center space-y-1">
                      <p className="text-[11px] font-semibold text-gray-800">** THANK YOU **</p>
                      <p className="text-[10px] text-gray-500">Please come again!</p>
                      <p className="text-[10px] text-gray-400">--------------------------------</p>
                      <p className="text-[9px] text-gray-400">Items sold are non-refundable</p>
                      <p className="text-[9px] text-gray-400">Keep this receipt for your records</p>
                    </div>
                  </div>

                  {/* Barcode simulation */}
                  <div className="mt-3 flex justify-center">
                    <div className="flex gap-[2px] items-end h-8">
                      {Array.from({ length: 30 }).map((_, i) => (
                        <div 
                          key={i} 
                          className="bg-gray-800" 
                          style={{ 
                            width: Math.random() > 0.5 ? '2px' : '1px',
                            height: `${Math.random() * 16 + 16}px`
                          }} 
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-[8px] text-center text-gray-400 mt-1 font-mono">
                    {completedTransaction.id}
                  </p>
                </div>

                {/* Torn edge bottom */}
                <div 
                  className="h-3 w-full"
                  style={{
                    background: `linear-gradient(315deg, #fffef8 33.33%, transparent 33.33%), 
                                linear-gradient(45deg, #fffef8 33.33%, transparent 33.33%)`,
                    backgroundSize: '12px 12px',
                    backgroundColor: 'transparent',
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex gap-3 px-2">
                <Button 
                  variant="outline" 
                  className="flex-1 bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  onClick={() => window.print()}
                >
                  Print Receipt
                </Button>
                <Button 
                  className="flex-1 bg-gray-900 hover:bg-gray-800 text-white"
                  onClick={() => {
                    setIsReceiptOpen(false)
                    setCompletedTransaction(null)
                    toast({ title: 'Ready!', description: 'Select items for next order' })
                  }}
                >
                  <Check className="w-4 h-4 mr-2" /> Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
