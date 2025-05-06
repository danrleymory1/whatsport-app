// src/app/manager/spaces/create/page.tsx
import { CreateSpaceForm } from "@/components/manager/create-space-form";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { UserType } from "@/types/user";

export default function CreateSpacePage() {
  return (
    <ProtectedRoute allowedUserTypes={[UserType.MANAGER]}>
      <CreateSpaceForm />
    </ProtectedRoute>
  );
}