import { createFileRoute } from "@tanstack/react-router"
import { Box } from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, useMemo } from "react"

import { ProductsService, SalesService, type ProductPublic, OpenAPI } from "../../client"
import useCustomToast from "../../hooks/useCustomToast"
import useAuth from "../../hooks/useAuth"
import { ActionButtons } from "@/components/POS/ActionButtons"
import { ReceiptDetails } from "@/components/POS/ReceiptDetails"
import { ProductTable } from "@/components/POS/ProductTable"
import { CustomerPanel } from "@/components/POS/CustomerPanel"
import { PaymentModal } from "@/components/POS/PaymentModal"
import { RecentReceiptsModal } from "@/components/POS/RecentReceiptsModal"
import { ReceiptPreviewModal } from "@/components/POS/ReceiptPreviewModal"
import { CartItem, SuspendedSale } from "@/components/POS/types"

export const Route = createFileRoute("/_layout/sales")({
  component: Sales,
})

function Sales() {
  const queryClient = useQueryClient()
  const showToast = useCustomToast()
  const { logout } = useAuth()
  
  // State management
  const [searchQuery, setSearchQuery] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isRecentReceiptsModalOpen, setIsRecentReceiptsModalOpen] = useState(false)
  const [isReceiptPreviewModalOpen, setIsReceiptPreviewModalOpen] = useState(false)
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null)
  const [receiptDateValue, setReceiptDateValue] = useState<string>(new Date().toISOString().split('T')[0])
  const [receiptDate, setReceiptDate] = useState<string>(() => {
    const today = new Date()
    const day = today.getDate().toString().padStart(2, '0')
    const month = today.toLocaleString('en-US', { month: 'short' })
    const year = today.getFullYear()
    return `${day}/${month}/${year}`
  })
  const [pricelist, setPricelist] = useState<string>("RETAIL 0.0")
  const [suspendedSales, setSuspendedSales] = useState<SuspendedSale[]>([])
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"customer" | "suspended">("customer")
  
  // Customer state
  const [customerName, setCustomerName] = useState<string>("")
  const [customerTel, setCustomerTel] = useState<string>("")
  const [customerBalance, setCustomerBalance] = useState<number>(0)
  const [remarks, setRemarks] = useState<string>("")
  const [customerPin, setCustomerPin] = useState<string>("")

  // Fetch payment methods
  const { data: paymentMethods, isLoading: isLoadingPaymentMethods, error: paymentMethodsError } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: () => SalesService.readPaymentMethods({ limit: 100 }),
  })


  // Search products
  const searchProducts = useQuery({
    queryKey: ["search-products", searchQuery],
    queryFn: () =>
      SalesService.searchProductsForSale({
        q: searchQuery || "a",
        limit: 50,
      }),
    enabled: true,
  })

  // Create sale mutation
  const createSale = useMutation({
    mutationFn: (data: {
      productId: string
      quantity: number
      unitPrice: number
      totalAmount: number
      paymentMethodId: string
      customerName?: string | null
      notes?: string | null
    }) =>
      SalesService.createSale({
        requestBody: {
          product_id: data.productId,
          quantity: data.quantity,
          unit_price: data.unitPrice,
          total_amount: data.totalAmount,
          payment_method_id: data.paymentMethodId,
          customer_name: data.customerName || null,
          notes: data.notes || null,
        },
      }),
    onError: (error: any) => {
      const detail = error.body?.detail || "Failed to create sale"
      showToast.showErrorToast(detail)
      throw error
    },
  })

  // Cart management
  const addToCart = (product: ProductPublic) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product.id === product.id)
      if (existingItem) {
        if (existingItem.quantity + 1 > (product.current_stock || 0)) {
          showToast.showErrorToast("Insufficient stock")
          return prevCart
        }
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prevCart, { product, quantity: 1, discount: 0 }]
    })
  }

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId))
  }

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.product.id === productId) {
            const newQuantity = item.quantity + delta
            if (newQuantity > (item.product.current_stock || 0)) {
              showToast.showErrorToast("Insufficient stock")
              return item
            }
            return { ...item, quantity: newQuantity }
          }
          return item
        })
        .filter((item) => item.quantity > 0)
    )
  }

  const updateDiscount = (productId: string, discount: number) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId ? { ...item, discount: Math.max(0, Math.min(100, discount)) } : item
      )
    )
  }

  // Calculate totals
  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => {
      const price = Number(item.product.selling_price)
      const discountAmount = (price * item.quantity * (item.discount || 0)) / 100
      return total + (price * item.quantity - discountAmount)
    }, 0)
  }, [cart])

  // Suspend sale
  const suspendSale = () => {
    if (cart.length === 0) {
      showToast.showErrorToast("Cart is empty")
      return
    }
    const suspendedSale: SuspendedSale = {
      id: Date.now().toString(),
      cart: [...cart],
      customer: customerName ? { name: customerName, tel: customerTel, balance: customerBalance } : undefined,
      receiptDate,
      pricelist,
      remarks: remarks || undefined,
    }
    setSuspendedSales([...suspendedSales, suspendedSale])
    setCart([])
    setCustomerName("")
    setCustomerTel("")
    setCustomerBalance(0)
    setRemarks("")
    showToast.showSuccessToast("Sale suspended successfully")
  }

  // Resume sale
  const resumeSale = (saleId: string) => {
    const sale = suspendedSales.find((s) => s.id === saleId)
    if (sale) {
      setCart(sale.cart)
      if (sale.customer) {
        setCustomerName(sale.customer.name)
        setCustomerTel(sale.customer.tel)
        setCustomerBalance(sale.customer.balance)
      }
      setReceiptDate(sale.receiptDate)
      setPricelist(sale.pricelist)
      setRemarks(sale.remarks || "")
      setSuspendedSales(suspendedSales.filter((s) => s.id !== saleId))
      setSelectedSaleId(null)
      showToast.showSuccessToast("Sale resumed")
    }
  }

  // Open payment modal
  const openPaymentModal = () => {
    if (cart.length === 0) {
      showToast.showErrorToast("Cart is empty")
      return
    }
    setIsPaymentModalOpen(true)
    }

  // Process payment with multiple payment methods
  const processPayment = async (payments: Record<string, { amount: number; refNo?: string }>) => {
    try {
      // Note: Stock validation is handled by the backend endpoint
      // No need to validate here as it causes unnecessary API calls and potential CORS issues

      // Convert payments to array format for API
      const paymentArray = Object.entries(payments)
        .filter(([_, payment]) => payment.amount > 0)
        .map(([methodId, payment]) => ({
          payment_method_id: methodId,
          amount: payment.amount,
          reference_number: payment.refNo || null,
        }))

      // Validate total payments (allow overpayment for change, but not underpayment)
      const totalPaid = paymentArray.reduce((sum, p) => sum + p.amount, 0)
      const difference = totalPaid - cartTotal
      
      // Check if payment is less than cart total (underpayment)
      if (difference < -0.01) {
        showToast.showErrorToast(
          `Payment total (${totalPaid.toFixed(2)}) is less than cart total (${cartTotal.toFixed(2)}). Please add ${Math.abs(difference).toFixed(2)} more.`
        )
        return
      }
      
      // If there's a small underpayment (0.01-0.10), adjust the largest payment to match exactly
      if (difference >= -0.10 && difference < -0.01 && paymentArray.length > 0) {
        // Find the largest payment and adjust it to make totals match exactly
        const largestPaymentIndex = paymentArray.reduce((maxIdx, p, idx) => 
          p.amount > paymentArray[maxIdx].amount ? idx : maxIdx, 0
        )
        const adjustment = cartTotal - totalPaid
        paymentArray[largestPaymentIndex].amount += adjustment
      }
      
      // Overpayment is allowed (for change), so we don't need to adjust or error on that

      // Process each cart item with all payment methods
      for (let itemIndex = 0; itemIndex < cart.length; itemIndex++) {
        const item = cart[itemIndex]
        const unitPrice = Number(item.product.selling_price)
        const discountAmount = (unitPrice * item.quantity * (item.discount || 0)) / 100
        const itemTotal = unitPrice * item.quantity - discountAmount
        
        // Calculate payment amounts proportionally for this item
        const itemPaymentRatio = itemTotal / cartTotal
        const isLastItem = itemIndex === cart.length - 1
        
        const itemPayments = paymentArray.map((payment, paymentIndex) => {
          let amount = payment.amount * itemPaymentRatio
          
          // For the last item, ensure we use the remaining amount to avoid rounding errors
          if (isLastItem) {
            // Calculate what was already allocated to previous items
            const previousItemsTotal = cart.slice(0, -1).reduce((sum, prevItem) => {
              const prevUnitPrice = Number(prevItem.product.selling_price)
              const prevDiscountAmount = (prevUnitPrice * prevItem.quantity * (prevItem.discount || 0)) / 100
              return sum + (prevUnitPrice * prevItem.quantity - prevDiscountAmount)
            }, 0)
            const previousRatio = previousItemsTotal / cartTotal
            const alreadyAllocated = payment.amount * previousRatio
            amount = payment.amount - alreadyAllocated
          }
          
          // Round to 2 decimal places
          return {
            payment_method_id: payment.payment_method_id,
            amount: Math.round(amount * 100) / 100,
            reference_number: payment.reference_number,
          }
        })
        
        // Ensure item payment totals match item total exactly (adjust largest payment if needed)
        const itemPaymentsTotal = itemPayments.reduce((sum, p) => sum + p.amount, 0)
        const difference = itemTotal - itemPaymentsTotal
        if (Math.abs(difference) > 0.001 && itemPayments.length > 0) {
          // Adjust the largest payment to match exactly
          const largestPaymentIndex = itemPayments.reduce((maxIdx, p, idx) => 
            p.amount > itemPayments[maxIdx].amount ? idx : maxIdx, 0
          )
          itemPayments[largestPaymentIndex].amount = Math.round((itemPayments[largestPaymentIndex].amount + difference) * 100) / 100
        }

        // Use the new multi-payment endpoint
        const token = await OpenAPI.TOKEN?.() || localStorage.getItem("access_token") || ""
        const apiBase = OpenAPI.BASE || import.meta.env.VITE_API_URL || ""
        
        const response = await fetch(`${apiBase}/api/v1/sales/multi-payment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            product_id: item.product.id,
            quantity: item.quantity,
            unit_price: unitPrice,
            total_amount: itemTotal,
            customer_name: customerName || null,
            notes: remarks || null,
            payments: itemPayments,
          }),
        })

        if (!response.ok) {
          let errorMessage = "Failed to create sale"
          try {
            const error = await response.json()
            errorMessage = error.detail || error.message || errorMessage
          } catch (e) {
            errorMessage = `HTTP ${response.status}: ${response.statusText}`
          }
          throw new Error(errorMessage)
        }
      }

      showToast.showSuccessToast(`Sale completed successfully`)
      queryClient.invalidateQueries({ queryKey: ["today-summary"] })
      queryClient.invalidateQueries({ queryKey: ["search-products"] })
      queryClient.invalidateQueries({ queryKey: ["recent-receipts"] })

      setIsPaymentModalOpen(false)
      setCart([])
      setSearchQuery("")
      setCustomerName("")
      setCustomerTel("")
      setCustomerBalance(0)
      setRemarks("")
    } catch (error: any) {
      console.error("Sale completion error:", error)
      const errorMessage = error?.message || error?.detail || "Failed to complete sale. Please check your connection and try again."
      showToast.showErrorToast(errorMessage)
      throw error
    }
  }

  const handleSave = async (payments: Record<string, { amount: number; refNo?: string }>) => {
    await processPayment(payments)
  }

  const handleSaveAndPrint = async (payments: Record<string, { amount: number; refNo?: string }>) => {
    await processPayment(payments)
    // TODO: Add print functionality
  }

  const resetSale = () => {
    setCart([])
    setSearchQuery("")
    setCustomerName("")
    setCustomerTel("")
    setCustomerBalance(0)
    setRemarks("")
    setCustomerPin("")
    setSelectedSaleId(null)
  }

  const clearCustomer = () => {
    setCustomerName("")
    setCustomerTel("")
    setCustomerBalance(0)
  }

  const handleReceiptDateFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.type = "date"
    e.target.value = receiptDateValue
  }

  const handleReceiptDateBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.type = "text"
    if (e.target.value) {
      const date = new Date(e.target.value)
      const day = date.getDate().toString().padStart(2, '0')
      const month = date.toLocaleString('en-US', { month: 'short' })
      const year = date.getFullYear()
      setReceiptDate(`${day}/${month}/${year}`)
      setReceiptDateValue(e.target.value)
    }
  }

  return (
    <Box h="100%" bg="bg.canvas" display="flex" flexDirection="column" overflow="hidden">
      <ActionButtons
        onLogout={logout}
        onReset={resetSale}
        onSuspendSale={suspendSale}
        onResumeSale={() => selectedSaleId && resumeSale(selectedSaleId)}
        onCompleteSale={openPaymentModal}
        cartLength={cart.length}
        selectedSaleId={selectedSaleId}
        isPending={createSale.isPending}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        cart={cart}
        totalAmount={cartTotal}
        paymentMethods={paymentMethods?.data ? paymentMethods.data.map((m) => ({
          id: m.id,
          name: m.name,
          type: m.name.toUpperCase().includes("CASH") ? "CASH" :
                m.name.toUpperCase().includes("MPESA") ? "MPESA" :
                m.name.toUpperCase().includes("PDQ") || m.name.toUpperCase().includes("KCB") ? "PDQ" :
                m.name.toUpperCase().includes("BANK") || m.name.toUpperCase().includes("EQUITY") ? "BANK" :
                m.name.toUpperCase().includes("CREDIT") ? "CREDIT_NOTE" : "OTHER",
        })) : []}
        onSave={handleSave}
        onSaveAndPrint={handleSaveAndPrint}
        isProcessing={createSale.isPending}
        isLoadingPaymentMethods={isLoadingPaymentMethods}
        paymentMethodsError={paymentMethodsError}
      />

      {/* Main Content Area */}
      <Box display="flex" flex={1} overflow="hidden" minH={0} flexDirection={{ base: "column", lg: "row" }}>
        {/* Left Panel - Products Table */}
        <Box flex={1} display="flex" flexDirection="column" bg="bg.canvas" minW={0} overflow="hidden">
          <ReceiptDetails
            receiptDate={receiptDate}
            receiptDateValue={receiptDateValue}
            onReceiptDateChange={setReceiptDate}
            onReceiptDateFocus={handleReceiptDateFocus}
            onReceiptDateBlur={handleReceiptDateBlur}
            pricelist={pricelist}
            onPricelistChange={setPricelist}
            onSearch={() => {}}
          />

          <ProductTable
            cart={cart}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            onAddToCart={addToCart}
            onRemoveFromCart={removeFromCart}
            onUpdateQuantity={updateQuantity}
            onUpdateDiscount={updateDiscount}
            searchResults={searchProducts.data}
            cartTotal={cartTotal}
          />
          </Box>

        <CustomerPanel
          activeTab={activeTab}
          onTabChange={setActiveTab}
          customerName={customerName}
          customerTel={customerTel}
          customerBalance={customerBalance}
          remarks={remarks}
          customerPin={customerPin}
          onCustomerNameChange={setCustomerName}
          onCustomerTelChange={setCustomerTel}
          onCustomerBalanceChange={setCustomerBalance}
          onRemarksChange={setRemarks}
          onCustomerPinChange={setCustomerPin}
          onSelectCustomer={() => {}}
          onNewCustomer={() => {}}
          onClearCustomer={clearCustomer}
          suspendedSales={suspendedSales}
          selectedSaleId={selectedSaleId}
          onSelectSale={setSelectedSaleId}
          onResumeSale={resumeSale}
          onViewReceipt={() => setIsRecentReceiptsModalOpen(true)}
          selectedReceiptId={selectedReceiptId}
          onPreviewReceipt={() => {
            if (selectedReceiptId) {
              setIsReceiptPreviewModalOpen(true)
            } else {
              showToast.showErrorToast("Please select a receipt first")
            }
          }}
        />
      </Box>
                    
      {/* Footer */}
      <Box py={2} textAlign="right" px={{ base: 4, md: 6 }} fontSize="xs" color={{ base: "#9ca3af", _light: "#6b7280" }}>
        ©Anchor Core : Developed by NBS
          </Box>

      <RecentReceiptsModal
        isOpen={isRecentReceiptsModalOpen}
        onClose={() => setIsRecentReceiptsModalOpen(false)}
        onAttach={(receiptId) => {
          // TODO: Implement attach receipt functionality
          showToast.showSuccessToast(`Receipt ${receiptId.slice(-6)} attached`)
        }}
        onPreviewReceipt={(receiptId) => {
          setSelectedReceiptId(receiptId)
          setIsReceiptPreviewModalOpen(true)
          setIsRecentReceiptsModalOpen(false)
        }}
        onSelectReceipt={(receiptId) => {
          setSelectedReceiptId(receiptId)
        }}
      />

      <ReceiptPreviewModal
        isOpen={isReceiptPreviewModalOpen}
        onClose={() => {
          setIsReceiptPreviewModalOpen(false)
          setSelectedReceiptId(null)
        }}
        receiptId={selectedReceiptId}
      />
          </Box>
  )
}
