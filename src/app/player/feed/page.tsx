// src/app/player/events/page.tsx
import { PlayerFeed } from "@/components/player/feed";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { UserType } from "@/types/user";

export default function PlayerEventsPage() {
  return (
      <ProtectedRoute allowedUserTypes={[UserType.PLAYER]}>
        <PlayerFeed />
      </ProtectedRoute>
  );
}