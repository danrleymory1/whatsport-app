"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { firebaseService } from "@/services/firebase-service";
import { Space } from "@/types/space";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { UserType } from "@/types/user";
import { SpaceDetail } from "@/components/manager/space-detail";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function SpaceDetailPage() {
  const params = useParams();
  const [space, setSpace] = useState<Space | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const spaceId = params.id as string;
  
  useEffect(() => {
    async function fetchSpace() {
      try {
        setLoading(true);
        const spaceData = await firebaseService.getSpace(spaceId);
        setSpace(spaceData);
      } catch (error) {
        console.error("Error fetching space:", error);
        setError("Erro ao carregar dados do espaço");
      } finally {
        setLoading(false);
      }
    }
    
    if (spaceId) {
      fetchSpace();
    }
  }, [spaceId]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (error || !space) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Erro</h1>
        <p className="text-lg">{error || "Espaço não encontrado"}</p>
      </div>
    );
  }
  
  return (
    <ProtectedRoute allowedUserTypes={[UserType.MANAGER]}>
      <SpaceDetail space={space} />
    </ProtectedRoute>
  );
}