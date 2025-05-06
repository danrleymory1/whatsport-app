// src/components/player/events-nearby.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  Trophy, 
  Filter, 
  Plus, 
  Search 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { googleMapsService } from "@/services/google-maps-service";
import { firebaseService } from "@/services/firebase-service";
import { Event } from "@/types/event";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function EventsNearby() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [distance, setDistance] = useState([10]);
  const [address, setAddress] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sportFilter, setSportFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [onlyFreeEvents, setOnlyFreeEvents] = useState(false);
  const [onlyAvailableEvents, setOnlyAvailableEvents] = useState(false);
  
  const router = useRouter();
  
  // Fetch initial events and get user location
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // Get user's location
        const position = await googleMapsService.getCurrentPosition();
        if (position) {
          setUserLocation(position);
          
          // Get nearby events
          const nearbyEvents = await firebaseService.getNearbyEvents(position, distance[0]);
          setEvents(nearbyEvents);
          setFilteredEvents(nearbyEvents);
        } else {
          // If location not available, get all events
          const eventsData = await firebaseService.getEvents({ upcoming: true });
          setEvents(eventsData);
          setFilteredEvents(eventsData);
        }
      } catch (error) {
        console.error("Error fetching events:", error);
        toast.error("Erro ao carregar eventos");
        
        // Fallback to fetch all events
        try {
          const eventsData = await firebaseService.getEvents({ upcoming: true });
          setEvents(eventsData);
          setFilteredEvents(eventsData);
        } catch (e) {
          console.error("Error fetching fallback events:", e);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, []);
  
  // Apply filters whenever filter values change
  useEffect(() => {
    if (events.length === 0) return;
    
    let filtered = [...events];
    
    // Filter by sport
    if (sportFilter) {
      filtered = filtered.filter(event => event.sport_type === sportFilter);
    }
    
    // Filter by level
    if (levelFilter) {
      filtered = filtered.filter(event => event.skill_level === levelFilter);
    }
    
    // Filter by date
    if (dateFilter) {
      const selectedDate = new Date(dateFilter);
      selectedDate.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.start_time);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate.getTime() === selectedDate.getTime();
      });
    }
    
    // Filter by price
    if (onlyFreeEvents) {
      filtered = filtered.filter(event => !event.price_per_person || event.price_per_person === 0);
    }
    
    // Filter by availability
    if (onlyAvailableEvents) {
      filtered = filtered.filter(event => 
        event.participants.length < event.max_participants
      );
    }
    
    // Filter by distance - only if we have user location
    if (userLocation && distance[0] < 50) { // Only apply if distance is set to less than max
      filtered = filtered.filter(event => {
        // If event has distance property (from getNearbyEvents)
        if ('distance' in event && typeof (event as any).distance === 'number') {
          return (event as any).distance <= distance[0] * 1000; // Convert km to meters
        }
        
        // If not, include it (to be safe)
        return true;
      });
    }
    
    setFilteredEvents(filtered);
  }, [events, sportFilter, levelFilter, dateFilter, onlyFreeEvents, onlyAvailableEvents, distance, userLocation]);
  
  const handleJoinEvent = (eventId: string) => {
    router.push(`/player/events/${eventId}`);
  };
  
  const handleCreateEvent = () => {
    router.push("/player/events/create");
  };
  
  const handleAddressSearch = async () => {
    if (!address.trim()) return;
    
    try {
      const location = await googleMapsService.geocodeAddress(address);
      
      if (location) {
        setUserLocation({ lat: location.lat, lng: location.lng });
        
        // Get nearby events for the new location
        const nearbyEvents = await firebaseService.getNearbyEvents(
          { lat: location.lat, lng: location.lng }, 
          distance[0]
        );
        
        setEvents(nearbyEvents);
        setFilteredEvents(nearbyEvents);
        
        toast.success("Localização atualizada", {
          description: location.address
        });
      } else {
        toast.error("Endereço não encontrado");
      }
    } catch (error) {
      console.error("Error searching address:", error);
      toast.error("Erro ao buscar endereço");
    }
  };
  
  const handleApplyFilters = async () => {
    setIsFilterOpen(false);
    
    if (!userLocation) {
      toast.error("Localização não definida", {
        description: "Defina uma localização para aplicar o filtro de distância"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Get events near the location with the specified distance
      const nearbyEvents = await firebaseService.getNearbyEvents(
        userLocation, 
        distance[0]
      );
      
      setEvents(nearbyEvents);
      // Filters will be applied by the useEffect
    } catch (error) {
      console.error("Error applying filters:", error);
      toast.error("Erro ao aplicar filtros");
    } finally {
      setLoading(false);
    }
  };
  
  const handleClearFilters = () => {
    setSportFilter("");
    setLevelFilter("");
    setDateFilter("");
    setOnlyFreeEvents(false);
    setOnlyAvailableEvents(false);
    setDistance([10]);
    
    // Re-fetch events if we have user location
    if (userLocation) {
      setLoading(true);
      firebaseService.getNearbyEvents(userLocation, 10)
        .then(nearbyEvents => {
          setEvents(nearbyEvents);
          setFilteredEvents(nearbyEvents);
        })
        .catch(error => {
          console.error("Error resetting events:", error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };
  
  // Extract unique sports from events
  const availableSports = [...new Set(events.map(event => event.sport_type))];
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Eventos Próximos</h1>
          <p className="text-muted-foreground">Encontre eventos esportivos perto de você</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsFilterOpen(!isFilterOpen)}>
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
          <Button onClick={handleCreateEvent}>
            <Plus className="mr-2 h-4 w-4" />
            Criar Evento
          </Button>
        </div>
      </div>
      
      {isFilterOpen && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtrar eventos</CardTitle>
            <CardDescription>Ajuste os filtros para encontrar eventos que combinam com você</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label htmlFor="location">Localização</Label>
                <div className="flex gap-2">
                  <Input
                    id="location"
                    placeholder="Digite um endereço ou CEP"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                  <Button size="icon" variant="ghost" onClick={handleAddressSearch}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sport">Esporte</Label>
                <Select value={sportFilter} onValueChange={setSportFilter}>
                  <SelectTrigger id="sport">
                    <SelectValue placeholder="Selecione um esporte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    {availableSports.map(sport => (
                      <SelectItem key={sport} value={sport}>{sport}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="level">Nível</Label>
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger id="level">
                    <SelectValue placeholder="Selecione um nível" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="beginner">Iniciante</SelectItem>
                    <SelectItem value="intermediate">Intermediário</SelectItem>
                    <SelectItem value="advanced">Avançado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <Input 
                  id="date" 
                  type="date" 
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>
            </div>
            
            <div className="mt-6 space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <Label htmlFor="distance">Distância máxima: {distance}km</Label>
                </div>
                <Slider
                  id="distance"
                  min={1}
                  max={50}
                  step={1}
                  value={distance}
                  onValueChange={setDistance}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="free" 
                  checked={onlyFreeEvents}
                  onCheckedChange={setOnlyFreeEvents}
                />
                <Label htmlFor="free">Apenas eventos gratuitos</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="available" 
                  checked={onlyAvailableEvents}
                  onCheckedChange={setOnlyAvailableEvents}
                />
                <Label htmlFor="available">Apenas com vagas disponíveis</Label>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleClearFilters}>Limpar Filtros</Button>
            <Button onClick={handleApplyFilters}>Aplicar Filtros</Button>
          </CardFooter>
        </Card>
      )}
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
          <p className="mt-4 text-muted-foreground">Nenhum evento encontrado com os filtros selecionados</p>
          <Button className="mt-4" onClick={handleClearFilters}>Limpar Filtros</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="overflow-hidden">
              <div className="h-48 bg-gray-200 flex items-center justify-center relative">
                <div className="bg-black/50 text-white text-lg font-bold p-2 absolute top-0 left-0">
                  {event.sport_type}
                </div>
                <div className="bg-gradient-to-t from-black/70 to-transparent absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-bold text-lg">{event.title}</h3>
                  <div className="flex items-center text-white/90 text-sm">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="truncate">{event.location.address}</span>
                  </div>
                </div>
              </div>
              
              <CardContent className="p-4">
                <div className="flex flex-col space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>{new Date(event.start_time).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>
                        {new Date(event.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • 
                        {new Date(event.end_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center text-sm">
                      <Users className="h-4 w-4 mr-1" />
                      <span>
                        {event.participants.length}/{event.max_participants} participantes
                      </span>
                    </div>
                    <Badge variant={
                      event.skill_level === "beginner" ? "outline" : 
                      event.skill_level === "intermediate" ? "secondary" : 
                      "default"
                    }>
                      {event.skill_level === "beginner" ? "Iniciante" : 
                       event.skill_level === "intermediate" ? "Intermediário" : 
                       "Avançado"}
                    </Badge>
                  </div>
                  
                  <Separator className="my-2" />
                  
                  <div className="flex justify-between items-center">
                    <div className="font-bold">
                      {!event.price_per_person || event.price_per_person === 0 
                        ? "Gratuito" 
                        : `R$ ${event.price_per_person.toFixed(2)}`
                      }
                    </div>
                    {'distance' in event && (
                      <div className="text-sm text-muted-foreground flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span>{((event as any).distance / 1000).toFixed(1)} km</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="p-4 pt-0">
                <Button 
                  className="w-full" 
                  variant={event.participants.length >= event.max_participants ? "outline" : "default"}
                  disabled={event.participants.length >= event.max_participants}
                  onClick={() => handleJoinEvent(event.id)}
                >
                  {event.participants.length >= event.max_participants ? "Lotado" : "Participar"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}