// src/components/manager/reservations.tsx
"use client";

import { useState, useEffect } from "react";
import { firebaseService } from "@/services/firebase-service";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ReservationStatus } from "@/types/reservation";
import { MapPin, Building, Calendar, Clock, AlertCircle, CheckCircle, XCircle, DollarSign, UserCircle, Phone, Mail, Users } from "lucide-react";

// Define interfaces for type safety
interface Space {
  id: string;
  name: string;
}

interface Reservation {
  id: string;
  space_id: string;
  space_name: string;
  organizer_id: string;
  organizer_name: string;
  organizer_email?: string;
  organizer_phone?: string;
  sport_type: string;
  start_time: string;
  end_time: string;
  participants_count: number;
  total_price: number;
  status: ReservationStatus;
  rejection_reason?: string;
  notes?: string;
}

export function ManagerReservations() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<string>("");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [reservationDetailsOpen, setReservationDetailsOpen] = useState(false);

  // Fetch manager's spaces
  const fetchSpaces = async () => {
    try {
      const spaces = await firebaseService.getSpaces();
      setSpaces(spaces);

      // Select first space by default if none is selected
      if (spaces.length > 0 && !selectedSpace) {
        setSelectedSpace(spaces[0].id);
      }
    } catch (error) {
      console.error("Error fetching spaces:", error);
      toast.error("Erro ao carregar espaços");
    }
  };

  // Fetch reservations for selected space
  const fetchReservations = async () => {
    if (!selectedSpace) return;

    setLoading(true);
    try {
      const filters: Record<string, unknown> = { upcoming: true };

      // Apply status filter if not "all"
      if (activeTab !== "all") {
        filters.status = activeTab;
      }

      const response = await firebaseService.getSpaceReservations(selectedSpace, filters);

      setReservations(response.data?.reservations || []);
    } catch (error) {
      console.error("Error fetching reservations:", error);
      toast.error("Erro ao carregar reservas");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchSpaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch reservations when space or tab changes
  useEffect(() => {
    if (selectedSpace) {
      fetchReservations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSpace, activeTab]);

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

  // Handle approve reservation
  const handleApproveReservation = async (reservationId: string) => {
    try {
      await firebaseService.approveReservation(reservationId);
      toast.success("Reserva aprovada com sucesso");
      fetchReservations();
    } catch (error) {
      console.error("Error approving reservation:", error);
      toast.error("Erro ao aprovar reserva");
    }
  };

  // Handle reject reservation
  const handleRejectReservation = async () => {
    if (!selectedReservation) return;

    try {
      await firebaseService.rejectReservation(selectedReservation.id, { rejection_reason: rejectionReason });
      toast.success("Reserva rejeitada");
      setRejectDialogOpen(false);
      setRejectionReason("");
      fetchReservations();
    } catch (error) {
      console.error("Error rejecting reservation:", error);
      toast.error("Erro ao rejeitar reserva");
    }
  };

  // Handle mark as completed
  const handleCompleteReservation = async (reservationId: string) => {
    try {
      await firebaseService.completeReservation(reservationId);
      toast.success("Reserva marcada como concluída");
      fetchReservations();
    } catch (error) {
      console.error("Error marking reservation as completed:", error);
      toast.error("Erro ao concluir reserva");
    }
  };

  // Show reservation details
  const viewReservationDetails = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setReservationDetailsOpen(true);
  };

  return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Gerenciamento de Reservas</h1>

        {/* Space selection */}
        <div className="mb-6">
          <Label htmlFor="space-select">Selecione um espaço</Label>
          <div className="flex gap-2 mt-2">
            <Select
                value={selectedSpace}
                onValueChange={setSelectedSpace}
            >
              <SelectTrigger id="space-select" className="flex-1">
                <SelectValue placeholder="Selecione um espaço" />
              </SelectTrigger>
              <SelectContent>
                {spaces.map((space) => (
                    <SelectItem key={space.id} value={space.id}>
                      {space.name}
                    </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={fetchReservations}>
              Atualizar
            </Button>
          </div>
        </div>

        {/* Reservations list */}
        {selectedSpace ? (
            <Tabs defaultValue="pending" onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="pending">Pendentes</TabsTrigger>
                <TabsTrigger value="approved">Aprovadas</TabsTrigger>
                <TabsTrigger value="rejected">Rejeitadas</TabsTrigger>
                <TabsTrigger value="canceled">Canceladas</TabsTrigger>
                <TabsTrigger value="completed">Concluídas</TabsTrigger>
                <TabsTrigger value="all">Todas</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {activeTab === "pending" && "Reservas Pendentes"}
                      {activeTab === "approved" && "Reservas Aprovadas"}
                      {activeTab === "rejected" && "Reservas Rejeitadas"}
                      {activeTab === "canceled" && "Reservas Canceladas"}
                      {activeTab === "completed" && "Reservas Concluídas"}
                      {activeTab === "all" && "Todas as Reservas"}
                    </CardTitle>
                    <CardDescription>
                      Gerencie as reservas do seu espaço
                    </CardDescription>
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
                            Nenhuma reserva encontrada
                          </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Organizador</TableHead>
                                <TableHead>Esporte</TableHead>
                                <TableHead>Data/Hora</TableHead>
                                <TableHead>Participantes</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Ações</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {reservations.map((reservation) => (
                                  <TableRow key={reservation.id}>
                                    <TableCell>{reservation.organizer_name}</TableCell>
                                    <TableCell>{reservation.sport_type}</TableCell>
                                    <TableCell>
                                      <div className="flex flex-col">
                                        <span>{formatDateTime(reservation.start_time)}</span>
                                        <span className="text-xs text-muted-foreground">até {formatDateTime(reservation.end_time)}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell>{reservation.participants_count}</TableCell>
                                    <TableCell>{formatCurrency(reservation.total_price)}</TableCell>
                                    <TableCell>{getStatusBadge(reservation.status)}</TableCell>
                                    <TableCell>
                                      <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => viewReservationDetails(reservation)}
                                        >
                                          Detalhes
                                        </Button>

                                        {reservation.status === ReservationStatus.PENDING && (
                                            <>
                                              <Button
                                                  variant="outline"
                                                  size="sm"
                                                  className="border-green-500 text-green-500 hover:bg-green-50"
                                                  onClick={() => handleApproveReservation(reservation.id)}
                                              >
                                                Aprovar
                                              </Button>

                                              <Button
                                                  variant="outline"
                                                  size="sm"
                                                  className="border-red-500 text-red-500 hover:bg-red-50"
                                                  onClick={() => {
                                                    setSelectedReservation(reservation);
                                                    setRejectDialogOpen(true);
                                                  }}
                                              >
                                                Rejeitar
                                              </Button>
                                            </>
                                        )}

                                        {reservation.status === ReservationStatus.APPROVED && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-blue-500 text-blue-500 hover:bg-blue-50"
                                                onClick={() => handleCompleteReservation(reservation.id)}
                                            >
                                              Concluir
                                            </Button>
                                        )}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
        ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Building className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                  <p className="mt-4 text-muted-foreground">
                    Selecione um espaço para gerenciar suas reservas
                  </p>
                  {spaces.length === 0 && (
                      <Button className="mt-4" asChild>
                        <a href="/manager/spaces/create">Cadastrar Espaço</a>
                      </Button>
                  )}
                </div>
              </CardContent>
            </Card>
        )}

        {/* Reservation Details Dialog */}
        <Dialog open={reservationDetailsOpen} onOpenChange={setReservationDetailsOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Detalhes da Reserva</DialogTitle>
              <DialogDescription>
                {selectedReservation?.space_name} - {selectedReservation?.sport_type}
              </DialogDescription>
            </DialogHeader>

            {selectedReservation && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">Informações da Reserva</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-primary" />
                        <span>Data de Início:</span>
                      </div>
                      <div>{formatDateTime(selectedReservation.start_time)}</div>

                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-primary" />
                        <span>Data de Término:</span>
                      </div>
                      <div>{formatDateTime(selectedReservation.end_time)}</div>

                      <div className="flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2 text-primary" />
                        <span>Esporte:</span>
                      </div>
                      <div>{selectedReservation.sport_type}</div>

                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2 text-primary" />
                        <span>Participantes:</span>
                      </div>
                      <div>{selectedReservation.participants_count}</div>

                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-2 text-primary" />
                        <span>Valor Total:</span>
                      </div>
                      <div>{formatCurrency(selectedReservation.total_price)}</div>

                      <div className="flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2 text-primary" />
                        <span>Status:</span>
                      </div>
                      <div>{getStatusBadge(selectedReservation.status)}</div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h3 className="font-medium">Informações do Organizador</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <UserCircle className="w-4 h-4 mr-2 text-primary" />
                        <span>Nome: {selectedReservation.organizer_name}</span>
                      </div>
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-primary" />
                        <span>Email: {selectedReservation.organizer_email}</span>
                      </div>
                      {selectedReservation.organizer_phone && (
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-2 text-primary" />
                            <span>Telefone: {selectedReservation.organizer_phone}</span>
                          </div>
                      )}
                    </div>
                  </div>

                  {selectedReservation.notes && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <h3 className="font-medium">Observações</h3>
                          <p className="text-sm">{selectedReservation.notes}</p>
                        </div>
                      </>
                  )}

                  {selectedReservation.rejection_reason && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <h3 className="font-medium text-red-500">Motivo da Rejeição</h3>
                          <p className="text-sm">{selectedReservation.rejection_reason}</p>
                        </div>
                      </>
                  )}

                  {selectedReservation.status === ReservationStatus.PENDING && (
                      <div className="flex justify-end gap-2 mt-4">
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-red-500 text-red-500 hover:bg-red-50"
                            onClick={() => {
                              setReservationDetailsOpen(false);
                              setRejectDialogOpen(true);
                            }}
                        >
                          Rejeitar
                        </Button>
                        <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              handleApproveReservation(selectedReservation.id);
                              setReservationDetailsOpen(false);
                            }}
                        >
                          Aprovar
                        </Button>
                      </div>
                  )}

                  {selectedReservation.status === ReservationStatus.APPROVED && (
                      <div className="flex justify-end gap-2 mt-4">
                        <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => {
                              handleCompleteReservation(selectedReservation.id);
                              setReservationDetailsOpen(false);
                            }}
                        >
                          Marcar como Concluída
                        </Button>
                      </div>
                  )}
                </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Reject Reservation Dialog */}
        <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Rejeitar Reserva</AlertDialogTitle>
              <AlertDialogDescription>
                Por favor, forneça um motivo para a rejeição desta reserva.
                Isso será enviado ao solicitante.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="py-4">
              <Label htmlFor="rejection-reason" className="mb-2 block">
                Motivo da Rejeição
              </Label>
              <Textarea
                  id="rejection-reason"
                  placeholder="Ex: Espaço já reservado, horário indisponível, etc."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="h-24"
              />
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                  onClick={handleRejectReservation}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={!rejectionReason.trim()}
              >
                Rejeitar Reserva
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
  );
}