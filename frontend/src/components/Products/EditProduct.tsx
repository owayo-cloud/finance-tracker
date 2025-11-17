import {
  Button,
  Input,
  Text,
  VStack,
  Box,
  HStack,
  Badge,
  Separator,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"

import {
  type ProductPublic,
  type ProductUpdate,
  ProductsService,
} from "@/client"
import type { ApiError } from "@/client/core/ApiError"
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

interface EditProductProps {
  product: ProductPublic
  children?: React.ReactNode
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  'data-testid'?: string
}

const EditProduct = ({ product, children, isOpen: controlledIsOpen, onOpenChange, 'data-testid': testId }: EditProductProps) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  
  // Use controlled or internal state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen
  const setIsOpen = onOpenChange || setInternalIsOpen
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting, isDirty },
  } = useForm<ProductUpdate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: product,
  })

  const mutation = useMutation({
    mutationFn: (data: ProductUpdate) =>
      ProductsService.updateProduct({ id: product.id, requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Product updated successfully! ✅")
      setIsOpen(false)
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
    },
  })

  const onSubmit: SubmitHandler<ProductUpdate> = (data) => {
    mutation.mutate(data)
  }

  const handleClose = () => {
    reset()
    setIsOpen(false)
  }

  const handleOpen = () => {
    reset(product) // Reset form with current product data
    setIsOpen(true)
  }

  return (
    <>
      {/* Trigger Element - Only render if children provided and not controlled */}
      {children && controlledIsOpen === undefined && (
        <div onClick={handleOpen} style={{ cursor: 'pointer', display: 'inline-block' }}>
          {children}
        </div>
      )}

      {/* Drawer */}
      <DrawerRoot
        open={isOpen}
        onOpenChange={(e) => !e.open && handleClose()}
        size="md"
        placement="end"
        data-testid={testId}
      >
        <DrawerBackdrop />
        <DrawerContent>
          <DrawerHeader borderBottomWidth="1px">
            <DrawerTitle>
              Edit Product - {product.name}
            </DrawerTitle>
            <DrawerCloseTrigger />
          </DrawerHeader>
          
          <DrawerBody>
            <VStack gap={6} align="stretch">
              {/* Product Details Section */}
              <Box>
                <Text fontSize="md" fontWeight="semibold" mb={3}>
                  Current Product Information
                </Text>
                <VStack
                  align="stretch"
                  gap={2}
                  p={4}
                  borderWidth="1px"
                  borderRadius="md"
                  bg="gray.900"
                >
                  <HStack justify="space-between">
                    <Text fontSize="sm" color="gray.400">
                      Product ID
                    </Text>
                    <Text fontSize="xs" color="gray.500" fontFamily="mono">
                      {product.id}
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontSize="sm" color="gray.400">
                      Category
                    </Text>
                    <Badge colorScheme="blue" size="sm">
                      {product.category?.name || "No category"}
                    </Badge>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontSize="sm" color="gray.400">
                      Status
                    </Text>
                    <Badge colorScheme="purple" size="sm">
                      {product.status?.name || "No status"}
                    </Badge>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontSize="sm" color="gray.400">
                      Current Stock
                    </Text>
                    <Badge 
                      colorScheme={
                        product.current_stock === 0 
                          ? "red" 
                          : product.current_stock && product.reorder_level && product.current_stock <= product.reorder_level
                            ? "orange"
                            : "green"
                      } 
                      size="sm"
                    >
                      {product.current_stock || 0} units
                    </Badge>
                  </HStack>
                </VStack>
              </Box>

              <Separator />

              {/* Edit Form */}
              <Box>
                <Text fontSize="md" fontWeight="semibold" mb={3}>
                  Update Product Details
                </Text>
                
                <form onSubmit={handleSubmit(onSubmit)} id="edit-product-form" data-testid="edit-product-form">
                  <VStack gap={4} align="stretch">
                    <Field
                      invalid={!!errors.name}
                      errorText={errors.name?.message}
                      label="Product Name"
                    >
                      <Input
                        {...register("name", { 
                          required: "Product name is required" 
                        })}
                        placeholder="Enter product name"
                        type="text"
                      />
                    </Field>

                    <Field
                      invalid={!!errors.description}
                      errorText={errors.description?.message}
                      label="Description"
                    >
                      <Input
                        {...register("description")}
                        placeholder="Product description (optional)"
                        type="text"
                      />
                    </Field>

                    <Field
                      invalid={!!errors.buying_price}
                      errorText={errors.buying_price?.message}
                      label="Buying Price (KES)"
                      helperText="Cost price for procurement"
                    >
                      <Input
                        {...register("buying_price", {
                          valueAsNumber: true,
                          required: "Buying price is required",
                          min: {
                            value: 0,
                            message: "Buying price must be at least 0",
                          },
                        })}
                        placeholder="0.00"
                        type="number"
                        step="0.01"
                      />
                    </Field>

                    <Field
                      invalid={!!errors.selling_price}
                      errorText={errors.selling_price?.message}
                      label="Selling Price (KES)"
                      helperText="Retail price for customers"
                    >
                      <Input
                        {...register("selling_price", {
                          valueAsNumber: true,
                          required: "Selling price is required",
                          min: {
                            value: 0.01,
                            message: "Selling price must be greater than 0",
                          },
                        })}
                        placeholder="0.00"
                        type="number"
                        step="0.01"
                      />
                    </Field>

                    <Field
                      invalid={!!errors.current_stock}
                      errorText={errors.current_stock?.message}
                      label="Current Stock"
                      helperText="Available units in inventory"
                    >
                      <Input
                        {...register("current_stock", {
                          valueAsNumber: true,
                          min: {
                            value: 0,
                            message: "Stock cannot be negative",
                          },
                        })}
                        placeholder="0"
                        type="number"
                      />
                    </Field>

                    <Field
                      invalid={!!errors.reorder_level}
                      errorText={errors.reorder_level?.message}
                      label="Reorder Level"
                      helperText="Minimum stock before reordering"
                    >
                      <Input
                        {...register("reorder_level", {
                          valueAsNumber: true,
                          min: {
                            value: 0,
                            message: "Reorder level cannot be negative",
                          },
                        })}
                        placeholder="0"
                        type="number"
                      />
                    </Field>
                  </VStack>
                </form>
              </Box>
            </VStack>
          </DrawerBody>

          <DrawerFooter borderTopWidth="1px" gap={3}>
            <Button
              variant="outline"
              colorScheme="gray"
              disabled={isSubmitting}
              onClick={handleClose}
              flex="1"
            >
              Cancel
            </Button>
            <Button
              colorScheme="teal"
              type="submit"
              form="edit-product-form"
              disabled={!isDirty || !isValid}
              loading={isSubmitting}
              flex="1"
            >
              Update Product
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </DrawerRoot>
    </>
  )
}

export default EditProduct
