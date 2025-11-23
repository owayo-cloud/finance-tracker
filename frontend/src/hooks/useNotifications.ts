/**
 * useNotifications Hook
 * 
 * Manages notification state, fetching, and real-time updates
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import {
  NotificationsService,
  type NotificationPublic,
  type NotificationsPublic,
} from "@/client"

interface UseNotificationsOptions {
  pollInterval?: number // Auto-refresh interval in ms (default: 30000 = 30 seconds)
  enabled?: boolean // Enable/disable queries
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { pollInterval = 30000, enabled = true } = options
  const queryClient = useQueryClient()

  // Fetch unread count
  const {
    data: unreadCount,
    isLoading: isLoadingCount,
    refetch: refetchCount,
  } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const response = await NotificationsService.getUnreadCount()
      return response.unread_count
    },
    enabled,
    refetchInterval: pollInterval,
    staleTime: pollInterval / 2,
  })

  // Fetch notifications list
  const {
    data: notificationsData,
    isLoading: isLoadingNotifications,
    refetch: refetchNotifications,
  } = useQuery<NotificationsPublic>({
    queryKey: ["notifications", "list"],
    queryFn: () =>
      NotificationsService.listNotifications({
        limit: 50,
        skip: 0,
      }),
    enabled,
    refetchInterval: pollInterval,
    staleTime: pollInterval / 2,
  })

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      NotificationsService.markAsRead({ id: notificationId }),
    onSuccess: () => {
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => NotificationsService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: string) =>
      NotificationsService.deleteNotification({ id: notificationId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })

  // Manual refresh function
  const refresh = () => {
    refetchCount()
    refetchNotifications()
  }

  return {
    // Data
    notifications: notificationsData?.data || [],
    unreadCount: unreadCount || 0,
    totalCount: notificationsData?.count || 0,

    // Loading states
    isLoading: isLoadingCount || isLoadingNotifications,
    isLoadingCount,
    isLoadingNotifications,

    // Mutations
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,

    // Mutation states
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDeletingNotification: deleteNotificationMutation.isPending,

    // Refetch
    refresh,
    refetchCount,
    refetchNotifications,
  }
}

export default useNotifications
