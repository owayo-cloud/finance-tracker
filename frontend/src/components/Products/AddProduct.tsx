import {
  Button,
  DialogActionTrigger,
  DialogTitle,
  Input,
  Text,
  VStack,
  HStack,
  Box,
  SimpleGrid,
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
  Textarea,
  createListCollection,
  Image,
  Flex,
  IconButton,
  Icon,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState, useMemo, useRef } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import { FaPlus, FaImage, FaTimes, FaInfoCircle } from "react-icons/fa"
import { Tooltip } from "../ui/tooltip"

import { type ProductCreate, ProductsService, MediaService } from "@/client"
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
import { Field } from "../ui/field"

const AddProduct = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [buyingPriceDisplay, setBuyingPriceDisplay] = useState("")
  const [sellingPriceDisplay, setSellingPriceDisplay] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()

  // Format number with thousand delimiter
  const formatNumber = (value: string): string => {
    // Remove all non-digit characters except decimal point
    const cleanValue = value.replace(/[^\d.]/g, "")
    
    // Split by decimal point
    const parts = cleanValue.split(".")
    
    // Add thousand separators to integer part
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    
    // Rejoin with decimal point (limit to 2 decimal places)
    return parts.length > 1 ? `${parts[0]}.${parts[1].slice(0, 2)}` : parts[0]
  }

  // Parse formatted number back to number
  const parseFormattedNumber = (value: string): number => {
    const cleanValue = value.replace(/,/g, "")
    return parseFloat(cleanValue) || 0
  }

  const { data: categoriesData, isLoading: loadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => ProductsService.readCategories(),
  })

  const { data: statusesData, isLoading: loadingStatuses } = useQuery({
    queryKey: ["statuses"],
    queryFn: () => ProductsService.readStatuses(),
  })

  const { data: tagsData, isLoading: loadingTags } = useQuery({
    queryKey: ["tags"],
    queryFn: () => ProductsService.readProductTags(),
  })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isValid, isSubmitting },
  } = useForm<ProductCreate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      name: "",
      description: "",
      buying_price: 0,
      selling_price: 0,
      current_stock: 0,
      reorder_level: 0,
      category_id: "",
      status_id: "",
      tag_id: "",
      image_id: undefined,
    },
  })

  // Register category_id, status_id, and tag_id fields on mount
  useEffect(() => {
    register("category_id", {
      required: "Category is required",
    })
    
    register("status_id", {
      required: "Status is required",
    })

    register("tag_id", {
      required: "Product tag is required",
    })

    register("buying_price", {
      required: "Buying price is required.",
      validate: (value) => {
        const numValue = typeof value === "string" ? parseFloat(value) : value
        if (numValue <= 0) return "Buying price must be greater than 0"
        return true
      },
    })

    register("selling_price", {
      required: "Selling price is required.",
      validate: (value) => {
        const numValue = typeof value === "string" ? parseFloat(value) : value
        if (numValue <= 0) return "Selling price must be greater than 0"
        return true
      },
    })
  }, [register])

  // Create collections for Select components
  const categoriesCollection = useMemo(() => {
    if (!categoriesData?.data) {
      return createListCollection<{ label: string; value: string }>({ items: [] })
    }
    
    return createListCollection({
      items: categoriesData.data.map((category) => ({
        label: category.name,
        value: String(category.id),
      })),
    })
  }, [categoriesData])

  const statusesCollection = useMemo(() => {
    if (!statusesData) {
      return createListCollection<{ label: string; value: string }>({ items: [] })
    }
    
    return createListCollection({
      items: statusesData.map((status) => ({
        label: status.name,
        value: String(status.id),
      })),
    })
  }, [statusesData])

  const tagsCollection = useMemo(() => {
    if (!tagsData) {
      return createListCollection<{ label: string; value: string }>({ items: [] })
    }
    
    return createListCollection({
      items: tagsData.map((tag) => ({
        label: tag.name,
        value: String(tag.id),
      })),
    })
  }, [tagsData])

  const mutation = useMutation({
    mutationFn: async (data: ProductCreate) => {
      let imageId = data.image_id

      // Upload image if one was selected
      if (imageFile) {
        setUploadingImage(true)
        try {
          const formData = new FormData()
          formData.append("file", imageFile)

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

      // Create product with image_id
      return ProductsService.createProduct({
        requestBody: { ...data, image_id: imageId }
      })
    },
    onSuccess: () => {
      showSuccessToast("Product created successfully.")
      reset()
      setImageFile(null)
      setImagePreview(null)
      setBuyingPriceDisplay("")
      setSellingPriceDisplay("")
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

  const onSubmit: SubmitHandler<ProductCreate> = (data) => {
    mutation.mutate(data)
  }

  return (
    <DialogRoot
      size="xl"
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => setIsOpen(open)}
    >
      <DialogTrigger asChild>
        <Button 
          value="add-product" 
          my={4} 
          colorScheme="teal"
          size="md"
        >
          <FaPlus /> Add Product
        </Button>
      </DialogTrigger>
      <DialogContent maxWidth="800px">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader pb={4}>
            <DialogTitle fontSize="xl" fontWeight="bold">
              Add New Product
            </DialogTitle>
            <Text fontSize="sm" color="gray.600" mt={1}>
              Fill in the details to add a new product to your inventory.
            </Text>
          </DialogHeader>
          
          <DialogBody>
            <SimpleGrid columns={2} gap={6}>
              {/* Left Column */}
              <VStack gap={4} align="stretch">
                <Field
                  required
                  invalid={!!errors.name}
                  errorText={errors.name?.message}
                  label="Product Name"
                >
                  <Input
                    {...register("name", {
                      required: "Product name is required.",
                    })}
                    placeholder="Enter product name"
                    size="md"
                    borderRadius="md"
                  />
                </Field>

                <Field
                  invalid={!!errors.description}
                  errorText={errors.description?.message}
                  label="Description"
                >
                  <Textarea
                    {...register("description")}
                    placeholder="Enter product description (optional)"
                    size="md"
                    borderRadius="md"
                    rows={3}
                  />
                </Field>

                <Field
                  required
                  invalid={!!errors.category_id}
                  errorText={errors.category_id?.message}
                  label="Category"
                >
                  <SelectRoot
                    collection={categoriesCollection}
                    size="md"
                    onValueChange={(e) => {
                      const selectedValue = e.value[0]
                      if (selectedValue && selectedValue !== "loading" && selectedValue !== "none") {
                        setValue("category_id", selectedValue, { shouldValidate: true })
                      }
                    }}
                  >
                    <SelectTrigger borderRadius="md">
                      <SelectValueText placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingCategories ? (
                        <SelectItem item={{ label: "Loading categories...", value: "loading" }}>
                          Loading categories...
                        </SelectItem>
                      ) : categoriesCollection.items.length > 0 ? (
                        categoriesCollection.items.map((item) => (
                          <SelectItem key={item.value} item={item}>
                            {item.label}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem item={{ label: "No categories available", value: "none" }}>
                          No categories available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </SelectRoot>
                </Field>

                <Field
                  required
                  invalid={!!errors.status_id}
                  errorText={errors.status_id?.message}
                  label="Status"
                >
                  <SelectRoot
                    collection={statusesCollection}
                    size="md"
                    onValueChange={(e) => {
                      const selectedValue = e.value[0]
                      if (selectedValue && selectedValue !== "loading" && selectedValue !== "none") {
                        setValue("status_id", selectedValue, { shouldValidate: true })
                      }
                    }}
                  >
                    <SelectTrigger borderRadius="md">
                      <SelectValueText placeholder="Select a status" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingStatuses ? (
                        <SelectItem item={{ label: "Loading statuses...", value: "loading" }}>
                          Loading statuses...
                        </SelectItem>
                      ) : statusesCollection.items.length > 0 ? (
                        statusesCollection.items.map((item) => (
                          <SelectItem key={item.value} item={item}>
                            {item.label}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem item={{ label: "No statuses available", value: "none" }}>
                          No statuses available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </SelectRoot>
                </Field>

                <Field
                  required
                  invalid={!!errors.tag_id}
                  errorText={errors.tag_id?.message}
                  label="Product Tag"
                >
                  <SelectRoot
                    collection={tagsCollection}
                    size="md"
                    onValueChange={(e) => {
                      const selectedValue = e.value[0]
                      if (selectedValue && selectedValue !== "loading" && selectedValue !== "none") {
                        setValue("tag_id", selectedValue, { shouldValidate: true })
                      }
                    }}
                  >
                    <SelectTrigger borderRadius="md">
                      <SelectValueText placeholder="Select a product tag" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingTags ? (
                        <SelectItem item={{ label: "Loading tags...", value: "loading" }}>
                          Loading tags...
                        </SelectItem>
                      ) : tagsCollection.items.length > 0 ? (
                        tagsCollection.items.map((item) => (
                          <SelectItem key={item.value} item={item}>
                            {item.label}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem item={{ label: "No tags available", value: "none" }}>
                          No tags available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </SelectRoot>
                </Field>
              </VStack>

              {/* Right Column */}
              <VStack gap={4} align="stretch">
                <HStack gap={4}>
                <Field
                  required
                  invalid={!!errors.buying_price}
                  errorText={errors.buying_price?.message}
                  label="Buying Price (BP)"
                  flex={1}
                >
                  <Input
                    value={buyingPriceDisplay}
                    onChange={(e) => {
                      const formatted = formatNumber(e.target.value)
                      setBuyingPriceDisplay(formatted)
                      const numericValue = parseFormattedNumber(formatted)
                      setValue("buying_price", numericValue, { shouldValidate: true })
                    }}
                    placeholder="0"
                    type="text"
                    size="md"
                    borderRadius="md"
                  />
                </Field>
                  <Field
                    required
                    invalid={!!errors.selling_price}
                    errorText={errors.selling_price?.message}
                    label="Selling Price (SP)"
                    flex={1}
                  >
                    <Input
                      value={sellingPriceDisplay}
                      onChange={(e) => {
                        const formatted = formatNumber(e.target.value)
                        setSellingPriceDisplay(formatted)
                        const numericValue = parseFormattedNumber(formatted)
                        setValue("selling_price", numericValue, { shouldValidate: true })
                      }}
                      placeholder="0"
                      type="text"
                      size="md"
                      borderRadius="md"
                    />
                  </Field>
                </HStack>

                <HStack gap={4}>
                  <Field
                    required
                    invalid={!!errors.current_stock}
                    errorText={errors.current_stock?.message}
                    label="Current Stock"
                    flex={1}
                  >
                    <Input
                      {...register("current_stock", {
                        required: "Current stock is required.",
                        valueAsNumber: true,
                        min: {
                          value: 0,
                          message: "Stock cannot be negative",
                        },
                      })}
                      placeholder="0"
                      type="number"
                      size="md"
                      borderRadius="md"
                    />
                  </Field>

                  <Field
                    invalid={!!errors.reorder_level}
                    errorText={errors.reorder_level?.message}
                    label={
                      <HStack gap={1}>
                        <Text>Reorder Level</Text>
                        <Tooltip
                          content="The minimum stock quantity at which you should reorder this product to avoid running out of stock."
                          positioning={{ placement: "top" }}
                        >
                          <Icon color={{ base: "blue.400", _light: "blue.600" }} cursor="help">
                            <FaInfoCircle />
                          </Icon>
                        </Tooltip>
                      </HStack>
                    }
                    flex={1}
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
                      size="md"
                      borderRadius="md"
                    />
                  </Field>
                </HStack>

                {/* Product Image Upload */}
                <Field
                  label="Product Image"
                  helperText="Upload an image for this product (optional, max 5MB)"
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
            </SimpleGrid>
          </DialogBody>

          <DialogFooter mt={6} gap={3}>
            <DialogActionTrigger asChild>
              <Button
                variant="outline"
                colorScheme="gray"
                disabled={isSubmitting || uploadingImage}
                size="md"
              >
                Cancel
              </Button>
            </DialogActionTrigger>
            <Button
              colorScheme="teal"
              type="submit"
              disabled={!isValid || uploadingImage}
              loading={isSubmitting || uploadingImage}
              size="md"
            >
              {uploadingImage ? "Uploading..." : "Create Product"}
            </Button>
          </DialogFooter>
        </form>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

export default AddProduct
