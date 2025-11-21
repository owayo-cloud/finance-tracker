import {
  Button,
  DialogActionTrigger,
  DialogTitle,
  Flex,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import { FaPlus } from "react-icons/fa"
import type { ApiError } from "@/client/core/ApiError"
import { OpenAPI } from "@/client"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"
import { Checkbox } from "../ui/checkbox"
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

interface PaymentMethodCreateForm {
  name: string
  description?: string
  is_active: boolean
}

const AddPaymentMethod = () => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<PaymentMethodCreateForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      name: "",
      description: "",
      is_active: true,
    },
  })

  const mutation = useMutation({
    mutationFn: async (data: PaymentMethodCreateForm) => {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${OpenAPI.BASE}/api/v1/sales/payment-methods`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Failed to create payment method")
      }
      return response.json()
    },
    onSuccess: () => {
      showSuccessToast("Payment method created successfully.")
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

  const onSubmit: SubmitHandler<PaymentMethodCreateForm> = (data) => {
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
        <Button value="add-payment-method" my={4} bg="#14b8a6" color="white" _hover={{ bg: "#0d9488" }}>
          <FaPlus fontSize="16px" />
          Add Payment Method
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4} color={{ base: "#9ca3af", _light: "#6b7280" }}>
              Fill in the form below to add a new payment method to the system.
            </Text>
            <VStack gap={4}>
              <Field
                label="Name"
                invalid={!!errors.name}
                errorText={errors.name?.message}
                required
              >
                <Input
                  {...register("name", {
                    required: "Name is required",
                    maxLength: {
                      value: 100,
                      message: "Name must be less than 100 characters",
                    },
                  })}
                  placeholder="e.g., POS Cash Acc"
                  bg={{ base: "#1a1d29", _light: "#ffffff" }}
                  border="1px solid"
                  borderColor={{ base: "rgba(255, 255, 255, 0.1)", _light: "#e5e7eb" }}
                  color={{ base: "#ffffff", _light: "#1a1d29" }}
                  _focus={{ borderColor: "#14b8a6", boxShadow: "0 0 0 1px #14b8a6" }}
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
                  placeholder="e.g., Cash payments at point of sale"
                  bg={{ base: "#1a1d29", _light: "#ffffff" }}
                  border="1px solid"
                  borderColor={{ base: "rgba(255, 255, 255, 0.1)", _light: "#e5e7eb" }}
                  color={{ base: "#ffffff", _light: "#1a1d29" }}
                  _focus={{ borderColor: "#14b8a6", boxShadow: "0 0 0 1px #14b8a6" }}
                />
              </Field>
              <Field label="Status">
                <Checkbox
                  {...register("is_active")}
                  defaultChecked={true}
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
                  disabled={!isValid || isSubmitting}
                  loading={isSubmitting}
                >
                  Create
                </Button>
              </DialogActionTrigger>
            </Flex>
          </DialogFooter>
        </form>
      </DialogContent>
    </DialogRoot>
  )
}

export default AddPaymentMethod

