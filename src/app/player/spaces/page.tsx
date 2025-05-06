// src/app/player/spaces/page.tsx
import { PlayerSpaces } from "@/components/player/spaces";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { UserType } from "@/types/user";

export default function SpacesPage() {
  return (
    <ProtectedRoute allowedUserTypes={[UserType.PLAYER]}>
      <PlayerSpaces />
    </ProtectedRoute>
  );
}