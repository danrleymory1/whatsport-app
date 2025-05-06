// src/app/manager/dashboard/page.tsx
import ManagerDashboard from "@/components/manager/dashboard";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { UserType } from "@/types/user";

export default function ManagerDashboardPage() {
  return (
    <ProtectedRoute allowedUserTypes={[UserType.MANAGER]}>
      <ManagerDashboard />
    </ProtectedRoute>
  );
}