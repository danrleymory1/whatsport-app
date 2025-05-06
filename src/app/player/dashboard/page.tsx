// src/app/player/dashboard/page.tsx
import PlayerDashboard from "@/components/player/dashboard";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { UserType } from "@/types/user";

export default function PlayerDashboardPage() {
    return (
        <ProtectedRoute allowedUserTypes={[UserType.PLAYER]}>
            <PlayerDashboard />
        </ProtectedRoute>
    );
}