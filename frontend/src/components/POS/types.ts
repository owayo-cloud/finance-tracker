import type { ProductPublic } from "@/client"

export interface CartItem {
  product: ProductPublic
  quantity: number
  discount?: number
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
