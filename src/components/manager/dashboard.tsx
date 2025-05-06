//src/app/components/manager/dashboard.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { firebaseService } from "@/services/firebase-service";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Building, 
  Users, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Plus,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Space } from "@/types/space";
import { Reservation, ReservationStatus } from "@/types/reservation";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

export default function ManagerDashboard() {
  const { user, userEmail } = useAuth();
  const router = useRouter();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [pendingReservations, setPendingReservations] = useState<Reservation[]>([]);
  const [recentReservations, setRecentReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSpaces: 0,
    pendingReservationsCount: 0,
    totalReservationsThisMonth: 0,
    totalRevenueThisMonth: 0,
  });
  
  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get spaces
        const spacesResponse = await firebaseService.getSpaces(user?.id);
        setSpaces(spacesResponse || []);
        
        // Get pending reservations
        let allPendingReservations: Reservation[] = [];
        
        for (const space of spacesResponse || []) {
          const reservationsResponse = await firebaseService.getSpaceReservations(space.id, { status: ReservationStatus.PENDING });
          const pendingForSpace = reservationsResponse || [];
          
          allPendingReservations = [...allPendingReservations, ...pendingForSpace];
        }
        
        setPendingReservations(allPendingReservations);
        
        // Get recent reservations (all statuses)
        let allRecentReservations: Reservation[] = [];
        
        for (const space of spacesResponse || []) {
          const reservationsResponse = await firebaseService.getReservations({ space_id: space.id });
          allRecentReservations = [...allRecentReservations, ...(reservationsResponse || [])];
        }
        
        // Sort by creation date (newest first) and take last 5
        allRecentReservations.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        setRecentReservations(allRecentReservations.slice(0, 5));
        
        // Set stats
        setStats({
          totalSpaces: spacesResponse?.length || 0,
          pendingReservationsCount: allPendingReservations.length,
          totalReservationsThisMonth: countReservationsThisMonth(allRecentReservations),
          totalRevenueThisMonth: calculateRevenueThisMonth(allRecentReservations),
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user?.id]);
  
  // Helper to count reservations this month
  const countReservationsThisMonth = (reservations: Reservation[]) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return reservations.filter((r: Reservation) => 
      new Date(r.start_time) >= startOfMonth && 
      r.status !== ReservationStatus.REJECTED && 
      r.status !== ReservationStatus.CANCELED
    ).length;
  };
  
  // Helper to calculate revenue this month
  const calculateRevenueThisMonth = (reservations: Reservation[]) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return reservations
      .filter(r => 
        new Date(r.start_time) >= startOfMonth && 
        (r.status === ReservationStatus.APPROVED || r.status === ReservationStatus.COMPLETED)
      )
      .reduce((total, r) => total + r.total_price, 0);
  };
  
  // Handle reservation approval/rejection
  const handleReservationAction = async (reservationId: string, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') {
        await firebaseService.approveReservation(reservationId);
      } else {
        await firebaseService.rejectReservation(reservationId);
      }
      
      // Update the lists
      setPendingReservations(prev => prev.filter(r => r.id !== reservationId));
      
      // Update recent reservations if the reservation is there
      setRecentReservations(prev => {
        return prev.map(r => {
          if (r.id === reservationId) {
            return {
              ...r,
              status: action === 'approve' ? ReservationStatus.APPROVED : ReservationStatus.REJECTED
            };
          }
          return r;
        });
      });
    } catch (error) {
      console.error(`Error ${action}ing reservation:`, error);
    }
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
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <AlertCircle className="w-3 h-3 mr-1" /> Pendente
        </span>;
      case ReservationStatus.APPROVED:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" /> Aprovada
        </span>;
      case ReservationStatus.REJECTED:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" /> Rejeitada
        </span>;
      case ReservationStatus.CANCELED:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <XCircle className="w-3 h-3 mr-1" /> Cancelada
        </span>;
      case ReservationStatus.COMPLETED:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <CheckCircle className="w-3 h-3 mr-1" /> Concluída
        </span>;
    }
  };
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Olá, {user?.name || "Gerente"}</h1>
          <p className="text-muted-foreground">
            Bem-vindo ao painel de controle dos seus espaços esportivos.
          </p>
        </div>
        <Button asChild>
          <Link href="/manager/spaces/create">
            <Plus className="mr-2 h-4 w-4" /> Cadastrar Espaço
          </Link>
        </Button>
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Espaços
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSpaces}</div>
            <p className="text-xs text-muted-foreground">
              Espaços cadastrados
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Reservas Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReservationsCount}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando aprovação
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Reservas no Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReservationsThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              Total no mês atual
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Faturamento do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenueThisMonth)}</div>
            <p className="text-xs text-muted-foreground">
              Total no mês atual
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs for different content sections */}
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Reservas Pendentes</TabsTrigger>
          <TabsTrigger value="spaces">Meus Espaços</TabsTrigger>
          <TabsTrigger value="recent">Atividade Recente</TabsTrigger>
        </TabsList>
        
        {/* Pending Reservations Tab */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Reservas Aguardando Aprovação</CardTitle>
              <CardDescription>
                Gerencie as solicitações de reserva dos seus espaços
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center p-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : pendingReservations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Não há reservas pendentes no momento.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Espaço</TableHead>
                      <TableHead>Organizador</TableHead>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Modalidade</TableHead>
                      <TableHead>Participantes</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingReservations.map((reservation) => (
                      <TableRow key={reservation.id}>
                        <TableCell>{reservation.space_name}</TableCell>
                        <TableCell>{reservation.organizer_name}</TableCell>
                        <TableCell>
                          {new Date(reservation.start_time).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </TableCell>
                        <TableCell>{reservation.sport_type}</TableCell>
                        <TableCell>{reservation.participants_count}</TableCell>
                        <TableCell>{formatCurrency(reservation.total_price)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-green-500 text-green-500 hover:bg-green-50"
                              onClick={() => handleReservationAction(reservation.id, 'approve')}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" /> Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-500 text-red-500 hover:bg-red-50"
                              onClick={() => handleReservationAction(reservation.id, 'reject')}
                            >
                              <XCircle className="w-4 h-4 mr-1" /> Rejeitar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            <CardFooter className="justify-end">
              <Button variant="outline" asChild>
                <Link href="/manager/reservations">Ver Todas as Reservas</Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Spaces Tab */}
        <TabsContent value="spaces">
          <Card>
            <CardHeader>
              <CardTitle>Meus Espaços</CardTitle>
              <CardDescription>
                Gerencie os espaços esportivos cadastrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center p-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : spaces.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Você ainda não cadastrou nenhum espaço.
                  </p>
                  <Button className="mt-4" asChild>
                    <Link href="/manager/spaces/create">Cadastrar Espaço</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {spaces.map((space) => (
                    <Card key={space.id} className="overflow-hidden">
                      <div className="relative h-40 bg-muted">
                        {space.photos && space.photos.length > 0 ? (
                          <img
                            src={space.photos[0].url}
                            alt={space.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Building className="w-12 h-12 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <CardHeader className="p-4">
                        <CardTitle className="text-lg">{space.name}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {space.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span className="truncate">{space.location.address || 'Localização não disponível'}</span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Users className="w-3 h-3 mr-1" />
                          <span>{space.available_sports.length} modalidades</span>
                        </div>
                      </CardContent>
                      <CardFooter className="p-4 pt-0">
                        <Button variant="outline" size="sm" className="w-full" asChild>
                          <Link href={`/manager/spaces/${space.id}`}>
                            Gerenciar
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="justify-end">
              <Button variant="outline" asChild>
                <Link href="/manager/spaces">Ver Todos os Espaços</Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Recent Activity Tab */}
        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
              <CardDescription>
                Últimas atividades nos seus espaços
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center p-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : recentReservations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Não há atividades recentes para exibir.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentReservations.map((reservation) => (
                    <div
                      key={reservation.id}
                      className="p-4 border rounded-lg flex items-start"
                    >
                      <div className="mr-4 p-2 bg-primary/10 rounded-full">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">
                            Reserva para {reservation.space_name}
                          </h4>
                          {getStatusBadge(reservation.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {reservation.organizer_name} - {reservation.sport_type}
                        </p>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <Clock className="w-3 h-3 mr-1" />
                          <span>
                            {new Date(reservation.start_time).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center text-sm font-medium mt-1">
                          <DollarSign className="w-3 h-3 mr-1" />
                          <span>{formatCurrency(reservation.total_price)}</span>
                        </div>
                      </div>
                      {reservation.status === ReservationStatus.PENDING && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-green-500 text-green-500 hover:bg-green-50"
                            onClick={() => handleReservationAction(reservation.id, 'approve')}
                          >
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500 text-red-500 hover:bg-red-50"
                            onClick={() => handleReservationAction(reservation.id, 'reject')}
                          >
                            Rejeitar
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="justify-end">
              <Button variant="outline" asChild>
                <Link href="/manager/calendar">Ver Agenda Completa</Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}