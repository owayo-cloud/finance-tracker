import {
  Box,
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
  DialogCloseTrigger,
  DialogActionTrigger,
} from "@/components/ui/dialog"
import { Field } from "@/components/ui/field"
import { useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import useCustomToast from "@/hooks/useCustomToast"

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
  const { showSuccessToast } = useCustomToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
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
      
      const customer: Customer = {
        name: data.name.trim(),
        tel: data.tel.trim(),
        balance: data.balance || 0,
      }
      
      // Save to localStorage
      const customers = JSON.parse(localStorage.getItem("pos_customers") || "[]")
      customers.push(customer)
      localStorage.setItem("pos_customers", JSON.stringify(customers))
      
      showSuccessToast("Customer created successfully")
      onSave(customer)
      reset()
      onClose()
    } catch (error: any) {
      console.error("New customer error:", error)
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
            <DialogTitle>New Customer</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4} color={{ base: "#9ca3af", _light: "#6b7280" }} fontSize="sm">
              Create a new customer profile.
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
              <DialogCloseTrigger asChild>
                <Button variant="outline" onClick={handleClose}>Cancel</Button>
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
                  Create Customer
                </Button>
              </DialogActionTrigger>
            </Flex>
          </DialogFooter>
        </form>
      </DialogContent>
    </DialogRoot>
  )
}

