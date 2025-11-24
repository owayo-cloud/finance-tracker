import { Box, Card, Container, Input, Text, VStack, Heading } from "@chakra-ui/react"
import {
  createFileRoute,
  Link as RouterLink,
  redirect,
} from "@tanstack/react-router"
import { type SubmitHandler, useForm } from "react-hook-form"
import { FiLock, FiUser } from "react-icons/fi"

import type { Body_login_login_access_token as AccessToken } from "@/client"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { InputGroup } from "@/components/ui/input-group"
import { PasswordInput } from "@/components/ui/password-input"
import useAuth, { isLoggedIn } from "@/hooks/useAuth"
import BrandMark from "@/components/Common/BrandMark"
import { passwordRules } from "../utils"

export const Route = createFileRoute("/login")({
  component: Login,
  beforeLoad: async () => {
    if (isLoggedIn()) {
      throw redirect({
        to: "/",
      })
    }
  },
})

function Login() {
  const { loginMutation, error, resetError } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AccessToken>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      username: "",
      password: "",
    },
  })

  const onSubmit: SubmitHandler<AccessToken> = async (data) => {
    if (isSubmitting) return

    resetError()

    try {
      await loginMutation.mutateAsync(data)
    } catch {
      // error is handled by useAuth hook
    }
  }

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg={{ base: "bg.canvas", _light: "bg.canvas" }}
      p={4}
    >
      <Container maxW="md" w="full">
        <Card.Root
          variant="outline"
          bg={{ base: "rgba(15, 20, 30, 0.7)", _light: "rgba(255, 255, 255, 0.95)" }}
          backdropFilter="blur(20px) saturate(180%)"
          border="1px solid"
          borderColor={{ base: "rgba(0, 150, 136, 0.3)", _light: "rgba(0, 150, 136, 0.2)" }}
          borderRadius="2xl"
          boxShadow={{ 
            base: "0 10px 40px rgba(0, 0, 0, 0.4), 0 0 1px rgba(0, 150, 136, 0.3)", 
            _light: "0 10px 40px rgba(0, 0, 0, 0.1), 0 0 1px rgba(0, 150, 136, 0.2)" 
          }}
        >
          <Card.Body p={{ base: 6, md: 8 }}>
            <Box
              as="form"
              onSubmit={handleSubmit(onSubmit)}
              w="full"
            >
              <VStack gap={6} align="stretch">
                {/* Logo and Title */}
                <VStack gap={4}>
                  <BrandMark w={24} h={24} fontSize="xl" />
                  <VStack gap={1}>
                    <Heading
                      size="lg"
                      fontWeight="bold"
                      css={{
                        background: "linear-gradient(to right, #009688, #00bcd4)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      WiseManPalace
                    </Heading>
                    <Text
                      fontSize="sm"
                      color="text.secondary"
                    >
                      Sign in to your account
                    </Text>
                  </VStack>
                </VStack>

                {/* Form Fields */}
                <VStack gap={4} align="stretch">
                  <Field
                    invalid={!!errors.username}
                    errorText={errors.username?.message || !!error}
                  >
                    <InputGroup w="100%" startElement={<FiUser />}>
                      <Input
                        {...register("username", {
                          required: "Username or email is required",
                        })}
                        placeholder="Username or Email"
                        type="text"
                        autoComplete="username"
                      />
                    </InputGroup>
                  </Field>
                  <PasswordInput
                    type="password"
                    startElement={<FiLock />}
                    {...register("password", passwordRules())}
                    placeholder="Password"
                    errors={errors}
                    autoComplete="current-password"
                  />
                </VStack>

                {/* Forgot Password */}
                <Box textAlign="right">
                  <RouterLink to="/recover-password" className="main-link">
                    <Text fontSize="sm">Forgot Password?</Text>
                  </RouterLink>
                </Box>

                {/* Submit Button */}
                <Button 
                  variant="solid" 
                  type="submit" 
                  loading={isSubmitting} 
                  size="lg"
                  w="full"
                  colorPalette="teal"
                >
                  Log In
                </Button>

              </VStack>
            </Box>
          </Card.Body>
        </Card.Root>
      </Container>
    </Box>
  )
}