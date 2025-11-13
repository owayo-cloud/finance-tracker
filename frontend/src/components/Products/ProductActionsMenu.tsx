import { BsThreeDotsVertical } from "react-icons/bs"
import { FiEdit, FiTrash } from "react-icons/fi"

import type { ProductPublic } from "@/client"
import { MenuContent, MenuItem, MenuRoot, MenuTrigger } from "../ui/menu"
import DeleteProduct from "./DeleteProduct"
import EditProduct from "./EditProduct"

interface ProductActionsMenuProps {
  product: ProductPublic
}

const ProductActionsMenu = ({ product }: ProductActionsMenuProps) => {
  return (
    <MenuRoot>
      <MenuTrigger asChild>
        <BsThreeDotsVertical fontSize={18} cursor="pointer" />
      </MenuTrigger>
      <MenuContent>
        <EditProduct product={product}>
          <MenuItem value="edit">
            <FiEdit fontSize={16} />
            Edit Product
          </MenuItem>
        </EditProduct>
        <DeleteProduct product={product}>
          <MenuItem value="delete" color="red.500">
            <FiTrash fontSize={16} />
            Delete Product
          </MenuItem>
        </DeleteProduct>
      </MenuContent>
    </MenuRoot>
  )
}

export default ProductActionsMenu
