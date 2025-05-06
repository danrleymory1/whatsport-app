// src/app/manager/reservations/page.tsx
import { ManagerReservations } from "@/components/manager/reservations";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { UserType } from "@/types/user";

export default function ManagerReservationsPage() {
  return (
    <ProtectedRoute allowedUserTypes={[UserType.MANAGER]}>
      <ManagerReservations />
    </ProtectedRoute>
  );
}