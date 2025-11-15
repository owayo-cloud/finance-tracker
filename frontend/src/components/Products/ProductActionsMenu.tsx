import { BsThreeDotsVertical } from "react-icons/bs"
import { FiEdit, FiTrash } from "react-icons/fi"
import { useState } from "react"

import type { ProductPublic } from "@/client"
import { MenuContent, MenuItem, MenuRoot, MenuTrigger } from "../ui/menu"
import DeleteProduct from "./DeleteProduct"
import EditProduct from "./EditProduct"

interface ProductActionsMenuProps {
  product: ProductPublic
}

const ProductActionsMenu = ({ product }: ProductActionsMenuProps) => {
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const handleEditClick = () => {
    setMenuOpen(false) // Close menu first
    setTimeout(() => setEditDrawerOpen(true), 100) // Small delay to ensure menu closes
  }

  const handleDeleteClick = () => {
    setMenuOpen(false) // Close menu first  
    setTimeout(() => setDeleteDialogOpen(true), 100) // Small delay to ensure menu closes
  }

  return (
    <>
      <MenuRoot open={menuOpen} onOpenChange={(e) => setMenuOpen(e.open)} data-testid="product-actions-menu">
        <MenuTrigger asChild>
          <BsThreeDotsVertical 
            fontSize={18} 
            cursor="pointer" 
            data-testid="product-actions-trigger"
          />
        </MenuTrigger>
        <MenuContent>
          <MenuItem 
            value="edit" 
            onClick={handleEditClick}
            data-testid="edit-product-menu-item"
          >
            <FiEdit fontSize={16} />
            Edit Product
          </MenuItem>
          <MenuItem 
            value="delete" 
            color="red.500" 
            onClick={handleDeleteClick}
            data-testid="delete-product-menu-item"
          >
            <FiTrash fontSize={16} />
            Delete Product
          </MenuItem>
        </MenuContent>
      </MenuRoot>

      {/* Controlled Edit Drawer */}
      <EditProduct 
        product={product}
        isOpen={editDrawerOpen}
        onOpenChange={setEditDrawerOpen}
        data-testid="edit-product-drawer"
      />

      {/* Controlled Delete Dialog */}
      <DeleteProduct 
        product={product}
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        data-testid="delete-product-dialog"
      />
    </>
  )
}

export default ProductActionsMenu
