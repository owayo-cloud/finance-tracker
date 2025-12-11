import {
  Badge,
  Box,
  Button,
  HStack,
  Input,
  Separator,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"

import type { ProductPublic, ProductUpdate } from "@/client"
import { ProductsService } from "@/client"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"
import {
  DrawerBackdrop,
  DrawerBody,
  DrawerCloseTrigger,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerRoot,
  DrawerTitle,
} from "../ui/drawer"
import { Field } from "../ui/field"

interface StockAdjustmentDrawerProps {
  product: ProductPublic
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

const StockAdjustmentDrawer = ({
  product,
  isOpen,
  onOpenChange,
}: StockAdjustmentDrawerProps) => {
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()

  const [currentStock, setCurrentStock] = useState(0)
  const [reorderLevel, setReorderLevel] = useState(0)

  // Update form when product changes
  useEffect(() => {
    if (product) {
      setCurrentStock(product.current_stock || 0)
      setReorderLevel(product.reorder_level || 0)
    }
  }, [product])

  const mutation = useMutation({
    mutationFn: (data: ProductUpdate) =>
      ProductsService.updateProduct({
        id: product.id,
        requestBody: data,
      }),
    onSuccess: () => {
      showSuccessToast("Stock levels updated successfully.")
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      onOpenChange(false)
    },
    onError: (err: any) => {
      handleError(err)
    },
  })

  const handleSubmit = () => {
    if (!product) return

    const updateData: ProductUpdate = {
      current_stock: currentStock,
      reorder_level: reorderLevel,
    }

    mutation.mutate(updateData)
  }

  if (!product) {
    return null
  }

  const hasChanges =
    currentStock !== (product.current_stock || 0) ||
    reorderLevel !== (product.reorder_level || 0)

  const stockChange = currentStock - (product.current_stock || 0)

  return (
    <DrawerRoot
      open={isOpen}
      onOpenChange={(e) => onOpenChange(e.open)}
      placement="end"
      size="md"
    >
      <DrawerBackdrop />
      <DrawerContent>
        <DrawerHeader borderBottomWidth="1px">
          <DrawerTitle>Adjust Stock - {product.name}</DrawerTitle>
          <DrawerCloseTrigger />
        </DrawerHeader>
        <DrawerBody p={6}>
          <VStack gap={6} align="stretch">
            {/* Product Info */}
            <Box>
              <Text fontSize="md" fontWeight="semibold" mb={3}>
                Product Details
              </Text>
              <VStack
                align="stretch"
                gap={2}
                p={4}
                borderWidth="1px"
                borderRadius="md"
                bg={{ base: "gray.900", _light: "gray.50" }}
                borderColor={{ base: "gray.700", _light: "gray.200" }}
              >
                <HStack justify="space-between">
                  <Text
                    fontSize="sm"
                    color={{ base: "gray.400", _light: "gray.600" }}
                  >
                    Product
                  </Text>
                  <Text fontWeight="semibold">{product.name}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text
                    fontSize="sm"
                    color={{ base: "gray.400", _light: "gray.600" }}
                  >
                    Category
                  </Text>
                  <Badge colorScheme="blue" size="sm">
                    {product.category.name}
                  </Badge>
                </HStack>
                <HStack justify="space-between">
                  <Text
                    fontSize="sm"
                    color={{ base: "gray.400", _light: "gray.600" }}
                  >
                    Current Stock
                  </Text>
                  <Text fontWeight="semibold">
                    {product.current_stock || 0} units
                  </Text>
                </HStack>
              </VStack>
            </Box>

            <Separator />

            {/* Stock Adjustment Form */}
            <Box>
              <Text fontSize="md" fontWeight="semibold" mb={3}>
                Adjust Stock Levels
              </Text>
              <VStack gap={4} align="stretch">
                <Field
                  label="Current Stock"
                  helperText="Available units in inventory"
                >
                  <Input
                    type="number"
                    value={currentStock}
                    onChange={(e) => setCurrentStock(Number(e.target.value))}
                    min={0}
                    placeholder="Enter current stock"
                  />
                </Field>

                <Field
                  label="Reorder Level"
                  helperText="Minimum stock before reordering"
                >
                  <Input
                    type="number"
                    value={reorderLevel}
                    onChange={(e) => setReorderLevel(Number(e.target.value))}
                    min={0}
                    placeholder="Enter reorder level"
                  />
                </Field>

                {/* Stock Status Preview */}
                <Box
                  p={4}
                  bg={{ base: "gray.900", _light: "gray.50" }}
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor={{ base: "gray.700", _light: "gray.200" }}
                >
                  <Text
                    fontSize="xs"
                    color={{ base: "gray.400", _light: "gray.600" }}
                    mb={2}
                  >
                    Stock Status Preview
                  </Text>
                  <HStack justify="space-between">
                    <Text fontSize="sm">Status:</Text>
                    <Badge
                      colorScheme={
                        currentStock === 0
                          ? "red"
                          : reorderLevel && currentStock <= reorderLevel
                            ? "orange"
                            : "green"
                      }
                    >
                      {currentStock === 0
                        ? "Out of Stock"
                        : reorderLevel && currentStock <= reorderLevel
                          ? "Low Stock"
                          : "In Stock"}
                    </Badge>
                  </HStack>
                  {reorderLevel > 0 &&
                    currentStock <= reorderLevel &&
                    currentStock > 0 && (
                      <Text fontSize="xs" color="orange.400" mt={2}>
                        ⚠️ Stock is at or below reorder level
                      </Text>
                    )}
                </Box>

                {/* Change Summary */}
                {hasChanges && (
                  <Box
                    p={3}
                    borderRadius="md"
                    bg={{ base: "teal.900/20", _light: "teal.50" }}
                    borderWidth="1px"
                    borderColor={{ base: "teal.700", _light: "teal.200" }}
                  >
                    <Text
                      fontWeight="semibold"
                      fontSize="sm"
                      color={{ base: "teal.300", _light: "teal.700" }}
                      mb={2}
                    >
                      Changes Summary
                    </Text>
                    {currentStock !== (product.current_stock || 0) && (
                      <Text
                        fontSize="xs"
                        color={{ base: "gray.400", _light: "gray.600" }}
                      >
                        Current Stock: {product.current_stock || 0} →{" "}
                        {currentStock} ({stockChange > 0 ? "+" : ""}
                        {stockChange} units)
                      </Text>
                    )}
                    {reorderLevel !== (product.reorder_level || 0) && (
                      <Text
                        fontSize="xs"
                        color={{ base: "gray.400", _light: "gray.600" }}
                      >
                        Reorder Level: {product.reorder_level || 0} →{" "}
                        {reorderLevel}
                      </Text>
                    )}
                  </Box>
                )}
              </VStack>
            </Box>
          </VStack>
        </DrawerBody>
        <DrawerFooter borderTopWidth="1px" gap={2}>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            colorPalette="teal"
            onClick={handleSubmit}
            loading={mutation.isPending}
            disabled={!hasChanges || currentStock < 0 || reorderLevel < 0}
          >
            Update Stock Levels
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </DrawerRoot>
  )
}

export default StockAdjustmentDrawer
