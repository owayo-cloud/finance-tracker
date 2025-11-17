import {
  Button,
  Input,
  Text,
  VStack,
  Box,
  HStack,
  Badge,
  Separator,
  Image,
  Flex,
  IconButton,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useRef } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import { FaImage, FaTimes } from "react-icons/fa"

import {
  type ProductPublic,
  type ProductUpdate,
  ProductsService,
  MediaService,
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
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
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
    mutationFn: async (data: ProductUpdate) => {
      let imageId = data.image_id

      // Upload image if one was selected
      if (imageFile) {
        setUploadingImage(true)
        try {
          const uploadedMedia = await MediaService.uploadImage({
            formData: { file: imageFile }
          })

          imageId = uploadedMedia.id
        } catch (error) {
          setUploadingImage(false)
          throw error
        }
        setUploadingImage(false)
      }

      // Update product with image_id
      return ProductsService.updateProduct({ 
        id: product.id, 
        requestBody: { ...data, image_id: imageId } 
      })
    },
    onSuccess: () => {
      showSuccessToast("Product updated successfully! ✅")
      setImageFile(null)
      setImagePreview(null)
      setIsOpen(false)
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
    },
  })

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        handleError({ message: "Please select an image file" } as ApiError)
        return
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        handleError({ message: "Image size must be less than 5MB" } as ApiError)
        return
      }

      setImageFile(file)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const onSubmit: SubmitHandler<ProductUpdate> = (data) => {
    mutation.mutate(data)
  }

  const handleClose = () => {
    reset()
    setImageFile(null)
    setImagePreview(null)
    setIsOpen(false)
  }

  const handleOpen = () => {
    reset(product) // Reset form with current product data
    setImageFile(null)
    setImagePreview(null)
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
                            value: 0.01,
                            message: "Buying price must be greater than 0",
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
                      helperText="Must be greater than buying price"
                    >
                      <Input
                        {...register("selling_price", {
                          valueAsNumber: true,
                          required: "Selling price is required",
                          validate: (value, formValues) => {
                            const numValue = typeof value === "number" ? value : parseFloat(String(value))
                            if (!numValue || numValue <= 0) {
                              return "Selling price must be greater than 0"
                            }
                            const buyingPrice = typeof formValues.buying_price === "number" 
                              ? formValues.buying_price 
                              : parseFloat(String(formValues.buying_price || 0))
                            if (numValue <= buyingPrice) {
                              return "Selling price must be greater than buying price"
                            }
                            return true
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
                      helperText="Available units in inventory (minimum 1)"
                    >
                      <Input
                        {...register("current_stock", {
                          valueAsNumber: true,
                          min: {
                            value: 1,
                            message: "Stock must be at least 1",
                          },
                        })}
                        placeholder="1"
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

                    {/* Product Image Upload */}
                    <Field
                      label="Product Image"
                      helperText="Upload a new image to replace the current one (optional, max 5MB)"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        style={{ display: "none" }}
                      />
                      
                      {imagePreview ? (
                        <Box position="relative">
                          <Image
                            src={imagePreview}
                            alt="Product preview"
                            borderRadius="md"
                            maxH="200px"
                            objectFit="cover"
                            w="full"
                          />
                          <IconButton
                            position="absolute"
                            top={2}
                            right={2}
                            size="sm"
                            colorScheme="red"
                            onClick={removeImage}
                            aria-label="Remove image"
                          >
                            <FaTimes />
                          </IconButton>
                        </Box>
                      ) : product.image?.id ? (
                        <Box>
                          <Text fontSize="sm" mb={2} color="gray.400">
                            Current Image:
                          </Text>
                          <Image
                            src={`/api/v1/media/serve/${product.image.id}`}
                            alt={product.name}
                            borderRadius="md"
                            maxH="200px"
                            objectFit="cover"
                            w="full"
                            mb={2}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            Replace Image
                          </Button>
                        </Box>
                      ) : (
                        <Box
                          border="2px dashed"
                          borderColor={{ base: "gray.600", _light: "gray.300" }}
                          borderRadius="md"
                          p={6}
                          textAlign="center"
                          cursor="pointer"
                          _hover={{ borderColor: "teal.400" }}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Flex direction="column" align="center" gap={2}>
                            <FaImage size={24} />
                            <Text fontSize="sm">
                              Click to upload image
                            </Text>
                            <Text fontSize="xs" color={{ base: "gray.400", _light: "gray.500" }}>
                              PNG, JPG up to 5MB
                            </Text>
                          </Flex>
                        </Box>
                      )}
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
              disabled={isSubmitting || uploadingImage}
              onClick={handleClose}
              flex="1"
            >
              Cancel
            </Button>
            <Button
              colorScheme="teal"
              type="submit"
              form="edit-product-form"
              disabled={!isDirty || !isValid || uploadingImage}
              loading={isSubmitting || uploadingImage}
              flex="1"
            >
              {uploadingImage ? "Uploading..." : "Update Product"}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </DrawerRoot>
    </>
  )
}

export default EditProduct
