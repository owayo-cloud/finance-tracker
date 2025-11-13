import {
  Button,
  DialogActionTrigger,
  DialogTitle,
  Input,
  Text,
  VStack,
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
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTrigger,
} from "../ui/dialog"
import { Field } from "../ui/field"

interface EditProductProps {
  product: ProductPublic
  children: React.ReactNode
}

const EditProduct = ({ product, children }: EditProductProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
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
      ProductsService.updateProduct({ id: Number(product.id), requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Product updated successfully.")
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

  const onCancel = () => {
    reset()
    setIsOpen(false)
  }

  return (
    <DialogRoot
      size={{ base: "xs", md: "md" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => {
        if (!open) {
          reset()
        }
        setIsOpen(open)
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>Update the product details.</Text>
            <VStack gap={4}>
              <Field
                invalid={!!errors.name}
                errorText={errors.name?.message}
                label="Product Name"
              >
                <Input
                  {...register("name")}
                  placeholder="Product Name"
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
                  placeholder="Description"
                  type="text"
                />
              </Field>

              <Field
                invalid={!!errors.buying_price}
                errorText={errors.buying_price?.message}
                label="Buying Price (BP)"
              >
                <Input
                  {...register("buying_price", {
                    valueAsNumber: true,
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
                label="Selling Price (SP)"
              >
                <Input
                  {...register("selling_price", {
                    valueAsNumber: true,
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

              <Field
                invalid={!!errors.category_id}
                errorText={errors.category_id?.message}
                label="Category ID"
              >
                <Input
                  {...register("category_id")}
                  placeholder="Category UUID"
                  type="text"
                />
              </Field>

              <Field
                invalid={!!errors.status_id}
                errorText={errors.status_id?.message}
                label="Status ID"
              >
                <Input
                  {...register("status_id")}
                  placeholder="Status UUID"
                  type="text"
                />
              </Field>
            </VStack>
          </DialogBody>

          <DialogFooter gap={2}>
            <DialogActionTrigger asChild>
              <Button
                variant="subtle"
                colorPalette="gray"
                disabled={isSubmitting}
                onClick={onCancel}
              >
                Cancel
              </Button>
            </DialogActionTrigger>
            <Button
              variant="solid"
              type="submit"
              disabled={!isDirty || !isValid}
              loading={isSubmitting}
            >
              Save
            </Button>
          </DialogFooter>
        </form>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

export default EditProduct
