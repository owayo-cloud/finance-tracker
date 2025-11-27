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
import { FiLock, FiMail, FiUser } from "react-icons/fi"

import type { UserRegister } from "@/client"
import BrandMark from "@/components/Common/BrandMark"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { InputGroup } from "@/components/ui/input-group"
import { PasswordInput } from "@/components/ui/password-input"
import useAuth, { isLoggedIn } from "@/hooks/useAuth"
import { confirmPasswordRules, emailPattern, passwordRules } from "@/utils"

export const Route = createFileRoute("/signup")({
  component: SignUp,
  beforeLoad: async () => {
    if (isLoggedIn()) {
      throw redirect({
        to: "/",
      })
    }
  },
})

interface UserRegisterForm extends UserRegister {
  confirm_password: string
}

function SignUp() {
  const { signUpMutation } = useAuth()
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<UserRegisterForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      email: "",
      username: "",
      full_name: "",
      password: "",
      confirm_password: "",
    },
  })

  const onSubmit: SubmitHandler<UserRegisterForm> = (data) => {
    signUpMutation.mutate(data)
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
          bg={{
            base: "rgba(15, 20, 30, 0.7)",
            _light: "rgba(255, 255, 255, 0.95)",
          }}
          backdropFilter="blur(20px) saturate(180%)"
          border="1px solid"
          borderColor={{
            base: "rgba(0, 150, 136, 0.3)",
            _light: "rgba(0, 150, 136, 0.2)",
          }}
          borderRadius="2xl"
          boxShadow={{
            base: "0 10px 40px rgba(0, 0, 0, 0.4), 0 0 1px rgba(0, 150, 136, 0.3)",
            _light:
              "0 10px 40px rgba(0, 0, 0, 0.1), 0 0 1px rgba(0, 150, 136, 0.2)",
          }}
        >
          <Card.Body p={{ base: 6, md: 8 }}>
            <Box as="form" onSubmit={handleSubmit(onSubmit)} w="full">
              <VStack gap={6} align="stretch">
                {/* Logo and Title */}
                <VStack gap={4}>
                  <BrandMark w={24} h={24} fontSize="xl" />
                  <VStack gap={1}>
                    <Heading
                      size="lg"
                      fontWeight="bold"
                      css={{
                        background:
                          "linear-gradient(to right, #009688, #00bcd4)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      Create Account
                    </Heading>
                    <Text fontSize="sm" color="text.secondary">
                      Sign up to get started
                    </Text>
                  </VStack>
                </VStack>

                {/* Form Fields */}
                <VStack gap={4} align="stretch">
                  <Field
                    invalid={!!errors.full_name}
                    errorText={errors.full_name?.message}
                  >
                    <InputGroup w="100%" startElement={<FiUser />}>
                      <Input
                        minLength={3}
                        {...register("full_name", {
                          required: "Full Name is required",
                        })}
                        placeholder="Full Name"
                        type="text"
                        autoComplete="name"
                      />
                    </InputGroup>
                  </Field>

                  <Field
                    invalid={!!errors.username}
                    errorText={errors.username?.message}
                  >
                    <InputGroup w="100%" startElement={<FiUser />}>
                      <Input
                        {...register("username", {
                          minLength: {
                            value: 3,
                            message: "Username must be at least 3 characters",
                          },
                          maxLength: {
                            value: 100,
                            message:
                              "Username must be less than 100 characters",
                          },
                        })}
                        placeholder="Username (optional)"
                        type="text"
                        autoComplete="username"
                      />
                    </InputGroup>
                  </Field>

                  <Field
                    invalid={!!errors.email}
                    errorText={errors.email?.message}
                  >
                    <InputGroup w="100%" startElement={<FiMail />}>
                      <Input
                        {...register("email", {
                          required: "Email is required",
                          pattern: emailPattern,
                        })}
                        placeholder="Email"
                        type="email"
                        autoComplete="email"
                      />
                    </InputGroup>
                  </Field>

                  <PasswordInput
                    type="password"
                    startElement={<FiLock />}
                    {...register("password", passwordRules())}
                    placeholder="Password"
                    errors={errors}
                    autoComplete="new-password"
                  />
                  <PasswordInput
                    type="confirm_password"
                    startElement={<FiLock />}
                    {...register(
                      "confirm_password",
                      confirmPasswordRules(getValues),
                    )}
                    placeholder="Confirm Password"
                    errors={errors}
                    autoComplete="new-password"
                  />
                </VStack>

                {/* Submit Button */}
                <Button
                  variant="solid"
                  type="submit"
                  loading={isSubmitting}
                  size="lg"
                  w="full"
                  colorPalette="teal"
                >
                  Sign Up
                </Button>

                {/* Login Link */}
                <Box textAlign="center">
                  <Text fontSize="sm" color="text.secondary">
                    Already have an account?{" "}
                    <RouterLink to="/login" className="main-link">
                      Log In
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

export default SignUp
