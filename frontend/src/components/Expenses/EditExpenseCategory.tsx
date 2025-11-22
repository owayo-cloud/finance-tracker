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
import { FaExchangeAlt, FaTrash } from "react-icons/fa"
import type { ExpenseCategoryPublic } from "@/client"
import type { ApiError } from "@/client/core/ApiError"
import { ExpensesService } from "@/client"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import { Field } from "../ui/field"
import { Textarea } from "@chakra-ui/react"

interface EditExpenseCategoryProps {
  category: ExpenseCategoryPublic
}

interface ExpenseCategoryUpdateForm {
  name?: string
  description?: string
}

const EditExpenseCategory = ({ category }: EditExpenseCategoryProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseCategoryUpdateForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      name: category.name,
      description: category.description || "",
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: ExpenseCategoryUpdateForm) => {
      return await ExpensesService.updateExpenseCategory({
        categoryId: category.id,
        requestBody: data,
      })
    },
    onSuccess: () => {
      showSuccessToast("Expense category updated successfully.")
      reset()
      setIsOpen(false)
    },
    onError: (err: ApiError | Error) => {
      handleError(err as ApiError)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["expenseCategories"] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await ExpensesService.deleteExpenseCategory({
        categoryId: category.id,
      })
    },
    onSuccess: () => {
      showSuccessToast("Expense category deleted successfully.")
      setIsOpen(false)
    },
    onError: (err: ApiError | Error) => {
      const error = err as ApiError
      if (error.body && typeof error.body === 'object' && 'detail' in error.body) {
        showErrorToast(error.body.detail as string)
      } else {
        handleError(error)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["expenseCategories"] })
    },
  })

  const onSubmit: SubmitHandler<ExpenseCategoryUpdateForm> = (data) => {
    updateMutation.mutate(data)
  }

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${category.name}"? This action cannot be undone.`)) {
      deleteMutation.mutate()
    }
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
          <FaExchangeAlt fontSize="14px" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Edit Expense Category</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4} color={{ base: "#9ca3af", _light: "#6b7280" }}>
              Update the expense category details below.
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
                      value: 255,
                      message: "Name must be less than 255 characters",
                    },
                  })}
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
                <Textarea
                  {...register("description", {
                    maxLength: {
                      value: 500,
                      message: "Description must be less than 500 characters",
                    },
                  })}
                  rows={3}
                  bg={{ base: "#1a1d29", _light: "#ffffff" }}
                  border="1px solid"
                  borderColor={{ base: "rgba(255, 255, 255, 0.1)", _light: "#e5e7eb" }}
                  color={{ base: "#ffffff", _light: "#1a1d29" }}
                  _focus={{ borderColor: "#14b8a6", boxShadow: "0 0 0 1px #14b8a6" }}
                />
              </Field>
            </VStack>
          </DialogBody>
          <DialogFooter>
            <Flex gap={2} w="full" justify="space-between">
              <Button
                type="button"
                variant="outline"
                colorScheme="red"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                loading={deleteMutation.isPending}
              >
                <FaTrash fontSize="14px" style={{ marginRight: "8px" }} />
                Delete
              </Button>
              <Flex gap={2}>
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
            </Flex>
          </DialogFooter>
        </form>
      </DialogContent>
    </DialogRoot>
  )
}

export default EditExpenseCategory

