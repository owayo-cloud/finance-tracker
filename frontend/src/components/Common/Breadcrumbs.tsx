import { Box, HStack, Text, Link as RouterLink } from "@chakra-ui/react"
import { useLocation, Link } from "@tanstack/react-router"
import { FiChevronRight, FiHome } from "react-icons/fi"
import { useColorMode } from "@/components/ui/color-mode"

interface BreadcrumbItem {
  label: string
  path?: string
}

const routeLabels: Record<string, string> = {
  "/": "Dashboard",
  "/sales": "Point of Sale",
  "/sales-list": "Sales History",
  "/stock-entry": "Stock Entry",
  "/products": "Products",
  "/reports": "Reports",
  "/expenses": "Expenses",
  "/debts": "Debts",
  "/shift-reconciliation": "Shift Reconciliation",
  "/admin": "Admin",
  "/settings": "Settings",
}

function Breadcrumbs() {
  const location = useLocation()
  const { colorMode } = useColorMode()
  const pathname = location.pathname

  // Build breadcrumb items from pathname
  const buildBreadcrumbs = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [
      { label: "Home", path: "/" },
    ]

    // Split pathname and create breadcrumb items
    const segments = pathname.split("/").filter(Boolean)
    
    let currentPath = ""
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`
      const isLast = index === segments.length - 1
      
      // Get label from routeLabels or capitalize segment
      const label = routeLabels[currentPath] || segment
        .split("-")
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(" ")
      
      items.push({
        label,
        path: isLast ? undefined : currentPath, // Last item is not clickable
      })
    })

    return items
  }

  const breadcrumbs = buildBreadcrumbs()

  // Don't show breadcrumbs on home page
  if (pathname === "/" || breadcrumbs.length <= 1) {
    return null
  }

  return (
    <HStack
      gap={2}
      mb={4}
      fontSize="sm"
      color={{ base: "#9ca3af", _light: "#6b7280" }}
      flexWrap="wrap"
    >
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1
        
        return (
          <HStack key={index} gap={2}>
            {index === 0 ? (
              <RouterLink to={item.path || "/"}>
                <Box
                  as="span"
                  display="inline-flex"
                  alignItems="center"
                  color={{ base: "#60a5fa", _light: "#2563eb" }}
                  _hover={{
                    color: { base: "#93c5fd", _light: "#3b82f6" },
                  }}
                  transition="color 0.2s"
                >
                  <FiHome size={14} />
                </Box>
              </RouterLink>
            ) : (
              <>
                <FiChevronRight size={14} />
                {isLast ? (
                  <Text
                    fontWeight="600"
                    color={{ base: "#e5e7eb", _light: "#111827" }}
                  >
                    {item.label}
                  </Text>
                ) : (
                  <RouterLink to={item.path || "/"}>
                    <Text
                      as="span"
                      color={{ base: "#60a5fa", _light: "#2563eb" }}
                      _hover={{
                        color: { base: "#93c5fd", _light: "#3b82f6" },
                        textDecoration: "underline",
                      }}
                      transition="color 0.2s"
                    >
                      {item.label}
                    </Text>
                  </RouterLink>
                )}
              </>
            )}
          </HStack>
        )
      })}
    </HStack>
  )
}

export default Breadcrumbs

