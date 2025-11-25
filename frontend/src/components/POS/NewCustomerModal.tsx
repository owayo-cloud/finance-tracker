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
} from "@/components/ui/dialog"
import { Field } from "@/components/ui/field"
import { useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import { useQueryClient } from "@tanstack/react-query"
import useCustomToast from "@/hooks/useCustomToast"
import useAuth from "@/hooks/useAuth"

interface Customer {
  name: string
  tel: string
  balance: number
}

interface NewCustomerModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (customer: Customer) => void
}

interface NewCustomerForm {
  name: string
  tel: string
  balance: number
}

export function NewCustomerModal({
  isOpen,
  onClose,
  onSave,
}: NewCustomerModalProps) {
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Check if user is admin
  const isAdmin = currentUser?.is_superuser || false
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<NewCustomerForm>({
    mode: "onBlur",
    defaultValues: {
      name: "",
      tel: "",
      balance: 0,
    },
  })

  const onSubmit: SubmitHandler<NewCustomerForm> = async (data) => {
    try {
      setIsSubmitting(true)
      
      const customerName = data.name.trim()
      const customerTel = data.tel.trim()
      const initialBalance = data.balance || 0
      
      // Create debt entry via API (this creates the customer account)
      const token = localStorage.getItem("access_token") || ""
      const apiBase = import.meta.env.VITE_API_URL || ""
      
      // Create debt entry to establish customer account
      // If balance is 0, create a minimal paid debt to establish the account
      // If balance > 0, create an actual debt
      const amount = initialBalance > 0 ? initialBalance : 0.01
      const amountPaid = initialBalance > 0 ? 0 : 0.01
      
      // Backend calculates balance automatically, so we don't need to send it
      const debtData = {
        customer_name: customerName,
        customer_contact: customerTel || undefined,
        amount: amount,
        amount_paid: amountPaid,
        // balance is calculated by backend as amount - amount_paid
        notes: initialBalance > 0 
          ? `Initial customer account with balance of ${initialBalance}` 
          : "Initial customer account creation (zero balance)",
      }
      
      const response = await fetch(`${apiBase}/api/v1/debts/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(debtData),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to create customer" }))
        throw new Error(errorData.detail || `Failed to create customer: ${response.status}`)
      }
      
      const createdDebt = await response.json()
      
      const customer: Customer = {
        name: customerName,
        tel: customerTel,
        balance: parseFloat(createdDebt.balance?.toString() || "0"),
      }
      
      // Invalidate all customer queries (including those with search params)
      await queryClient.invalidateQueries({ queryKey: ["customers"], exact: false })
      await queryClient.invalidateQueries({ queryKey: ["debts-for-customers"] })
      
      // Verify the debt was created by checking the debts API
      try {
        const verifyResponse = await fetch(`${apiBase}/api/v1/debts/?customer_name=${encodeURIComponent(customerName)}&limit=10`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      } catch (e) {
        // Verification failed, but continue anyway
      }
      
      // Small delay to ensure backend has processed the creation
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Trigger custom event to update customer search modal in same window
      window.dispatchEvent(new CustomEvent("customerCreated", { detail: { customerName } }))
      
      showSuccessToast("Customer created successfully")
      onSave(customer)
      reset()
      onClose()
    } catch (error: any) {
      showErrorToast(error.message || "Failed to create customer")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  // Don't show modal if not admin
  if (!isAdmin && isOpen) {
    showErrorToast("Only administrators can create new customers")
    onClose()
    return null
  }

  return (
    <DialogRoot
      size={{ base: "xs", md: "md" }}
      placement="center"
      open={isOpen && isAdmin}
      onOpenChange={({ open }) => !open && handleClose()}
    >
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>New Customer (Credit Account)</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4} color={{ base: "#9ca3af", _light: "#6b7280" }} fontSize="sm">
              Create a new credit customer account. This customer will be able to make purchases on credit.
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
                    required: "Customer name is required",
                    maxLength: {
                      value: 255,
                      message: "Name must be less than 255 characters",
                    },
                  })}
                  placeholder="Enter customer name"
                  bg={{ base: "#1a1d29", _light: "#ffffff" }}
                  borderColor={{ base: "rgba(255, 255, 255, 0.1)", _light: "#e5e7eb" }}
                  color={{ base: "#ffffff", _light: "#1a1d29" }}
                  _focus={{ borderColor: "#14b8a6", boxShadow: "0 0 0 1px #14b8a6" }}
                />
              </Field>
              <Field
                label="Phone"
                invalid={!!errors.tel}
                errorText={errors.tel?.message}
              >
                <Input
                  {...register("tel", {
                    maxLength: {
                      value: 20,
                      message: "Phone must be less than 20 characters",
                    },
                  })}
                  placeholder="Enter phone number"
                  bg={{ base: "#1a1d29", _light: "#ffffff" }}
                  borderColor={{ base: "rgba(255, 255, 255, 0.1)", _light: "#e5e7eb" }}
                  color={{ base: "#ffffff", _light: "#1a1d29" }}
                  _focus={{ borderColor: "#14b8a6", boxShadow: "0 0 0 1px #14b8a6" }}
                />
              </Field>
              <Field
                label="Balance"
                invalid={!!errors.balance}
                errorText={errors.balance?.message}
              >
                <Input
                  type="number"
                  step="0.01"
                  {...register("balance", {
                    valueAsNumber: true,
                    min: {
                      value: 0,
                      message: "Balance cannot be negative",
                    },
                  })}
                  placeholder="0.00"
                  bg={{ base: "#1a1d29", _light: "#ffffff" }}
                  borderColor={{ base: "rgba(255, 255, 255, 0.1)", _light: "#e5e7eb" }}
                  color={{ base: "#ffffff", _light: "#1a1d29" }}
                  _focus={{ borderColor: "#14b8a6", boxShadow: "0 0 0 1px #14b8a6" }}
                />
              </Field>
            </VStack>
          </DialogBody>
          <DialogFooter>
            <Flex gap={2} w="full" justify="flex-end">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button
                type="submit"
                bg="#14b8a6"
                color="white"
                _hover={{ bg: "#0d9488" }}
                disabled={!isValid || isSubmitting}
                loading={isSubmitting}
              >
                Create Customer
              </Button>
            </Flex>
          </DialogFooter>
        </form>
      </DialogContent>
    </DialogRoot>
  )
}

