import {
  Badge,
  Box,
  Button,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  Flex,
  HStack,
  Input,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"

import {
  type ApiError,
  type DebtPaymentCreate,
  type DebtPublic,
  DebtsService,
} from "../../client"
import useCustomToast from "../../hooks/useCustomToast"

interface RecordPaymentProps {
  debt: DebtPublic
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    minimumFractionDigits: 0,
  }).format(num)
}

export default function RecordPayment({
  debt,
  isOpen,
  onClose,
  onSuccess,
}: RecordPaymentProps) {
  const queryClient = useQueryClient()
  const showToast = useCustomToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm<DebtPaymentCreate>({
    mode: "onBlur",
    defaultValues: {
      amount: 0,
      notes: "",
    },
  })

  const paymentAmount = watch("amount")
  const paymentAmountNum =
    typeof paymentAmount === "string"
      ? parseFloat(paymentAmount)
      : paymentAmount || 0
  const remainingBalance =
    parseFloat(debt.balance?.toString() || "0") - paymentAmountNum

  const mutation = useMutation({
    mutationFn: (data: DebtPaymentCreate) =>
      DebtsService.createDebtPayment({ debtId: debt.id, requestBody: data }),
    onSuccess: () => {
      showToast.showSuccessToast("Payment recorded successfully")
      reset()
      onSuccess()
      queryClient.invalidateQueries({ queryKey: ["debts"] })
    },
    onError: (err: ApiError) => {
      const errDetail = (err.body as any)?.detail
      showToast.showErrorToast(errDetail || "Failed to record payment")
    },
    onSettled: () => {
      setIsSubmitting(false)
    },
  })

  const onSubmit: SubmitHandler<DebtPaymentCreate> = (data) => {
    setIsSubmitting(true)
    mutation.mutate(data)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <DialogRoot open={isOpen} onOpenChange={(e) => !e.open && handleClose()}>
      <DialogContent
        maxW="500px"
        bg={{ base: "#1a1d29", _light: "#ffffff" }}
        border="1px solid"
        borderColor={{ base: "rgba(255, 255, 255, 0.08)", _light: "#e5e7eb" }}
      >
        <DialogHeader>
          <DialogTitle color={{ base: "#e5e7eb", _light: "#111827" }}>
            Record Payment
          </DialogTitle>
          <DialogCloseTrigger />
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit as SubmitHandler<any>)}>
          <DialogBody>
            <VStack gap={4} align="stretch">
              {/* Debt Summary */}
              <Box
                p={4}
                bg={{ base: "#0f1117", _light: "#f9fafb" }}
                borderRadius="md"
                border="1px solid"
                borderColor={{
                  base: "rgba(255, 255, 255, 0.08)",
                  _light: "#e5e7eb",
                }}
              >
                <Flex justify="space-between" mb={2}>
                  <Text
                    fontSize="sm"
                    color={{ base: "#9ca3af", _light: "#6b7280" }}
                  >
                    Customer
                  </Text>
                  <Text
                    fontSize="sm"
                    fontWeight="600"
                    color={{ base: "#e5e7eb", _light: "#374151" }}
                  >
                    {debt.customer_name}
                  </Text>
                </Flex>

                <Flex justify="space-between" mb={2}>
                  <Text
                    fontSize="sm"
                    color={{ base: "#9ca3af", _light: "#6b7280" }}
                  >
                    Total Debt
                  </Text>
                  <Text
                    fontSize="sm"
                    fontWeight="600"
                    color={{ base: "#e5e7eb", _light: "#374151" }}
                  >
                    {formatCurrency(debt.amount)}
                  </Text>
                </Flex>

                <Flex justify="space-between" mb={2}>
                  <Text
                    fontSize="sm"
                    color={{ base: "#9ca3af", _light: "#6b7280" }}
                  >
                    Paid
                  </Text>
                  <Text
                    fontSize="sm"
                    fontWeight="600"
                    color={{ base: "#10b981", _light: "#059669" }}
                  >
                    {formatCurrency(debt.amount_paid || 0)}
                  </Text>
                </Flex>

                <Flex justify="space-between">
                  <Text
                    fontSize="sm"
                    color={{ base: "#9ca3af", _light: "#6b7280" }}
                  >
                    Outstanding Balance
                  </Text>
                  <Text
                    fontSize="sm"
                    fontWeight="700"
                    color={{ base: "#fbbf24", _light: "#f59e0b" }}
                  >
                    {formatCurrency(debt.balance)}
                  </Text>
                </Flex>
              </Box>

              {/* Payment Amount */}
              <Box>
                <Text
                  fontSize="sm"
                  fontWeight="500"
                  mb={2}
                  color={{ base: "#e5e7eb", _light: "#374151" }}
                >
                  Payment Amount <span style={{ color: "#ef4444" }}>*</span>
                </Text>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Enter payment amount"
                  {...register("amount", {
                    required: "Payment amount is required",
                    min: {
                      value: 0.01,
                      message: "Amount must be greater than 0",
                    },
                    max: {
                      value: parseFloat(debt.balance.toString()),
                      message: "Amount cannot exceed outstanding balance",
                    },
                  })}
                  bg={{ base: "#0f1117", _light: "#f9fafb" }}
                  border="1px solid"
                  borderColor={{
                    base: errors.amount
                      ? "#ef4444"
                      : "rgba(255, 255, 255, 0.08)",
                    _light: errors.amount ? "#ef4444" : "#e5e7eb",
                  }}
                />
                {errors.amount && (
                  <Text fontSize="sm" color="#ef4444" mt={1}>
                    {errors.amount.message}
                  </Text>
                )}
              </Box>

              {/* Remaining Balance Preview */}
              {paymentAmountNum > 0 && (
                <Box
                  p={3}
                  bg={
                    remainingBalance <= 0
                      ? { base: "#064e3b", _light: "#d1fae5" }
                      : { base: "#422006", _light: "#fef3c7" }
                  }
                  borderRadius="md"
                  border="1px solid"
                  borderColor={
                    remainingBalance <= 0
                      ? { base: "#10b981", _light: "#10b981" }
                      : { base: "#f59e0b", _light: "#f59e0b" }
                  }
                >
                  <Flex justify="space-between" align="center">
                    <Text
                      fontSize="sm"
                      fontWeight="600"
                      color={
                        remainingBalance <= 0
                          ? { base: "#34d399", _light: "#059669" }
                          : { base: "#fbbf24", _light: "#d97706" }
                      }
                    >
                      New Balance
                    </Text>
                    <HStack>
                      <Text
                        fontSize="lg"
                        fontWeight="700"
                        color={
                          remainingBalance <= 0
                            ? { base: "#10b981", _light: "#047857" }
                            : { base: "#fbbf24", _light: "#d97706" }
                        }
                      >
                        {formatCurrency(Math.max(0, remainingBalance))}
                      </Text>
                      {remainingBalance <= 0 && (
                        <Badge colorPalette="green" size="sm">
                          PAID IN FULL
                        </Badge>
                      )}
                    </HStack>
                  </Flex>
                </Box>
              )}

              {/* Payment Method - Note: payment_method_id is required but not implemented in this component */}

              {/* Notes */}
              <Box>
                <Text
                  fontSize="sm"
                  fontWeight="500"
                  mb={2}
                  color={{ base: "#e5e7eb", _light: "#374151" }}
                >
                  Notes (Optional)
                </Text>
                <Textarea
                  placeholder="Add payment notes..."
                  rows={3}
                  {...register("notes")}
                  bg={{ base: "#0f1117", _light: "#f9fafb" }}
                  border="1px solid"
                  borderColor={{
                    base: "rgba(255, 255, 255, 0.08)",
                    _light: "#e5e7eb",
                  }}
                />
              </Box>
            </VStack>
          </DialogBody>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose} mr={3}>
              Cancel
            </Button>
            <Button
              type="submit"
              colorPalette="blue"
              loading={isSubmitting}
              disabled={isSubmitting || Object.keys(errors).length > 0}
            >
              Record Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </DialogRoot>
  )
}
