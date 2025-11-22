import { Heading, Stack, Box, HStack, Text, Icon } from "@chakra-ui/react"
import { useTheme } from "next-themes"
import { FiMonitor, FiSun, FiMoon } from "react-icons/fi"

import { Radio, RadioGroup } from "@/components/ui/radio"

const Appearance = () => {
  const { theme, setTheme } = useTheme()

  const getThemeIcon = (value: string) => {
    switch (value) {
      case "system":
        return FiMonitor
      case "light":
        return FiSun
      case "dark":
        return FiMoon
      default:
        return FiMonitor
    }
  }


  return (
    <Box maxW="md">
      <Heading size="sm" mb={4} color={{ base: "#ffffff", _light: "#1a1d29" }}>
        Appearance
      </Heading>
      <Box
        p={6}
        bg={{ base: "#1a1d29", _light: "#ffffff" }}
        borderRadius="lg"
        border="1px solid"
        borderColor={{ base: "rgba(255, 255, 255, 0.08)", _light: "#e5e7eb" }}
        boxShadow={{ base: "0 2px 4px rgba(0, 0, 0, 0.2)", _light: "0 1px 3px rgba(0, 0, 0, 0.1)" }}
      >
        <RadioGroup
          onValueChange={(e) => setTheme(e.value ?? "system")}
          value={theme}
          colorPalette="teal"
        >
          <Stack gap={3}>
            {["system", "light", "dark"].map((value) => {
              const IconComponent = getThemeIcon(value)
              return (
                <HStack key={value} gap={3}>
                  <Radio value={value} />
                  <Icon as={IconComponent} fontSize="md" color={{ base: "#9ca3af", _light: "#6b7280" }} />
                  <Text fontSize="sm" color={{ base: "#ffffff", _light: "#1a1d29" }} textTransform="capitalize">
                    {value === "system" ? "System" : value === "light" ? "Light Mode" : "Dark Mode"}
                  </Text>
                </HStack>
              )
            })}
          </Stack>
        </RadioGroup>
      </Box>
    </Box>
  )
}

export default Appearance