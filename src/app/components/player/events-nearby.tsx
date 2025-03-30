// src/components/player/events-nearby.tsx
"use client";

import { useState } from "react";
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

// Mock data for events
const MOCK_EVENTS = [
  {
    id: 1,
    title: "Futebol Society 7x7",
    sport: "Futebol",
    location: "Quadra Premium Soccer",
    address: "Rua das Flores, 123 - São Paulo",
    date: "2023-04-15",
    time: "19:00",
    duration: "1h30min",
    level: "Intermediário",
    participants: {
      current: 10,
      total: 14,
    },
    price: 35,
    organizer: "Carlos Silva",
    distance: 1.2,
  },
  {
    id: 2,
    title: "Beach Tennis Amador",
    sport: "Beach Tennis",
    location: "Arena Beach São Paulo",
    address: "Av. Paulista, 500 - São Paulo",
    date: "2023-04-16",
    time: "10:00",
    duration: "2h",
    level: "Iniciante",
    participants: {
      current: 3,
      total: 4,
    },
    price: 40,
    organizer: "Ana Oliveira",
    distance: 2.5,
  },
  {
    id: 3,
    title: "Vôlei 6x6",
    sport: "Vôlei",
    location: "Clube Atlético Paulistano",
    address: "Rua Honduras, 1400 - São Paulo",
    date: "2023-04-17",
    time: "18:30",
    duration: "2h",
    level: "Avançado",
    participants: {
      current: 8,
      total: 12,
    },
    price: 25,
    organizer: "Marcelo Santos",
    distance: 3.1,
  },
  {
    id: 4,
    title: "Tênis - Duplas",
    sport: "Tênis",
    location: "São Paulo Tennis Club",
    address: "Rua Canadá, 658 - São Paulo",
    date: "2023-04-18",
    time: "15:00",
    duration: "1h30min",
    level: "Intermediário",
    participants: {
      current: 2,
      total: 4,
    },
    price: 60,
    organizer: "Julia Mendes",
    distance: 4.2,
  },
  {
    id: 5,
    title: "Basquete 3x3",
    sport: "Basquete",
    location: "Quadra do Parque Ibirapuera",
    address: "Av. Pedro Álvares Cabral - São Paulo",
    date: "2023-04-19",
    time: "17:00",
    duration: "2h",
    level: "Todos os níveis",
    participants: {
      current: 9,
      total: 12,
    },
    price: 0,
    organizer: "Rafael Costa",
    distance: 3.8,
  },
];

export function EventsNearby() {
  const [events, setEvents] = useState(MOCK_EVENTS);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [distance, setDistance] = useState([10]);
  const [address, setAddress] = useState("");
  
  const handleJoinEvent = (eventId: number) => {
    toast.success("Inscrição realizada", {
      description: "Você foi adicionado ao evento com sucesso!",
    });
  };
  
  const handleCreateEvent = () => {
    toast.info("Novo evento", {
      description: "Funcionalidade de criação de evento em desenvolvimento.",
    });
  };

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
                  <Button size="icon" variant="ghost">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sport">Esporte</Label>
                <Select>
                  <SelectTrigger id="sport">
                    <SelectValue placeholder="Selecione um esporte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="football">Futebol</SelectItem>
                    <SelectItem value="volleyball">Vôlei</SelectItem>
                    <SelectItem value="tennis">Tênis</SelectItem>
                    <SelectItem value="basketball">Basquete</SelectItem>
                    <SelectItem value="beach-tennis">Beach Tennis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="level">Nível</Label>
                <Select>
                  <SelectTrigger id="level">
                    <SelectValue placeholder="Selecione um nível" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="beginner">Iniciante</SelectItem>
                    <SelectItem value="intermediate">Intermediário</SelectItem>
                    <SelectItem value="advanced">Avançado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <Input id="date" type="date" />
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
                <Switch id="free" />
                <Label htmlFor="free">Apenas eventos gratuitos</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch id="available" />
                <Label htmlFor="available">Apenas com vagas disponíveis</Label>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline">Limpar Filtros</Button>
            <Button>Aplicar Filtros</Button>
          </CardFooter>
        </Card>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <Card key={event.id} className="overflow-hidden">
            <div className="h-48 bg-gray-200 flex items-center justify-center relative">
              <div className="bg-black/50 text-white text-lg font-bold p-2 absolute top-0 left-0">
                {event.sport}
              </div>
              <div className="bg-gradient-to-t from-black/70 to-transparent absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-white font-bold text-lg">{event.title}</h3>
                <div className="flex items-center text-white/90 text-sm">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="truncate">{event.location}</span>
                </div>
              </div>
            </div>
            
            <CardContent className="p-4">
              <div className="flex flex-col space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{new Date(event.date).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{event.time} • {event.duration}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center text-sm">
                    <Users className="h-4 w-4 mr-1" />
                    <span>
                      {event.participants.current}/{event.participants.total} participantes
                    </span>
                  </div>
                  <Badge variant={event.level === "Iniciante" ? "outline" : event.level === "Intermediário" ? "secondary" : "default"}>
                    {event.level}
                  </Badge>
                </div>
                
                <Separator className="my-2" />
                
                <div className="flex justify-between items-center">
                  <div className="font-bold">
                    {event.price === 0 ? "Gratuito" : `R$ ${event.price.toFixed(2)}`}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span>{event.distance} km</span>
                  </div>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="p-4 pt-0">
              <Button 
                className="w-full" 
                variant={event.participants.current >= event.participants.total ? "outline" : "default"}
                disabled={event.participants.current >= event.participants.total}
                onClick={() => handleJoinEvent(event.id)}
              >
                {event.participants.current >= event.participants.total ? "Lotado" : "Participar"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}