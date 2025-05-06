// src/app/player/settings/page.tsx
import { UserSettings } from "@/components/player/settings";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { UserType } from "@/types/user";

export default function PlayerSettings() {
  return (
      <ProtectedRoute allowedUserTypes={[UserType.PLAYER]}>
        <UserSettings />
      </ProtectedRoute>
  );
}