// src/app/manager/requests/page.tsx
import { RequestsManager } from "@/components/manager/requests-manager";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { UserType } from "@/types/user";

export default function RequestsManagerPage() {
  return (
    <ProtectedRoute allowedUserTypes={[UserType.MANAGER]}>
      <RequestsManager />
    </ProtectedRoute>
  );
}