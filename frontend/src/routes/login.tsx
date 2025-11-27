import {
  Box,
  Card,
  Container,
  Heading,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react"
import {
  createFileRoute,
  Link as RouterLink,
  redirect,
} from "@tanstack/react-router"
import { type SubmitHandler, useForm } from "react-hook-form"
import { FiLock, FiUser } from "react-icons/fi"

import type { Body_login_login_access_token as AccessToken } from "@/client"
import BrandMark from "@/components/Common/BrandMark"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { InputGroup } from "@/components/ui/input-group"
import { PasswordInput } from "@/components/ui/password-input"
import useAuth, { isLoggedIn } from "@/hooks/useAuth"
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
      bg={{
        base: "linear-gradient(135deg, #0f172a 0%, #111827 40%, #1f1b2e 100%)",
        _light:
          "linear-gradient(135deg, #f8fafc 0%, #dbeafe 45%, #ede9fe 100%)",
      }}
      p={{ base: 4, md: 6 }}
    >
      <Container maxW="md" w="full">
        <Card.Root
          variant="outline"
          bg={{
            base: "rgba(15, 20, 30, 0.85)",
            _light: "rgba(255, 255, 255, 0.97)",
          }}
          backdropFilter="blur(20px) saturate(180%)"
          border="1px solid"
          borderColor={{
            base: "rgba(96, 165, 250, 0.35)",
            _light: "rgba(148, 163, 184, 0.35)",
          }}
          borderRadius="2xl"
          boxShadow={{
            base: "0 25px 60px rgba(0, 0, 0, 0.65), 0 0 20px rgba(168, 85, 247, 0.2)",
            _light: "0 15px 35px rgba(15, 23, 42, 0.12)",
          }}
        >
          <Card.Body p={{ base: 6, md: 8 }}>
            <Box as="form" onSubmit={handleSubmit(onSubmit)} w="full">
              <VStack gap={6} align="stretch">
                {/* Logo and Title */}
                <VStack gap={4}>
                  <BrandMark
                    w={24}
                    h={24}
                    fontSize="xl"
                    bg="linear-gradient(135deg, rgba(20, 184, 166, 0.25), rgba(96, 165, 250, 0.25), rgba(168, 85, 247, 0.25))"
                    borderColor="rgba(96, 165, 250, 0.45)"
                    boxShadow="0 20px 35px rgba(0, 0, 0, 0.35)"
                  />
                  <VStack gap={1}>
                    <Heading
                      size="lg"
                      fontWeight="bold"
                      css={{
                        background:
                          "linear-gradient(120deg, #14b8a6 0%, #60a5fa 55%, #a855f7 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      WiseManPalace
                    </Heading>
                    <Text fontSize="sm" color="text.secondary">
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
                    <Text fontSize="sm" fontWeight="600" color="text.link">
                      Forgot Password?
                    </Text>
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
                  bgGradient="linear-gradient(120deg, #14b8a6 0%, #60a5fa 60%, #a855f7 100%)"
                  color="white"
                  _hover={{
                    bgGradient:
                      "linear-gradient(120deg, #0d9488 0%, #3b82f6 60%, #9333ea 100%)",
                    opacity: 0.95,
                  }}
                  _active={{
                    transform: "scale(0.98)",
                  }}
                >
                  Log In
                </Button>

                {/* Sign Up Link */}
                <Box textAlign="center">
                  <Text fontSize="sm" color="text.secondary">
                    Don't have an account?{" "}
                    <RouterLink to="/signup" className="main-link">
                      <Text as="span" fontWeight="600" color="text.link">
                        Sign Up
                      </Text>
                    </RouterLink>
                  </Text>
                </Box>
              </VStack>
            </Box>
          </Card.Body>
        </Card.Root>
      </Container>
    </Box>
  )
}
