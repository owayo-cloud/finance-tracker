/**
 * NotificationBell Component
 * 
 * Displays notification bell icon with unread count badge and dropdown list
 */

import { Box, IconButton, Text, VStack, HStack, Spinner, Badge, Icon } from "@chakra-ui/react"
import { FiBell, FiCheck, FiCheckCircle, FiTrash2, FiAlertCircle, FiInfo } from "react-icons/fi"
import { MenuContent, MenuItem, MenuRoot, MenuSeparator, MenuTrigger } from "../ui/menu"
import { Link } from "@tanstack/react-router"
import { useNotifications } from "@/hooks/useNotifications"
import { formatDistanceToNow } from "date-fns"
import type { NotificationPublic } from "@/client"

interface NotificationBellProps {
  variant?: "desktop" | "mobile"
}

// Priority colors
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "critical":
      return "#ef4444" // red
    case "warning":
      return "#f59e0b" // amber
    default:
      return "#10b981" // green
  }
}

// Type icons
const getTypeIcon = (type: string) => {
  if (type.includes("alert") || type.includes("critical")) return FiAlertCircle
  if (type.includes("success") || type.includes("approved")) return FiCheckCircle
  return FiInfo
}

function NotificationBell({ variant = "desktop" }: NotificationBellProps) {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isMarkingAsRead,
    isMarkingAllAsRead,
  } = useNotifications({
    pollInterval: 30000, // Refresh every 30 seconds
  })

  const handleNotificationClick = (notification: NotificationPublic) => {
    if (!notification.is_read) {
      markAsRead(notification.id)
    }
  }

  const handleDelete = (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteNotification(notificationId)
  }

  return (
    <MenuRoot positioning={{ placement: "bottom-end" }}>
      <MenuTrigger asChild>
        <Box position="relative" display="inline-flex" alignItems="center" justifyContent="center">
          <IconButton
            variant="ghost"
            aria-label="Notifications"
            color={{ base: "#ffffff", _light: "#1a1d29" }}
            _hover={{ bg: { base: "rgba(255, 255, 255, 0.05)", _light: "rgba(0, 0, 0, 0.05)" } }}
            size="sm"
          >
            <FiBell fontSize="18px" />
          </IconButton>
          {unreadCount > 0 && (
            <Badge
              position="absolute"
              top="4px"
              right="4px"
              colorScheme="red"
              borderRadius="full"
              fontSize="9px"
              minW="16px"
              h="16px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              px={1}
              bg="#ef4444"
              color="white"
              fontWeight="700"
              zIndex={1}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Box>
      </MenuTrigger>

      <MenuContent
        maxW="400px"
        w="95vw"
        maxH="500px"
        overflowY="auto"
        p={0}
        bg={{ base: "#1e2433", _light: "#ffffff" }}
        border="1px solid"
        borderColor={{ base: "rgba(255, 255, 255, 0.1)", _light: "#e5e7eb" }}
        boxShadow="lg"
      >
        {/* Header */}
        <HStack
          justify="space-between"
          px={4}
          py={3}
          borderBottom="1px solid"
          borderColor={{ base: "rgba(255, 255, 255, 0.1)", _light: "#e5e7eb" }}
          bg={{ base: "#1a1d29", _light: "#f9fafb" }}
          position="sticky"
          top={0}
          zIndex={1}
        >
          <HStack gap={2}>
            <Text fontWeight="700" fontSize="md" color={{ base: "#ffffff", _light: "#1a1d29" }}>
              Notifications
            </Text>
            {unreadCount > 0 && (
              <Badge colorScheme="red" borderRadius="full" px={2} py={0.5} fontSize="xs">
                {unreadCount}
              </Badge>
            )}
          </HStack>
          {unreadCount > 0 && (
            <IconButton
              variant="ghost"
              aria-label="Mark all as read"
              size="sm"
              onClick={() => markAllAsRead()}
              isLoading={isMarkingAllAsRead}
              color={{ base: "#14b8a6", _light: "#0d9488" }}
              _hover={{ bg: { base: "rgba(255, 255, 255, 0.05)", _light: "rgba(0, 0, 0, 0.05)" } }}
            >
              <FiCheckCircle fontSize="16px" />
            </IconButton>
          )}
        </HStack>

        {/* Notifications List */}
        {isLoading ? (
          <VStack py={8} gap={2}>
            <Spinner size="md" color="#14b8a6" />
            <Text fontSize="sm" color={{ base: "#9ca3af", _light: "#6b7280" }}>
              Loading notifications...
            </Text>
          </VStack>
        ) : notifications.length === 0 ? (
          <VStack py={8} gap={2}>
            <Icon as={FiBell} fontSize="40px" color={{ base: "#4b5563", _light: "#9ca3af" }} />
            <Text fontSize="sm" color={{ base: "#9ca3af", _light: "#6b7280" }} fontWeight="500">
              No notifications yet
            </Text>
            <Text fontSize="xs" color={{ base: "#6b7280", _light: "#9ca3af" }}>
              You're all caught up!
            </Text>
          </VStack>
        ) : (
          <VStack gap={0} align="stretch">
            {notifications.map((notification) => {
              const TypeIcon = getTypeIcon(notification.type)
              const priorityColor = getPriorityColor(notification.priority)
              
              const notificationContent = (
                <HStack
                  key={notification.id}
                  align="start"
                  gap={3}
                  px={4}
                  py={3}
                  bg={
                    !notification.is_read
                      ? { base: "rgba(20, 184, 166, 0.05)", _light: "rgba(20, 184, 166, 0.05)" }
                      : "transparent"
                  }
                  borderLeft="3px solid"
                  borderLeftColor={!notification.is_read ? priorityColor : "transparent"}
                  _hover={{
                    bg: { base: "rgba(255, 255, 255, 0.03)", _light: "rgba(0, 0, 0, 0.02)" },
                  }}
                  cursor="pointer"
                  onClick={() => handleNotificationClick(notification)}
                  position="relative"
                  transition="all 0.2s"
                >
                  {/* Icon */}
                  <Box
                    w={8}
                    h={8}
                    borderRadius="md"
                    bg={`${priorityColor}20`}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flexShrink={0}
                  >
                    <Icon as={TypeIcon} fontSize="16px" color={priorityColor} />
                  </Box>

                  {/* Content */}
                  <VStack align="start" gap={1} flex={1} minW={0}>
                    <Text
                      fontSize="sm"
                      fontWeight={!notification.is_read ? "700" : "500"}
                      color={{ base: "#ffffff", _light: "#1a1d29" }}
                      noOfLines={2}
                    >
                      {notification.title}
                    </Text>
                    {notification.message && (
                      <Text
                        fontSize="xs"
                        color={{ base: "#9ca3af", _light: "#6b7280" }}
                        noOfLines={2}
                      >
                        {notification.message}
                      </Text>
                    )}
                    <Text fontSize="xs" color={{ base: "#6b7280", _light: "#9ca3af" }}>
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </Text>
                  </VStack>

                  {/* Actions */}
                  <HStack gap={1} flexShrink={0}>
                    {!notification.is_read && (
                      <IconButton
                        variant="ghost"
                        aria-label="Mark as read"
                        size="xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          markAsRead(notification.id)
                        }}
                        color={{ base: "#14b8a6", _light: "#0d9488" }}
                        _hover={{ bg: { base: "rgba(255, 255, 255, 0.05)", _light: "rgba(0, 0, 0, 0.05)" } }}
                      >
                        <FiCheck fontSize="14px" />
                      </IconButton>
                    )}
                    <IconButton
                      variant="ghost"
                      aria-label="Delete notification"
                      size="xs"
                      onClick={(e) => handleDelete(notification.id, e)}
                      color={{ base: "#ef4444", _light: "#dc2626" }}
                      _hover={{ bg: { base: "rgba(255, 255, 255, 0.05)", _light: "rgba(0, 0, 0, 0.05)" } }}
                    >
                      <FiTrash2 fontSize="14px" />
                    </IconButton>
                  </HStack>
                </HStack>
              )

              // Wrap in Link if link_url exists
              return notification.link_url ? (
                <Link key={notification.id} to={notification.link_url} style={{ textDecoration: "none" }}>
                  {notificationContent}
                </Link>
              ) : (
                notificationContent
              )
            })}
          </VStack>
        )}

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <MenuSeparator />
            <Box
              textAlign="center"
              py={3}
              borderTop="1px solid"
              borderColor={{ base: "rgba(255, 255, 255, 0.1)", _light: "#e5e7eb" }}
              bg={{ base: "#1a1d29", _light: "#f9fafb" }}
            >
              <Link to="/notifications" style={{ textDecoration: "none" }}>
                <Text
                  fontSize="sm"
                  fontWeight="600"
                  color={{ base: "#14b8a6", _light: "#0d9488" }}
                  _hover={{ textDecoration: "underline" }}
                >
                  View All Notifications
                </Text>
              </Link>
            </Box>
          </>
        )}
      </MenuContent>
    </MenuRoot>
  )
}

export default NotificationBell
