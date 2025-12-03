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
import { useId, useRef, useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import { FaInfoCircle } from "react-icons/fa"

import {
  MediaService,
  type ProductPublic,
  ProductsService,
  type ProductUpdate,
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
  "data-testid"?: string
}

const EditProduct = ({
  product,
  children,
  isOpen: controlledIsOpen,
  onOpenChange,
  "data-testid": testId,
}: EditProductProps) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [_imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const formId = useId()

  // Use controlled or internal state
  const isOpen =
    controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen
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
            formData: { file: imageFile },
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
        requestBody: { ...data, image_id: imageId },
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

  // @ts-expect-error - used in JSX
  const _handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Strict validation: Only .jpg, .jpeg, and .png files
      const validTypes = ["image/jpeg", "image/jpg", "image/png"]
      const validExtensions = [".jpg", ".jpeg", ".png"]
      const fileName = file.name.toLowerCase()
      const fileExtension = fileName.substring(fileName.lastIndexOf("."))

      if (
        !validTypes.includes(file.type) ||
        !validExtensions.includes(fileExtension)
      ) {
        handleError({
          message:
            "Invalid file type. Only .jpg, .jpeg, and .png images are allowed.",
        } as ApiError)
        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
        return
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        handleError({ message: "Image size must be less than 5MB" } as ApiError)
        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
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

  // @ts-expect-error - used in JSX
  const _removeImage = () => {
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
        <button
          type="button"
          onClick={handleOpen}
          style={{
            cursor: "pointer",
            display: "inline-block",
            background: "none",
            border: "none",
            padding: 0,
          }}
        >
          {children}
        </button>
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
            <DrawerTitle>Edit Product - {product.name}</DrawerTitle>
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
                </VStack>
              </Box>

              <Separator />

              {/* Edit Form */}
              <Box>
                <Text fontSize="md" fontWeight="semibold" mb={3}>
                  Update Product Details
                </Text>

                <form
                  onSubmit={handleSubmit(onSubmit)}
                  id={formId}
                  data-testid="edit-product-form"
                >
                  <VStack gap={4} align="stretch">
                    <Field
                      invalid={!!errors.name}
                      errorText={errors.name?.message}
                      label="Product Name"
                    >
                      <Input
                        {...register("name", {
                          required: "Product name is required",
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
                            const numValue =
                              typeof value === "number"
                                ? value
                                : parseFloat(String(value))
                            if (!numValue || numValue <= 0) {
                              return "Selling price must be greater than 0"
                            }
                            const buyingPrice =
                              typeof formValues.buying_price === "number"
                                ? formValues.buying_price
                                : parseFloat(
                                    String(formValues.buying_price || 0),
                                  )
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

                    {/* Note about stock management */}
                    <Box
                      p={4}
                      bg={{ base: "blue.900/20", _light: "blue.50" }}
                      borderRadius="md"
                      borderWidth="1px"
                      borderColor={{ base: "blue.700", _light: "blue.200" }}
                    >
                      <HStack gap={2} mb={2}>
                        {/* @ts-ignore */}
                        <FaInfoCircle color="var(--chakra-colors-blue-400)" />
                        <Text
                          fontWeight="semibold"
                          fontSize="sm"
                          color={{ base: "blue.300", _light: "blue.700" }}
                        >
                          Stock Management
                        </Text>
                      </HStack>
                      <Text
                        fontSize="xs"
                        color={{ base: "gray.400", _light: "gray.600" }}
                      >
                        Stock levels and reorder points are managed via the{" "}
                        <strong>Stock Adjustment</strong> module. Current stock:{" "}
                        <strong>{product.current_stock || 0} units</strong>
                      </Text>
                    </Box>

                    {/* Product Image Upload */}
                    {/* <Field
                      label="Product Image"
                      helperText="Upload a JPG or PNG image (max 5MB)"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                        onChange={handleImageSelect}
                        style={{ display: "none" }}
                      />
                      
                      {imagePreview ? (
                        <Box position="relative">
                          <Image
                            src={imagePreview}
                            alt="New product preview"
                            borderRadius="md"
                            maxH="250px"
                            objectFit="contain"
                            w="full"
                            bg={{ base: "gray.800", _light: "gray.50" }}
                            border="1px solid"
                            borderColor={{ base: "gray.700", _light: "gray.200" }}
                          />
                          <IconButton
                            position="absolute"
                            top={2}
                            right={2}
                            size="sm"
                            colorScheme="red"
                            onClick={removeImage}
                            aria-label="Remove new image"
                          >
                            <FaTimes />
                          </IconButton>
                          <Badge
                            position="absolute"
                            bottom={2}
                            left={2}
                            colorScheme="green"
                            size="sm"
                          >
                            New Image Selected
                          </Badge>
                        </Box>
                      ) : product.image?.id ? (
                        <Box>
                          <Text fontSize="sm" mb={2} color={{ base: "gray.400", _light: "gray.600" }} fontWeight="medium">
                            Current Image:
                          </Text>
                          <Box position="relative">
                            <Image
                              src={`/api/v1/media/serve/${product.image.id}`}
                              alt={product.name}
                              borderRadius="md"
                              maxH="250px"
                              objectFit="contain"
                              w="full"
                              bg={{ base: "gray.800", _light: "gray.50" }}
                              border="1px solid"
                              borderColor={{ base: "gray.700", _light: "gray.200" }}
                              mb={3}
                            />
                            <Badge
                              position="absolute"
                              bottom={14}
                              left={2}
                              colorScheme="blue"
                              size="sm"
                            >
                              Current
                            </Badge>
                          </Box>
                          <Button
                            size="sm"
                            variant="outline"
                            colorScheme="teal"
                            onClick={() => fileInputRef.current?.click()}
                            w="full"
                          >
                            <FaImage /> Replace Image
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
                    </Field> */}
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
