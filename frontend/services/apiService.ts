export interface Stats {
  revenue: number;
  users: number;
  sales: number;
  growth: number;
}

export interface Activity {
  id: number;
  type: string;
  amount: number;
  time: string;
  description: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export const apiService = {
  async fetchStats(period: string): Promise<Stats> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const baseStats: Record<string, Stats> = {
      day: { revenue: 12345, users: 234, sales: 45, growth: 5.2 },
      week: { revenue: 45678, users: 789, sales: 156, growth: 7.1 },
      month: { revenue: 56789, users: 1234, sales: 345, growth: 8.5 },
      year: { revenue: 678901, users: 12456, sales: 4567, growth: 12.3 }
    };
    
    return baseStats[period.toLowerCase()] || baseStats.month;
  },

  async fetchRecentActivity(): Promise<Activity[]> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return [
      { id: 1, type: "transaction", amount: 450, time: "2 minutes ago", description: "New transaction received" },
      { id: 2, type: "user", amount: 0, time: "15 minutes ago", description: "New user registration" },
      { id: 3, type: "transaction", amount: 1200, time: "1 hour ago", description: "Payment processed" },
      { id: 4, type: "sale", amount: 850, time: "2 hours ago", description: "Product sold" }
    ];
  },

  async fetchNotifications(): Promise<Notification[]> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return [
      { id: 1, title: "New Sale", message: "You have a new sale of $450", time: "5 min ago", read: false },
      { id: 2, title: "User Milestone", message: "You've reached 1,000 users!", time: "1 hour ago", read: false },
      { id: 3, title: "Revenue Update", message: "Monthly revenue target achieved", time: "3 hours ago", read: true }
    ];
  }
};