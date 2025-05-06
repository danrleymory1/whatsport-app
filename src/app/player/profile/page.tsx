// src/app/player/profile/page.tsx
import { UserProfile } from "@/components/player/profile";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { UserType } from "@/types/user";

export default function PlayerProfilePage() {
  return (
    <ProtectedRoute allowedUserTypes={[UserType.PLAYER]}>
      <UserProfile />
    </ProtectedRoute>
  );
}