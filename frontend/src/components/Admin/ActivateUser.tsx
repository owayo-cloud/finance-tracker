import { Button, DialogTitle, Text } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { FiCheckCircle } from "react-icons/fi"

import { UsersService, type UserUpdate } from "@/client"
import type { ApiError } from "@/client/core/ApiError"
import {
  DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTrigger,
} from "@/components/ui/dialog"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"

const ActivateUser = ({ id }: { id: string }) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    handleSubmit,
    formState: { isSubmitting },
  } = useForm()

  const activateUser = async (id: string) => {
    const updateData: UserUpdate = { is_active: true }
    await UsersService.updateUser({ userId: id, requestBody: updateData })
  }

  const mutation = useMutation({
    mutationFn: activateUser,
    onSuccess: () => {
      showSuccessToast("User activated successfully")
      setIsOpen(false)
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })

  const onSubmit = async () => {
    mutation.mutate(id)
  }

  return (
    <DialogRoot
      size={{ base: "xs", md: "md" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => setIsOpen(open)}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" colorPalette="green">
          <FiCheckCircle fontSize="16px" />
          Activate User
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Activate User</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>
              Are you sure you want to activate this user? They will be able to
              log in and access the system.
            </Text>
          </DialogBody>

          <DialogFooter gap={2}>
            <DialogActionTrigger asChild>
              <Button
                variant="subtle"
                colorPalette="gray"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </DialogActionTrigger>
            <Button
              variant="solid"
              colorPalette="green"
              type="submit"
              loading={isSubmitting}
            >
              Activate
            </Button>
          </DialogFooter>
          <DialogCloseTrigger />
        </form>
      </DialogContent>
    </DialogRoot>
  )
}

export default ActivateUser
