import { Box, Button, Heading, VStack, HStack, Icon, Stack, Text } from "@chakra-ui/react"
import { useMutation } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"
import { FiLock, FiCheck } from "react-icons/fi"

import { type ApiError, type UpdatePassword, UsersService } from "@/client"
import useCustomToast from "@/hooks/useCustomToast"
import { confirmPasswordRules, handleError, passwordRules } from "@/utils"
import { PasswordInput } from "../ui/password-input"

interface UpdatePasswordForm extends UpdatePassword {
  confirm_password: string
}

const ChangePassword = () => {
  const { showSuccessToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePasswordForm>({
    mode: "onBlur",
    criteriaMode: "all",
  })

  const newPassword = watch("new_password")

  const mutation = useMutation({
    mutationFn: (data: UpdatePassword) =>
      UsersService.updatePasswordMe({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Password updated successfully.")
      reset()
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
  })

  const onSubmit: SubmitHandler<UpdatePasswordForm> = async (data) => {
    mutation.mutate(data)
  }

  const passwordRequirements = [
    { text: "At least 8 characters", met: newPassword?.length >= 8 },
    { text: "Contains uppercase letter", met: /[A-Z]/.test(newPassword || "") },
    { text: "Contains lowercase letter", met: /[a-z]/.test(newPassword || "") },
    { text: "Contains number", met: /[0-9]/.test(newPassword || "") },
  ]

  return (
    <Box maxW="md">
      <Heading size="sm" mb={4} color={{ base: "#ffffff", _light: "#1a1d29" }}>
        Change Password
      </Heading>
      <Box
        p={6}
        bg={{ base: "#1a1d29", _light: "#ffffff" }}
        borderRadius="lg"
        border="1px solid"
        borderColor={{ base: "rgba(255, 255, 255, 0.08)", _light: "#e5e7eb" }}
        boxShadow={{ base: "0 2px 4px rgba(0, 0, 0, 0.2)", _light: "0 1px 3px rgba(0, 0, 0, 0.1)" }}
      >
        <Box as="form" onSubmit={handleSubmit(onSubmit)}>
          <VStack gap={4} align="stretch">
            <PasswordInput
              type="current_password"
              startElement={<FiLock />}
              {...register("current_password", passwordRules())}
              placeholder="Current Password"
              errors={errors}
            />
            <PasswordInput
              type="new_password"
              startElement={<FiLock />}
              {...register("new_password", passwordRules())}
              placeholder="New Password"
              errors={errors}
            />
            <PasswordInput
              type="confirm_password"
              startElement={<FiLock />}
              {...register("confirm_password", confirmPasswordRules(getValues))}
              placeholder="Confirm Password"
              errors={errors}
            />
            
            {newPassword && (
              <Box
                p={3}
                borderRadius="md"
                bg={{ base: "rgba(148, 163, 184, 0.05)", _light: "#f8fafc" }}
                border="1px solid"
                borderColor={{ base: "rgba(148, 163, 184, 0.15)", _light: "#e2e8f0" }}
              >
                <Stack gap={1.5}>
                  {passwordRequirements.map((req, index) => (
                    <HStack key={index} gap={2}>
                      <Icon
                        as={FiCheck}
                        fontSize="xs"
                        color={req.met ? "#22c55e" : { base: "#64748b", _light: "#94a3b8" }}
                      />
                      <Text fontSize="xs" color={{ base: "#9ca3af", _light: "#6b7280" }}>
                        {req.text}
                      </Text>
                    </HStack>
                  ))}
                </Stack>
              </Box>
            )}

            <Button 
              variant="solid" 
              type="submit" 
              loading={isSubmitting}
              w="full"
            >
              Update Password
            </Button>
          </VStack>
        </Box>
      </Box>
    </Box>
  )
}

export default ChangePassword