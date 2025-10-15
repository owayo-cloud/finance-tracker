import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}