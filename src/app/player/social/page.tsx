// src/app/player/social/page.tsx
import { FriendsGroups } from "@/components/player/friends-groups";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { UserType } from "@/types/user";

export default function PlayerSettings() {
  return (
      <ProtectedRoute allowedUserTypes={[UserType.PLAYER]}>
        <FriendsGroups />
      </ProtectedRoute>
  );
}