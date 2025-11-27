import {
  Button,
  createListCollection,
  Flex,
  Input,
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react"
import { useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import {
  DialogActionTrigger,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field } from "@/components/ui/field"
import useCustomToast from "@/hooks/useCustomToast"

interface CashMovementModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface CashMovementForm {
  type: "in" | "out"
  amount: number
  reason: string
  notes?: string
}

export function CashMovementModal({
  isOpen,
  onClose,
  onSuccess,
}: CashMovementModalProps) {
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<CashMovementForm>({
    mode: "onBlur",
    defaultValues: {
      type: "in",
      amount: 0,
      reason: "",
      notes: "",
    },
  })

  const movementType = watch("type")
  const movementTypeCollection = createListCollection({
    items: [
      { label: "Cash In", value: "in" },
      { label: "Cash Out", value: "out" },
    ],
  })

  const onSubmit: SubmitHandler<CashMovementForm> = async (data) => {
    try {
      setIsSubmitting(true)

      // In a real system, you would save this to a cash_movement table
      // For now, we'll just log it and show a success message
      // You can integrate this with your backend later

      const movementData = {
        type: data.type,
        amount: data.amount,
        reason: data.reason,
        notes: data.notes,
        timestamp: new Date().toISOString(),
      }

      // Store in localStorage for now (you can replace with API call)
      const movements = JSON.parse(
        localStorage.getItem("cash_movements") || "[]",
      )
      movements.push(movementData)
      localStorage.setItem("cash_movements", JSON.stringify(movements))

      showSuccessToast(
        `Cash ${data.type === "in" ? "in" : "out"} of Ksh ${data.amount.toFixed(2)} recorded successfully`,
      )
      reset()
      onClose()
      onSuccess?.()
    } catch (_error: any) {
      showErrorToast("Failed to record cash movement")
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
            <DialogTitle>Cash Movement</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text
              mb={4}
              color={{ base: "#9ca3af", _light: "#6b7280" }}
              fontSize="sm"
            >
              Record cash in or cash out transactions.
            </Text>
            <VStack gap={4}>
              <Field
                label="Type"
                invalid={!!errors.type}
                errorText={errors.type?.message}
                required
              >
                <SelectRoot
                  collection={movementTypeCollection}
                  value={movementType ? [movementType] : []}
                  onValueChange={(e) =>
                    setValue("type", e.value[0] as "in" | "out", {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger
                    bg="input.bg"
                    borderColor="input.border"
                    color="text.primary"
                    _focus={{
                      borderColor: "input.focus.border",
                      boxShadow: "input.focus.shadow",
                    }}
                  >
                    <SelectValueText placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem item={{ label: "Cash In", value: "in" }}>
                      Cash In
                    </SelectItem>
                    <SelectItem item={{ label: "Cash Out", value: "out" }}>
                      Cash Out
                    </SelectItem>
                  </SelectContent>
                </SelectRoot>
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
                  bg={{ base: "#1a1d29", _light: "#ffffff" }}
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
                  placeholder="e.g., Petty cash, Bank deposit, Withdrawal"
                  bg={{ base: "#1a1d29", _light: "#ffffff" }}
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
                  bg={{ base: "#1a1d29", _light: "#ffffff" }}
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
            </VStack>
          </DialogBody>
          <DialogFooter>
            <Flex gap={2} w="full" justify="flex-end">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <DialogActionTrigger asChild>
                <Button
                  type="submit"
                  bg="brand.primary"
                  color="white"
                  _hover={{ bg: "brand.primary.hover" }}
                  disabled={!isValid || isSubmitting}
                  loading={isSubmitting}
                >
                  Record Movement
                </Button>
              </DialogActionTrigger>
            </Flex>
          </DialogFooter>
        </form>
      </DialogContent>
    </DialogRoot>
  )
}
