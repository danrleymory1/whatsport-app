// src/components/player/create-event-form.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { firebaseService } from "@/services/firebase-service";
import { googleMapsService } from "@/services/google-maps-service";
import { MapPin, Calendar, Clock, Users, DollarSign, Search } from "lucide-react";
import { useAuth } from "@/context/auth-context";

// Schema for event creation
const eventSchema = z.object({
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres"),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres"),
  sport_type: z.string().min(1, "Selecione um esporte"),
  skill_level: z.string().min(1, "Selecione um nível de habilidade"),
  start_date: z.string().min(1, "Selecione uma data"),
  start_time: z.string().min(1, "Selecione um horário"),
  end_time: z.string().min(1, "Selecione um horário"),
  location: z.object({
    address: z.string().min(1, "Endereço é obrigatório"),
    lat: z.number(),
    lng: z.number(),
    city: z.string().optional(),
    state: z.string().optional(),
    postal_code: z.string().optional(),
  }),
  max_participants: z.number().min(2, "O evento deve ter pelo menos 2 participantes"),
  price_per_person: z.number().min(0, "O preço não pode ser negativo"),
  is_private: z.boolean().default(false),
});

type EventFormValues = z.infer<typeof eventSchema>;

// Sport options
const sportOptions = [
  "Futebol",
  "Futsal",
  "Society",
  "Tênis",
  "Beach Tennis",
  "Vôlei",
  "Basquete",
  "Natação",
  "Corrida",
  "CrossFit",
  "Handebol",
  "Muay Thai",
  "Jiu-Jitsu",
  "Boxe",
  "Pilates",
  "Yoga",
  "Padel",
];

// Skill level options
const skillLevelOptions = [
  { value: "beginner", label: "Iniciante" },
  { value: "intermediate", label: "Intermediário" },
  { value: "advanced", label: "Avançado" },
];

export function CreateEventForm() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchAddress, setSearchAddress] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Initialize form with default values
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      sport_type: "",
      skill_level: "",
      start_date: "",
      start_time: "",
      end_time: "",
      location: {
        address: "",
        lat: 0,
        lng: 0,
        city: "",
        state: "",
      },
      max_participants: 10,
      price_per_person: 0,
      is_private: false,
    },
  });

  // Get user's current location on mount
  useEffect(() => {
    const getUserLocation = async () => {
      try {
        const position = await googleMapsService.getCurrentPosition();
        if (position) {
          setUserLocation(position);
          
          // Get address from coordinates
          const location = await googleMapsService.reverseGeocode(position.lat, position.lng);
          if (location) {
            form.setValue("location", {
              address: location.address,
              lat: location.lat,
              lng: location.lng,
              city: location.city,
              state: location.state,
              postal_code: location.postal_code,
            });
          }
        }
      } catch (error) {
        console.error("Error getting user location:", error);
      }
    };
    
    getUserLocation();
  }, [form]);

  // Search address
  const handleAddressSearch = async () => {
    if (!searchAddress.trim()) return;

    setIsSearching(true);
    try {
      const results = await googleMapsService.searchAddress(searchAddress);
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching address:", error);
      toast.error("Erro ao buscar endereço");
    } finally {
      setIsSearching(false);
    }
  };

  // Select address from search results
  const selectAddress = (result: any) => {
    const location = googleMapsService.toLocation(result);
    form.setValue("location", {
      address: location.address,
      lat: location.lat,
      lng: location.lng,
      city: location.city,
      state: location.state,
      postal_code: location.postal_code,
    });
    setSearchResults([]);
  };

  // Handle form submission
  const onSubmit = async (data: EventFormValues) => {
    setIsSubmitting(true);
    try {
      // Format start and end time
      const startDate = new Date(data.start_date);
      const [startHours, startMinutes] = data.start_time.split(':').map(Number);
      startDate.setHours(startHours, startMinutes, 0, 0);
      
      const endDate = new Date(data.start_date);
      const [endHours, endMinutes] = data.end_time.split(':').map(Number);
      endDate.setHours(endHours, endMinutes, 0, 0);
      
      // Check if end time is after start time
      if (endDate <= startDate) {
        toast.error("Horário de término deve ser após o horário de início");
        setIsSubmitting(false);
        return;
      }

      // Prepare data for submission
      const eventData = {
        title: data.title,
        description: data.description,
        sport_type: data.sport_type,
        skill_level: data.skill_level,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        location: data.location,
        max_participants: data.max_participants,
        price_per_person: data.price_per_person,
        is_private: data.is_private,
        organizer_name: user?.name || "Organizador",
      };

      // Create event
      const eventId = await firebaseService.createEvent(eventData, user?.id || "");
      
      toast.success("Evento criado com sucesso!", {
        description: "Você foi adicionado como participante automaticamente."
      });
      
      // Navigate to event details
      router.push(`/player/events/${eventId}`);
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error("Erro ao criar evento");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Move to next tab
  const goToNextTab = () => {
    if (activeTab === "basic") {
      // Validate basic fields before proceeding
      const basicFields = ["title", "description", "sport_type", "skill_level"] as const;
      const isValid = basicFields.every(field => form.getFieldState(field).invalid === false);
      
      if (isValid) {
        setActiveTab("datetime");
      } else {
        // Trigger validation
        form.trigger(basicFields);
        toast.error("Preencha todos os campos obrigatórios");
      }
    } else if (activeTab === "datetime") {
      // Validate datetime fields before proceeding
      const datetimeFields = ["start_date", "start_time", "end_time"] as const;
      const isValid = datetimeFields.every(field => form.getFieldState(field).invalid === false);
      
      if (isValid) {
        setActiveTab("location");
      } else {
        form.trigger(datetimeFields);
        toast.error("Preencha todos os campos obrigatórios");
      }
    } else if (activeTab === "location") {
      // Validate location fields before proceeding
      if (form.getValues().location.lat === 0 || form.getValues().location.lng === 0) {
        toast.error("Selecione uma localização válida");
      } else {
        setActiveTab("settings");
      }
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Criar Novo Evento</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
              <TabsTrigger value="datetime">Data e Hora</TabsTrigger>
              <TabsTrigger value="location">Localização</TabsTrigger>
              <TabsTrigger value="settings">Configurações</TabsTrigger>
            </TabsList>

            {/* Basic Information */}
            <TabsContent value="basic">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Básicas</CardTitle>
                  <CardDescription>
                    Forneça as informações básicas sobre o seu evento
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título do Evento</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Futebol Society Semanal" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descreva seu evento, incluindo detalhes importantes para os participantes"
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="sport_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Esporte</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um esporte" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {sportOptions.map((sport) => (
                                <SelectItem key={sport} value={sport}>
                                  {sport}
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
                      name="skill_level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nível de Habilidade</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um nível" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {skillLevelOptions.map((level) => (
                                <SelectItem key={level.value} value={level.value}>
                                  {level.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button type="button" onClick={goToNextTab}>
                    Próximo
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Date and Time */}
            <TabsContent value="datetime">
              <Card>
                <CardHeader>
                  <CardTitle>Data e Hora</CardTitle>
                  <CardDescription>
                    Defina quando o evento acontecerá
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </FormControl>
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
                            <Input type="time" {...field} />
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
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("basic")}
                  >
                    Voltar
                  </Button>
                  <Button type="button" onClick={goToNextTab}>
                    Próximo
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Location */}
            <TabsContent value="location">
              <Card>
                <CardHeader>
                  <CardTitle>Localização</CardTitle>
                  <CardDescription>
                    Defina onde o evento acontecerá
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Buscar Endereço</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Digite o endereço para buscar"
                        value={searchAddress}
                        onChange={(e) => setSearchAddress(e.target.value)}
                      />
                      <Button
                        type="button"
                        onClick={handleAddressSearch}
                        disabled={isSearching}
                      >
                        {isSearching ? "Buscando..." : <Search className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {searchResults.length > 0 && (
                    <Card className="overflow-hidden">
                      <div className="max-h-60 overflow-y-auto p-1">
                        {searchResults.map((result, index) => (
                          <div
                            key={index}
                            className="p-2 hover:bg-muted cursor-pointer"
                            onClick={() => selectAddress(result)}
                          >
                            {result.address.freeformAddress}
                            {result.address.countrySubdivision && `, ${result.address.countrySubdivision}`}
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  <FormField
                    control={form.control}
                    name="location.address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="location.city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cidade</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location.state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Hidden fields for latitude and longitude */}
                  <input
                    type="hidden"
                    {...form.register("location.lat", { valueAsNumber: true })}
                  />
                  <input
                    type="hidden"
                    {...form.register("location.lng", { valueAsNumber: true })}
                  />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("datetime")}
                  >
                    Voltar
                  </Button>
                  <Button type="button" onClick={goToNextTab}>
                    Próximo
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Settings */}
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações do Evento</CardTitle>
                  <CardDescription>
                    Defina detalhes adicionais do seu evento
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="max_participants"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número Máximo de Participantes</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={2}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Inclui o organizador
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price_per_person"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço por Pessoa (R$)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Deixe 0 para eventos gratuitos
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_private"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Evento Privado</FormLabel>
                          <FormDescription>
                            Quando ativado, o evento só será visível para convidados
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("location")}
                  >
                    Voltar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Criando..." : "Criar Evento"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </Form>
    </div>
  );
}