"use client";

import { useState, useEffect } from "react";
import { firebaseService } from "@/services/firebase-service";
import { googleMapsService } from "@/services/google-maps-service";
import { Event } from "@/types/event";
import LeafletMap from "@/components/map/google-map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  Users,
  MapPin,
  Clock
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function EventsMapPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Get user location
        const position = await googleMapsService.getCurrentPosition();
        if (position) {
          setUserLocation(position);
        }

        // Get all events
        const eventsResponse = await firebaseService.getEvents({ upcoming: true });
        setEvents(eventsResponse || []);
      } catch (error) {
        console.error("Error fetching events data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleMarkerClick = (event: Event) => {
    setSelectedEvent(event);
  };

  const handleEventClick = (event: Event) => {
    router.push(`/player/events/${event.id}`);
  };

  return (
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-4">Mapa de Eventos Esportivos</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card className="h-[calc(100vh-180px)]">
              <CardContent className="p-0">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <LeafletMap
                        events={events}
                        onMarkerClick={handleMarkerClick}
                        initialCenter={userLocation || undefined}
                        initialZoom={12}
                        height="100%"
                    />
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="h-[calc(100vh-180px)] overflow-auto">
              <CardHeader>
                <CardTitle>Eventos Próximos</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : events.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        Nenhum evento encontrado.
                      </p>
                      <Link href="/player/events/create" className="mt-4 inline-block">
                        <button className="px-4 py-2 rounded bg-primary text-primary-foreground">
                          Criar Evento
                        </button>
                      </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                      {events.map((event) => (
                          <div
                              key={event.id}
                              className={`p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer ${
                                  selectedEvent?.id === event.id ? "border-primary bg-primary/10" : ""
                              }`}
                              onClick={() => handleMarkerClick(event)}
                          >
                            <h3 className="font-medium">{event.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {event.sport_type} - {event.skill_level}
                            </p>
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
                              <span className="truncate">{event.location.address || 'Local não definido'}</span>
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Users className="h-3 w-3 mr-1" />
                              <span>
                          {event.participants.length}/{event.max_participants} participantes
                        </span>
                            </div>
                            <div className="mt-2">
                              <button
                                  className="w-full px-2 py-1 text-sm border rounded hover:bg-muted"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEventClick(event);
                                  }}
                              >
                                Ver Detalhes
                              </button>
                            </div>
                          </div>
                      ))}
                    </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {selectedEvent && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>{selectedEvent.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2">Detalhes do Evento</h3>
                    <p className="text-muted-foreground mb-2">{selectedEvent.description}</p>

                    <div className="flex items-center mb-1">
                      <Calendar className="h-4 w-4 mr-2 text-primary" />
                      <span>
                    {new Date(selectedEvent.start_time).toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                    </div>

                    <div className="flex items-center mb-1">
                      <Clock className="h-4 w-4 mr-2 text-primary" />
                      <span>
                    {new Date(selectedEvent.start_time).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })} -
                        {new Date(selectedEvent.end_time).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                  </span>
                    </div>

                    <div className="flex items-center mb-1">
                      <MapPin className="h-4 w-4 mr-2 text-primary" />
                      <span>{selectedEvent.location.address}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Informações Adicionais</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between border-b pb-1">
                        <span className="text-muted-foreground">Esporte</span>
                        <span>{selectedEvent.sport_type}</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="text-muted-foreground">Nível</span>
                        <span>{selectedEvent.skill_level}</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="text-muted-foreground">Participantes</span>
                        <span>{selectedEvent.participants.length}/{selectedEvent.max_participants}</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="text-muted-foreground">Organizador</span>
                        <span>{selectedEvent.organizer_name}</span>
                      </div>
                      {selectedEvent.price_per_person ? (
                          <div className="flex justify-between border-b pb-1">
                            <span className="text-muted-foreground">Preço por pessoa</span>
                            <span>R$ {selectedEvent.price_per_person.toFixed(2)}</span>
                          </div>
                      ) : (
                          <div className="flex justify-between border-b pb-1">
                            <span className="text-muted-foreground">Preço</span>
                            <span>Gratuito</span>
                          </div>
                      )}
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex justify-end">
                  <button
                      className="px-4 py-2 rounded bg-primary text-primary-foreground"
                      onClick={() => handleEventClick(selectedEvent)}
                  >
                    Ver Página do Evento
                  </button>
                </div>
              </CardContent>
            </Card>
        )}
      </div>
  );
}