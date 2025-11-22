import {
  Button,
  DialogActionTrigger,
  DialogTitle,
  Input,
  VStack,
  HStack,
  Box,
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
  Textarea,
  createListCollection,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState, useMemo } from "react"
import { type SubmitHandler, useForm, Controller } from "react-hook-form"

import { ExpensesService, type ExpenseCreate, type ExpenseUpdate, type ExpensePublic } from "@/client"
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
} from "../ui/dialog"
import { Field } from "../ui/field"

interface AddExpenseProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  editingExpense?: ExpensePublic | null
  onSuccess?: () => void
}

function AddExpense({ isOpen, onOpenChange, editingExpense, onSuccess }: AddExpenseProps) {
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const [amountDisplay, setAmountDisplay] = useState("")

  // Format number with thousand delimiter
  const formatNumber = (value: string): string => {
    const cleanValue = value.replace(/[^\d.]/g, "")
    const parts = cleanValue.split(".")
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    return parts.length > 1 ? `${parts[0]}.${parts[1].slice(0, 2)}` : parts[0]
  }

  // Parse formatted number back to number
  const parseFormattedNumber = (value: string): number => {
    const cleanValue = value.replace(/,/g, "")
    return parseFloat(cleanValue) || 0
  }

  const { data: categoriesData, isLoading: loadingCategories } = useQuery({
    queryKey: ["expenseCategories"],
    queryFn: async () => {
      return await ExpensesService.readExpenseCategories()
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<ExpenseCreate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      category_id: "" as any,
      amount: 0,
      description: "",
      expense_date: new Date().toISOString().split('T')[0],
      notes: "",
    },
  })

  const watchedCategoryId = watch("category_id")

  // Reset form when dialog opens/closes or editingExpense changes
  useEffect(() => {
    if (isOpen) {
      if (editingExpense && editingExpense.expense_date) {
        const expenseDate = new Date(editingExpense.expense_date)
        const dateStr = expenseDate.toISOString().split('T')[0]
        setAmountDisplay(formatNumber(String(editingExpense.amount)))
        reset({
          category_id: editingExpense.category_id as any,
          amount: Number(editingExpense.amount),
          description: editingExpense.description,
          expense_date: dateStr,
          notes: editingExpense.notes || "",
        })
      } else {
        setAmountDisplay("")
        reset({
          category_id: "" as any,
          amount: 0,
          description: "",
          expense_date: new Date().toISOString().split('T')[0],
          notes: "",
        })
      }
    }
  }, [isOpen, editingExpense, reset])

  // Create collection for Select component
  const categoriesCollection = useMemo(() => {
    if (!categoriesData?.data || categoriesData.data.length === 0) {
      return createListCollection<{ label: string; value: string }>({ items: [] })
    }
    return createListCollection<{ label: string; value: string }>({
      items: categoriesData.data.map((cat) => ({
        label: cat.name,
        value: String(cat.id),
      })),
    })
  }, [categoriesData])

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: ExpenseCreate) => {
      return await ExpensesService.createExpense({ requestBody: data })
    },
    onSuccess: () => {
      showSuccessToast("Expense created successfully.")
      reset()
      setAmountDisplay("")
      onOpenChange(false)
      queryClient.invalidateQueries({ queryKey: ["expenses"] })
      queryClient.invalidateQueries({ queryKey: ["expenseSummary"] })
      onSuccess?.()
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: ExpenseUpdate) => {
      if (!editingExpense) throw new Error("No expense to update")
      return await ExpensesService.updateExpense({
        expenseId: editingExpense.id,
        requestBody: data,
      })
    },
    onSuccess: () => {
      showSuccessToast("Expense updated successfully.")
      reset()
      setAmountDisplay("")
      onOpenChange(false)
      queryClient.invalidateQueries({ queryKey: ["expenses"] })
      queryClient.invalidateQueries({ queryKey: ["expenseSummary"] })
      onSuccess?.()
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
  })

  const onSubmit: SubmitHandler<ExpenseCreate | ExpenseUpdate> = (data) => {
    const expenseData = {
      ...data,
      amount: parseFormattedNumber(amountDisplay) || Number(data.amount),
    }
    
    if (editingExpense) {
      updateMutation.mutate(expenseData as ExpenseUpdate)
    } else {
      createMutation.mutate(expenseData as ExpenseCreate)
    }
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNumber(e.target.value)
    setAmountDisplay(formatted)
    const parsed = parseFormattedNumber(formatted)
    setValue("amount", parsed, { shouldValidate: true })
  }

  const isLoading = loadingCategories || createMutation.isPending || updateMutation.isPending

  return (
    <DialogRoot open={isOpen} onOpenChange={(e) => onOpenChange(e.open)} size="lg">
      <DialogContent maxWidth="600px">
        <DialogHeader>
          <DialogTitle>{editingExpense ? "Edit Expense" : "Add Expense"}</DialogTitle>
          <DialogCloseTrigger />
        </DialogHeader>
        <DialogBody>
          <Box
            as="form"
            id="expense-form"
            onSubmit={handleSubmit(onSubmit)}
          >
            <VStack gap={4} align="stretch">
              {/* Category */}
              <Field
                label="Category"
                invalid={!!errors.category_id}
                errorText={errors.category_id?.message as string}
                required
              >
                <Controller
                  name="category_id"
                  control={control}
                  rules={{ required: "Category is required" }}
                  render={({ field }) => (
                    <SelectRoot
                      collection={categoriesCollection}
                      value={watchedCategoryId ? [String(watchedCategoryId)] : []}
                      onValueChange={(e) => {
                        field.onChange(e.value[0])
                        setValue("category_id", e.value[0] as any, { shouldValidate: true })
                      }}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValueText placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriesData?.data?.map((cat) => (
                          <SelectItem key={cat.id} item={{ label: cat.name, value: String(cat.id) }}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </SelectRoot>
                  )}
                />
              </Field>

              {/* Amount */}
              <Field
                label="Amount"
                invalid={!!errors.amount}
                errorText={errors.amount?.message as string}
                required
              >
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amountDisplay}
                  onChange={handleAmountChange}
                  onBlur={() => {
                    if (!amountDisplay) {
                      setAmountDisplay("0.00")
                      setValue("amount", 0, { shouldValidate: true })
                    }
                  }}
                  disabled={isLoading}
                />
              </Field>

              {/* Description */}
              <Field
                label="Description"
                invalid={!!errors.description}
                errorText={errors.description?.message as string}
                required
              >
                <Input
                  {...register("description", {
                    required: "Description is required",
                    maxLength: {
                      value: 1000,
                      message: "Description must be less than 1000 characters",
                    },
                  })}
                  placeholder="Enter expense description"
                  disabled={isLoading}
                />
              </Field>

              {/* Expense Date */}
              <Field
                label="Date"
                invalid={!!errors.expense_date}
                errorText={errors.expense_date?.message as string}
                required
              >
                <Input
                  type="date"
                  {...register("expense_date", {
                    required: "Date is required",
                  })}
                  disabled={isLoading}
                />
              </Field>

              {/* Notes */}
              <Field
                label="Notes"
                invalid={!!errors.notes}
                errorText={errors.notes?.message as string}
              >
                <Textarea
                  {...register("notes", {
                    maxLength: {
                      value: 1000,
                      message: "Notes must be less than 1000 characters",
                    },
                  })}
                  placeholder="Additional notes (optional)"
                  rows={3}
                  disabled={isLoading}
                />
              </Field>
            </VStack>
          </Box>
        </DialogBody>
        <DialogFooter>
          <HStack gap={2}>
            <DialogActionTrigger asChild>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </DialogActionTrigger>
            <Button
              type="submit"
              form="expense-form"
              disabled={!isValid || isLoading}
              loading={isLoading}
              bg={{ base: "#009688", _light: "#009688" }}
              color="white"
              _hover={{ bg: { base: "#00796b", _light: "#00796b" } }}
            >
              {editingExpense ? "Update" : "Create"} Expense
            </Button>
          </HStack>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  )
}

export default AddExpense
export { AddExpense }

