// src/app/manager/finance/page.tsx
import { FinanceManager } from "@/components/manager/finance-manager";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { UserType } from "@/types/user";

export default function FinanceManagerPage() {
  return (
    <ProtectedRoute allowedUserTypes={[UserType.MANAGER]}>
      <FinanceManager />
    </ProtectedRoute>
  );
}