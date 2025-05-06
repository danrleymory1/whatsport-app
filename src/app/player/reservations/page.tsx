// src/app/player/reservations/page.tsx
import { PlayerReservations } from "@/components/player/reservations";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { UserType } from "@/types/user";

export default function ReservationsPage() {
  return (
    <ProtectedRoute allowedUserTypes={[UserType.PLAYER]}>
      <PlayerReservations />
    </ProtectedRoute>
  );
}