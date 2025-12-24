import type { ProductPublic } from "@/client"

export interface CartItem {
  product: ProductPublic
  quantity: number
  discount?: number // Percentage discount (0-100)
  discountType?: "percentage" | "fixed" // Type of discount
  fixedDiscount?: number // Fixed amount discount
}

export interface SuspendedSale {
  id: string
  cart: CartItem[]
  customer?: {
    name: string
    tel: string
    balance: number
  }
  receiptDate: string
  pricelist: string
  remarks?: string
}
