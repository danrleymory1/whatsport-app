// src/app/manager/settings/page.tsx
import { ManagerSettings } from "@/components/manager/settings";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { UserType } from "@/types/user";

export default function ManagerSettingsPage() {
  return (
    <ProtectedRoute allowedUserTypes={[UserType.MANAGER]}>
      <ManagerSettings />
    </ProtectedRoute>
  );
}