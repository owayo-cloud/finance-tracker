import {
  Button,
  DialogActionTrigger,
  DialogRoot,
  DialogTrigger,
  Flex,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import { FiEdit } from "react-icons/fi"
import type { PaymentMethodPublic } from "@/client"
import { OpenAPI } from "@/client"
import type { ApiError } from "@/client/core/ApiError"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"
import { Checkbox } from "../ui/checkbox"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import { Field } from "../ui/field"

interface EditPaymentMethodProps {
  paymentMethod: PaymentMethodPublic
}

interface PaymentMethodUpdateForm {
  name?: string
  description?: string
  is_active?: boolean
}

const EditPaymentMethod = ({ paymentMethod }: EditPaymentMethodProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PaymentMethodUpdateForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      name: paymentMethod.name,
      description: paymentMethod.description || "",
      is_active: paymentMethod.is_active,
    },
  })

  const mutation = useMutation({
    mutationFn: async (data: PaymentMethodUpdateForm) => {
      const token = localStorage.getItem("access_token")
      const response = await fetch(
        `${OpenAPI.BASE}/api/v1/sales/payment-methods/${paymentMethod.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        },
      )
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Failed to update payment method")
      }
      return response.json()
    },
    onSuccess: () => {
      showSuccessToast("Payment method updated successfully.")
      reset()
      setIsOpen(false)
    },
    onError: (err: ApiError | Error) => {
      handleError(err as ApiError)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] })
    },
  })

  const onSubmit: SubmitHandler<PaymentMethodUpdateForm> = (data) => {
    mutation.mutate(data)
  }

  return (
    <DialogRoot
      size={{ base: "xs", md: "md" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => setIsOpen(open)}
    >
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          bg="#3b82f6"
          color="white"
          _hover={{ bg: "#2563eb" }}
        >
          <FiEdit fontSize="14px" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Edit Payment Method</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4} color={{ base: "#9ca3af", _light: "#6b7280" }}>
              Update the payment method details below.
            </Text>
            <VStack gap={4}>
              <Field
                label="Name"
                invalid={!!errors.name}
                errorText={errors.name?.message}
              >
                <Input
                  {...register("name", {
                    maxLength: {
                      value: 100,
                      message: "Name must be less than 100 characters",
                    },
                  })}
                  bg={{ base: "#1a1d29", _light: "#ffffff" }}
                  border="1px solid"
                  borderColor={{
                    base: "rgba(255, 255, 255, 0.1)",
                    _light: "#e5e7eb",
                  }}
                  color={{ base: "#ffffff", _light: "#1a1d29" }}
                  _focus={{
                    borderColor: "#14b8a6",
                    boxShadow: "0 0 0 1px #14b8a6",
                  }}
                />
              </Field>
              <Field
                label="Description"
                invalid={!!errors.description}
                errorText={errors.description?.message}
              >
                <Input
                  {...register("description", {
                    maxLength: {
                      value: 500,
                      message: "Description must be less than 500 characters",
                    },
                  })}
                  bg={{ base: "#1a1d29", _light: "#ffffff" }}
                  border="1px solid"
                  borderColor={{
                    base: "rgba(255, 255, 255, 0.1)",
                    _light: "#e5e7eb",
                  }}
                  color={{ base: "#ffffff", _light: "#1a1d29" }}
                  _focus={{
                    borderColor: "#14b8a6",
                    boxShadow: "0 0 0 1px #14b8a6",
                  }}
                />
              </Field>
              <Field label="Status">
                <Checkbox
                  {...register("is_active")}
                  defaultChecked={paymentMethod.is_active}
                  colorPalette="teal"
                >
                  Active
                </Checkbox>
              </Field>
            </VStack>
          </DialogBody>
          <DialogFooter>
            <Flex gap={2} w="full" justify="flex-end">
              <DialogCloseTrigger asChild>
                <Button variant="outline">Cancel</Button>
              </DialogCloseTrigger>
              <DialogActionTrigger asChild>
                <Button
                  type="submit"
                  bg="#14b8a6"
                  color="white"
                  _hover={{ bg: "#0d9488" }}
                  disabled={isSubmitting}
                  loading={isSubmitting}
                >
                  Update
                </Button>
              </DialogActionTrigger>
            </Flex>
          </DialogFooter>
        </form>
      </DialogContent>
    </DialogRoot>
  )
}

export default EditPaymentMethod
