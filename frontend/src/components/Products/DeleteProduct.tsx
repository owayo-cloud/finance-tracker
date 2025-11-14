import {
  Button,
  DialogActionTrigger,
  DialogTitle,
  Text,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

import type { ProductPublic } from "@/client"
import { ProductsService } from "@/client"
import type { ApiError } from "@/client/core/ApiError"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTrigger,
} from "../ui/dialog"

interface DeleteProductProps {
  product: ProductPublic
  children: React.ReactNode
}

const DeleteProduct = ({ product, children }: DeleteProductProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()

  const deleteProductMutation = useMutation({
     mutationFn: (id: string) => ProductsService.deleteProduct({ id: Number(id) }),
    onSuccess: () => {
      showSuccessToast("Product deleted successfully.")
      setIsOpen(false)
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["products"],
      })
    },
  })

  const onDelete = async () => {
    deleteProductMutation.mutate(product.id)
  }

  return (
    <DialogRoot
      size={{ base: "xs", md: "md" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => setIsOpen(open)}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Product</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <Text>
            Are you sure you want to delete <strong>{product.name}</strong>?
            This action cannot be undone.
          </Text>
          {product.current_stock != null && product.current_stock > 0 && (
            <Text color="orange.500" mt={2}>
              Warning: This product has {product.current_stock} units in stock.
            </Text>
          )}
        </DialogBody>
        <DialogFooter gap={2}>
          <DialogActionTrigger asChild>
            <Button
              variant="subtle"
              colorPalette="gray"
              disabled={deleteProductMutation.isPending}
            >
              Cancel
            </Button>
          </DialogActionTrigger>
          <Button
            colorPalette="red"
            onClick={onDelete}
            loading={deleteProductMutation.isPending}
          >
            Delete
          </Button>
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

export default DeleteProduct
