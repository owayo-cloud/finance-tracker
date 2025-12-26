import { Box, Button, Flex, Icon } from "@chakra-ui/react"
import { useNavigate } from "@tanstack/react-router"
import {
  FiCreditCard,
  FiDollarSign,
  FiFileText,
  FiClock,
  FiHome,
  FiLogOut,
  FiPause,
  FiPlay,
  FiRefreshCw,
} from "react-icons/fi"

interface ActionButtonsProps {
  onLogout?: () => void
  onReset: () => void
  onSuspendSale: () => void
  onResumeSale: () => void
  onCompleteSale: () => void
  onCreditNote?: () => void
  onCashMovement?: () => void
  onQuickSaleHistory?: () => void
  cartLength: number
  selectedSaleId: string | null
  isPending?: boolean
  isAuditor?: boolean
  isTillOpen?: boolean
}

export function ActionButtons({
  onLogout,
  onReset,
  onSuspendSale,
  onResumeSale,
  onCompleteSale,
  onCreditNote,
  onCashMovement,
  onQuickSaleHistory,
  cartLength,
  selectedSaleId,
  isPending = false,
  isAuditor = false,
  isTillOpen = true,
}: ActionButtonsProps) {
  const navigate = useNavigate()

  return (
    <Box
      bg="bg.canvas"
      borderBottom="1px solid"
      borderColor="border.card"
      px={{ base: 4, md: 6 }}
      py={3}
    >
      <Flex gap={2} flexWrap="wrap" alignItems="center">
        <Button
          bg="brand.secondary"
          color="white"
          _hover={{ bg: "brand.secondary.hover" }}
          size="sm"
          onClick={() => navigate({ to: "/" })}
        >
          <Icon as={FiHome} mr={2} />
          Dashboard
        </Button>
        {onLogout && (
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
        )}
        {!isAuditor && (
          <>
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
              disabled={cartLength === 0 || !isTillOpen}
              loading={isPending}
              title={
                !isTillOpen
                  ? "POS is locked. Please open a till before making sales."
                  : undefined
              }
            >
              <Icon as={FiCreditCard} mr={2} />
              Payment
            </Button>
            {onQuickSaleHistory && (
              <Button
                bg="brand.primary"
                color="white"
                _hover={{ bg: "brand.primary.hover" }}
                size="sm"
                onClick={onQuickSaleHistory}
              >
                <Icon as={FiClock} mr={2} />
                Quick History (F5)
              </Button>
            )}
          </>
        )}
      </Flex>
    </Box>
  )
}
