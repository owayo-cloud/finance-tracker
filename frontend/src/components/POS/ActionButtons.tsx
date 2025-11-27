import { Box, Button, Flex, Icon } from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"
import {
  FiCreditCard,
  FiDollarSign,
  FiFileText,
  FiHome,
  FiLogOut,
  FiPause,
  FiPlay,
  FiRefreshCw,
} from "react-icons/fi"

interface ActionButtonsProps {
  onLogout: () => void
  onReset: () => void
  onSuspendSale: () => void
  onResumeSale: () => void
  onCompleteSale: () => void
  onCreditNote?: () => void
  onCashMovement?: () => void
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
  onCreditNote,
  onCashMovement,
  cartLength,
  selectedSaleId,
  isPending = false,
}: ActionButtonsProps) {
  return (
    <Box
      bg="bg.canvas"
      borderBottom="1px solid"
      borderColor="border.card"
      px={{ base: 4, md: 6 }}
      py={3}
    >
      <Flex gap={2} flexWrap="wrap" alignItems="center">
        <Link to="/">
          <Button
            bg="brand.secondary"
            color="white"
            _hover={{ bg: "brand.secondary.hover" }}
            size="sm"
          >
            <Icon as={FiHome} mr={2} />
            Dashboard
          </Button>
        </Link>
        <Button
          bg="button.danger"
          color="white"
          _hover={{ bg: "button.danger.hover" }}
          size="sm"
          onClick={onLogout}
        >
          <Icon as={FiLogOut} mr={2} />
          Logout
        </Button>
        <Button
          bg="button.warning"
          color="white"
          _hover={{ bg: "button.warning.hover" }}
          size="sm"
          onClick={onReset}
        >
          <Icon as={FiRefreshCw} mr={2} />
          Reset
        </Button>
        <Button
          bg="brand.primary"
          color="white"
          _hover={{ bg: "brand.primary.hover" }}
          size="sm"
          onClick={onCreditNote}
        >
          <Icon as={FiFileText} mr={2} />
          Add Credit Note (F2)
        </Button>
        <Button
          bg="brand.primary"
          color="white"
          _hover={{ bg: "brand.primary.hover" }}
          size="sm"
          onClick={onCashMovement}
        >
          <Icon as={FiDollarSign} mr={2} />
          Cash Movement (F1)
        </Button>
        <Button
          bg="brand.primary"
          color="white"
          _hover={{ bg: "brand.primary.hover" }}
          size="sm"
          onClick={onSuspendSale}
          disabled={cartLength === 0}
        >
          <Icon as={FiPause} mr={2} />
          Suspend Sale (F3)
        </Button>
        <Button
          bg="brand.primary"
          color="white"
          _hover={{ bg: "brand.primary.hover" }}
          size="sm"
          onClick={onResumeSale}
          disabled={!selectedSaleId}
        >
          <Icon as={FiPlay} mr={2} />
          Resume Sale (F4)
        </Button>
        <Button
          bg="button.success"
          color="white"
          _hover={{ bg: "button.success.hover" }}
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
