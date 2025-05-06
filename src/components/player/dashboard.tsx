//src/app/components/player/dashboard.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { firebaseService } from "@/services/firebase-service";
import { googleMapsService } from "@/services/google-maps-service";
import { Event } from "@/types/event";
import LeafletMap from "@/components/map/google-map";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Plus,
  RefreshCw,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function PlayerDashboard() {
  const { user, userEmail } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [nearbyEvents, setNearbyEvents] = useState<Event[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get user location
        const position = await googleMapsService.getCurrentPosition();
        if (position) {
          setUserLocation(position);
          
          // Get nearby events
          const nearbyEventsData = await firebaseService.getNearbyEvents(position, 10);
          setNearbyEvents(nearbyEventsData);
        }
        
        // Get user's upcoming events
        const upcomingEventsData = await firebaseService.getEvents({ participant: true, upcoming: true });
        setUpcomingEvents(upcomingEventsData);
        
        // Get all events for the map
        const allEventsData = await firebaseService.getEvents({ upcoming: true });
        setEvents(allEventsData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Erro ao carregar dados do dashboard", {
          description: "Tente novamente mais tarde."
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const handleEventClick = (event: Event) => {
    router.push(`/player/events/${event.id}`);
  };
  
  const refreshNearbyEvents = async () => {
    if (!userLocation) return;
    
    try {
      const nearbyEventsData = await firebaseService.getNearbyEvents(userLocation, 10);
      setNearbyEvents(nearbyEventsData);
      toast.success("Eventos próximos atualizados");
    } catch (error) {
      console.error("Error refreshing nearby events:", error);
      toast.error("Erro ao atualizar eventos próximos");
    }
  };
  
  const refreshUpcomingEvents = async () => {
    try {
      const upcomingEventsData = await firebaseService.getEvents({ participant: true, upcoming: true });
      setUpcomingEvents(upcomingEventsData);
      toast.success("Seus eventos atualizados");
    } catch (error) {
      console.error("Error refreshing upcoming events:", error);
      toast.error("Erro ao atualizar seus eventos");
    }
  };
  
  const activateLocation = async () => {
    try {
      const position = await googleMapsService.getCurrentPosition();
      if (position) {
        setUserLocation(position);
        const nearbyEventsData = await firebaseService.getNearbyEvents(position, 10);
        setNearbyEvents(nearbyEventsData);
      }
    } catch (error) {
      console.error("Error getting user location:", error);
      toast.error("Não foi possível obter sua localização");
    }
  };
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Olá, {user?.name || "Jogador"}</h1>
          <p className="text-muted-foreground">
            Bem-vindo ao WhatSport! Encontre eventos esportivos próximos a você.
          </p>
        </div>
        <Button asChild>
          <Link href="/player/events/create">
            <Plus className="mr-2 h-4 w-4" /> Criar Evento
          </Link>
        </Button>
      </div>
      
      {/* Map section */}
      <Card>
        <CardHeader>
          <CardTitle>Mapa de Eventos</CardTitle>
          <CardDescription>
            Eventos esportivos próximos a você
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] rounded-md overflow-hidden">
            <LeafletMap
              events={events}
              onMarkerClick={handleEventClick}
              initialCenter={userLocation || undefined}
              height="400px"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/player/map">Ver mapa completo</Link>
          </Button>
        </CardFooter>
      </Card>
      
      {/* Upcoming events */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Seus Próximos Eventos</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={refreshUpcomingEvents}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>
              Eventos em que você está participando
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Você não tem eventos agendados.
                </p>
                <Button className="mt-4" asChild>
                  <Link href="/player/events/create">Criar evento</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleEventClick(event)}
                  >
                    <div className="flex-shrink-0 p-2 bg-primary/10 rounded-md">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div className="ml-4 flex-1">
                      <h4 className="font-medium">{event.title}</h4>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>
                          {new Date(event.start_time).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span>{event.location?.address || 'Localização não definida'}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {upcomingEvents.length > 3 && (
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/player/events/my">Ver todos</Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Nearby events */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Eventos Próximos</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={refreshNearbyEvents}
                disabled={!userLocation}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>
              Eventos esportivos perto de você
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : !userLocation ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Permita o acesso à localização para ver eventos próximos.
                </p>
                <Button className="mt-4" onClick={activateLocation}>
                  Ativar localização
                </Button>
              </div>
            ) : nearbyEvents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Não encontramos eventos próximos a você.
                </p>
                <Button className="mt-4" asChild>
                  <Link href="/player/events/create">Criar um evento</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {nearbyEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleEventClick(event)}
                  >
                    <div className="flex-shrink-0 p-2 bg-primary/10 rounded-md">
                      <Trophy className="h-5 w-5 text-primary" />
                    </div>
                    <div className="ml-4 flex-1">
                      <h4 className="font-medium">{event.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {event.sport_type} - {event.skill_level}
                      </p>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <Users className="h-3 w-3 mr-1" />
                        <span>
                          {event.participants?.length || 0}/{event.max_participants} participantes
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>
                          {new Date(event.start_time).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {nearbyEvents.length > 3 && (
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/player/events/nearby">Ver todos</Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Stats section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Eventos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingEvents.length}</div>
            <p className="text-xs text-muted-foreground">
              Eventos em que você está participando
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Eventos Próximos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nearbyEvents.length}</div>
            <p className="text-xs text-muted-foreground">
              Eventos perto da sua localização
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Meus Esportes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {[...new Set(upcomingEvents.map(e => e.sport_type || ''))].filter(Boolean).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Esportes em que você participa
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}