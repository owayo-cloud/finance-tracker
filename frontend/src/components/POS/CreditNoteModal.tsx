import {
  Button,
  Flex,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react"
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogActionTrigger,
} from "@/components/ui/dialog"
import { Field } from "@/components/ui/field"
import { Textarea } from "@chakra-ui/react"
import { useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import { SalesService, OpenAPI } from "@/client"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"
import type { ApiError } from "@/client/core/ApiError"

interface CreditNoteModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface CreditNoteForm {
  amount: number
  customer_name: string
  reason: string
  notes?: string
}

export function CreditNoteModal({
  isOpen,
  onClose,
  onSuccess,
}: CreditNoteModalProps) {
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<CreditNoteForm>({
    mode: "onBlur",
    defaultValues: {
      amount: 0,
      customer_name: "",
      reason: "",
      notes: "",
    },
  })

  const onSubmit: SubmitHandler<CreditNoteForm> = async (data) => {
    try {
      setIsSubmitting(true)
      
      // Find Credit Note payment method
      const paymentMethods = await SalesService.readPaymentMethods({ limit: 100 })
      const creditNoteMethod = paymentMethods.data.find(
        (pm) => pm.name.toUpperCase().includes("CREDIT NOTE") || pm.name.toUpperCase().includes("CREDIT")
      )
      
      if (!creditNoteMethod) {
        showErrorToast("Credit Note payment method not found. Please contact administrator.")
        return
      }

      // Create a sale with Credit Note payment method
      // Note: This creates a negative sale or refund entry
      const token = localStorage.getItem("access_token") || ""
      const apiBase = OpenAPI.BASE || import.meta.env.VITE_API_URL || ""
      
      // For credit notes, we'll create a special sale entry
      // In a real system, you might want a separate credit_note table
      const response = await fetch(`${apiBase}/api/v1/sales`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: "00000000-0000-0000-0000-000000000000", // Dummy product ID for credit notes
          quantity: 1,
          unit_price: -Math.abs(data.amount), // Negative amount for credit
          total_amount: -Math.abs(data.amount),
          payment_method_id: creditNoteMethod.id,
          customer_name: data.customer_name || null,
          notes: `CREDIT NOTE: ${data.reason}. ${data.notes || ""}`,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Failed to create credit note")
      }

      showSuccessToast("Credit note created successfully")
      reset()
      onClose()
      onSuccess?.()
    } catch (error: any) {
      const errorMessage = error?.message || error?.detail || "Failed to create credit note"
      showErrorToast(errorMessage)
      handleError(error as ApiError)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <DialogRoot
      size={{ base: "xs", md: "md" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => !open && handleClose()}
    >
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Add Credit Note</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4} color={{ base: "#9ca3af", _light: "#6b7280" }} fontSize="sm">
              Create a credit note for a customer refund or adjustment.
            </Text>
            <VStack gap={4}>
              <Field
                label="Customer Name"
                invalid={!!errors.customer_name}
                errorText={errors.customer_name?.message}
                required
              >
                <Input
                  {...register("customer_name", {
                    required: "Customer name is required",
                    maxLength: {
                      value: 255,
                      message: "Customer name must be less than 255 characters",
                    },
                  })}
                  placeholder="Enter customer name"
                  bg="input.bg"
                  borderColor="input.border"
                  color="text.primary"
                  _focus={{ borderColor: "input.focus.border", boxShadow: "input.focus.shadow" }}
                />
              </Field>
              <Field
                label="Amount"
                invalid={!!errors.amount}
                errorText={errors.amount?.message}
                required
              >
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  {...register("amount", {
                    required: "Amount is required",
                    min: {
                      value: 0.01,
                      message: "Amount must be greater than 0",
                    },
                    valueAsNumber: true,
                  })}
                  placeholder="0.00"
                  bg="input.bg"
                  borderColor="input.border"
                  color="text.primary"
                  _focus={{ borderColor: "input.focus.border", boxShadow: "input.focus.shadow" }}
                />
              </Field>
              <Field
                label="Reason"
                invalid={!!errors.reason}
                errorText={errors.reason?.message}
                required
              >
                <Input
                  {...register("reason", {
                    required: "Reason is required",
                    maxLength: {
                      value: 500,
                      message: "Reason must be less than 500 characters",
                    },
                  })}
                  placeholder="e.g., Product return, Refund, Adjustment"
                  bg="input.bg"
                  borderColor="input.border"
                  color="text.primary"
                  _focus={{ borderColor: "input.focus.border", boxShadow: "input.focus.shadow" }}
                />
              </Field>
              <Field
                label="Notes"
                invalid={!!errors.notes}
                errorText={errors.notes?.message}
              >
                <Textarea
                  {...register("notes", {
                    maxLength: {
                      value: 1000,
                      message: "Notes must be less than 1000 characters",
                    },
                  })}
                  rows={3}
                  placeholder="Additional notes (optional)"
                  bg="input.bg"
                  borderColor="input.border"
                  color="text.primary"
                  _focus={{ borderColor: "input.focus.border", boxShadow: "input.focus.shadow" }}
                />
              </Field>
            </VStack>
          </DialogBody>
          <DialogFooter>
            <Flex gap={2} w="full" justify="flex-end">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <DialogActionTrigger asChild>
                <Button
                  type="submit"
                  bg="brand.primary"
                  color="white"
                  _hover={{ bg: "brand.primary.hover" }}
                  disabled={!isValid || isSubmitting}
                  loading={isSubmitting}
                >
                  Create Credit Note
                </Button>
              </DialogActionTrigger>
            </Flex>
          </DialogFooter>
        </form>
      </DialogContent>
    </DialogRoot>
  )
}

