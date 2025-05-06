// src/app/manager/vcard/page.tsx
import { VCardValidator } from "@/components/manager/vcard-validator";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { UserType } from "@/types/user";

export default function VCardValidatorPage() {
  return (
    <ProtectedRoute allowedUserTypes={[UserType.MANAGER]}>
      <VCardValidator />
    </ProtectedRoute>
  );
}