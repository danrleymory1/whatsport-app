// src/app/player/events/create/page.tsx
import { CreateEventForm } from "@/components/player/create-event-form";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { UserType } from "@/types/user";

export default function CreateEventPage() {
  return (
    <ProtectedRoute allowedUserTypes={[UserType.PLAYER]}>
      <CreateEventForm />
    </ProtectedRoute>
  );
}