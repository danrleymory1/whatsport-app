// src/app/components/player/spaces.tsx
"use client";

import { useState, useEffect } from "react";
import { firebaseService } from "@/services/firebase-service";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  MapPin, 
  Search, 
  Building, 
  Calendar, 
  Clock, 
  Filter,
  Users,
  Check,
  X
} from "lucide-react";
import { 
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { auth } from "@/lib/firebase";

// Form schema for reservation
const reservationSchema = z.object({
  sport_type: z.string().min(1, "Selecione um esporte"),
  date: z.date({
    required_error: "Selecione uma data",
  }),
  start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Formato de hora inválido (HH:MM)",
  }),
  end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Formato de hora inválido (HH:MM)",
  }),
  participants_count: z.number().int().min(1, "Mínimo de 1 participante"),
  notes: z.string().optional(),
}).refine((data) => {
  const start = data.start_time.split(':').map(Number);
  const end = data.end_time.split(':').map(Number);
  
  const startMinutes = start[0] * 60 + start[1];
  const endMinutes = end[0] * 60 + end[1];
  
  return endMinutes > startMinutes;
}, {
  message: "O horário de término deve ser posterior ao horário de início",
  path: ["end_time"]
});

type ReservationFormData = z.infer<typeof reservationSchema>;

export function PlayerSpaces() {
  const [spaces, setSpaces] = useState<any[]>([]);
  const [filteredSpaces, setFilteredSpaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpace, setSelectedSpace] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sportFilter, setSportFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();

  // Form for reservations
  const form = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      sport_type: "",
      date: undefined,
      start_time: "",
      end_time: "",
      participants_count: 1,
      notes: "",
    }
  });

  // Fetch spaces
  const fetchSpaces = async () => {
    setLoading(true);
    try {
      const response = await firebaseService.getPublicSpaces();
      
      if (response.data && response.data.spaces) {
        setSpaces(response.data.spaces);
        setFilteredSpaces(response.data.spaces);
      }
    } catch (error) {
      console.error("Error fetching spaces:", error);
      toast.error("Erro ao carregar espaços");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpaces();
  }, []);

  // Filter spaces
  useEffect(() => {
    if (spaces.length > 0) {
      let filtered = [...spaces];
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(space => 
          space.name.toLowerCase().includes(query) || 
          space.description.toLowerCase().includes(query)
        );
      }
      
      if (sportFilter) {
        filtered = filtered.filter(space => 
          space.available_sports.some((sport: any) => 
            sport.sport_type === sportFilter
          )
        );
      }
      
      if (cityFilter) {
        filtered = filtered.filter(space => 
          space.location.city?.toLowerCase() === cityFilter.toLowerCase()
        );
      }
      
      setFilteredSpaces(filtered);
    }
  }, [searchQuery, sportFilter, cityFilter, spaces]);

  // Apply filters
  const applyFilters = () => {
    // Filters applied in useEffect
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery("");
    setSportFilter("");
    setCityFilter("");
  };

  // Open reservation dialog
  const openReservationDialog = (space: any) => {
    setSelectedSpace(space);
    
    // Reset form if there are available sports
    if (space.available_sports && space.available_sports.length > 0) {
      form.reset({
        sport_type: space.available_sports[0].sport_type,
        date: new Date(),
        start_time: "",
        end_time: "",
        participants_count: 1,
        notes: "",
      });
    }
    
    setDialogOpen(true);
  };

  // Create reservation
  const onSubmit = async (data: ReservationFormData) => {
    try {
      // Format date and times for API
      const startTime = new Date(data.date);
      const [startHours, startMinutes] = data.start_time.split(':').map(Number);
      startTime.setHours(startHours, startMinutes, 0, 0);
      
      const endTime = new Date(data.date);
      const [endHours, endMinutes] = data.end_time.split(':').map(Number);
      endTime.setHours(endHours, endMinutes, 0, 0);
      
      const reservationData = {
        space_id: selectedSpace.id,
        sport_type: data.sport_type,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        participants_count: data.participants_count,
        notes: data.notes || undefined,
      };
      
      // Submit reservation
      const response = await firebaseService.createReservation(reservationData, auth.currentUser?.uid || "");
      
      // Show success message
      toast.success("Reserva solicitada com sucesso", {
        description: "O gerente do espaço irá analisar sua solicitação."
      });
      
      setDialogOpen(false);
      form.reset();
      
      // Redirect to reservations page
      router.push("/player/reservations");
    } catch (error: any) {
      console.error("Error creating reservation:", error);
      toast.error("Erro ao criar reserva", {
        description: error.message || "Tente novamente mais tarde"
      });
    }
  };

  // Extract all unique sports from spaces
  const allSports = Array.from(new Set(
    spaces.flatMap(space => 
      space.available_sports.map((sport: any) => sport.sport_type)
    )
  )).sort();

  // Extract all unique cities from spaces
  const allCities = Array.from(new Set(
    spaces.map(space => space.location.city).filter(Boolean)
  )).sort();

  // Get sport price per hour
  const getSportPrice = (space: any, sportType: string) => {
    const sport = space.available_sports.find(
      (s: any) => s.sport_type === sportType
    );
    return sport ? sport.price_per_hour : 0;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Espaços Esportivos</h1>
      
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por nome ou descrição"
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filtrar Espaços</SheetTitle>
                <SheetDescription>
                  Filtre os espaços por esporte ou localização
                </SheetDescription>
              </SheetHeader>
              
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="sport-filter">Esporte</Label>
                  <Select
                    value={sportFilter}
                    onValueChange={setSportFilter}
                  >
                    <SelectTrigger id="sport-filter">
                      <SelectValue placeholder="Todos os esportes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os esportes</SelectItem>
                      {allSports.map((sport) => (
                        <SelectItem key={sport} value={sport}>
                          {sport}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="city-filter">Cidade</Label>
                  <Select
                    value={cityFilter}
                    onValueChange={setCityFilter}
                  >
                    <SelectTrigger id="city-filter">
                      <SelectValue placeholder="Todas as cidades" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas as cidades</SelectItem>
                      {allCities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <SheetFooter>
                <SheetClose asChild>
                  <Button variant="outline" onClick={clearFilters}>
                    Limpar Filtros
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button onClick={applyFilters}>Aplicar Filtros</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredSpaces.length === 0 ? (
        <div className="text-center py-12">
          <Building className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
          <p className="mt-4 text-muted-foreground">
            Nenhum espaço encontrado com os filtros selecionados
          </p>
          <Button className="mt-4" onClick={clearFilters}>
            Limpar Filtros
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpaces.map((space) => (
            <Card key={space.id} className="overflow-hidden">
              <div className="h-48 bg-muted">
                {space.photos && space.photos.length > 0 ? (
                  <img
                    src={space.photos.find((p: any) => p.is_primary)?.url || space.photos[0].url}
                    alt={space.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building className="h-12 w-12 text-muted-foreground" />
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
                <div className="flex items-center text-sm text-muted-foreground mb-2">
                  <MapPin className="h-3 w-3 mr-1" />
                  <span className="truncate">
                    {space.location.address}
                    {space.location.city && `, ${space.location.city}`}
                  </span>
                </div>
                
                <div className="text-sm mt-2">
                  <p className="font-medium">Esportes disponíveis:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {space.available_sports.map((sport: any, index: number) => (
                      <div key={index} className="bg-muted px-2 py-1 rounded-full text-xs">
                        {sport.sport_type}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="p-4 pt-0">
                <Button className="w-full" onClick={() => openReservationDialog(space)}>
                  Reservar
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Reservation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reservar Espaço</DialogTitle>
            <DialogDescription>
              {selectedSpace?.name}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="sport_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Esporte</FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um esporte" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {selectedSpace?.available_sports.map((sport: any) => (
                          <SelectItem key={sport.sport_type} value={sport.sport_type}>
                            {sport.sport_type} - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sport.price_per_hour)}/hora
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: ptBR })
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          disabled={(date) => date < new Date()}
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário de Início</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="time"
                          placeholder="HH:MM"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="end_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário de Término</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="time"
                          placeholder="HH:MM"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="participants_count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Participantes</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações (opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Adicione informações adicionais sobre a reserva"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {form.watch("sport_type") && form.watch("date") && 
               form.watch("start_time") && form.watch("end_time") && (
                <div className="bg-muted p-3 rounded-md">
                  <p className="font-medium">Resumo da reserva:</p>
                  <div className="text-sm mt-1">
                    <p>Esporte: {form.watch("sport_type")}</p>
                    <p>Data: {form.watch("date") ? format(form.watch("date"), "dd/MM/yyyy", { locale: ptBR }) : ""}</p>
                    <p>Horário: {form.watch("start_time")} - {form.watch("end_time")}</p>
                    <p>Participantes: {form.watch("participants_count")}</p>
                    
                    {selectedSpace && (
                      <p className="font-medium mt-2">
                        Valor estimado: {new Intl.NumberFormat('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL' 
                        }).format(
                          calculatePrice(
                            form.watch("start_time"), 
                            form.watch("end_time"), 
                            getSportPrice(selectedSpace, form.watch("sport_type")),
                            form.watch("participants_count")
                          )
                        )}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Solicitar Reserva</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper function to calculate price
function calculatePrice(startTime: string, endTime: string, pricePerHour: number, participants: number): number {
  if (!startTime || !endTime) return 0;
  
  const start = startTime.split(':').map(Number);
  const end = endTime.split(':').map(Number);
  
  const startMinutes = start[0] * 60 + start[1];
  const endMinutes = end[0] * 60 + end[1];
  
  const durationHours = (endMinutes - startMinutes) / 60;
  
  return pricePerHour * durationHours * participants;
}