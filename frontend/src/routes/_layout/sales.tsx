import { createFileRoute } from "@tanstack/react-router"
import { Box, Button } from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, useMemo, useEffect } from "react"

import { SalesService, type ProductPublic, OpenAPI } from "../../client"
import useCustomToast from "../../hooks/useCustomToast"
import useAuth from "../../hooks/useAuth"
import { ActionButtons } from "@/components/POS/ActionButtons"
import { ReceiptDetails } from "@/components/POS/ReceiptDetails"
import { ProductTable } from "@/components/POS/ProductTable"
import { CustomerPanel } from "@/components/POS/CustomerPanel"
import { PaymentModal } from "@/components/POS/PaymentModal"
import { RecentReceiptsModal } from "@/components/POS/RecentReceiptsModal"
import { ReceiptPreviewModal } from "@/components/POS/ReceiptPreviewModal"
import { CreditNoteModal } from "@/components/POS/CreditNoteModal"
import { CashMovementModal } from "@/components/POS/CashMovementModal"
import { CustomerSearchModal } from "@/components/POS/CustomerSearchModal"
import { NewCustomerModal } from "@/components/POS/NewCustomerModal"
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
  const [isProcessingPayment, setIsProcessingPayment] = useState(false) // Prevent double-saving
  const [isCustomerPanelOpen, setIsCustomerPanelOpen] = useState(false) // Mobile: customer panel collapsed by default
  const [isRecentReceiptsModalOpen, setIsRecentReceiptsModalOpen] = useState(false)
  const [isReceiptPreviewModalOpen, setIsReceiptPreviewModalOpen] = useState(false)
  const [isCreditNoteModalOpen, setIsCreditNoteModalOpen] = useState(false)
  const [isCashMovementModalOpen, setIsCashMovementModalOpen] = useState(false)
  const [isCustomerSearchModalOpen, setIsCustomerSearchModalOpen] = useState(false)
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false)
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
  const [suspendedSales, setSuspendedSales] = useState<SuspendedSale[]>(() => {
    // Load from localStorage on mount
    try {
      const saved = localStorage.getItem("pos_suspended_sales")
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"customer" | "suspended">("customer")
  
  // Customer state
  const [customerName, setCustomerName] = useState<string>("")
  const [customerTel, setCustomerTel] = useState<string>("")
  const [customerBalance, setCustomerBalance] = useState<number>(0)
  const [remarks, setRemarks] = useState<string>("")
  const [customerPin, setCustomerPin] = useState<string>("")
  
  // Save suspended sales to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem("pos_suspended_sales", JSON.stringify(suspendedSales))
    } catch (error) {
      console.error("Failed to save suspended sales:", error)
    }
  }, [suspendedSales])
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F1 - Cash Movement
      if (e.key === "F1") {
        e.preventDefault()
        setIsCashMovementModalOpen(true)
      }
      // F2 - Credit Note
      if (e.key === "F2") {
        e.preventDefault()
        setIsCreditNoteModalOpen(true)
      }
      // F3 - Suspend Sale
      if (e.key === "F3") {
        e.preventDefault()
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
        setSuspendedSales((prev) => [...prev, suspendedSale])
        setCart([])
        setCustomerName("")
        setCustomerTel("")
        setCustomerBalance(0)
        setRemarks("")
        showToast.showSuccessToast("Sale suspended successfully")
      }
      // F4 - Resume Sale
      if (e.key === "F4") {
        e.preventDefault()
        if (selectedSaleId) {
          const sale = suspendedSales.find((s) => s.id === selectedSaleId)
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
            setSuspendedSales((prev) => prev.filter((s) => s.id !== selectedSaleId))
            setSelectedSaleId(null)
            showToast.showSuccessToast("Sale resumed")
          }
        }
      }
    }
    
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedSaleId, suspendedSales, cart, customerName, customerTel, customerBalance, receiptDate, pricelist, remarks, showToast])

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
    // Prevent double-saving
    if (isProcessingPayment) {
      console.log("Payment already processing, ignoring duplicate request")
      return
    }
    
    setIsProcessingPayment(true)
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

      // Validate total payments
      const totalPaid = paymentArray.reduce((sum, p) => sum + p.amount, 0)
      const difference = totalPaid - cartTotal
      
      // If customer is selected, allow partial payment (will create debt)
      // Otherwise, require full payment
      if (!customerName) {
        // No customer: require full payment
        if (difference < -0.01) {
          showToast.showErrorToast(
            `Payment total (${totalPaid.toFixed(2)}) is less than cart total (${cartTotal.toFixed(2)}). Please add ${Math.abs(difference).toFixed(2)} more.`
          )
          return
        }
        
        // If there's a small underpayment (0.01-0.10), adjust the largest payment to match exactly
        if (difference >= -0.10 && difference < -0.01 && paymentArray.length > 0) {
          const largestPaymentIndex = paymentArray.reduce((maxIdx, p, idx) => 
            p.amount > paymentArray[maxIdx].amount ? idx : maxIdx, 0
          )
          const adjustment = cartTotal - totalPaid
          paymentArray[largestPaymentIndex].amount += adjustment
        }
      } else {
        // Customer selected: allow partial or zero payment (entire amount can be debt)
        // No minimum payment required - zero payment means full amount becomes debt
        // If payment exceeds total, that's fine (change will be given)
      }
      
      // Overpayment is allowed (for change), so we don't need to adjust or error on that

      // Process each cart item with all payment methods
      const createdSaleIds: string[] = []
      const token = localStorage.getItem("access_token") || ""
      const apiBase = OpenAPI.BASE || import.meta.env.VITE_API_URL || ""
      let firstSaleId: string | null = null
      
      for (let itemIndex = 0; itemIndex < cart.length; itemIndex++) {
        const item = cart[itemIndex]
        const unitPrice = Number(item.product.selling_price)
        const discountAmount = (unitPrice * item.quantity * (item.discount || 0)) / 100
        const itemTotal = unitPrice * item.quantity - discountAmount
        
        // Calculate payment amounts proportionally for this item
        const itemPaymentRatio = itemTotal / cartTotal
        const isLastItem = itemIndex === cart.length - 1
        
        const itemPayments = paymentArray.map((payment) => {
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
        // But if customer is selected and partial payment, allow it
        const itemPaymentsTotal = itemPayments.reduce((sum, p) => sum + p.amount, 0)
        const itemDifference = itemTotal - itemPaymentsTotal
        
        // Only adjust if no customer (full payment required) or if overpayment
        if (!customerName && Math.abs(itemDifference) > 0.001 && itemPayments.length > 0) {
          // Adjust the largest payment to match exactly
          const largestPaymentIndex = itemPayments.reduce((maxIdx, p, idx) => 
            p.amount > itemPayments[maxIdx].amount ? idx : maxIdx, 0
          )
          itemPayments[largestPaymentIndex].amount = Math.round((itemPayments[largestPaymentIndex].amount + itemDifference) * 100) / 100
        }

        // Use the new multi-payment endpoint
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
        
        // Get sale ID from response
        const saleData = await response.json()
        if (saleData.id) {
          createdSaleIds.push(saleData.id)
          if (!firstSaleId) {
            firstSaleId = saleData.id
          }
        }
      }
      
      // Create debt if customer is selected and payment is less than total
      if (customerName && totalPaid < cartTotal) {
        const debtAmount = cartTotal - totalPaid
        
        try {
          // Create one debt for the entire cart (linked to first sale)
          const debtResponse = await fetch(`${apiBase}/api/v1/debts/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              customer_name: customerName,
              customer_contact: customerTel || null,
              sale_id: firstSaleId || null,
              amount: debtAmount,
              amount_paid: 0,
              balance: debtAmount,
              debt_date: new Date().toISOString(),
              due_date: null,
              status: "pending",
              notes: remarks || `Credit sale - ${cart.length} item(s), Balance: ${debtAmount.toFixed(2)}`,
            }),
          })
          
          if (!debtResponse.ok) {
            const errorText = await debtResponse.text()
            console.error("Failed to create debt:", errorText)
            // Don't throw - sale was successful, debt creation is secondary
            showToast.showErrorToast(`Sale completed but failed to record debt: ${errorText}`)
          } else {
            showToast.showSuccessToast(`Sale completed. Debt of ${debtAmount.toFixed(2)} recorded for ${customerName}`)
          }
        } catch (error: any) {
          console.error("Error creating debt:", error)
          // Don't throw - sale was successful
          showToast.showErrorToast(`Sale completed but failed to record debt: ${error.message || "Unknown error"}`)
        }
      }

      // Store the last sale ID for receipt printing (we'll get it from the response)
      // Note: Since we process multiple items, we'll use the most recent sale
      // The receipt preview will show all sales for this transaction

      showToast.showSuccessToast(`Sale completed successfully`)
      queryClient.invalidateQueries({ queryKey: ["today-summary"] })
      queryClient.invalidateQueries({ queryKey: ["search-products"] })
      queryClient.invalidateQueries({ queryKey: ["recent-receipts"] })
      queryClient.invalidateQueries({ queryKey: ["debts-for-customers"] })
      queryClient.invalidateQueries({ queryKey: ["recent-sales-for-customers"] })

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
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const handleSave = async (payments: Record<string, { amount: number; refNo?: string }>) => {
    await processPayment(payments)
  }

  const handleSaveAndPrint = async (payments: Record<string, { amount: number; refNo?: string }>) => {
    try {
      await processPayment(payments)
      // Get the most recent sale for printing
      const token = localStorage.getItem("access_token") || ""
      const apiBase = OpenAPI.BASE || import.meta.env.VITE_API_URL || ""
      const lastSaleResponse = await fetch(`${apiBase}/api/v1/sales?limit=1`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (lastSaleResponse.ok) {
        const lastSales = await lastSaleResponse.json()
        if (lastSales.data && lastSales.data.length > 0) {
          setSelectedReceiptId(lastSales.data[0].id)
          setIsReceiptPreviewModalOpen(true)
          // Trigger print after modal opens
          setTimeout(() => {
            window.print()
          }, 1000)
        }
      }
    } catch (error) {
      // Error already handled in processPayment
    }
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

  const handleSelectCustomer = async (customer: { name: string; tel: string; balance: number }) => {
    setCustomerName(customer.name)
    setCustomerTel(customer.tel)
    setCustomerBalance(customer.balance)
    
    // Fetch latest balance from API
    try {
      const token = localStorage.getItem("access_token") || ""
      const apiBase = OpenAPI.BASE || import.meta.env.VITE_API_URL || ""
      // URL encode the customer name properly
      const encodedName = encodeURIComponent(customer.name)
      const response = await fetch(`${apiBase}/api/v1/debts/customers/${encodedName}/balance`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const balanceData = await response.json()
        setCustomerBalance(balanceData.total_balance || 0)
      } else if (response.status === 404) {
        // Customer has no debts yet, balance is 0
        setCustomerBalance(0)
      }
    } catch (error) {
      console.error("Failed to fetch customer balance:", error)
      // Use the balance from customer object as fallback
    }
  }

  const handleNewCustomerSave = (customer: { name: string; tel: string; balance: number }) => {
    handleSelectCustomer(customer)
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
    <Box h="100%" bg="bg.canvas" display="flex" flexDirection="column" overflow={{ base: "auto", lg: "hidden" }}>
      <ActionButtons
        onLogout={logout}
        onReset={resetSale}
        onSuspendSale={suspendSale}
        onResumeSale={() => {
          if (selectedSaleId) {
            resumeSale(selectedSaleId)
            setActiveTab("customer")
          }
        }}
        onCompleteSale={openPaymentModal}
        onCreditNote={() => setIsCreditNoteModalOpen(true)}
        onCashMovement={() => setIsCashMovementModalOpen(true)}
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
        isProcessing={isProcessingPayment || createSale.isPending}
        isLoadingPaymentMethods={isLoadingPaymentMethods}
        paymentMethodsError={paymentMethodsError}
        customerName={customerName || undefined}
        customerBalance={customerBalance}
      />

      {/* Main Content Area */}
      <Box 
        display="flex" 
        flex={1} 
        overflow={{ base: "visible", lg: "hidden" }} 
        minH={0} 
        flexDirection={{ base: "column", lg: "row" }}
        position="relative"
      >
        {/* Left Panel - Products Table (Prioritized on mobile) */}
        <Box 
          flex={1} 
          display="flex" 
          flexDirection="column" 
          bg="bg.canvas" 
          minW={0} 
          overflow="hidden"
          order={{ base: 1, lg: 0 }} // Show first on mobile
          minH={{ base: isCustomerPanelOpen ? "50vh" : "70vh", lg: "auto" }} // Adjust height based on panel state
          maxH={{ base: isCustomerPanelOpen ? "50vh" : "none", lg: "none" }} // Limit height when panel is open
        >
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

        {/* Customer Panel - Collapsible on mobile */}
        <Box
          data-customer-panel
          display={{ base: isCustomerPanelOpen ? "flex" : "none", lg: "flex" }}
          flexDirection="column"
          w={{ base: "100%", lg: "400px" }}
          flexShrink={0}
          order={{ base: 2, lg: 0 }}
          maxH={{ base: "50vh", lg: "none" }} // Limit height on mobile
          overflowY={{ base: "auto", lg: "hidden" }} // Allow scrolling on mobile
          position={{ base: "relative", lg: "static" }}
        >
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
            onSelectCustomer={() => setIsCustomerSearchModalOpen(true)}
            onNewCustomer={() => setIsNewCustomerModalOpen(true)}
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
        
        {/* Mobile: Toggle button for customer panel */}
        <Box
          display={{ base: "block", lg: "none" }}
          position="fixed"
          bottom="80px"
          right="20px"
          zIndex={10}
        >
          <Button
            onClick={() => {
              setIsCustomerPanelOpen(!isCustomerPanelOpen)
              // Scroll to customer panel when opening
              if (!isCustomerPanelOpen) {
                setTimeout(() => {
                  const customerPanel = document.querySelector('[data-customer-panel]')
                  if (customerPanel) {
                    customerPanel.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                }, 100)
              }
            }}
            bg="#14b8a6"
            color="white"
            borderRadius="full"
            size="lg"
            boxShadow="lg"
            _hover={{ bg: "#0d9488" }}
          >
            {isCustomerPanelOpen ? "Hide Customer" : "Show Customer"}
          </Button>
        </Box>
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

      <CreditNoteModal
        isOpen={isCreditNoteModalOpen}
        onClose={() => setIsCreditNoteModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["today-summary"] })
          queryClient.invalidateQueries({ queryKey: ["recent-receipts"] })
        }}
      />

      <CashMovementModal
        isOpen={isCashMovementModalOpen}
        onClose={() => setIsCashMovementModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["today-summary"] })
        }}
      />

      <CustomerSearchModal
        isOpen={isCustomerSearchModalOpen}
        onClose={() => setIsCustomerSearchModalOpen(false)}
        onSelectCustomer={handleSelectCustomer}
      />

      <NewCustomerModal
        isOpen={isNewCustomerModalOpen}
        onClose={() => setIsNewCustomerModalOpen(false)}
        onSave={handleNewCustomerSave}
      />
          </Box>
  )
}
