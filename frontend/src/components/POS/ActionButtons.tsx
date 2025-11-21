import { Box, Button, Flex, Icon } from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"
import {
  FiHome,
  FiLogOut,
  FiRefreshCw,
  FiFileText,
  FiDollarSign,
  FiPause,
  FiPlay,
  FiCreditCard,
} from "react-icons/fi"

interface ActionButtonsProps {
  onLogout: () => void
  onReset: () => void
  onSuspendSale: () => void
  onResumeSale: () => void
  onCompleteSale: () => void
  cartLength: number
  selectedSaleId: string | null
  isPending?: boolean
}

export function ActionButtons({
  onLogout,
  onReset,
  onSuspendSale,
  onResumeSale,
  onCompleteSale,
  cartLength,
  selectedSaleId,
  isPending = false,
}: ActionButtonsProps) {
  return (
    <Box
      bg={{ base: "#1a1d29", _light: "#ffffff" }}
      borderBottom="1px solid"
      borderColor={{ base: "rgba(255, 255, 255, 0.08)", _light: "#e5e7eb" }}
      px={{ base: 4, md: 6 }}
      py={3}
    >
      <Flex gap={2} flexWrap="wrap" alignItems="center">
        <Link to="/">
          <Button bg="#3b82f6" color="white" _hover={{ bg: "#2563eb" }} size="sm">
            <Icon as={FiHome} mr={2} />
            Dashboard
          </Button>
        </Link>
        <Button bg="#ef4444" color="white" _hover={{ bg: "#dc2626" }} size="sm" onClick={onLogout}>
          <Icon as={FiLogOut} mr={2} />
          Logout
        </Button>
        <Button bg="#f59e0b" color="white" _hover={{ bg: "#d97706" }} size="sm" onClick={onReset}>
          <Icon as={FiRefreshCw} mr={2} />
          Reset
        </Button>
        <Button bg="#14b8a6" color="white" _hover={{ bg: "#0d9488" }} size="sm">
          <Icon as={FiFileText} mr={2} />
          Add Credit Note (F2)
        </Button>
        <Button bg="#14b8a6" color="white" _hover={{ bg: "#0d9488" }} size="sm">
          <Icon as={FiDollarSign} mr={2} />
          Cash Movement (F1)
        </Button>
        <Button
          bg="#14b8a6"
          color="white"
          _hover={{ bg: "#0d9488" }}
          size="sm"
          onClick={onSuspendSale}
          disabled={cartLength === 0}
        >
          <Icon as={FiPause} mr={2} />
          Suspend Sale (F3)
        </Button>
        <Button
          bg="#14b8a6"
          color="white"
          _hover={{ bg: "#0d9488" }}
          size="sm"
          onClick={onResumeSale}
          disabled={!selectedSaleId}
        >
          <Icon as={FiPlay} mr={2} />
          Resume Sale (F4)
        </Button>
        <Button
          bg="#22c55e"
          color="white"
          _hover={{ bg: "#16a34a" }}
          size="sm"
          onClick={onCompleteSale}
          disabled={cartLength === 0}
          loading={isPending}
        >
          <Icon as={FiCreditCard} mr={2} />
          Payment
        </Button>
      </Flex>
    </Box>
  )
}

