import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Input,
  Text,
  VStack,
  HStack,
  Badge,
  Separator,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import {
  type ApiError,
  UsersService,
  type UserUpdateMe,
} from "@/client"
import useAuth from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
import { emailPattern, handleError, getUserInitials } from "@/utils"
import { Field } from "../ui/field"

const UserInformation = () => {
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const [editMode, setEditMode] = useState(false)
  const { user: currentUser } = useAuth()
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { isSubmitting, errors, isDirty },
  } = useForm<UserUpdateMe>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      full_name: currentUser?.full_name || undefined,
      email: currentUser?.email || undefined,
      username: currentUser?.username || undefined,
    },
  })

  const toggleEditMode = () => {
    setEditMode(!editMode)
  }

  const mutation = useMutation({
    mutationFn: (data: UserUpdateMe) =>
      UsersService.updateUserMe({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("User updated successfully.")
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries()
    },
  })

  const onSubmit: SubmitHandler<UserUpdateMe> = async (data) => {
    mutation.mutate(data)
  }

  const onCancel = () => {
    reset()
    toggleEditMode()
  }

  const getRoleBadge = () => {
    if (currentUser?.is_superuser) {
      return (
        <Badge
          bg="linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
          color="white"
          fontSize="xs"
          fontWeight="700"
          px={3}
          py={1}
          borderRadius="sm"
          textTransform="uppercase"
        >
          Admin
        </Badge>
      )
    } else if (currentUser?.is_auditor) {
      return (
        <Badge
          bg="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
          color="white"
          fontSize="xs"
          fontWeight="700"
          px={3}
          py={1}
          borderRadius="sm"
          textTransform="uppercase"
        >
          Auditor
        </Badge>
      )
    } else {
      return (
        <Badge
          bg="linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
          color="white"
          fontSize="xs"
          fontWeight="700"
          px={3}
          py={1}
          borderRadius="sm"
          textTransform="uppercase"
        >
          Cashier
        </Badge>
      )
    }
  }

  return (
    <Container maxW="full">
      <VStack gap={6} align="stretch">
        {/* Profile Header */}
        <Box
          p={6}
          bg="bg.surface"
          borderRadius="lg"
          border="1px solid"
          borderColor="border.card"
          boxShadow={{ base: "0 2px 4px rgba(0, 0, 0, 0.2)", _light: "0 1px 3px rgba(0, 0, 0, 0.1)" }}
        >
          <HStack gap={4} align="start">
            {/* Avatar */}
            <Box
              w={20}
              h={20}
              borderRadius="full"
              bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              color="white"
              fontSize="2xl"
              fontWeight="700"
              flexShrink={0}
              border="3px solid"
              borderColor={{ base: "rgba(255, 255, 255, 0.1)", _light: "rgba(0, 0, 0, 0.1)" }}
              transition="all 0.2s"
              _hover={{
                borderColor: { base: "rgba(59, 130, 246, 0.5)", _light: "rgba(59, 130, 246, 0.3)" },
                boxShadow: { base: "0 0 0 4px rgba(59, 130, 246, 0.2)", _light: "0 0 0 4px rgba(59, 130, 246, 0.1)" },
              }}
              _focus={{
                borderColor: { base: "#3b82f6", _light: "#3b82f6" },
                boxShadow: { base: "0 0 0 4px rgba(59, 130, 246, 0.3)", _light: "0 0 0 4px rgba(59, 130, 246, 0.2)" },
                outline: "none",
              }}
              tabIndex={0}
            >
              {getUserInitials(currentUser?.full_name, currentUser?.email)}
            </Box>
            
            {/* User Info */}
            <VStack align="start" gap={2} flex={1}>
              <VStack align="start" gap={1}>
                <Text fontSize="xl" fontWeight="700" color="text.primary">
                  {currentUser?.full_name || "User"}
                </Text>
                {getRoleBadge()}
              </VStack>
              <Text fontSize="sm" color="text.muted">
                {currentUser?.email}
              </Text>
              {currentUser?.username && (
                <HStack gap={1}>
                  <Text fontSize="sm" color="text.muted">
                    @{currentUser.username}
                  </Text>
                </HStack>
              )}
            </VStack>
          </HStack>
        </Box>

        {/* Edit Form */}
        <Box
          p={6}
          bg="bg.surface"
          borderRadius="lg"
          border="1px solid"
          borderColor="border.card"
          boxShadow={{ base: "0 2px 4px rgba(0, 0, 0, 0.2)", _light: "0 1px 3px rgba(0, 0, 0, 0.1)" }}
        >
          <Heading size="sm" mb={4} color="text.primary">
            Edit Profile
          </Heading>
          <Box as="form" onSubmit={handleSubmit(onSubmit)}>
            <VStack gap={4} align="stretch">
              <Field label="Full name">
                {editMode ? (
                  <Input
                    {...register("full_name", { maxLength: 30 })}
                    type="text"
                    size="md"
                    placeholder="Enter your full name"
                    _hover={{
                      borderColor: { base: "rgba(59, 130, 246, 0.5)", _light: "rgba(59, 130, 246, 0.3)" },
                    }}
                    _focus={{
                      borderColor: { base: "#3b82f6", _light: "#3b82f6" },
                      boxShadow: { base: "0 0 0 3px rgba(59, 130, 246, 0.2)", _light: "0 0 0 3px rgba(59, 130, 246, 0.1)" },
                    }}
                  />
                ) : (
                  <HStack gap={2}>
                    <Text
                      fontSize="md"
                      py={2}
                      color={!currentUser?.full_name ? "text.muted" : "text.primary"}
                    >
                      {currentUser?.full_name || "Not set"}
                    </Text>
                  </HStack>
                )}
              </Field>
              
              <Field
                label="Email"
                invalid={!!errors.email}
                errorText={errors.email?.message}
              >
                {editMode ? (
                  <Input
                    {...register("email", {
                      required: "Email is required",
                      pattern: emailPattern,
                    })}
                    type="email"
                    size="md"
                    placeholder="Enter your email"
                    _hover={{
                      borderColor: { base: "rgba(59, 130, 246, 0.5)", _light: "rgba(59, 130, 246, 0.3)" },
                    }}
                    _focus={{
                      borderColor: { base: "#3b82f6", _light: "#3b82f6" },
                      boxShadow: { base: "0 0 0 3px rgba(59, 130, 246, 0.2)", _light: "0 0 0 3px rgba(59, 130, 246, 0.1)" },
                    }}
                  />
                ) : (
                  <HStack gap={2}>
                    <Text fontSize="md" py={2} color="text.primary">
                      {currentUser?.email}
                    </Text>
                  </HStack>
                )}
              </Field>

              {currentUser?.username && (
                <Field label="Username">
                  <HStack gap={2}>
                    <Text fontSize="md" py={2} color="text.muted">
                      @{currentUser.username}
                    </Text>
                    <Text fontSize="xs" color="text.muted">
                      (Cannot be changed)
                    </Text>
                  </HStack>
                </Field>
              )}

              <Separator my={2} />

              <Flex gap={3} justify="flex-end">
                {!editMode && (
                  <Button
                    variant="solid"
                    onClick={toggleEditMode}
                    type="button"
                    _hover={{
                      bg: { base: "rgba(59, 130, 246, 0.8)", _light: "rgba(59, 130, 246, 0.9)" },
                    }}
                    _focus={{
                      bg: { base: "#3b82f6", _light: "#3b82f6" },
                      boxShadow: { base: "0 0 0 3px rgba(59, 130, 246, 0.3)", _light: "0 0 0 3px rgba(59, 130, 246, 0.2)" },
                    }}
                  >
                    Edit Profile
                  </Button>
                )}
                {editMode && (
                  <>
                    <Button
                      variant="subtle"
                      colorPalette="gray"
                      onClick={onCancel}
                      disabled={isSubmitting}
                      _hover={{
                        bg: { base: "rgba(255, 255, 255, 0.1)", _light: "rgba(0, 0, 0, 0.05)" },
                      }}
                      _focus={{
                        bg: { base: "rgba(59, 130, 246, 0.1)", _light: "rgba(59, 130, 246, 0.05)" },
                        boxShadow: { base: "0 0 0 3px rgba(59, 130, 246, 0.2)", _light: "0 0 0 3px rgba(59, 130, 246, 0.1)" },
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="solid"
                      type="submit"
                      loading={isSubmitting}
                      disabled={!isDirty || !getValues("email")}
                      _hover={{
                        bg: { base: "rgba(59, 130, 246, 0.8)", _light: "rgba(59, 130, 246, 0.9)" },
                      }}
                      _focus={{
                        bg: { base: "#3b82f6", _light: "#3b82f6" },
                        boxShadow: { base: "0 0 0 3px rgba(59, 130, 246, 0.3)", _light: "0 0 0 3px rgba(59, 130, 246, 0.2)" },
                      }}
                    >
                      Save Changes
                    </Button>
                  </>
                )}
              </Flex>
            </VStack>
          </Box>
        </Box>
      </VStack>
    </Container>
  )
}

export default UserInformation
