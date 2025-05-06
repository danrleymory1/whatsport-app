// src/app/manager/profile/page.tsx
import { ManagerProfile } from "@/components/manager/profile";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { UserType } from "@/types/user";

export default function ManagerProfilePage() {
  return (
    <ProtectedRoute allowedUserTypes={[UserType.MANAGER]}>
      <ManagerProfile />
    </ProtectedRoute>
  );
}