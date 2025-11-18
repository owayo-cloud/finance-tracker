import { Container, Input, Text, Box } from "@chakra-ui/react"
import {
  createFileRoute,
  Link as RouterLink,
  redirect,
} from "@tanstack/react-router"
import { type SubmitHandler, useForm } from "react-hook-form"
import { FiLock, FiMail } from "react-icons/fi"
import type { Body_login_login_access_token as AccessToken } from "@/client"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { InputGroup } from "@/components/ui/input-group"
import { PasswordInput } from "@/components/ui/password-input"
import useAuth, { isLoggedIn } from "@/hooks/useAuth"
import { emailPattern, passwordRules } from "../utils"
import { PiWineLight } from "react-icons/pi"
import { Checkbox } from "@/components/ui/checkbox"

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
      position="relative"
      overflow="hidden"
      bg="#0a0e14"
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={4}
    >
      {/* Animated gradient background */}
      <Box
        position="absolute"
        top="-50%"
        left="-50%"
        right="-50%"
        bottom="-50%"
        bgGradient="radial(circle at 30% 20%, rgba(167, 139, 250, 0.15), transparent 50%), radial(circle at 70% 60%, rgba(236, 72, 153, 0.15), transparent 50%), radial(circle at 50% 80%, rgba(249, 115, 22, 0.1), transparent 50%)"
        animation="pulse 8s ease-in-out infinite"
        style={{
          '@keyframes pulse': {
            '0%, 100%': { transform: 'scale(1) rotate(0deg)' },
            '50%': { transform: 'scale(1.1) rotate(5deg)' }
          }
        }}
      />

      {/* Floating orbs */}
      <Box
        position="absolute"
        top="20%"
        left="10%"
        w="300px"
        h="300px"
        borderRadius="full"
        bgGradient="radial(circle, rgba(167, 139, 250, 0.2), transparent 70%)"
        filter="blur(60px)"
        animation="float 12s ease-in-out infinite"
        style={{
          '@keyframes float': {
            '0%, 100%': { transform: 'translate(0, 0)' },
            '50%': { transform: 'translate(50px, -50px)' }
          }
        }}
      />
      <Box
        position="absolute"
        bottom="20%"
        right="10%"
        w="250px"
        h="250px"
        borderRadius="full"
        bgGradient="radial(circle, rgba(236, 72, 153, 0.2), transparent 70%)"
        filter="blur(60px)"
        animation="float 10s ease-in-out infinite reverse"
      />

      <Container
        as="form"
        onSubmit={handleSubmit(onSubmit)}
        maxW="400px"
        position="relative"
        bg="rgba(15, 20, 30, 0.7)"
        backdropFilter="blur(20px) saturate(180%)"
        borderRadius="3xl"
        border="1px solid"
        borderColor="rgba(255, 255, 255, 0.08)"
        p={8}
        boxShadow="0 20px 60px rgba(0, 0, 0, 0.6), 0 0 1px rgba(167, 139, 250, 0.3)"
        transition="all 0.3s ease"
        _hover={{
          borderColor: "rgba(167, 139, 250, 0.2)",
          boxShadow: "0 25px 70px rgba(0, 0, 0, 0.7), 0 0 30px rgba(167, 139, 250, 0.15)"
        }}
      >
        {/* Glow effect on top */}
        <Box
          position="absolute"
          top="-1px"
          left="20%"
          right="20%"
          h="2px"
          bgGradient="linear(to-r, transparent, #a78bfa, #ec4899, transparent)"
          filter="blur(2px)"
        />

        {/* Logo and Wine Glasses */}
        <Box textAlign="center" mb={10}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap={4}
            mb={4}
            transition="all 0.3s ease"
            _hover={{
              transform: "scale(1.05)",
            }}
          >
            <Box
              animation="sway 3s ease-in-out infinite"
              style={{
                '@keyframes sway': {
                  '0%, 100%': { transform: 'rotate(-5deg)' },
                  '50%': { transform: 'rotate(5deg)' }
                }
              }}
            >
              <PiWineLight 
                size={36} 
                style={{ 
                  color: '#a78bfa',
                  filter: 'drop-shadow(0 0 12px rgba(167, 139, 250, 0.6))'
                }} 
              />
            </Box>
            <Text
              color="gray.400"
              fontSize="4xl"
              fontWeight="bold"
              bgGradient="linear(to-r, #a78bfa, #ec4899, #f97316)"
              bgClip="text"
              letterSpacing="tight"
              textShadow="0 0 40px rgba(167, 139, 250, 0.3)"
            >
              WiseManPalace
            </Text>
            <Box
              animation="sway 3s ease-in-out infinite reverse"
            >
              <PiWineLight 
                size={36} 
                style={{ 
                  color: '#ec4899',
                  filter: 'drop-shadow(0 0 12px rgba(236, 72, 153, 0.6))'
                }} 
              />
            </Box>
          </Box>
          <Text color="gray.400" fontSize="sm" letterSpacing="wide">
            Connect to your palace of wisdom
          </Text>
        </Box>

        {/* Email field */}
        <Field
          invalid={!!errors.username}
          errorText={errors.username?.message || !!error}
          mb={5}
        >
          <Text color="gray.300" fontSize="sm" mb={2} fontWeight="medium">
            Email Address
          </Text>
          <InputGroup w="100%" startElement={<FiMail color="#9CA3AF" />}>
            <Input
              {...register("username", {
                required: "Username is required",
                pattern: emailPattern,
              })}
              placeholder="Enter your email"
              type="email"
              bg="rgba(10, 14, 20, 0.6)"
              border="1px solid"
              borderColor="rgba(255, 255, 255, 0.06)"
              color="white"
              h="12"
              _placeholder={{ color: "gray.600" }}
              _hover={{ 
                borderColor: "rgba(167, 139, 250, 0.4)",
                bg: "rgba(10, 14, 20, 0.8)"
              }}
              _focus={{ 
                borderColor: "#a78bfa",
                bg: "rgba(10, 14, 20, 0.9)",
                boxShadow: "0 0 0 3px rgba(167, 139, 250, 0.1), 0 0 20px rgba(167, 139, 250, 0.2)"
              }}
              transition="all 0.2s ease"
            />
          </InputGroup>
        </Field>

        {/* Password field */}
        <Box mb={6}>  
          <Text color="gray.300" fontSize="sm" mb={2} fontWeight="medium">
            Password
          </Text>
          <InputGroup w="100%" startElement={<FiLock color="#9CA3AF" />}>
            <PasswordInput
              type="password"
              {...register("password", passwordRules())}
              placeholder="Enter your password"
              errors={errors}
              bg="rgba(10, 14, 20, 0.6)"
              border="1px solid"
              borderColor="rgba(255, 255, 255, 0.06)"
              color="white"
              h="12"
              _placeholder={{ color: "gray.600" }}
              _hover={{ 
                borderColor: "rgba(167, 139, 250, 0.4)",
                bg: "rgba(10, 14, 20, 0.8)"
              }}
              _focus={{ 
                borderColor: "#a78bfa",
                bg: "rgba(10, 14, 20, 0.9)",
                boxShadow: "0 0 0 3px rgba(167, 139, 250, 0.1), 0 0 20px rgba(167, 139, 250, 0.2)"
              }}
              transition="all 0.2s ease"
            />
          </InputGroup>
        </Box>

        {/* Remember & Forgot */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={8}>
          <Checkbox size="sm" colorScheme="purple">
            <Text color="gray.400" fontSize="sm">
              Remember me
            </Text>
          </Checkbox>
          <RouterLink to="/recover-password" className="main-link">
            <Text 
              color="purple.400" 
              fontSize="sm" 
              fontWeight="medium"
              transition="all 0.2s"
              _hover={{ 
                color: "purple.300",
                textDecoration: "underline"
              }}
            >
              Forgot Password?
            </Text>
          </RouterLink>
        </Box>

        {/* Login Button */}
        <Button
          type="submit"
          loading={isSubmitting}
          w="100%"
          h="12"
          bg="linear-gradient(135deg, #a78bfa 0%, #ec4899 50%, #f97316 100%)"
          bgSize="200% 100%"
          color="white"
          size="lg"
          fontSize="md"
          fontWeight="bold"
          letterSpacing="wide"
          borderRadius="xl"
          position="relative"
          overflow="hidden"
          transition="all 0.3s ease"
          _before={{
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bg: "linear-gradient(135deg, rgba(255,255,255,0.1), transparent)",
            opacity: 0,
            transition: "opacity 0.3s ease"
          }}
          _hover={{
            position: "100% 0",
            transform: "translateY(-2px)",
            boxShadow: "0 10px 30px rgba(167, 139, 250, 0.4), 0 0 40px rgba(236, 72, 153, 0.3)",
            _before: { opacity: 1 }
          }}
          _active={{
            transform: "translateY(0)",
            boxShadow: "0 5px 15px rgba(167, 139, 250, 0.3)"
          }}
          mb={6}
        >
          Sign In
        </Button>

        {/* Divider */}
        <Box position="relative" textAlign="center" mb={6}>
          <Box h="1px" bg="rgba(255, 255, 255, 0.06)" />
          <Text
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            bg="rgba(15, 20, 30, 0.9)"
            px={3}
            color="gray.500"
            fontSize="xs"
            letterSpacing="wider"
          >
            SECURE LOGIN
          </Text>
        </Box>

        {/* Error Display */}
        {error && (
          <Box
            p={4}
            bg="rgba(239, 68, 68, 0.08)"
            backdropFilter="blur(10px)"
            border="1px solid"
            borderColor="rgba(239, 68, 68, 0.3)"
            borderRadius="xl"
            animation="slideIn 0.3s ease"
            style={{
              '@keyframes slideIn': {
                from: { opacity: 0, transform: 'translateY(-10px)' },
                to: { opacity: 1, transform: 'translateY(0)' }
              }
            }}
          >
            <Text color="red.300" fontSize="sm" fontWeight="medium">
              {error}
            </Text>
          </Box>
        )}

        {/* Bottom accent */}
        <Box
          position="absolute"
          bottom="-1px"
          left="30%"
          right="30%"
          h="2px"
          bgGradient="linear(to-r, transparent, #ec4899, transparent)"
          filter="blur(2px)"
        />
      </Container>
    </Box>
  )
}