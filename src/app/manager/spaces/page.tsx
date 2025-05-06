// src/app/manager/spaces/page.tsx
import { SpacesManager } from "@/components/manager/spaces-manager";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { UserType } from "@/types/user";

export default function ManagerSpacesPage() {
  return (
    <ProtectedRoute allowedUserTypes={[UserType.MANAGER]}>
      <SpacesManager />
    </ProtectedRoute>
  );
}