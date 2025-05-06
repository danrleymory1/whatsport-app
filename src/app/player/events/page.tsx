// src/app/player/events/page.tsx
import { EventsNearby } from "@/components/player/events-nearby";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { UserType } from "@/types/user";

export default function PlayerEventsPage() {
  return (
      <ProtectedRoute allowedUserTypes={[UserType.PLAYER]}>
        <EventsNearby />
      </ProtectedRoute>
  );
}