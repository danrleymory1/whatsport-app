// src/app/manager/calendar/page.tsx
import { ScheduleManager } from "@/components/manager/schedule-manager";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { UserType } from "@/types/user";

export default function ScheduleManagerPage() {
  return (
    <ProtectedRoute allowedUserTypes={[UserType.MANAGER]}>
      <ScheduleManager />
    </ProtectedRoute>
  );
}