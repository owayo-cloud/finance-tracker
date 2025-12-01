import { Box, type BoxProps, HStack, Text } from "@chakra-ui/react"

type BrandMarkProps = BoxProps & {
  /**
   * Adjusts the font size inside the logo box. Defaults to "md".
   */
  fontSize?: BoxProps["fontSize"]
}

function BrandMark({ fontSize = "md", ...boxProps }: BrandMarkProps) {
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      borderRadius="xl"
      bg="rgba(20, 184, 166, 0.08)"
      border="2px solid"
      borderColor="rgba(20, 184, 166, 0.35)"
      boxShadow="0 0 25px rgba(20, 184, 166, 0.25)"
      {...boxProps}
    >
      <HStack gap={0.5} alignItems="center" justifyContent="center">
        <Text
          fontSize={fontSize}
          fontWeight="800"
          color="#14b8a6"
          lineHeight="1"
        >
          W
        </Text>
        <Text
          fontSize={fontSize}
          fontWeight="800"
          color="#60a5fa"
          lineHeight="1"
        >
          M
        </Text>
        <Text
          fontSize={fontSize}
          fontWeight="800"
          color="#a855f7"
          lineHeight="1"
        >
          P
        </Text>
      </HStack>
    </Box>
  )
}

export default BrandMark
