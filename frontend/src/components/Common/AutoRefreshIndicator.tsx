import { Box, HStack, Icon, Text } from "@chakra-ui/react"
import { FiRefreshCw } from "react-icons/fi"
import { REFRESH_INTERVALS, usePageAutoRefresh } from "@/hooks/useAutoRefresh"
import { Tooltip } from "../ui/tooltip"

interface AutoRefreshIndicatorProps {
  interval?: number
  onToggle?: () => void
}

const AutoRefreshIndicator = ({
  interval,
  onToggle,
}: AutoRefreshIndicatorProps) => {
  const { enabled, toggle } = usePageAutoRefresh(
    interval || REFRESH_INTERVALS.PAGE_REFRESH,
  )

  const handleToggle = () => {
    try {
      toggle()
      onToggle?.()
    } catch (_error) {
      // Failed to toggle page auto-refresh - silently continue
    }
  }

  const getIntervalText = () => {
    const seconds = (interval || REFRESH_INTERVALS.PAGE_REFRESH) / 1000
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    return `${minutes}m`
  }

  return (
    <Tooltip
      content={
        enabled
          ? `Page auto-refresh: Every ${getIntervalText()}`
          : "Page auto-refresh: Disabled"
      }
      positioning={{ placement: "bottom" }}
    >
      <Box
        as="button"
        onClick={handleToggle}
        p={2}
        borderRadius="md"
        _hover={{
          bg: {
            base: "rgba(255, 255, 255, 0.1)",
            _light: "rgba(0, 0, 0, 0.05)",
          },
        }}
        transition="all 0.2s"
        cursor="pointer"
      >
        <HStack gap={2}>
          <Icon
            as={FiRefreshCw}
            fontSize="md"
            color={
              enabled
                ? { base: "blue.400", _light: "blue.600" }
                : { base: "gray.500", _light: "gray.400" }
            }
            animation={enabled ? "spin 2s linear infinite" : "none"}
            css={{
              "@keyframes spin": {
                "0%": { transform: "rotate(0deg)" },
                "100%": { transform: "rotate(360deg)" },
              },
            }}
          />
          {enabled && (
            <Text
              fontSize="xs"
              color={{ base: "gray.400", _light: "gray.600" }}
            >
              {getIntervalText()}
            </Text>
          )}
        </HStack>
      </Box>
    </Tooltip>
  )
}

export default AutoRefreshIndicator
