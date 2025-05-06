// src/app/components/player/reservations.tsx
"use client";

import { useState, useEffect } from "react";
import { firebaseService } from "@/services/firebase-service";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ReservationStatus } from "@/types/reservation";
import { MapPin, Calendar, Clock, AlertCircle, CheckCircle, XCircle, DollarSign } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";

export function PlayerReservations() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  const router = useRouter();

  // Fetch reservations
  const fetchReservations = async () => {
    setLoading(true);
    try {
      const response = await firebaseService.getReservations(
        activeTab === "upcoming" ? { upcoming: true } : {}
      );
      
      setReservations(response || []);
    } catch (error) {
      console.error("Error fetching reservations:", error);
      toast.error("Erro ao carregar reservas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [activeTab]);

  // Format date
  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Get status badge
  const getStatusBadge = (status: ReservationStatus) => {
    switch (status) {
      case ReservationStatus.PENDING:
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          <AlertCircle className="w-3 h-3 mr-1" /> Pendente
        </Badge>;
      case ReservationStatus.APPROVED:
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle className="w-3 h-3 mr-1" /> Aprovada
        </Badge>;
      case ReservationStatus.REJECTED:
        return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">
          <XCircle className="w-3 h-3 mr-1" /> Rejeitada
        </Badge>;
      case ReservationStatus.CANCELED:
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">
          <XCircle className="w-3 h-3 mr-1" /> Cancelada
        </Badge>;
      case ReservationStatus.COMPLETED:
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          <CheckCircle className="w-3 h-3 mr-1" /> Concluída
        </Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  // Cancel reservation
  const handleCancelReservation = async (reservationId: string) => {
    try {
      await firebaseService.cancelReservation(reservationId, auth.currentUser?.uid || "");
      toast.success("Reserva cancelada com sucesso");
      fetchReservations();
    } catch (error) {
      console.error("Error canceling reservation:", error);
      toast.error("Erro ao cancelar reserva");
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Minhas Reservas</h1>
      
      <Tabs defaultValue="upcoming" onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="upcoming">Próximas Reservas</TabsTrigger>
          <TabsTrigger value="past">Histórico</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-0">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>{activeTab === "upcoming" ? "Próximas Reservas" : "Histórico de Reservas"}</CardTitle>
                  <CardDescription>
                    {activeTab === "upcoming" ? "Suas reservas futuras" : "Suas reservas passadas"}
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={fetchReservations}>
                  Atualizar
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : reservations.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                  <p className="mt-4 text-muted-foreground">
                    {activeTab === "upcoming" 
                      ? "Você não tem reservas futuras" 
                      : "Você não tem reservas passadas"}
                  </p>
                  <Button className="mt-4" asChild>
                    <Link href="/player/spaces">Explorar Espaços</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {reservations.map((reservation) => (
                    <div 
                      key={reservation.id} 
                      className="border rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-medium">{reservation.space_name}</h3>
                        {getStatusBadge(reservation.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <div className="flex items-center text-sm">
                            <Calendar className="h-4 w-4 mr-2 text-primary" />
                            <span>
                              {formatDateTime(reservation.start_time)} - {formatDateTime(reservation.end_time)}
                            </span>
                          </div>
                          
                          <div className="flex items-center text-sm">
                            <MapPin className="h-4 w-4 mr-2 text-primary" />
                            <span>{reservation.space_name}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center text-sm">
                            <AlertCircle className="h-4 w-4 mr-2 text-primary" />
                            <span>{reservation.sport_type}</span>
                          </div>
                          
                          <div className="flex items-center text-sm">
                            <DollarSign className="h-4 w-4 mr-2 text-primary" />
                            <span>{formatCurrency(reservation.total_price)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {reservation.rejection_reason && (
                        <div className="bg-red-50 p-3 rounded-md mb-4">
                          <p className="text-sm text-red-800">
                            <strong>Motivo da rejeição:</strong> {reservation.rejection_reason}
                          </p>
                        </div>
                      )}
                      
                      {reservation.status === ReservationStatus.PENDING && (
                        <div className="flex justify-end">
                          <Button 
                            variant="outline" 
                            className="border-red-500 text-red-500 hover:bg-red-50"
                            onClick={() => handleCancelReservation(reservation.id)}
                          >
                            Cancelar Reserva
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                Mostrando {reservations.length} reservas
              </div>
              {activeTab === "upcoming" && (
                <Button asChild>
                  <Link href="/player/spaces">Fazer Nova Reserva</Link>
                </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}